import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import * as SessionModel from '../models/Session.js';
import * as MessageModel from '../models/Message.js';

export const getSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.adminId;
    if (!adminId) {
      res.status(401).json({ error: '未授权' });
      return;
    }

    const sessions = await SessionModel.findByAdminId(adminId);
    res.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: '获取会话列表失败' });
  }
};

export const getSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const session = await SessionModel.findById(parseInt(id));
    
    if (!session) {
      res.status(404).json({ error: '会话不存在' });
      return;
    }

    const messages = await MessageModel.findBySessionId(parseInt(id));
    res.json({ session, messages });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: '获取会话详情失败' });
  }
};

export const endSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await SessionModel.updateStatus(parseInt(id), 'ended');
    res.json({ message: '会话已结束' });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ error: '结束会话失败' });
  }
};

export const getVisitorHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { visitorId } = req.params;
    const sessions = await SessionModel.findHistoryByVisitorId(visitorId);
    
    const result = [];
    for (const session of sessions) {
      const messages = await MessageModel.findBySessionId(session.id);
      result.push({ session, messages });
    }

    res.json(result);
  } catch (error) {
    console.error('Get visitor history error:', error);
    res.status(500).json({ error: '获取访客历史记录失败' });
  }
};

export const getVisitorSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { visitorId } = req.params;
    const session = await SessionModel.findActiveByVisitorId(visitorId);
    
    if (!session) {
      res.status(404).json({ error: '无进行中的会话' });
      return;
    }

    const messages = await MessageModel.findBySessionId(session.id);
    res.json({ session, messages });
  } catch (error) {
    console.error('Get visitor session error:', error);
    res.status(500).json({ error: '获取访客会话失败' });
  }
};
