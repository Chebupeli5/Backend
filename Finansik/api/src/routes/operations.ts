import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();
router.use(requireAuth);

// Enhanced operation schema with more fields
const operationSchema = z.object({
  category_id: z.number().int().positive(),
  type: z.enum(['income', 'expense']),
  transaction: z.number().int(),
  date: z.string().datetime().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  is_recurring: z.boolean().default(false),
  recurring_frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  recurring_end_date: z.string().datetime().optional(),
});

const updateOperationSchema = operationSchema.partial();

// Get all operations with advanced filtering
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { 
      from, 
      to, 
      category_id, 
      type, 
      tags, 
      min_amount, 
      max_amount,
      search,
      page = '1',
      limit = '50',
      sort_by = 'date',
      sort_order = 'desc'
    } = req.query as any;

    const where: any = { user_id: req.user!.userId };

    // Date filtering
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    // Category filtering
    if (category_id) where.category_id = Number(category_id);

    // Type filtering
    if (type) where.type = String(type);

    // Amount filtering
    if (min_amount || max_amount) {
      where.transaction = {};
      if (min_amount) where.transaction.gte = Number(min_amount);
      if (max_amount) where.transaction.lte = Number(max_amount);
    }

    // Tags filtering
    if (tags) {
      const tagArray = String(tags).split(',').map(t => t.trim());
      where.tags = { contains: tagArray[0] }; // Simple contains for now
    }

    // Search in description
    if (search) {
      where.description = { contains: String(search), mode: 'insensitive' };
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const orderBy: any = {};
    orderBy[sort_by] = sort_order;

    const [operations, total] = await Promise.all([
      prisma.operations.findMany({
        where,
        include: {
          category: {
            select: { category_id: true, name: true }
          }
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.operations.count({ where })
    ]);

    // Calculate summary statistics
    const summary = await prisma.operations.aggregate({
      where,
      _sum: { transaction: true },
      _count: { operation_id: true },
      _avg: { transaction: true }
    });

    const incomeTotal = await prisma.operations.aggregate({
      where: { ...where, type: 'income' },
      _sum: { transaction: true }
    });

    const expenseTotal = await prisma.operations.aggregate({
      where: { ...where, type: 'expense' },
      _sum: { transaction: true }
    });

    res.json({
      operations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      },
      summary: {
        total_operations: summary._count.operation_id,
        total_amount: summary._sum.transaction || 0,
        average_amount: Math.round(summary._avg.transaction || 0),
        income_total: incomeTotal._sum.transaction || 0,
        expense_total: expenseTotal._sum.transaction || 0,
        net_amount: (incomeTotal._sum.transaction || 0) - (expenseTotal._sum.transaction || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching operations:', error);
    res.status(500).json({ error: 'Failed to fetch operations' });
  }
});

// Get specific operation by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const operation = await prisma.operations.findFirst({
      where: { operation_id: id, user_id: req.user!.userId },
      include: {
        category: {
          select: { category_id: true, name: true }
        }
      }
    });

    if (!operation) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    res.json(operation);
  } catch (error) {
    console.error('Error fetching operation:', error);
    res.status(500).json({ error: 'Failed to fetch operation' });
  }
});

// Create new operation
router.post('/', async (req: AuthRequest, res) => {
  try {
    const parsed = operationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const operationData = {
      ...parsed.data,
      user_id: req.user!.userId,
      date: parsed.data.date ? new Date(parsed.data.date) : undefined,
      recurring_end_date: parsed.data.recurring_end_date ? new Date(parsed.data.recurring_end_date) : undefined,
    };

    const created = await prisma.operations.create({
      data: operationData,
      include: {
        category: {
          select: { category_id: true, name: true }
        }
      }
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating operation:', error);
    res.status(500).json({ error: 'Failed to create operation' });
  }
});

// Update operation
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const parsed = updateOperationSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    // Check if operation exists and belongs to user
    const existingOperation = await prisma.operations.findFirst({
      where: { operation_id: id, user_id: req.user!.userId }
    });

    if (!existingOperation) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    const updateData = {
      ...parsed.data,
      date: parsed.data.date ? new Date(parsed.data.date) : undefined,
      recurring_end_date: parsed.data.recurring_end_date ? new Date(parsed.data.recurring_end_date) : undefined,
    };

    const updated = await prisma.operations.update({
      where: { operation_id: id },
      data: updateData,
      include: {
        category: {
          select: { category_id: true, name: true }
        }
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating operation:', error);
    res.status(500).json({ error: 'Failed to update operation' });
  }
});

// Delete operation
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    
    // Check if operation exists and belongs to user
    const existingOperation = await prisma.operations.findFirst({
      where: { operation_id: id, user_id: req.user!.userId }
    });

    if (!existingOperation) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    await prisma.operations.delete({ where: { operation_id: id } });
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting operation:', error);
    res.status(500).json({ error: 'Failed to delete operation' });
  }
});

