import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();
router.use(requireAuth);

const loanSchema = z.object({
  credit_name: z.string().min(1),
  loan_balance: z.number().int().positive(),
  loan_payment: z.number().int().positive(),
  payment_date: z.string().datetime(),
});
const loanUpdateSchema = loanSchema.partial();

router.get('/', async (req: AuthRequest, res) => {
  const list = await prisma.loans.findMany({ where: { user_id: req.user!.userId } });
  res.json(list);
});

router.post('/', async (req: AuthRequest, res) => {
  const parsed = loanSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const created = await prisma.loans.create({ data: { user_id: req.user!.userId, ...parsed.data, payment_date: new Date(parsed.data.payment_date) } });
  res.status(201).json(created);
});

router.get('/schedule/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const loan = await prisma.loans.findUnique({ where: { id } });
  if (!loan || loan.user_id !== req.user!.userId) return res.status(404).json({ error: 'Not found' });
  const months = Math.ceil(loan.loan_balance / loan.loan_payment);
  const schedule = Array.from({ length: months }).map((_, i) => ({
    installment: i + 1,
    amount: loan.loan_payment,
    due: new Date(new Date(loan.payment_date).setMonth(loan.payment_date.getMonth() + i)),
  }));
  res.json({ schedule });
});

router.get('/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
  const loan = await prisma.loans.findUnique({ where: { id } });
  if (!loan || loan.user_id !== req.user!.userId) return res.status(404).json({ error: 'Not found' });
  res.json(loan);
});

router.put('/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
  const parsed = loanUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const existing = await prisma.loans.findUnique({ where: { id } });
  if (!existing || existing.user_id !== req.user!.userId) return res.status(404).json({ error: 'Not found' });
  const data: any = { ...parsed.data };
  if (data.payment_date !== undefined) data.payment_date = new Date(data.payment_date);
  const updated = await prisma.loans.update({ where: { id }, data });
  res.json(updated);
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
  const existing = await prisma.loans.findUnique({ where: { id } });
  if (!existing || existing.user_id !== req.user!.userId) return res.status(404).json({ error: 'Not found' });
  await prisma.loans.delete({ where: { id } });
  res.status(204).send();
});

export default router;


