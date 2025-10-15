import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();
router.use(requireAuth);

const notifySchema = z.object({ message: z.string().min(1) });
const notifyUpdateSchema = notifySchema.partial();

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

router.get('/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
  const item = await prisma.notifications.findUnique({ where: { id } });
  if (!item || item.user_id !== req.user!.userId) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.put('/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
  const parsed = notifyUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const existing = await prisma.notifications.findUnique({ where: { id } });
  if (!existing || existing.user_id !== req.user!.userId) return res.status(404).json({ error: 'Not found' });
  const data: any = { ...parsed.data };
  if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Nothing to update' });
  const updated = await prisma.notifications.update({ where: { id }, data });
  res.json(updated);
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
  const existing = await prisma.notifications.findUnique({ where: { id } });
  if (!existing || existing.user_id !== req.user!.userId) return res.status(404).json({ error: 'Not found' });
  await prisma.notifications.delete({ where: { id } });
  res.status(204).send();
});

export default router;


