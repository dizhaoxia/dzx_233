import { create } from 'zustand';
import type { Session, Message, Admin, SessionStatus, Rating, RatingScore } from '../types';

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
  resetChat: () => void;
}

const generateVisitorId = (): string => {
  const stored = localStorage.getItem('visitor_id');
  if (stored) return stored;
  const newId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('visitor_id', newId);
  return newId;
};

export const useChatStore = create<ChatState>((set, get) => ({
  visitorId: typeof window !== 'undefined' ? generateVisitorId() : null,
  session: null,
  messages: [],
  queuePosition: null,
  sessionStatus: null,
  assignedAdmin: null,
  isConnected: false,
  showRatingCard: false,
  pendingRatingSessionId: null,
  currentRating: null,
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
    }),
}));
