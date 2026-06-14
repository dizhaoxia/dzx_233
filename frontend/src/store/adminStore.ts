import { create } from 'zustand';
import type { Session, Message, VisitorHistory } from '../types';

interface AdminState {
  sessions: Session[];
  activeSessionId: number | null;
  activeSessionMessages: Message[];
  visitorHistory: VisitorHistory[];
  searchVisitorId: string;
  setSessions: (sessions: Session[] | ((prev: Session[]) => Session[])) => void;
  addSession: (session: Session) => void;
  updateSession: (session: Session) => void;
  removeSession: (sessionId: number) => void;
  setActiveSessionId: (id: number | null) => void;
  setActiveSessionMessages: (messages: Message[]) => void;
  addMessageToActiveSession: (message: Message) => void;
  markSessionAsRead: (sessionId: number) => void;
  setVisitorHistory: (history: VisitorHistory[]) => void;
  setSearchVisitorId: (id: string) => void;
  resetAdminStore: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  sessions: [],
  activeSessionId: null,
  activeSessionMessages: [],
  visitorHistory: [],
  searchVisitorId: '',
  setSessions: (sessions) =>
    set((state) => ({
      sessions: typeof sessions === 'function' ? sessions(state.sessions) : sessions,
    })),
  addSession: (session) =>
    set((state) => {
      const exists = state.sessions.some((s) => s.id === session.id);
      if (exists) {
        return {
          sessions: state.sessions.map((s) =>
            s.id === session.id ? { ...session, unreadCount: s.unreadCount || 0 } : s
          ),
        };
      }
      return { sessions: [session, ...state.sessions] };
    }),
  updateSession: (session) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === session.id ? { ...session, unreadCount: s.unreadCount } : s
      ),
    })),
  removeSession: (sessionId) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
      activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
    })),
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  setActiveSessionMessages: (messages) => set({ activeSessionMessages: messages }),
  addMessageToActiveSession: (message) =>
    set((state) => {
      const exists = state.activeSessionMessages.some((m) => m.id === message.id);
      if (exists) return state;
      return {
        activeSessionMessages: [...state.activeSessionMessages, message],
      };
    }),
  markSessionAsRead: (sessionId) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, unreadCount: 0 } : s
      ),
    })),
  setVisitorHistory: (history) => set({ visitorHistory: history }),
  setSearchVisitorId: (id) => set({ searchVisitorId: id }),
  resetAdminStore: () =>
    set({
      sessions: [],
      activeSessionId: null,
      activeSessionMessages: [],
      visitorHistory: [],
      searchVisitorId: '',
    }),
}));