// Bulk operations
router.post('/bulk', async (req: AuthRequest, res) => {
  try {
    const { operations } = req.body as { operations: any[] };
    
    if (!Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({ error: 'Operations array is required' });
    }

    if (operations.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 operations per bulk request' });
    }

    const validatedOperations = operations.map(op => {
      const parsed = operationSchema.safeParse(op);
      if (!parsed.success) {
        throw new Error(`Invalid operation: ${parsed.error.message}`);
      }
      return {
        ...parsed.data,
        user_id: req.user!.userId,
        date: parsed.data.date ? new Date(parsed.data.date) : undefined,
        recurring_end_date: parsed.data.recurring_end_date ? new Date(parsed.data.recurring_end_date) : undefined,
      };
    });

    const created = await prisma.operations.createMany({
      data: validatedOperations,
      skipDuplicates: true
    });

    res.status(201).json({ 
      message: `${created.count} operations created successfully`,
      created_count: created.count,
      requested_count: operations.length
    });
  } catch (error) {
    console.error('Error creating bulk operations:', error);
    res.status(500).json({ error: 'Failed to create bulk operations' });
  }
});

// Monthly summary (enhanced)
router.get('/summary/monthly', async (req: AuthRequest, res) => {
  try {
    const { year } = req.query as any;
    const y = Number(year) || new Date().getFullYear();
    const start = new Date(`${y}-01-01T00:00:00.000Z`);
    const end = new Date(`${y}-12-31T23:59:59.999Z`);
    
    const rows = await prisma.$queryRaw<any[]>`
      SELECT DATE_TRUNC('month', date) as month,
             SUM(CASE WHEN type='income' THEN transaction ELSE 0 END) as income,
             SUM(CASE WHEN type='expense' THEN transaction ELSE 0 END) as expense,
             COUNT(*) as operation_count,
             AVG(transaction) as average_amount
      FROM operations
      WHERE user_id = ${req.user!.userId} AND date BETWEEN ${start} AND ${end}
      GROUP BY 1
      ORDER BY 1`;

    // Calculate year totals
    const yearTotals = await prisma.operations.aggregate({
      where: {
        user_id: req.user!.userId,
        date: { gte: start, lte: end }
      },
      _sum: { transaction: true },
      _count: { operation_id: true }
    });

    res.json({
      monthly_data: rows,
      year_summary: {
        total_operations: yearTotals._count.operation_id,
        total_amount: yearTotals._sum.transaction || 0,
        income_total: rows.reduce((sum, row) => sum + Number(row.income), 0),
        expense_total: rows.reduce((sum, row) => sum + Number(row.expense), 0)
      }
    });
  } catch (error) {
    console.error('Error fetching monthly summary:', error);
    res.status(500).json({ error: 'Failed to fetch monthly summary' });
  }
});

