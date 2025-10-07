import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '../utils/hash.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

const prisma = new PrismaClient();
const router = Router();

const credentialsSchema = z.object({
  login: z.string().min(3),
  password: z.string().min(6),
  visualname: z.string().min(1).optional(),
  role: z.enum(['user', 'admin']).optional(),
});

router.post('/signup', async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { login, password, visualname, role } = parsed.data;
  const existing = await prisma.users.findUnique({ where: { login } });
  if (existing) return res.status(409).json({ error: 'Login already exists' });
  const hashed = await hashPassword(password);
  const user = await prisma.users.create({ data: { login, password: hashed, visualname: visualname ?? login, role: role ?? 'user' } });
  const accessToken = signAccessToken({ userId: user.user_id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.user_id });
  const exp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.refresh_tokens.create({ data: { user_id: user.user_id, token: refreshToken, expiresAt: exp } });
  res.json({ accessToken, refreshToken, user: { id: user.user_id, login: user.login, visualname: user.visualname, role: user.role } });
});

router.post('/login', async (req, res) => {
  const parsed = credentialsSchema.pick({ login: true, password: true }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { login, password } = parsed.data;
  const user = await prisma.users.findUnique({ where: { login } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await verifyPassword(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const accessToken = signAccessToken({ userId: user.user_id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.user_id });
  const exp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.refresh_tokens.create({ data: { user_id: user.user_id, token: refreshToken, expiresAt: exp } });
  res.json({ accessToken, refreshToken, user: { id: user.user_id, login: user.login, visualname: user.visualname, role: user.role } });

});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) return res.status(400).json({ error: 'Missing refreshToken' });
  const stored = await prisma.refresh_tokens.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) return res.status(401).json({ error: 'Invalid refresh token' });
  try {
    const payload = verifyRefreshToken<{ userId: number }>(refreshToken);
    const user = await prisma.users.findUnique({ where: { user_id: payload.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });
    const accessToken = signAccessToken({ userId: user.user_id, role: user.role });
    res.json({ accessToken });
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) return res.status(400).json({ error: 'Missing refreshToken' });
  await prisma.refresh_tokens.updateMany({ where: { token: refreshToken }, data: { revoked: true } });
  res.status(204).end();
});

export default router;



