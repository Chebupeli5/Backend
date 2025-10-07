import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();
router.use(requireAuth);

router.get('/balance', async (req: AuthRequest, res) => {
  const income = await prisma.operations.aggregate({ _sum: { transaction: true }, where: { user_id: req.user!.userId, type: 'income' } });
  const expense = await prisma.operations.aggregate({ _sum: { transaction: true }, where: { user_id: req.user!.userId, type: 'expense' } });
  const assets = await prisma.assets.aggregate({ _sum: { balance: true }, where: { user_id: req.user!.userId } });
  const savings = await prisma.savings_accounts.aggregate({ _sum: { balance: true }, where: { user_id: req.user!.userId } });
  res.json({
    income: income._sum.transaction ?? 0,
    expense: expense._sum.transaction ?? 0,
    net: (income._sum.transaction ?? 0) - (expense._sum.transaction ?? 0),
    assets: (assets._sum.balance ?? 0) + (savings._sum.balance ?? 0),
  });
});

export default router;