// Category summary (enhanced)
router.get('/summary/by-category', async (req: AuthRequest, res) => {
  try {
    const { year, type } = req.query as any;
    
    let whereClause = `WHERE o.user_id = ${req.user!.userId}`;
    if (year) {
      const start = new Date(`${year}-01-01T00:00:00.000Z`);
      const end = new Date(`${year}-12-31T23:59:59.999Z`);
      whereClause += ` AND o.date BETWEEN '${start.toISOString()}' AND '${end.toISOString()}'`;
    }
    if (type) {
      whereClause += ` AND o.type = '${type}'`;
    }

    const rows = await prisma.$queryRaw<any[]>`
      SELECT c.category_id,
             c.name,
             SUM(CASE WHEN o.type='income' THEN o.transaction ELSE 0 END) as income,
             SUM(CASE WHEN o.type='expense' THEN o.transaction ELSE 0 END) as expense,
             COUNT(*) as operation_count,
             AVG(o.transaction) as average_amount
      FROM operations o
      JOIN categories c ON c.category_id = o.category_id
      ${whereClause}
      GROUP BY c.category_id, c.name
      ORDER BY (income + expense) DESC`;

    res.json(rows);
  } catch (error) {
    console.error('Error fetching category summary:', error);
    res.status(500).json({ error: 'Failed to fetch category summary' });
  }
});

// Daily summary
router.get('/summary/daily', async (req: AuthRequest, res) => {
  try {
    const { from, to } = req.query as any;
    const start = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const end = to ? new Date(to) : new Date();

    const rows = await prisma.$queryRaw<any[]>`
      SELECT DATE_TRUNC('day', date) as day,
             SUM(CASE WHEN type='income' THEN transaction ELSE 0 END) as income,
             SUM(CASE WHEN type='expense' THEN transaction ELSE 0 END) as expense,
             COUNT(*) as operation_count
      FROM operations
      WHERE user_id = ${req.user!.userId} AND date BETWEEN ${start} AND ${end}
      GROUP BY 1
      ORDER BY 1`;

    res.json(rows);
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    res.status(500).json({ error: 'Failed to fetch daily summary' });
  }
});

// Analytics and insights
router.get('/analytics/insights', async (req: AuthRequest, res) => {
  try {
    const { period = '30' } = req.query as any;
    const days = Number(period);
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const end = new Date();

    // Spending patterns
    const spendingPatterns = await prisma.$queryRaw<any[]>`
      SELECT 
        EXTRACT(HOUR FROM date) as hour,
        EXTRACT(DOW FROM date) as day_of_week,
        AVG(transaction) as average_amount,
        COUNT(*) as operation_count
      FROM operations
      WHERE user_id = ${req.user!.userId} 
        AND type = 'expense' 
        AND date BETWEEN ${start} AND ${end}
      GROUP BY 1, 2
      ORDER BY 1, 2`;

    // Top categories
    const topCategories = await prisma.$queryRaw<any[]>`
      SELECT c.name,
             SUM(o.transaction) as total_amount,
             COUNT(*) as operation_count
      FROM operations o
      JOIN categories c ON c.category_id = o.category_id
      WHERE o.user_id = ${req.user!.userId} 
        AND o.type = 'expense'
        AND o.date BETWEEN ${start} AND ${end}
      GROUP BY c.name
      ORDER BY total_amount DESC
      LIMIT 10`;

    // Monthly trends
    const monthlyTrends = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(CASE WHEN type='income' THEN transaction ELSE 0 END) as income,
        SUM(CASE WHEN type='expense' THEN transaction ELSE 0 END) as expense
      FROM operations
      WHERE user_id = ${req.user!.userId} 
        AND date BETWEEN ${start} AND ${end}
      GROUP BY 1
      ORDER BY 1`;

    res.json({
      spending_patterns: spendingPatterns,
      top_categories: topCategories,
      monthly_trends: monthlyTrends,
      period_days: days
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Export operations
router.get('/export/csv', async (req: AuthRequest, res) => {
  try {
    const { from, to, category_id, type } = req.query as any;
    
    const where: any = { user_id: req.user!.userId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    if (category_id) where.category_id = Number(category_id);
    if (type) where.type = String(type);

    const operations = await prisma.operations.findMany({
      where,
      include: {
        category: {
          select: { name: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Convert to CSV format
    const csvHeader = 'Date,Type,Category,Amount,Description,Tags\n';
    const csvRows = operations.map(op => 
      `${op.date.toISOString().split('T')[0]},${op.type},${op.category.name},${op.transaction},"${op.description || ''}","${op.tags || ''}"`
    ).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="operations.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting operations:', error);
    res.status(500).json({ error: 'Failed to export operations' });
  }
});

export default router;


