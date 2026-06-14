import { pool } from '../config/database.js';
import type { Session, SessionStatus } from '../types/index.js';

const rowToSession = (row: any): Session => ({
  id: row.id,
  visitorId: row.visitor_id,
  adminId: row.admin_id,
  status: row.status,
  startedAt: row.started_at,
  endedAt: row.ended_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  lastMessage: row.last_message_content ? {
    id: row.last_message_id,
    sessionId: row.id,
    senderType: row.last_message_sender,
    content: row.last_message_content,
    isRead: !!row.last_message_is_read,
    createdAt: row.last_message_created_at
  } : undefined,
  unreadCount: row.unread_count || 0
});

export const create = async (visitorId: string): Promise<Session> => {
  const [result] = await pool().execute(
    'INSERT INTO sessions (visitor_id, status) VALUES (?, ?)',
    [visitorId, 'waiting']
  );
  const insertId = (result as any).insertId;
  const session = await findById(insertId);
  if (!session) throw new Error('Failed to create session');
  return session;
};

export const findById = async (id: number): Promise<Session | null> => {
  const [rows] = await pool().execute('SELECT * FROM sessions WHERE id = ?', [id]);
  const result = rows as any[];
  return result.length > 0 ? rowToSession(result[0]) : null;
};

export const findActiveByVisitorId = async (visitorId: string): Promise<Session | null> => {
  const [rows] = await pool().execute(
    "SELECT * FROM sessions WHERE visitor_id = ? AND status IN ('waiting', 'active') ORDER BY created_at DESC LIMIT 1",
    [visitorId]
  );
  const result = rows as any[];
  return result.length > 0 ? rowToSession(result[0]) : null;
};

export const findByAdminId = async (adminId: number): Promise<Session[]> => {
  const [rows] = await pool().execute(`
    SELECT 
      s.*,
      m.id as last_message_id,
      m.sender_type as last_message_sender,
      m.content as last_message_content,
      m.is_read as last_message_is_read,
      m.created_at as last_message_created_at,
      (SELECT COUNT(*) FROM messages WHERE session_id = s.id AND sender_type = 'visitor' AND is_read = 0) as unread_count
    FROM sessions s
    LEFT JOIN messages m ON m.id = (
      SELECT id FROM messages WHERE session_id = s.id ORDER BY created_at DESC LIMIT 1
    )
    WHERE s.admin_id = ? AND s.status = 'active'
    ORDER BY m.created_at DESC, s.created_at DESC
  `, [adminId]);
  return (rows as any[]).map(rowToSession);
};

export const findHistoryByVisitorId = async (visitorId: string): Promise<Session[]> => {
  const [rows] = await pool().execute(`
    SELECT 
      s.*,
      m.id as last_message_id,
      m.sender_type as last_message_sender,
      m.content as last_message_content,
      m.is_read as last_message_is_read,
      m.created_at as last_message_created_at
    FROM sessions s
    LEFT JOIN messages m ON m.id = (
      SELECT id FROM messages WHERE session_id = s.id ORDER BY created_at DESC LIMIT 1
    )
    WHERE s.visitor_id = ?
    ORDER BY s.created_at DESC
    LIMIT 20
  `, [visitorId]);
  return (rows as any[]).map(rowToSession);
};

export const findWaitingSessions = async (): Promise<Session[]> => {
  const [rows] = await pool().execute(
    "SELECT * FROM sessions WHERE status = 'waiting' ORDER BY created_at ASC"
  );
  return (rows as any[]).map(rowToSession);
};

export const assignAdmin = async (sessionId: number, adminId: number): Promise<void> => {
  await pool().execute(
    "UPDATE sessions SET admin_id = ?, status = 'active', started_at = ? WHERE id = ?",
    [adminId, new Date(), sessionId]
  );
};

export const updateStatus = async (sessionId: number, status: SessionStatus): Promise<void> => {
  const endedAt = status === 'ended' ? new Date() : null;
  await pool().execute(
    'UPDATE sessions SET status = ?, ended_at = ? WHERE id = ?',
    [status, endedAt, sessionId]
  );
};
