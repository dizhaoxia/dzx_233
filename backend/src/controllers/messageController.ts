import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import * as MessageModel from '../models/Message.js';

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const messages = await MessageModel.findBySessionId(parseInt(sessionId));
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: '获取消息列表失败' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { senderType } = req.body;
    await MessageModel.markAsRead(parseInt(sessionId), senderType);
    res.json({ message: '消息已标记为已读' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: '标记已读失败' });
  }
};
