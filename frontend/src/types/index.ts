export type AdminStatus = 'online' | 'offline' | 'busy';

export type SessionStatus = 'waiting' | 'active' | 'ended';

export type SenderType = 'visitor' | 'admin';

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
  'error': { message: string };
}
