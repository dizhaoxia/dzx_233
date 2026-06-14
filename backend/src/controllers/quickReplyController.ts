import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import * as QuickReplyModel from '../models/QuickReply.js';
import type { QuickReplyCategory } from '../types/index.js';

export const getQuickReplies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.adminId;
    if (!adminId) {
      res.status(401).json({ error: '未授权' });
      return;
    }

    const quickReplies = await QuickReplyModel.findByAdminId(adminId);
    res.json(quickReplies);
  } catch (error) {
    console.error('Get quick replies error:', error);
    res.status(500).json({ error: '获取快捷回复失败' });
  }
};

export const createQuickReply = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.adminId;
    if (!adminId) {
      res.status(401).json({ error: '未授权' });
      return;
    }

    const { title, content, category } = req.body;
    
    if (!title?.trim()) {
      res.status(400).json({ error: '标题不能为空' });
      return;
    }
    if (!content?.trim()) {
      res.status(400).json({ error: '内容不能为空' });
      return;
    }

    const validCategories: QuickReplyCategory[] = ['greeting', 'faq', 'closing', 'custom'];
    const replyCategory = validCategories.includes(category) ? category : 'custom';

    const quickReply = await QuickReplyModel.create(adminId, title.trim(), content.trim(), replyCategory);
    res.status(201).json(quickReply);
  } catch (error) {
    console.error('Create quick reply error:', error);
    res.status(500).json({ error: '创建快捷回复失败' });
  }
};

export const updateQuickReply = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.adminId;
    if (!adminId) {
      res.status(401).json({ error: '未授权' });
      return;
    }

    const { id } = req.params;
    const { title, content, category } = req.body;

    if (!title?.trim()) {
      res.status(400).json({ error: '标题不能为空' });
      return;
    }
    if (!content?.trim()) {
      res.status(400).json({ error: '内容不能为空' });
      return;
    }

    const validCategories: QuickReplyCategory[] = ['greeting', 'faq', 'closing', 'custom'];
    const replyCategory = validCategories.includes(category) ? category : 'custom';

    const quickReply = await QuickReplyModel.update(
      parseInt(id),
      adminId,
      title.trim(),
      content.trim(),
      replyCategory
    );

    if (!quickReply) {
      res.status(404).json({ error: '快捷回复不存在' });
      return;
    }

    res.json(quickReply);
  } catch (error) {
    console.error('Update quick reply error:', error);
    res.status(500).json({ error: '更新快捷回复失败' });
  }
};

export const deleteQuickReply = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.adminId;
    if (!adminId) {
      res.status(401).json({ error: '未授权' });
      return;
    }

    const { id } = req.params;
    const success = await QuickReplyModel.remove(parseInt(id), adminId);

    if (!success) {
      res.status(404).json({ error: '快捷回复不存在' });
      return;
    }

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete quick reply error:', error);
    res.status(500).json({ error: '删除快捷回复失败' });
  }
};

export const updateSortOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.adminId;
    if (!adminId) {
      res.status(401).json({ error: '未授权' });
      return;
    }

    const { items } = req.body;
    if (!Array.isArray(items)) {
      res.status(400).json({ error: '参数格式错误' });
      return;
    }

    await QuickReplyModel.updateSortOrder(adminId, items);
    res.json({ message: '排序更新成功' });
  } catch (error) {
    console.error('Update sort order error:', error);
    res.status(500).json({ error: '更新排序失败' });
  }
};
