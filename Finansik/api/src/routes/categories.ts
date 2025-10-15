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

const categoryUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  balance: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().nonnegative().nullable().optional(),
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
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const parsed = categoryUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    // Load category and check access
    const existing = await prisma.categories.findUnique({ where: { category_id: id } });
    if (!existing) return res.status(404).json({ error: 'Category not found' });
    const isAdmin = (req.user?.role ?? 'user') === 'admin';
    if (!isAdmin && existing.user_id !== req.user!.userId) return res.status(404).json({ error: 'Category not found' });

    const updates: any[] = [];
    // Update category fields if provided
    const catData: any = {};
    if (parsed.data.name !== undefined) catData.name = parsed.data.name;
    if (parsed.data.balance !== undefined) catData.balance = parsed.data.balance;
    if (Object.keys(catData).length) {
      updates.push(prisma.categories.update({ where: { category_id: id }, data: catData }));
    }

    // Handle limit if provided
    if (parsed.data.limit !== undefined) {
      const targetUserId = existing.user_id;
      if (parsed.data.limit === null) {
        updates.push(prisma.categorylimit.deleteMany({ where: { category_id: id, user_id: targetUserId } }));
      } else {
        const currentLimit = await prisma.categorylimit.findFirst({ where: { category_id: id, user_id: targetUserId } });
        if (currentLimit) {
          updates.push(prisma.categorylimit.update({ where: { id: currentLimit.id }, data: { limit: parsed.data.limit } }));
        } else {
          updates.push(prisma.categorylimit.create({ data: { category_id: id, user_id: targetUserId, limit: parsed.data.limit } }));
        }
      }
    }

    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    await prisma.$transaction(updates);

    // Return updated category with current limit value
    const [updatedCat, updatedLimit] = await Promise.all([
      prisma.categories.findUnique({ where: { category_id: id } }),
      prisma.categorylimit.findFirst({ where: { category_id: id, user_id: existing.user_id } }),
    ]);

    res.json({ ...updatedCat!, limit: updatedLimit ? updatedLimit.limit : null });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    // Ensure category exists and belongs to current user (or admin)
    const category = await prisma.categories.findUnique({ where: { category_id: id } });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    const isAdmin = (req.user?.role ?? 'user') === 'admin';
    if (!isAdmin && category.user_id !== req.user!.userId) return res.status(404).json({ error: 'Category not found' });

    // Delete dependencies first, then category (single transaction)
    await prisma.$transaction([
      prisma.categorylimit.deleteMany({ where: { category_id: id, user_id: category.user_id } }),
      prisma.operations.deleteMany({ where: { category_id: id, user_id: category.user_id } }),
      prisma.categories.delete({ where: { category_id: id } }),
    ]);

    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
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
