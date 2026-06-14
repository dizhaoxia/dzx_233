import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../store/authStore';
import { useAdminStore } from '../../store/adminStore';
import { getSocket, emit, on } from '../../services/socket';
import AdminHeader from '../../components/AdminHeader';
import SessionList from '../../components/SessionList';
import ChatWindow from '../../components/ChatWindow';
import RatingStatsPanel from '../../components/RatingStatsPanel';
import type { Session, Rating } from '../../types';

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, admin } = useAuthStore();
  const { activeSessionId, sessions, showStatsPanel, addRating } = useAdminStore();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    if (admin?.id) {
      const socket = getSocket();
      if (!socket.hasListeners('connect')) {
        socket.on('connect', () => {
          emit('admin:login', { adminId: admin.id });
        });
      }
      if (socket.connected) {
        emit('admin:login', { adminId: admin.id });
      }
    }
  }, [isAuthenticated, admin?.id, router]);

  useEffect(() => {
    const session = sessions.find((s) => s.id === activeSessionId);
    setSelectedSession(session || null);
  }, [activeSessionId, sessions]);

  useEffect(() => {
    const handleRatingSubmitted = ({ rating }: { rating: Rating }) => {
      addRating(rating);
    };

    const unsubRating = on('rating:submitted', handleRatingSubmitted);
    return () => {
      unsubRating();
    };
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <AdminHeader />
      <div className="flex-1 flex overflow-hidden">
        <SessionList onSelectSession={setSelectedSession} />
        <ChatWindow session={selectedSession} />
        {showStatsPanel && (
          <div className="w-80 border-l border-gray-200 flex-shrink-0">
            <RatingStatsPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
