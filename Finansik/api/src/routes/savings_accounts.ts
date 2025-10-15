import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

router.use(requireAuth);

const savingsAccountSchema = z.object({
  saving_name: z.string().trim().min(1),
  balance: z.coerce.number().int().optional(),
  interest_rate: z.coerce.number().min(0).max(100).optional(),
  user_id: z.coerce.number().int().optional(),
});

// GET /savings_accounts - Get all savings accounts for the authenticated user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const list = await prisma.savings_accounts.findMany({ 
      where: { user_id: req.user!.userId } 
    });
    const withYield = list.map(acc => {
      const rate = (acc.interest_rate ?? 0) as number;
      const bal = (acc.balance ?? 0) as number;
      const yearly_yield = Math.round(bal * (rate / 100));
      const monthly_yield = Math.round(yearly_yield / 12);
      return { ...acc, monthly_yield, yearly_yield };
    });
    res.json(withYield);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch savings accounts' });
  }
});

// POST /savings_accounts - Create a new savings account
router.post('/', async (req: AuthRequest, res) => {
  try {
    const parsed = savingsAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    // Allow admin to specify user_id; regular users can only create for themselves
    const isAdmin = (req.user?.role ?? 'user') === 'admin';
    if (parsed.data.user_id !== undefined && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const targetUserId = parsed.data.user_id ?? req.user!.userId;
    
    const created = await prisma.savings_accounts.create({
      data: {
        user_id: targetUserId,
        saving_name: parsed.data.saving_name,
        balance: parsed.data.balance ?? 0,
        interest_rate: parsed.data.interest_rate ?? 0,
      },
    });
    
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create savings account' });
  }
});

// PUT /savings_accounts/:id - Update a savings account
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const parsed = savingsAccountSchema.partial().safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    // Check if the savings account exists and belongs to the user
    const existingAccount = await prisma.savings_accounts.findFirst({
      where: { id, user_id: req.user!.userId }
    });

    if (!existingAccount) {
      return res.status(404).json({ error: 'Savings account not found' });
    }

    const updated = await prisma.savings_accounts.update({
      where: { id },
      data: parsed.data,
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update savings account' });
  }
});

// DELETE /savings_accounts/:id - Delete a savings account
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);

    // Check if the savings account exists and belongs to the user
    const existingAccount = await prisma.savings_accounts.findFirst({
      where: { id, user_id: req.user!.userId }
    });

    if (!existingAccount) {
      return res.status(404).json({ error: 'Savings account not found' });
    }

    await prisma.savings_accounts.delete({ 
      where: { id } 
    });
    
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete savings account' });
  }
});

export default router;
