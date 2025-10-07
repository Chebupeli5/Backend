import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const schema = z.object({ saving_name: z.string().min(1), balance: z.number().int().optional(), interest_rate: z.number().optional() });

router.get('/', async (req: AuthRequest, res) => {
  const items = await prisma.savings_accounts.findMany({ where: { user_id: req.user!.userId } });
  res.json(items);
});

router.post('/', async (req: AuthRequest, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { saving_name, balance = 0, interest_rate = 0 } = parsed.data;
  const item = await prisma.savings_accounts.create({ data: { user_id: req.user!.userId, saving_name, balance, interest_rate } });
  res.status(201).json(item);
});

router.put('/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const parsed = schema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const item = await prisma.savings_accounts.update({ where: { id }, data: parsed.data });
  res.json(item);
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  await prisma.savings_accounts.delete({ where: { id } });
  res.status(204).send();
});

export default router;


