import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();
router.use(requireAuth);

const notifySchema = z.object({ message: z.string().min(1) });

router.get('/', async (req: AuthRequest, res) => {
  const list = await prisma.notifications.findMany({ where: { user_id: req.user!.userId }, orderBy: { created: 'desc' } });
  res.json(list);
});

router.post('/', async (req: AuthRequest, res) => {
  const parsed = notifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const created = await prisma.notifications.create({ data: { user_id: req.user!.userId, message: parsed.data.message } });
  res.status(201).json(created);
});

router.get('/due', async (req: AuthRequest, res) => {
  const now = new Date();
  const three = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const loans = await prisma.loans.findMany({ where: { user_id: req.user!.userId, payment_date: { gte: now, lte: three } } });
  const msgs = loans.map(l => ({ type: 'loan', id: l.id, due: l.payment_date, message: `Платёж по кредиту ${l.credit_name} скоро` }));
  res.json(msgs);
});

export default router;


