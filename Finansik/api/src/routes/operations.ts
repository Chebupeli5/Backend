import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();
router.use(requireAuth);

const opSchema = z.object({
  category_id: z.number().int(),
  type: z.enum(['income', 'expense']),
  transaction: z.number().int(),
  date: z.string().datetime().optional(),
  description: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  is_recurring: z.boolean().optional(),
  recurring_frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  recurring_end_date: z.string().datetime().optional(),
});

router.get('/', async (req: AuthRequest, res) => {
  const { from, to, category_id, type, q, tags } = req.query as any;
  const where: any = { user_id: req.user!.userId };
  if (from || to) where.date = { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined };
  if (category_id) where.category_id = Number(category_id);
  if (type) where.type = String(type);
  if (q) where.description = { contains: String(q), mode: 'insensitive' };
  if (tags) where.tags = { contains: String(tags), mode: 'insensitive' };
  const list = await prisma.operations.findMany({ where, orderBy: { date: 'desc' } });
  res.json(list);
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const parsed = opSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const data = parsed.data;

    // Validate category belongs to user
    const category = await prisma.categories.findFirst({ where: { category_id: data.category_id, user_id: req.user!.userId } });
    if (!category) return res.status(400).json({ error: 'Invalid category_id' });

    const created = await prisma.operations.create({
      data: {
        user_id: req.user!.userId,
        category_id: data.category_id,
        type: data.type,
        transaction: data.transaction,
        date: data.date ? new Date(data.date) : undefined,
        description: data.description,
        tags: data.tags,
        is_recurring: data.is_recurring ?? false,
        recurring_frequency: data.recurring_frequency,
        recurring_end_date: data.recurring_end_date ? new Date(data.recurring_end_date) : undefined,
      },
    });
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create operation' });
  }
});

// get by id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const op = await prisma.operations.findFirst({ where: { operation_id: id, user_id: req.user!.userId } });
    if (!op) return res.status(404).json({ error: 'Not found' });
    res.json(op);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch operation' });
  }
});

// update
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const parsed = opSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const data = parsed.data as any;

    // Ensure operation exists and belongs to user
    const existing = await prisma.operations.findFirst({ where: { operation_id: id, user_id: req.user!.userId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    // If category_id provided, validate belongs to user
    if (data.category_id !== undefined) {
      const category = await prisma.categories.findFirst({ where: { category_id: data.category_id, user_id: req.user!.userId } });
      if (!category) return res.status(400).json({ error: 'Invalid category_id' });
    }

    if (data.date) data.date = new Date(data.date);
    if (data.recurring_end_date) data.recurring_end_date = new Date(data.recurring_end_date);

    const updated = await prisma.operations.update({ where: { operation_id: id }, data });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update operation' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    // Ensure belongs to user
    const existing = await prisma.operations.findFirst({ where: { operation_id: id, user_id: req.user!.userId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await prisma.operations.delete({ where: { operation_id: id } });
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete operation' });
  }
});
export default router;


