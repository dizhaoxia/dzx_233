import axios from 'axios';
import type {
  LoginResponse,
  Session,
  Message,
  SessionWithMessages,
  VisitorHistory,
  AdminStatus,
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

export default api;
