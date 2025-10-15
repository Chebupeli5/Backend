import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();
router.use(requireAuth);

const goalSchema = z.object({
  goal_name: z.string().trim().min(1),
  goal: z.coerce.number().int().positive(),
  description: z.string().optional(),
  target_date: z.coerce.date().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  category: z.string().optional(),
  current_amount: z.coerce.number().int().min(0).default(0),
  user_id: z.coerce.number().int().optional(),
});

const goalUpdateSchema = goalSchema.partial().extend({
  amount: z.coerce.number().int().positive().optional(),
  complete: z.coerce.boolean().optional(),
  is_completed: z.coerce.boolean().optional(),
});

// GET /goals - Get all goals for the authenticated user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const list = await prisma.financial_goals.findMany({ 
      where: { user_id: req.user!.userId },
      orderBy: { created_at: 'desc' }
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// POST /goals - Create a new goal
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = goalSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    // Allow admin to specify user_id; regular users can only create for themselves
    const isAdmin = (req.user?.role ?? 'user') === 'admin';
    if (parsed.data.user_id !== undefined && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const targetUserId = parsed.data.user_id ?? req.user!.userId;
    
    const created = await prisma.financial_goals.create({
      data: {
        user_id: targetUserId,
        goal_name: parsed.data.goal_name,
        goal: parsed.data.goal,
        description: parsed.data.description,
        target_date: parsed.data.target_date,
        priority: parsed.data.priority,
        category: parsed.data.category,
        current_amount: parsed.data.current_amount,
      },
    });
    
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// GET /goals/:id - Get specific goal by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const goal = await prisma.financial_goals.findFirst({
      where: { id, user_id: req.user!.userId }
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

// PUT /goals/:id - Update a goal
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const parsed = goalUpdateSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    // Check if the goal exists and belongs to the user
    const existingGoal = await prisma.financial_goals.findFirst({
      where: { id, user_id: req.user!.userId }
    });

    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const data = parsed.data as any;
    const updateData: any = {};
    // regular field updates
    if (data.goal_name !== undefined) updateData.goal_name = data.goal_name;
    if (data.goal !== undefined) updateData.goal = data.goal;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.target_date !== undefined) updateData.target_date = data.target_date;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.current_amount !== undefined) updateData.current_amount = data.current_amount;

    // actions
    const finalGoalTarget = updateData.goal ?? existingGoal.goal;

    if (data.amount !== undefined) {
      if (existingGoal.is_completed) {
        return res.status(400).json({ error: 'Cannot add money to completed goal' });
      }
      const baseAmount = updateData.current_amount !== undefined ? updateData.current_amount : existingGoal.current_amount;
      const newAmount = baseAmount + data.amount;
      updateData.current_amount = newAmount;
      if (newAmount >= finalGoalTarget) {
        updateData.is_completed = true;
      }
    }

    if (data.complete === true) {
      updateData.is_completed = true;
    }

    if (data.is_completed !== undefined) {
      updateData.is_completed = data.is_completed;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    const updated = await prisma.financial_goals.update({
      where: { id },
      data: updateData,
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// DELETE /goals/:id - Delete a goal
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    // Check if the goal exists and belongs to the user
    const existingGoal = await prisma.financial_goals.findFirst({
      where: { id, user_id: req.user!.userId }
    });

    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await prisma.financial_goals.delete({ 
      where: { id } 
    });
    
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});



// GET /goals/analytics/summary - Get goal analytics and summary
router.get('/analytics/summary', async (req: AuthRequest, res: Response) => {
  try {
    const goals = await prisma.financial_goals.findMany({
      where: { user_id: req.user!.userId }
    });

    const totalGoals = goals.length;
    const completedGoals = goals.filter((g: any) => g.is_completed).length;
    const activeGoals = totalGoals - completedGoals;
    const totalTargetAmount = goals.reduce((sum: number, g: any) => sum + g.goal, 0);
    const totalCurrentAmount = goals.reduce((sum: number, g: any) => sum + g.current_amount, 0);
    const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
    const averageGoalAmount = totalGoals > 0 ? totalTargetAmount / totalGoals : 0;

    const priorityDistribution = {
      high: goals.filter((g: any) => g.priority === 'high').length,
      medium: goals.filter((g: any) => g.priority === 'medium').length,
      low: goals.filter((g: any) => g.priority === 'low').length,
    };

    const overdueGoals = goals.filter((g: any) => 
      !g.is_completed && g.target_date && new Date(g.target_date) < new Date()
    ).length;

    res.json({
      total_goals: totalGoals,
      completed_goals: completedGoals,
      active_goals: activeGoals,
      total_target_amount: totalTargetAmount,
      total_current_amount: totalCurrentAmount,
      completion_rate: Math.round(completionRate * 100) / 100,
      average_goal_amount: Math.round(averageGoalAmount * 100) / 100,
      priority_distribution: priorityDistribution,
      overdue_goals: overdueGoals,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goal analytics' });
  }
});

// GET /goals/priority/:priority - Get goals by priority level
router.get('/priority/:priority', async (req: AuthRequest, res: Response) => {
  try {
    const priority = req.params.priority;
    
    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority level' });
    }

    const goals = await prisma.financial_goals.findMany({
      where: { 
        user_id: req.user!.userId,
        priority: priority as 'low' | 'medium' | 'high'
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals by priority' });
  }
});

export default router;


