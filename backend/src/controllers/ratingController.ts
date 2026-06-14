import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import * as RatingModel from '../models/Rating.js';
import type { RatingScore } from '../types/index.js';

export const getRatings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.adminId;
    if (!adminId) {
      res.status(401).json({ error: '未授权' });
      return;
    }

    const { limit } = req.query;
    const ratings = await RatingModel.findByAdminId(adminId, limit ? parseInt(limit as string) : undefined);
    res.json(ratings);
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: '获取评价列表失败' });
  }
};

export const getRatingBySessionId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.adminId;
    if (!adminId) {
      res.status(401).json({ error: '未授权' });
      return;
    }

    const { sessionId } = req.params;
    const rating = await RatingModel.findBySessionId(parseInt(sessionId));

    if (!rating) {
      res.status(404).json({ error: '评价不存在' });
      return;
    }

    if (rating.adminId !== adminId) {
      res.status(403).json({ error: '无权限查看此评价' });
      return;
    }

    res.json(rating);
  } catch (error) {
    console.error('Get rating by session id error:', error);
    res.status(500).json({ error: '获取评价失败' });
  }
};

export const createRating = async (req: AuthRequest | any, res: Response): Promise<void> => {
  try {
    const { sessionId, visitorId, score, feedback } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: '会话ID不能为空' });
      return;
    }
    if (!visitorId) {
      res.status(400).json({ error: '访客ID不能为空' });
      return;
    }
    if (!score) {
      res.status(400).json({ error: '评价分数不能为空' });
      return;
    }

    const validScores: RatingScore[] = ['satisfied', 'neutral', 'dissatisfied'];
    if (!validScores.includes(score)) {
      res.status(400).json({ error: '无效的评价分数' });
      return;
    }

    const existing = await RatingModel.findBySessionId(sessionId);
    if (existing) {
      res.status(400).json({ error: '该会话已评价' });
      return;
    }

    const rating = await RatingModel.create(
      parseInt(sessionId),
      null,
      visitorId,
      score,
      feedback
    );

    res.status(201).json(rating);
  } catch (error) {
    console.error('Create rating error:', error);
    res.status(500).json({ error: '提交评价失败' });
  }
};

export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.adminId;
    if (!adminId) {
      res.status(401).json({ error: '未授权' });
      return;
    }

    const { startDate, endDate } = req.query;
    const stats = await RatingModel.getAdminStats(
      adminId,
      startDate as string | undefined,
      endDate as string | undefined
    );

    res.json(stats);
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
};
