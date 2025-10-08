import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();
router.use(requireAuth);

// Enhanced goal schema with more fields
const goalSchema = z.object({
  goal_name: z.string().min(1).max(100),
  goal: z.number().int().positive(),
  description: z.string().optional(),
  target_date: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  category: z.string().optional(),
  current_amount: z.number().int().nonnegative().default(0),
  is_completed: z.boolean().default(false),
});

const updateGoalSchema = goalSchema.partial();

// Get all goals with progress calculation
router.get('/', async (req: AuthRequest, res) => {
  try {
    const goals = await prisma.financial_goals.findMany({ 
      where: { user_id: req.user!.userId },
      orderBy: [
        { is_completed: 'asc' },
        { priority: 'desc' },
        { target_date: 'asc' }
      ]
    });

    // Calculate total available balance from assets and savings
    const assetsSum = await prisma.assets.aggregate({ 
      _sum: { balance: true }, 
      where: { user_id: req.user!.userId } 
    });
    const savingsSum = await prisma.savings_accounts.aggregate({ 
      _sum: { balance: true }, 
      where: { user_id: req.user!.userId } 
    });
    const totalBalance = (assetsSum._sum.balance ?? 0) + (savingsSum._sum.balance ?? 0);

    // Calculate progress for each goal
    const goalsWithProgress = goals.map(goal => {
      const progress = goal.goal > 0 ? Math.min((goal.current_amount / goal.goal) * 100, 100) : 0;
      const remaining = Math.max(goal.goal - goal.current_amount, 0);
      const isOverdue = goal.target_date ? new Date(goal.target_date) < new Date() && !goal.is_completed : false;
      
      return {
        ...goal,
        progress: Math.round(progress * 100) / 100, // Round to 2 decimal places
        remaining_amount: remaining,
        is_overdue: isOverdue,
        days_remaining: goal.target_date ? Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
      };
    });

    res.json({ 
      goals: goalsWithProgress, 
      totalBalance,
      summary: {
        total_goals: goals.length,
        completed_goals: goals.filter(g => g.is_completed).length,
        active_goals: goals.filter(g => !g.is_completed).length,
        overdue_goals: goalsWithProgress.filter(g => g.is_overdue).length,
        total_target_amount: goals.reduce((sum, g) => sum + g.goal, 0),
        total_current_amount: goals.reduce((sum, g) => sum + g.current_amount, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Get specific goal by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const goal = await prisma.financial_goals.findFirst({
      where: { id, user_id: req.user!.userId }
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const progress = goal.goal > 0 ? Math.min((goal.current_amount / goal.goal) * 100, 100) : 0;
    const remaining = Math.max(goal.goal - goal.current_amount, 0);
    const isOverdue = goal.target_date ? new Date(goal.target_date) < new Date() && !goal.is_completed : false;

    res.json({
      ...goal,
      progress: Math.round(progress * 100) / 100,
      remaining_amount: remaining,
      is_overdue: isOverdue,
      days_remaining: goal.target_date ? Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
    });
  } catch (error) {
    console.error('Error fetching goal:', error);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

// Create new goal
router.post('/', async (req: AuthRequest, res) => {
  try {
    const parsed = goalSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const goalData = {
      ...parsed.data,
      user_id: req.user!.userId,
      target_date: parsed.data.target_date ? new Date(parsed.data.target_date) : null,
    };

    const created = await prisma.financial_goals.create({ data: goalData });
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Update goal
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const parsed = updateGoalSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    // Check if goal exists and belongs to user
    const existingGoal = await prisma.financial_goals.findFirst({
      where: { id, user_id: req.user!.userId }
    });

    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const updateData = {
      ...parsed.data,
      target_date: parsed.data.target_date ? new Date(parsed.data.target_date) : undefined,
    };

    const updated = await prisma.financial_goals.update({
      where: { id },
      data: updateData
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// Delete goal
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    
    // Check if goal exists and belongs to user
    const existingGoal = await prisma.financial_goals.findFirst({
      where: { id, user_id: req.user!.userId }
    });

    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await prisma.financial_goals.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// Add money to goal (update current_amount)
router.post('/:id/add', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { amount } = z.object({ amount: z.number().int().positive() }).parse(req.body);

    const goal = await prisma.financial_goals.findFirst({
      where: { id, user_id: req.user!.userId }
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    if (goal.is_completed) {
      return res.status(400).json({ error: 'Cannot add money to completed goal' });
    }

    const newAmount = goal.current_amount + amount;
    const isCompleted = newAmount >= goal.goal;

    const updated = await prisma.financial_goals.update({
      where: { id },
      data: { 
        current_amount: newAmount,
        is_completed: isCompleted
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error adding money to goal:', error);
    res.status(500).json({ error: 'Failed to add money to goal' });
  }
});

// Mark goal as completed
router.post('/:id/complete', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);

    const goal = await prisma.financial_goals.findFirst({
      where: { id, user_id: req.user!.userId }
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const updated = await prisma.financial_goals.update({
      where: { id },
      data: { is_completed: true }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error completing goal:', error);
    res.status(500).json({ error: 'Failed to complete goal' });
  }
});

// Get goal analytics
router.get('/analytics/summary', async (req: AuthRequest, res) => {
  try {
    const goals = await prisma.financial_goals.findMany({
      where: { user_id: req.user!.userId }
    });

    const analytics = {
      total_goals: goals.length,
      completed_goals: goals.filter(g => g.is_completed).length,
      active_goals: goals.filter(g => !g.is_completed).length,
      total_target_amount: goals.reduce((sum, g) => sum + g.goal, 0),
      total_current_amount: goals.reduce((sum, g) => sum + g.current_amount, 0),
      completion_rate: goals.length > 0 ? (goals.filter(g => g.is_completed).length / goals.length) * 100 : 0,
      average_goal_amount: goals.length > 0 ? goals.reduce((sum, g) => sum + g.goal, 0) / goals.length : 0,
      priority_distribution: {
        high: goals.filter(g => g.priority === 'high').length,
        medium: goals.filter(g => g.priority === 'medium').length,
        low: goals.filter(g => g.priority === 'low').length
      },
      overdue_goals: goals.filter(g => g.target_date && new Date(g.target_date) < new Date() && !g.is_completed).length
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching goal analytics:', error);
    res.status(500).json({ error: 'Failed to fetch goal analytics' });
  }
});

// Get goals by priority
router.get('/priority/:priority', async (req: AuthRequest, res) => {
  try {
    const priority = req.params.priority as 'low' | 'medium' | 'high';
    
    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority level' });
    }

    const goals = await prisma.financial_goals.findMany({
      where: { 
        user_id: req.user!.userId,
        priority: priority
      },
      orderBy: { target_date: 'asc' }
    });

    res.json(goals);
  } catch (error) {
    console.error('Error fetching goals by priority:', error);
    res.status(500).json({ error: 'Failed to fetch goals by priority' });
  }
});

export default router;


