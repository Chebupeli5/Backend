import jwt from 'jsonwebtoken';

const accessSecret = process.env.JWT_SECRET || 'dev_secret_change_me';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'dev_refresh_change_me';

export function signAccessToken(payload: object, expiresIn: string | number = '60m'): string {
  return (jwt.sign as any)(payload, accessSecret as any, { expiresIn });
}

export function signRefreshToken(payload: object, expiresIn: string | number = '30d'): string {
  return (jwt.sign as any)(payload, refreshSecret as any, { expiresIn });
}

export function verifyAccessToken<T = any>(token: string): T {
  return jwt.verify(token, accessSecret) as T;
}

export function verifyRefreshToken<T = any>(token: string): T {
  return jwt.verify(token, refreshSecret) as T;
}



