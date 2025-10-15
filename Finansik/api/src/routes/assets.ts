import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();
router.use(requireAuth);

const assetSchema = z.object({ name: z.string().min(1), balance: z.number().int().optional(), user_id: z.number().int().optional() });
const assetUpdateSchema = z.object({ name: z.string().min(1).optional(), balance: z.number().int().optional() });

router.get('/assets', async (req: AuthRequest, res) => {
  const list = await prisma.assets.findMany({ where: { user_id: req.user!.userId } });
  res.json(list);
});

router.post('/assets', async (req: AuthRequest, res) => {
  const parsed = assetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const isAdmin = (req.user?.role ?? 'user') === 'admin';
  if (parsed.data.user_id !== undefined && !isAdmin) return res.status(403).json({ error: 'Forbidden' });
  const targetUserId = parsed.data.user_id ?? req.user!.userId;
  const created = await prisma.assets.create({ data: { user_id: targetUserId, name: parsed.data.name, balance: parsed.data.balance ?? 0 } });
  res.status(201).json(created);
});


router.put('/assets/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
  const parsed = assetUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const data: any = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.balance !== undefined) data.balance = parsed.data.balance;
  if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Nothing to update' });

  const existing = await prisma.assets.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Asset not found' });
  const isAdmin = (req.user?.role ?? 'user') === 'admin';
  if (!isAdmin && existing.user_id !== req.user!.userId) return res.status(404).json({ error: 'Asset not found' });

  const updated = await prisma.assets.update({ where: { id }, data });
  res.json(updated);
});

router.delete('/assets/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  await prisma.assets.delete({ where: { id } });
  res.status(204).end();
});

export default router;


