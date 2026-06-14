import { pool } from '../config/database.js';
import type { Admin, AdminStatus } from '../types/index.js';

const rowToAdmin = (row: any): Admin => ({
  id: row.id,
  username: row.username,
  password: row.password,
  status: row.status,
  lastOnlineAt: row.last_online_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const findByUsername = async (username: string): Promise<Admin | null> => {
  const [rows] = await pool().execute('SELECT * FROM admins WHERE username = ?', [username]);
  const result = rows as any[];
  return result.length > 0 ? rowToAdmin(result[0]) : null;
};

export const findById = async (id: number): Promise<Admin | null> => {
  const [rows] = await pool().execute('SELECT * FROM admins WHERE id = ?', [id]);
  const result = rows as any[];
  return result.length > 0 ? rowToAdmin(result[0]) : null;
};

export const findAvailableAdmins = async (): Promise<Admin[]> => {
  const [rows] = await pool().execute(
    "SELECT * FROM admins WHERE status = 'online' ORDER BY last_online_at ASC"
  );
  return (rows as any[]).map(rowToAdmin);
};

export const updateStatus = async (id: number, status: AdminStatus): Promise<void> => {
  const lastOnlineAt = status === 'offline' ? null : new Date();
  await pool().execute(
    'UPDATE admins SET status = ?, last_online_at = ? WHERE id = ?',
    [status, lastOnlineAt, id]
  );
};

export const updateLastOnline = async (id: number): Promise<void> => {
  await pool().execute(
    'UPDATE admins SET last_online_at = ? WHERE id = ?',
    [new Date(), id]
  );
};
