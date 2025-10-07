import { Router } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();
const upload = multer({ dest: 'uploads/' });

router.use(requireAuth);

router.get('/', async (req: AuthRequest, res) => {
  const list = await prisma.reports.findMany({ where: { user_id: req.user!.userId }, orderBy: { created: 'desc' } });
  res.json(list);
});

router.post('/', upload.single('file'), async (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const created = await prisma.reports.create({ data: { user_id: req.user!.userId, file: req.file.path } });
  res.status(201).json(created);
});

export default router;


