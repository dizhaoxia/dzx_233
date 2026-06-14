import { create } from 'zustand';
import type { Session, Message, Admin, SessionStatus, Rating, RatingScore, TicketWithDetails } from '../types';

interface ChatState {
  visitorId: string | null;
  session: Session | null;
  messages: Message[];
  queuePosition: number | null;
  sessionStatus: SessionStatus | null;
  assignedAdmin: Admin | null;
  isConnected: boolean;
  showRatingCard: boolean;
  pendingRatingSessionId: number | null;
  currentRating: Rating | null;
  visitorTickets: TicketWithDetails[];
  selectedTicket: TicketWithDetails | null;
  showTicketList: boolean;
  setVisitorId: (visitorId: string) => void;
  setSession: (session: Session | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setQueuePosition: (position: number | null) => void;
  setSessionStatus: (status: SessionStatus | null) => void;
  setAssignedAdmin: (admin: Admin | null) => void;
  setIsConnected: (connected: boolean) => void;
  markMessagesAsRead: () => void;
  setShowRatingCard: (show: boolean) => void;
  setPendingRatingSessionId: (sessionId: number | null) => void;
  setCurrentRating: (rating: Rating | null) => void;
  setVisitorTickets: (tickets: TicketWithDetails[]) => void;
  setSelectedTicket: (ticket: TicketWithDetails | null) => void;
  setShowTicketList: (show: boolean) => void;
  resetChat: () => void;
  startNewChat: () => string;
  continueWithTicket: (ticket: TicketWithDetails) => void;
}

const generateVisitorId = (): string => {
  const newId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('visitor_id', newId);
  return newId;
};

const getStoredVisitorId = (): string | null => {
  return localStorage.getItem('visitor_id');
};

export const useChatStore = create<ChatState>((set, get) => ({
  visitorId: typeof window !== 'undefined' ? (getStoredVisitorId() || generateVisitorId()) : null,
  session: null,
  messages: [],
  queuePosition: null,
  sessionStatus: null,
  assignedAdmin: null,
  isConnected: false,
  showRatingCard: false,
  pendingRatingSessionId: null,
  currentRating: null,
  visitorTickets: [],
  selectedTicket: null,
  showTicketList: false,
  setVisitorId: (visitorId) => set({ visitorId }),
  setSession: (session) => set({ session }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => {
      const exists = state.messages.some((m) => m.id === message.id);
      if (exists) return state;
      return {
        messages: [...state.messages, message],
      };
    }),
  setQueuePosition: (position) => set({ queuePosition: position }),
  setSessionStatus: (status) => set({ sessionStatus: status }),
  setAssignedAdmin: (admin) => set({ assignedAdmin: admin }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  markMessagesAsRead: () =>
    set((state) => ({
      messages: state.messages.map((m) => ({ ...m, isRead: true })),
    })),
  setShowRatingCard: (show) => set({ showRatingCard: show }),
  setPendingRatingSessionId: (sessionId) => set({ pendingRatingSessionId: sessionId }),
  setCurrentRating: (rating) => set({ currentRating: rating }),
  setVisitorTickets: (tickets) => set({ visitorTickets: tickets }),
  setSelectedTicket: (ticket) => set({ selectedTicket: ticket }),
  setShowTicketList: (show) => set({ showTicketList: show }),
  resetChat: () =>
    set({
      session: null,
      messages: [],
      queuePosition: null,
      sessionStatus: null,
      assignedAdmin: null,
      isConnected: false,
      showRatingCard: false,
      pendingRatingSessionId: null,
      currentRating: null,
      selectedTicket: null,
      showTicketList: false,
    }),
  startNewChat: () => {
    const newVisitorId = generateVisitorId();
    set({
      visitorId: newVisitorId,
      session: null,
      messages: [],
      queuePosition: null,
      sessionStatus: null,
      assignedAdmin: null,
      isConnected: false,
      showRatingCard: false,
      pendingRatingSessionId: null,
      currentRating: null,
      visitorTickets: [],
      selectedTicket: null,
      showTicketList: false,
    });
    return newVisitorId;
  },
  continueWithTicket: (ticket) => {
    set({
      selectedTicket: ticket,
      showTicketList: false,
    });
  },
}));
