import axios from 'axios';
import type {
  LoginResponse,
  Session,
  Message,
  SessionWithMessages,
  VisitorHistory,
  AdminStatus,
  QuickReply,
  Rating,
  AdminRatingStats,
  QuickReplyCategory,
  Ticket,
  TicketWithDetails,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  AdminForAssign,
} from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3202';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('auth-storage');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/api/auth/login', { username, password });
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  updateStatus: async (status: AdminStatus): Promise<{ message: string; status: AdminStatus }> => {
    const response = await api.put('/api/auth/status', { status });
    return response.data;
  },
};

export const sessionAPI = {
  getSessions: async (): Promise<Session[]> => {
    const response = await api.get('/api/sessions');
    return response.data;
  },

  getSession: async (id: number): Promise<SessionWithMessages> => {
    const response = await api.get(`/api/sessions/${id}`);
    return response.data;
  },

  endSession: async (id: number): Promise<{ message: string }> => {
    const response = await api.put(`/api/sessions/${id}/end`);
    return response.data;
  },

  getVisitorHistory: async (visitorId: string): Promise<VisitorHistory[]> => {
    const response = await api.get(`/api/sessions/visitor/${visitorId}/history`);
    return response.data;
  },

  getVisitorActiveSession: async (visitorId: string): Promise<SessionWithMessages> => {
    const response = await api.get(`/api/sessions/visitor/${visitorId}/active`);
    return response.data;
  },
};

export const messageAPI = {
  getMessages: async (sessionId: number): Promise<Message[]> => {
    const response = await api.get(`/api/messages/${sessionId}`);
    return response.data;
  },

  markAsRead: async (
    sessionId: number,
    senderType: 'visitor' | 'admin'
  ): Promise<{ message: string }> => {
    const response = await api.post(`/api/messages/${sessionId}/read`, { senderType });
    return response.data;
  },
};

export const quickReplyAPI = {
  getQuickReplies: async (): Promise<QuickReply[]> => {
    const response = await api.get('/api/quick-replies');
    return response.data;
  },

  createQuickReply: async (data: {
    title: string;
    content: string;
    category: QuickReplyCategory;
  }): Promise<QuickReply> => {
    const response = await api.post('/api/quick-replies', data);
    return response.data;
  },

  updateQuickReply: async (
    id: number,
    data: { title: string; content: string; category: QuickReplyCategory }
  ): Promise<QuickReply> => {
    const response = await api.put(`/api/quick-replies/${id}`, data);
    return response.data;
  },

  deleteQuickReply: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/api/quick-replies/${id}`);
    return response.data;
  },

  updateSortOrder: async (items: { id: number; sortOrder: number }[]): Promise<{ message: string }> => {
    const response = await api.put('/api/quick-replies/sort-order', { items });
    return response.data;
  },
};

export const ratingAPI = {
  getRatings: async (limit?: number): Promise<Rating[]> => {
    const params = limit ? { limit } : {};
    const response = await api.get('/api/ratings', { params });
    return response.data;
  },

  getRatingBySessionId: async (sessionId: number): Promise<Rating> => {
    const response = await api.get(`/api/ratings/session/${sessionId}`);
    return response.data;
  },

  createRating: async (data: {
    sessionId: number;
    visitorId: string;
    score: string;
    feedback?: string;
  }): Promise<Rating> => {
    const response = await api.post('/api/ratings', data);
    return response.data;
  },

  getAdminStats: async (startDate?: string, endDate?: string): Promise<AdminRatingStats> => {
    const params = { startDate, endDate };
    const response = await api.get('/api/ratings/stats', { params });
    return response.data;
  },
};

export const ticketAPI = {
  createTicket: async (data: {
    title: string;
    description?: string;
    category: TicketCategory;
    priority: TicketPriority;
    visitorId: string;
    sessionId?: number;
  }): Promise<Ticket> => {
    const response = await api.post('/api/tickets', data);
    return response.data;
  },

  getTicket: async (id: number): Promise<TicketWithDetails> => {
    const response = await api.get(`/api/tickets/${id}`);
    return response.data;
  },

  getMyTickets: async (status?: TicketStatus): Promise<TicketWithDetails[]> => {
    const params = status ? { status } : {};
    const response = await api.get('/api/tickets/my', { params });
    return response.data;
  },

  getAllTickets: async (filters?: {
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: TicketCategory;
  }): Promise<TicketWithDetails[]> => {
    const response = await api.get('/api/tickets/all', { params: filters });
    return response.data;
  },

  getVisitorTickets: async (visitorId: string, includeClosed?: boolean): Promise<TicketWithDetails[]> => {
    const params = includeClosed ? { includeClosed: 'true' } : {};
    const response = await api.get(`/api/tickets/visitor/${visitorId}`, { params });
    return response.data;
  },

  updateTicketStatus: async (id: number, status: TicketStatus): Promise<{ message: string; ticket: TicketWithDetails }> => {
    const response = await api.put(`/api/tickets/${id}/status`, { status });
    return response.data;
  },

  assignTicket: async (id: number, adminId: number | null): Promise<{ message: string; ticket: TicketWithDetails }> => {
    const response = await api.put(`/api/tickets/${id}/assign`, { adminId });
    return response.data;
  },

  updateTicket: async (id: number, data: {
    title?: string;
    description?: string;
    category?: TicketCategory;
    priority?: TicketPriority;
  }): Promise<{ message: string; ticket: TicketWithDetails }> => {
    const response = await api.put(`/api/tickets/${id}`, data);
    return response.data;
  },

  getAdmins: async (): Promise<AdminForAssign[]> => {
    const response = await api.get('/api/tickets/admins');
    return response.data;
  },
};

export default api;
