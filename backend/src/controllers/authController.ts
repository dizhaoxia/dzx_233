import bcrypt from 'bcryptjs';
import type { Response } from 'express';
import * as AdminModel from '../models/Admin.js';
import { generateToken, type AuthRequest } from '../middleware/auth.js';

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: '用户名和密码不能为空' });
      return;
    }

    const admin = await AdminModel.findByUsername(username);
    if (!admin) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const isPasswordValid = bcrypt.compareSync(password, admin.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const token = generateToken(admin.id, admin.username);

    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        status: admin.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.adminId;
    if (adminId) {
      await AdminModel.updateStatus(adminId, 'offline');
    }
    res.json({ message: '登出成功' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: '登出失败' });
  }
};

export const updateStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const adminId = req.adminId;

    if (!adminId) {
      res.status(401).json({ error: '未授权' });
      return;
    }

    if (!['online', 'offline', 'busy'].includes(status)) {
      res.status(400).json({ error: '无效的状态' });
      return;
    }

    await AdminModel.updateStatus(adminId, status);
    res.json({ message: '状态更新成功', status });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: '状态更新失败' });
  }
};
