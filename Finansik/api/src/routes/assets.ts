import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();
router.use(requireAuth);

const assetSchema = z.object({ name: z.string().min(1), balance: z.number().int().optional() });
const savingSchema = z.object({ saving_name: z.string().min(1), balance: z.number().int().optional(), interest_rate: z.number().optional() });

router.get('/assets', async (req: AuthRequest, res) => {
  const list = await prisma.assets.findMany({ where: { user_id: req.user!.userId } });
  res.json(list);
});

router.post('/assets', async (req: AuthRequest, res) => {
  const parsed = assetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const created = await prisma.assets.create({ data: { user_id: req.user!.userId, name: parsed.data.name, balance: parsed.data.balance ?? 0 } });
  res.status(201).json(created);
});

router.get('/savings', async (req: AuthRequest, res) => {
  const list = await prisma.savings_accounts.findMany({ where: { user_id: req.user!.userId } });
  res.json(list);
});

router.post('/savings', async (req: AuthRequest, res) => {
  const parsed = savingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const created = await prisma.savings_accounts.create({ data: { user_id: req.user!.userId, ...parsed.data } });
  res.status(201).json(created);
});

export default router;


