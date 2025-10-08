import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';

export interface AuthRequest extends Request {
  user?: { userId: number; role?: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - Missing or invalid authorization header' });
  }
  try {
    const token = auth.slice('Bearer '.length);
    const payload = verifyAccessToken<{ userId: number; role?: string }>(token);
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch (e) {
    console.error('Token verification failed:', e);
    return res.status(401).json({ error: 'Invalid token - Token may be expired or malformed' });
  }
}

export function requireRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || (req.user.role ?? 'user') !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}



