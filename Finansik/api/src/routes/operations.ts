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
});

router.get('/', async (req: AuthRequest, res) => {
  const { from, to, category_id, type } = req.query as any;
  const where: any = { user_id: req.user!.userId };
  if (from || to) where.date = { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined };
  if (category_id) where.category_id = Number(category_id);
  if (type) where.type = String(type);
  const list = await prisma.operations.findMany({ where, orderBy: { date: 'desc' } });
  res.json(list);
});

router.post('/', async (req: AuthRequest, res) => {
  const parsed = opSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const data = parsed.data;
  const created = await prisma.operations.create({
    data: {
      user_id: req.user!.userId,
      category_id: data.category_id,
      type: data.type,
      transaction: data.transaction,
      date: data.date ? new Date(data.date) : undefined,
    },
  });
  res.status(201).json(created);
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  await prisma.operations.delete({ where: { operation_id: id } });
  res.status(204).end();
});

// summaries
router.get('/summary/monthly', async (req: AuthRequest, res) => {
  const { year } = req.query as any;
  const y = Number(year) || new Date().getFullYear();
  const start = new Date(`${y}-01-01T00:00:00.000Z`);
  const end = new Date(`${y}-12-31T23:59:59.999Z`);
  const rows = await prisma.$queryRaw<any[]>`
    SELECT DATE_TRUNC('month', date) as m,
           SUM(CASE WHEN type='income' THEN transaction ELSE 0 END) as income,
           SUM(CASE WHEN type='expense' THEN transaction ELSE 0 END) as expense
    FROM operations
    WHERE user_id = ${req.user!.userId} AND date BETWEEN ${start} AND ${end}
    GROUP BY 1
    ORDER BY 1`;
  res.json(rows);
});

router.get('/summary/by-category', async (req: AuthRequest, res) => {
  const rows = await prisma.$queryRaw<any[]>`
    SELECT c.name,
           SUM(CASE WHEN o.type='income' THEN o.transaction ELSE 0 END) as income,
           SUM(CASE WHEN o.type='expense' THEN o.transaction ELSE 0 END) as expense
    FROM operations o
    JOIN categories c ON c.category_id = o.category_id
    WHERE o.user_id = ${req.user!.userId}
    GROUP BY c.name
    ORDER BY c.name`;
  res.json(rows);
});

export default router;


