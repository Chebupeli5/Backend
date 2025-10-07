import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();
router.use(requireAuth);

const goalSchema = z.object({ goal_name: z.string().min(1), goal: z.number().int().positive() });

router.get('/', async (req: AuthRequest, res) => {
  const list = await prisma.financial_goals.findMany({ where: { user_id: req.user!.userId } });
  const assetsSum = await prisma.assets.aggregate({ _sum: { balance: true }, where: { user_id: req.user!.userId } });
  const savingsSum = await prisma.savings_accounts.aggregate({ _sum: { balance: true }, where: { user_id: req.user!.userId } });
  const total = (assetsSum._sum.balance ?? 0) + (savingsSum._sum.balance ?? 0);
  res.json({ goals: list, totalBalance: total });
});

router.post('/', async (req: AuthRequest, res) => {
  const parsed = goalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const created = await prisma.financial_goals.create({ data: { user_id: req.user!.userId, ...parsed.data } });
  res.status(201).json(created);
});

export default router;


