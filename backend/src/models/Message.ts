import { pool } from '../config/database.js';
import type { Message, SenderType } from '../types/index.js';

const rowToMessage = (row: any): Message => ({
  id: row.id,
  sessionId: row.session_id,
  senderType: row.sender_type,
  content: row.content,
  isRead: !!row.is_read,
  createdAt: row.created_at
});

export const create = async (
  sessionId: number,
  senderType: SenderType,
  content: string
): Promise<Message> => {
  const [result] = await pool().execute(
    'INSERT INTO messages (session_id, sender_type, content) VALUES (?, ?, ?)',
    [sessionId, senderType, content]
  );
  const insertId = (result as any).insertId;
  const message = await findById(insertId);
  if (!message) throw new Error('Failed to create message');
  return message;
};

export const findById = async (id: number): Promise<Message | null> => {
  const [rows] = await pool().execute('SELECT * FROM messages WHERE id = ?', [id]);
  const result = rows as any[];
  return result.length > 0 ? rowToMessage(result[0]) : null;
};

export const findBySessionId = async (sessionId: number): Promise<Message[]> => {
  const [rows] = await pool().execute(
    'SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC',
    [sessionId]
  );
  return (rows as any[]).map(rowToMessage);
};

export const markAsRead = async (sessionId: number, senderType: SenderType): Promise<void> => {
  await pool().execute(
    'UPDATE messages SET is_read = 1 WHERE session_id = ? AND sender_type = ? AND is_read = 0',
    [sessionId, senderType]
  );
};

export const getUnreadCount = async (sessionId: number, senderType: SenderType): Promise<number> => {
  const [rows] = await pool().execute(
    'SELECT COUNT(*) as count FROM messages WHERE session_id = ? AND sender_type = ? AND is_read = 0',
    [sessionId, senderType]
  );
  return (rows as any[])[0].count;
};
