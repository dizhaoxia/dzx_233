import { create } from 'zustand';
import type { Session, Message, VisitorHistory, QuickReply, Rating, AdminRatingStats, TicketWithDetails, AdminForAssign } from '../types';

type AdminView = 'chat' | 'tickets';

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
  currentView: AdminView;
  tickets: TicketWithDetails[];
  selectedTicketId: number | null;
  showCreateTicketModal: boolean;
  showTicketDetailModal: boolean;
  adminsForAssign: AdminForAssign[];
  setCurrentView: (view: AdminView) => void;
  setTickets: (tickets: TicketWithDetails[]) => void;
  addTicket: (ticket: TicketWithDetails) => void;
  updateTicket: (ticket: TicketWithDetails) => void;
  removeTicket: (ticketId: number) => void;
  setSelectedTicketId: (id: number | null) => void;
  setShowCreateTicketModal: (show: boolean) => void;
  setShowTicketDetailModal: (show: boolean) => void;
  setAdminsForAssign: (admins: AdminForAssign[]) => void;
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
  currentView: 'chat',
  tickets: [],
  selectedTicketId: null,
  showCreateTicketModal: false,
  showTicketDetailModal: false,
  adminsForAssign: [],
  setCurrentView: (view) => set({ currentView: view }),
  setTickets: (tickets) => set({ tickets }),
  addTicket: (ticket) =>
    set((state) => {
      const exists = state.tickets.some((t) => t.id === ticket.id);
      if (exists) {
        return {
          tickets: state.tickets.map((t) => (t.id === ticket.id ? ticket : t)),
        };
      }
      return { tickets: [ticket, ...state.tickets] };
    }),
  updateTicket: (ticket) =>
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === ticket.id ? ticket : t)),
    })),
  removeTicket: (ticketId) =>
    set((state) => ({
      tickets: state.tickets.filter((t) => t.id !== ticketId),
      selectedTicketId: state.selectedTicketId === ticketId ? null : state.selectedTicketId,
    })),
  setSelectedTicketId: (id) => set({ selectedTicketId: id }),
  setShowCreateTicketModal: (show) => set({ showCreateTicketModal: show }),
  setShowTicketDetailModal: (show) => set({ showTicketDetailModal: show }),
  setAdminsForAssign: (admins) => set({ adminsForAssign: admins }),
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
      currentView: 'chat',
      tickets: [],
      selectedTicketId: null,
      showCreateTicketModal: false,
      showTicketDetailModal: false,
      adminsForAssign: [],
    }),
}));
