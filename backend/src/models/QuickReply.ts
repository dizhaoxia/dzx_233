import { pool } from '../config/database.js';
import type { QuickReply, QuickReplyCategory } from '../types/index.js';

const rowToQuickReply = (row: any): QuickReply => ({
  id: row.id,
  adminId: row.admin_id,
  title: row.title,
  content: row.content,
  category: row.category,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const defaultQuickReplies: { title: string; content: string; category: QuickReplyCategory }[] = [
  { title: '欢迎语', content: '您好，欢迎咨询！请问有什么可以帮助您的？', category: 'greeting' },
  { title: '常见问题1', content: '关于您的问题，我们需要进一步了解详细情况，请您描述一下具体遇到的问题。', category: 'faq' },
  { title: '常见问题2', content: '好的，您的问题我们已经记录，会尽快为您处理，请您耐心等待。', category: 'faq' },
  { title: '结束语', content: '感谢您的咨询，祝您生活愉快！如有其他问题，欢迎随时联系我们。', category: 'closing' },
];

export const createDefaultQuickReplies = async (adminId: number): Promise<void> => {
  for (const reply of defaultQuickReplies) {
    await pool().execute(
      'INSERT INTO quick_replies (admin_id, title, content, category) VALUES (?, ?, ?, ?)',
      [adminId, reply.title, reply.content, reply.category]
    );
  }
};

export const findByAdminId = async (adminId: number): Promise<QuickReply[]> => {
  const [rows] = await pool().execute(
    'SELECT * FROM quick_replies WHERE admin_id = ? ORDER BY sort_order ASC, created_at ASC',
    [adminId]
  );
  return (rows as any[]).map(rowToQuickReply);
};

export const findById = async (id: number): Promise<QuickReply | null> => {
  const [rows] = await pool().execute('SELECT * FROM quick_replies WHERE id = ?', [id]);
  const result = rows as any[];
  return result.length > 0 ? rowToQuickReply(result[0]) : null;
};

export const create = async (
  adminId: number,
  title: string,
  content: string,
  category: QuickReplyCategory = 'custom'
): Promise<QuickReply> => {
  const [result] = await pool().execute(
    'INSERT INTO quick_replies (admin_id, title, content, category) VALUES (?, ?, ?, ?)',
    [adminId, title, content, category]
  );
  const insertId = (result as any).insertId;
  const reply = await findById(insertId);
  if (!reply) throw new Error('Failed to create quick reply');
  return reply;
};

export const update = async (
  id: number,
  adminId: number,
  title: string,
  content: string,
  category: QuickReplyCategory
): Promise<QuickReply | null> => {
  await pool().execute(
    'UPDATE quick_replies SET title = ?, content = ?, category = ? WHERE id = ? AND admin_id = ?',
    [title, content, category, id, adminId]
  );
  return findById(id);
};

export const remove = async (id: number, adminId: number): Promise<boolean> => {
  const [result] = await pool().execute(
    'DELETE FROM quick_replies WHERE id = ? AND admin_id = ?',
    [id, adminId]
  );
  return (result as any).affectedRows > 0;
};

export const updateSortOrder = async (
  adminId: number,
  items: { id: number; sortOrder: number }[]
): Promise<void> => {
  const connection = await pool().getConnection();
  try {
    await connection.beginTransaction();
    for (const item of items) {
      await connection.execute(
        'UPDATE quick_replies SET sort_order = ? WHERE id = ? AND admin_id = ?',
        [item.sortOrder, item.id, adminId]
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
