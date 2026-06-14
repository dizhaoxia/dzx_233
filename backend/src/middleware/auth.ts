import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'customer-service-secret-key-2024';

export interface AuthRequest extends Request {
  adminId?: number;
  adminUsername?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: '未提供认证令牌' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: number; username: string };
    req.adminId = decoded.adminId;
    req.adminUsername = decoded.username;
    next();
  } catch (error) {
    res.status(401).json({ error: '无效的认证令牌' });
  }
};

export const generateToken = (adminId: number, username: string): string => {
  return jwt.sign(
    { adminId, username },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};
