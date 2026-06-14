import { create } from 'zustand';
import type { Session, Message, VisitorHistory, QuickReply, Rating, AdminRatingStats } from '../types';

interface AdminState {
  sessions: Session[];
  activeSessionId: number | null;
  activeSessionMessages: Message[];
  visitorHistory: VisitorHistory[];
  searchVisitorId: string;
  quickReplies: QuickReply[];
  ratings: Rating[];
  ratingStats: AdminRatingStats | null;
  showQuickReplyPanel: boolean;
  showStatsPanel: boolean;
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
  setQuickReplies: (replies: QuickReply[]) => void;
  addQuickReply: (reply: QuickReply) => void;
  updateQuickReply: (reply: QuickReply) => void;
  removeQuickReply: (id: number) => void;
  setRatings: (ratings: Rating[]) => void;
  addRating: (rating: Rating) => void;
  setRatingStats: (stats: AdminRatingStats | null) => void;
  setShowQuickReplyPanel: (show: boolean) => void;
  setShowStatsPanel: (show: boolean) => void;
  resetAdminStore: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  sessions: [],
  activeSessionId: null,
  activeSessionMessages: [],
  visitorHistory: [],
  searchVisitorId: '',
  quickReplies: [],
  ratings: [],
  ratingStats: null,
  showQuickReplyPanel: false,
  showStatsPanel: false,
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
  setQuickReplies: (replies) => set({ quickReplies: replies }),
  addQuickReply: (reply) =>
    set((state) => ({ quickReplies: [...state.quickReplies, reply] })),
  updateQuickReply: (reply) =>
    set((state) => ({
      quickReplies: state.quickReplies.map((r) =>
        r.id === reply.id ? reply : r
      ),
    })),
  removeQuickReply: (id) =>
    set((state) => ({
      quickReplies: state.quickReplies.filter((r) => r.id !== id),
    })),
  setRatings: (ratings) => set({ ratings }),
  addRating: (rating) =>
    set((state) => {
      const exists = state.ratings.some((r) => r.id === rating.id);
      if (exists) return state;
      return { ratings: [rating, ...state.ratings] };
    }),
  setRatingStats: (stats) => set({ ratingStats: stats }),
  setShowQuickReplyPanel: (show) => set({ showQuickReplyPanel: show }),
  setShowStatsPanel: (show) => set({ showStatsPanel: show }),
  resetAdminStore: () =>
    set({
      sessions: [],
      activeSessionId: null,
      activeSessionMessages: [],
      visitorHistory: [],
      searchVisitorId: '',
      quickReplies: [],
      ratings: [],
      ratingStats: null,
      showQuickReplyPanel: false,
      showStatsPanel: false,
    }),
}));
