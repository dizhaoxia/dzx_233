import { pool } from '../config/database.js';
import type { Ticket, TicketWithDetails, TicketStatus, TicketPriority, TicketCategory } from '../types/index.js';

const rowToTicket = (row: any): Ticket => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  priority: row.priority,
  status: row.status,
  visitorId: row.visitor_id,
  sessionId: row.session_id,
  adminId: row.admin_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  resolvedAt: row.resolved_at,
  closedAt: row.closed_at,
});

const rowToTicketWithDetails = (row: any): TicketWithDetails => {
  const ticket = rowToTicket(row);
  return {
    ...ticket,
    admin: row.admin_id ? { id: row.admin_id, username: row.admin_username } : undefined,
    session: row.session_id ? { id: row.session_id, status: row.session_status } : undefined,
  };
};

export const create = async (data: {
  title: string;
  description?: string;
  category: TicketCategory;
  priority: TicketPriority;
  visitorId: string;
  sessionId?: number;
  adminId?: number;
}): Promise<Ticket> => {
  const [result] = await pool().execute(
    `INSERT INTO tickets (title, description, category, priority, visitor_id, session_id, admin_id, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [data.title, data.description || null, data.category, data.priority, data.visitorId, data.sessionId || null, data.adminId || null]
  );
  const insertId = (result as any).insertId;
  const ticket = await findById(insertId);
  if (!ticket) throw new Error('Failed to create ticket');
  return ticket;
};

export const findById = async (id: number): Promise<Ticket | null> => {
  const [rows] = await pool().execute('SELECT * FROM tickets WHERE id = ?', [id]);
  const result = rows as any[];
  return result.length > 0 ? rowToTicket(result[0]) : null;
};

export const findByIdWithDetails = async (id: number): Promise<TicketWithDetails | null> => {
  const [rows] = await pool().execute(`
    SELECT t.*, a.username as admin_username, s.status as session_status
    FROM tickets t
    LEFT JOIN admins a ON t.admin_id = a.id
    LEFT JOIN sessions s ON t.session_id = s.id
    WHERE t.id = ?
  `, [id]);
  const result = rows as any[];
  return result.length > 0 ? rowToTicketWithDetails(result[0]) : null;
};

export const findByAdminId = async (adminId: number, status?: TicketStatus): Promise<TicketWithDetails[]> => {
  let sql = `
    SELECT t.*, a.username as admin_username, s.status as session_status
    FROM tickets t
    LEFT JOIN admins a ON t.admin_id = a.id
    LEFT JOIN sessions s ON t.session_id = s.id
    WHERE t.admin_id = ?
  `;
  const params: any[] = [adminId];
  
  if (status) {
    sql += ' AND t.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY t.priority DESC, t.created_at DESC';
  
  const [rows] = await pool().execute(sql, params);
  return (rows as any[]).map(rowToTicketWithDetails);
};

export const findByVisitorId = async (visitorId: string, includeClosed: boolean = false): Promise<TicketWithDetails[]> => {
  let sql = `
    SELECT t.*, a.username as admin_username, s.status as session_status
    FROM tickets t
    LEFT JOIN admins a ON t.admin_id = a.id
    LEFT JOIN sessions s ON t.session_id = s.id
    WHERE t.visitor_id = ?
  `;
  const params: any[] = [visitorId];
  
  if (!includeClosed) {
    sql += " AND t.status != 'closed'";
  }
  
  sql += ' ORDER BY t.created_at DESC';
  
  const [rows] = await pool().execute(sql, params);
  return (rows as any[]).map(rowToTicketWithDetails);
};

export const findAll = async (filters?: {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  adminId?: number;
}): Promise<TicketWithDetails[]> => {
  let sql = `
    SELECT t.*, a.username as admin_username, s.status as session_status
    FROM tickets t
    LEFT JOIN admins a ON t.admin_id = a.id
    LEFT JOIN sessions s ON t.session_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (filters?.status) {
    sql += ' AND t.status = ?';
    params.push(filters.status);
  }
  if (filters?.priority) {
    sql += ' AND t.priority = ?';
    params.push(filters.priority);
  }
  if (filters?.category) {
    sql += ' AND t.category = ?';
    params.push(filters.category);
  }
  if (filters?.adminId !== undefined) {
    sql += ' AND t.admin_id = ?';
    params.push(filters.adminId);
  }
  
  sql += ' ORDER BY t.priority DESC, t.created_at DESC';
  
  const [rows] = await pool().execute(sql, params);
  return (rows as any[]).map(rowToTicketWithDetails);
};

export const updateStatus = async (id: number, status: TicketStatus): Promise<void> => {
  const now = new Date();
  let sql = 'UPDATE tickets SET status = ?, updated_at = ?';
  const params: any[] = [status, now];
  
  if (status === 'resolved') {
    sql += ', resolved_at = ?';
    params.push(now);
  } else if (status === 'closed') {
    sql += ', closed_at = ?';
    params.push(now);
  }
  
  sql += ' WHERE id = ?';
  params.push(id);
  
  await pool().execute(sql, params);
};

export const assignAdmin = async (id: number, adminId: number | null): Promise<void> => {
  await pool().execute(
    'UPDATE tickets SET admin_id = ?, updated_at = ? WHERE id = ?',
    [adminId, new Date(), id]
  );
};

export const update = async (id: number, data: {
  title?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
}): Promise<void> => {
  const fields: string[] = [];
  const params: any[] = [];
  
  if (data.title !== undefined) {
    fields.push('title = ?');
    params.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    params.push(data.description || null);
  }
  if (data.category !== undefined) {
    fields.push('category = ?');
    params.push(data.category);
  }
  if (data.priority !== undefined) {
    fields.push('priority = ?');
    params.push(data.priority);
  }
  
  if (fields.length === 0) return;
  
  fields.push('updated_at = ?');
  params.push(new Date());
  
  params.push(id);
  
  await pool().execute(
    `UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`,
    params
  );
};
