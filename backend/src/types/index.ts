export type AdminStatus = 'online' | 'offline' | 'busy';

export type SessionStatus = 'waiting' | 'active' | 'ended';

export type SenderType = 'visitor' | 'admin';

export type QuickReplyCategory = 'greeting' | 'faq' | 'closing' | 'custom';

export type RatingScore = 'satisfied' | 'neutral' | 'dissatisfied';

export interface Admin {
  id: number;
  username: string;
  password: string;
  status: AdminStatus;
  lastOnlineAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: number;
  visitorId: string;
  adminId: number | null;
  status: SessionStatus;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: Message;
  unreadCount?: number;
}

export interface Message {
  id: number;
  sessionId: number;
  senderType: SenderType;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

export interface QueueItem {
  sessionId: number;
  visitorId: string;
  createdAt: Date;
}

export interface QuickReply {
  id: number;
  adminId: number;
  title: string;
  content: string;
  category: QuickReplyCategory;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Rating {
  id: number;
  sessionId: number;
  adminId: number | null;
  visitorId: string;
  score: RatingScore;
  feedback: string | null;
  createdAt: Date;
}

export interface AdminRatingStats {
  adminId: number;
  totalSessions: number;
  ratedSessions: number;
  satisfiedCount: number;
  neutralCount: number;
  dissatisfiedCount: number;
  satisfactionRate: number;
}

export interface SocketData {
  visitorId?: string;
  adminId?: number;
  sessionId?: number;
}
