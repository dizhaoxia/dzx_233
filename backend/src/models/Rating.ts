import { pool } from '../config/database.js';
import type { Rating, RatingScore, AdminRatingStats } from '../types/index.js';

const rowToRating = (row: any): Rating => ({
  id: row.id,
  sessionId: row.session_id,
  adminId: row.admin_id,
  visitorId: row.visitor_id,
  score: row.score,
  feedback: row.feedback,
  createdAt: row.created_at,
});

export const findBySessionId = async (sessionId: number): Promise<Rating | null> => {
  const [rows] = await pool().execute('SELECT * FROM ratings WHERE session_id = ?', [sessionId]);
  const result = rows as any[];
  return result.length > 0 ? rowToRating(result[0]) : null;
};

export const findByAdminId = async (adminId: number, limit: number = 50): Promise<Rating[]> => {
  const [rows] = await pool().execute(
    'SELECT * FROM ratings WHERE admin_id = ? ORDER BY created_at DESC LIMIT ?',
    [adminId, limit]
  );
  return (rows as any[]).map(rowToRating);
};

export const create = async (
  sessionId: number,
  adminId: number | null,
  visitorId: string,
  score: RatingScore,
  feedback?: string
): Promise<Rating> => {
  const [result] = await pool().execute(
    'INSERT INTO ratings (session_id, admin_id, visitor_id, score, feedback) VALUES (?, ?, ?, ?, ?)',
    [sessionId, adminId, visitorId, score, feedback || null]
  );
  const insertId = (result as any).insertId;
  const rating = await findById(insertId);
  if (!rating) throw new Error('Failed to create rating');
  return rating;
};

export const findById = async (id: number): Promise<Rating | null> => {
  const [rows] = await pool().execute('SELECT * FROM ratings WHERE id = ?', [id]);
  const result = rows as any[];
  return result.length > 0 ? rowToRating(result[0]) : null;
};

export const updateAdminId = async (id: number, adminId: number): Promise<Rating | null> => {
  await pool().execute(
    'UPDATE ratings SET admin_id = ? WHERE id = ?',
    [adminId, id]
  );
  return findById(id);
};

export const getAdminStats = async (adminId: number, startDate?: string, endDate?: string): Promise<AdminRatingStats> => {
  let query = `
    SELECT 
      ? as admin_id,
      COUNT(DISTINCT s.id) as total_sessions,
      COUNT(DISTINCT r.id) as rated_sessions,
      SUM(CASE WHEN r.score = 'satisfied' THEN 1 ELSE 0 END) as satisfied_count,
      SUM(CASE WHEN r.score = 'neutral' THEN 1 ELSE 0 END) as neutral_count,
      SUM(CASE WHEN r.score = 'dissatisfied' THEN 1 ELSE 0 END) as dissatisfied_count
    FROM sessions s
    LEFT JOIN ratings r ON s.id = r.session_id
    WHERE s.admin_id = ? AND s.status = 'ended'
  `;
  const params: any[] = [adminId, adminId];

  if (startDate) {
    query += ' AND s.ended_at >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND s.ended_at <= ?';
    params.push(endDate);
  }

  const [rows] = await pool().execute(query, params);
  const row = (rows as any[])[0];

  const totalSessions = row.total_sessions || 0;
  const ratedSessions = row.rated_sessions || 0;
  const satisfiedCount = row.satisfied_count || 0;
  const neutralCount = row.neutral_count || 0;
  const dissatisfiedCount = row.dissatisfied_count || 0;
  const satisfactionRate = ratedSessions > 0 ? (satisfiedCount / ratedSessions) * 100 : 0;

  return {
    adminId,
    totalSessions,
    ratedSessions,
    satisfiedCount,
    neutralCount,
    dissatisfiedCount,
    satisfactionRate: Math.round(satisfactionRate * 100) / 100,
  };
};
