import type { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import * as TicketModel from '../models/Ticket.js';
import * as AdminModel from '../models/Admin.js';
import type { TicketStatus, TicketPriority, TicketCategory } from '../types/index.js';

export const createTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, category, priority, visitorId, sessionId } = req.body;
    const adminId = req.adminId;

    if (!title || !category || !priority || !visitorId) {
      res.status(400).json({ error: '缺少必要参数' });
      return;
    }

    const ticket = await TicketModel.create({
      title,
      description,
      category: category as TicketCategory,
      priority: priority as TicketPriority,
      visitorId,
      sessionId: sessionId ? parseInt(sessionId) : undefined,
      adminId: adminId || undefined,
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: '创建工单失败' });
  }
};

export const getTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ticket = await TicketModel.findByIdWithDetails(parseInt(id));

    if (!ticket) {
      res.status(404).json({ error: '工单不存在' });
      return;
    }

    res.json(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: '获取工单详情失败' });
  }
};

export const getMyTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.adminId;
    const { status } = req.query;

    if (!adminId) {
      res.status(401).json({ error: '未授权' });
      return;
    }

    const tickets = await TicketModel.findByAdminId(
      adminId,
      status as TicketStatus | undefined
    );

    res.json(tickets);
  } catch (error) {
    console.error('Get my tickets error:', error);
    res.status(500).json({ error: '获取工单列表失败' });
  }
};

export const getVisitorTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { visitorId } = req.params;
    const { includeClosed } = req.query;

    const tickets = await TicketModel.findByVisitorId(
      visitorId,
      includeClosed === 'true'
    );

    res.json(tickets);
  } catch (error) {
    console.error('Get visitor tickets error:', error);
    res.status(500).json({ error: '获取访客工单失败' });
  }
};

export const getAllTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, priority, category } = req.query;

    const filters: {
      status?: TicketStatus;
      priority?: TicketPriority;
      category?: TicketCategory;
    } = {};

    if (status) filters.status = status as TicketStatus;
    if (priority) filters.priority = priority as TicketPriority;
    if (category) filters.category = category as TicketCategory;

    const tickets = await TicketModel.findAll(filters);

    res.json(tickets);
  } catch (error) {
    console.error('Get all tickets error:', error);
    res.status(500).json({ error: '获取工单列表失败' });
  }
};

export const updateTicketStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: '缺少状态参数' });
      return;
    }

    const ticket = await TicketModel.findById(parseInt(id));
    if (!ticket) {
      res.status(404).json({ error: '工单不存在' });
      return;
    }

    await TicketModel.updateStatus(parseInt(id), status as TicketStatus);

    const updatedTicket = await TicketModel.findByIdWithDetails(parseInt(id));
    res.json({ message: '状态更新成功', ticket: updatedTicket });
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ error: '更新工单状态失败' });
  }
};

export const assignTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    const ticket = await TicketModel.findById(parseInt(id));
    if (!ticket) {
      res.status(404).json({ error: '工单不存在' });
      return;
    }

    if (adminId !== null) {
      const admin = await AdminModel.findById(parseInt(adminId));
      if (!admin) {
        res.status(404).json({ error: '客服不存在' });
        return;
      }
    }

    await TicketModel.assignAdmin(parseInt(id), adminId ? parseInt(adminId) : null);

    const updatedTicket = await TicketModel.findByIdWithDetails(parseInt(id));
    res.json({ message: '分配成功', ticket: updatedTicket });
  } catch (error) {
    console.error('Assign ticket error:', error);
    res.status(500).json({ error: '分配工单失败' });
  }
};

export const updateTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, category, priority } = req.body;

    const ticket = await TicketModel.findById(parseInt(id));
    if (!ticket) {
      res.status(404).json({ error: '工单不存在' });
      return;
    }

    await TicketModel.update(parseInt(id), {
      title,
      description,
      category: category as TicketCategory | undefined,
      priority: priority as TicketPriority | undefined,
    });

    const updatedTicket = await TicketModel.findByIdWithDetails(parseInt(id));
    res.json({ message: '更新成功', ticket: updatedTicket });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: '更新工单失败' });
  }
};

export const getAdmins = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const admins = await AdminModel.findAll();
    const allAdmins = admins.map(a => ({
      id: a.id,
      username: a.username,
      status: a.status,
    }));
    res.json(allAdmins);
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ error: '获取客服列表失败' });
  }
};
