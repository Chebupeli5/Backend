import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

router.use(requireAuth);

const categorySchema = z.object({
  name: z.string().trim().min(1),
  balance: z.coerce.number().int().optional(),
  user_id: z.coerce.number().int().optional(),
});

router.get('/', async (req: AuthRequest, res) => {
  const list = await prisma.categories.findMany({ where: { user_id: req.user!.userId } });
  res.json(list);
});

router.post('/', async (req: AuthRequest, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  // Allow admin to specify user_id; regular users can only create for themselves
  const isAdmin = (req.user?.role ?? 'user') === 'admin';
  if (parsed.data.user_id !== undefined && !isAdmin) return res.status(403).json({ error: 'Forbidden' });
  const targetUserId = parsed.data.user_id ?? req.user!.userId;
  const created = await prisma.categories.create({
    data: { user_id: targetUserId, name: parsed.data.name, balance: parsed.data.balance ?? 0 },
  });
  res.status(201).json(created);
});

router.put('/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const parsed = categorySchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const updated = await prisma.categories.update({
    where: { category_id: id },
    data: parsed.data,
  });
  res.json(updated);
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  await prisma.categories.delete({ where: { category_id: id } });
  res.status(204).end();
});

// Category limits
const limitSchema = z.object({
  category_id: z.number().int(),
  limit: z.number().int().nonnegative(),
  user_id: z.number().int().optional(),
});

router.get('/limits', async (req: AuthRequest, res) => {
  const list = await prisma.categorylimit.findMany({ where: { user_id: req.user!.userId } });
  res.json(list);
});

router.post('/limits', async (req: AuthRequest, res) => {
  const parsed = limitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const isAdmin = (req.user?.role ?? 'user') === 'admin';
  if (parsed.data.user_id !== undefined && !isAdmin) return res.status(403).json({ error: 'Forbidden' });
  const targetUserId = parsed.data.user_id ?? req.user!.userId;
  const created = await prisma.categorylimit.create({
    data: { user_id: targetUserId, category_id: parsed.data.category_id, limit: parsed.data.limit },
  });
  res.status(201).json(created);
});

router.put('/limits/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const parsed = limitSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const updated = await prisma.categorylimit.update({ where: { id }, data: parsed.data });
  res.json(updated);
});

router.delete('/limits/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  await prisma.categorylimit.delete({ where: { id } });
  res.status(204).end();
});

export default router;
