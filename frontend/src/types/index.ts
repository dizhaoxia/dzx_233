export type AdminStatus = 'online' | 'offline' | 'busy';

export type SessionStatus = 'waiting' | 'active' | 'ended';

export type SenderType = 'visitor' | 'admin';

export type QuickReplyCategory = 'greeting' | 'faq' | 'closing' | 'custom';

export type RatingScore = 'satisfied' | 'neutral' | 'dissatisfied';

export type TicketStatus = 'pending' | 'processing' | 'resolved' | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketCategory = 'technical' | 'billing' | 'product' | 'account' | 'other';

export interface Admin {
  id: number;
  username: string;
  status: AdminStatus;
}

export interface Session {
  id: number;
  visitorId: string;
  adminId: number | null;
  status: SessionStatus;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessage?: Message;
  unreadCount?: number;
}

export interface Message {
  id: number;
  sessionId: number;
  senderType: SenderType;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface QuickReply {
  id: number;
  adminId: number;
  title: string;
  content: string;
  category: QuickReplyCategory;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Rating {
  id: number;
  sessionId: number;
  adminId: number | null;
  visitorId: string;
  score: RatingScore;
  feedback: string | null;
  createdAt: string;
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

export interface LoginResponse {
  token: string;
  admin: Admin;
}

export interface SessionWithMessages {
  session: Session;
  messages: Message[];
}

export interface VisitorHistory {
  session: Session;
  messages: Message[];
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  visitorId: string;
  sessionId: number | null;
  adminId: number | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
}

export interface TicketWithDetails extends Ticket {
  admin?: { id: number; username: string };
  session?: { id: number; status: SessionStatus };
}

export interface AdminForAssign {
  id: number;
  username: string;
  status: AdminStatus;
}

export interface QueuePosition {
  position: number;
}

export interface SocketEvents {
  'visitor:connect': { visitorId: string };
  'visitor:message': { sessionId: number; content: string };
  'visitor:close': { sessionId: number };
  'admin:login': { adminId: number };
  'admin:logout': { adminId: number };
  'admin:status': { adminId: number; status: AdminStatus };
  'admin:message': { sessionId: number; content: string };
  'admin:join': { sessionId: number };
  'admin:end': { sessionId: number };
  'message:new': { message: Message };
  'message:read': { sessionId: number; senderType: SenderType };
  'session:queued': { position: number };
  'session:assigned': { session: Session; admin?: Admin; messages?: Message[] };
  'session:new': { session: Session };
  'session:ended': { sessionId: number };
  'admin:online': { adminId: number };
  'typing': { sessionId: number; sender: string };
  'queue:refresh': { sessionId: number };
  'rating:request': { sessionId: number };
  'rating:submitted': { rating: Rating };
  'rating:submit': { sessionId: number; visitorId: string; score: RatingScore; feedback?: string };
  'ticket:created': { ticket: TicketWithDetails };
  'ticket:updated': { ticket: TicketWithDetails };
  'ticket:assigned': { ticket: TicketWithDetails };
  'error': { message: string };
}
