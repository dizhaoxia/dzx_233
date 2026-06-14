export type AdminStatus = 'online' | 'offline' | 'busy';

export type SessionStatus = 'waiting' | 'active' | 'ended';

export type SenderType = 'visitor' | 'admin';

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

export interface SocketData {
  visitorId?: string;
  adminId?: number;
  sessionId?: number;
}
