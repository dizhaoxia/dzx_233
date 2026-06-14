import React, { useEffect } from 'react';
import { User, Clock, MessageCircle } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { sessionAPI } from '../services/api';
import { emit, on } from '../services/socket';
import { formatTime, truncateText, getStatusText } from '../utils/format';
import type { Session, Message } from '../types';

interface SessionListProps {
  onSelectSession: (session: Session) => void;
}

const SessionList: React.FC<SessionListProps> = ({ onSelectSession }) => {
  const {
    sessions,
    activeSessionId,
    setSessions,
    addSession,
    updateSession,
    removeSession,
    setActiveSessionMessages,
    setActiveSessionId,
    setVisitorHistory,
    searchVisitorId,
  } = useAdminStore();

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    const handleSessionNew = ({ session }: { session: Session }) => {
      addSession(session);
    };

    const handleSessionEnded = ({ sessionId }: { sessionId: number }) => {
      removeSession(sessionId);
    };

    const handleMessageNew = ({ message }: { message: Message }) => {
      updateSessionListWithMessage(message);
    };

    const unsubNew = on('session:new', handleSessionNew);
    const unsubEnded = on('session:ended', handleSessionEnded);
    const unsubMessage = on('message:new', handleMessageNew);

    return () => {
      unsubNew();
      unsubEnded();
      unsubMessage();
    };
  }, [addSession, removeSession]);

  useEffect(() => {
    if (searchVisitorId.trim()) {
      searchVisitorHistory(searchVisitorId.trim());
    } else {
      setVisitorHistory([]);
      loadSessions();
    }
  }, [searchVisitorId]);

  const loadSessions = async () => {
    try {
      const data = await sessionAPI.getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const searchVisitorHistory = async (visitorId: string) => {
    try {
      const data = await sessionAPI.getVisitorHistory(visitorId);
      setVisitorHistory(data);
    } catch (error) {
      console.error('Failed to search visitor history:', error);
    }
  };

  const updateSessionListWithMessage = (message: Message) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === message.sessionId
          ? {
              ...s,
              lastMessage: message,
              unreadCount: message.senderType === 'visitor' ? (s.unreadCount || 0) + 1 : s.unreadCount,
            }
          : s
      ).sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || a.createdAt;
        const bTime = b.lastMessage?.createdAt || b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      })
    );
  };

  const handleSelectSession = async (session: Session) => {
    onSelectSession(session);
    setActiveSessionId(session.id);
    emit('admin:join', { sessionId: session.id });

    try {
      const data = await sessionAPI.getSession(session.id);
      setActiveSessionMessages(data.messages);
    } catch (error) {
      console.error('Failed to load session messages:', error);
    }
  };

  const displaySessions = searchVisitorId.trim()
    ? useAdminStore.getState().visitorHistory.map((h) => h.session)
    : sessions;

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800">
          {searchVisitorId.trim() ? '历史会话' : '当前会话'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {searchVisitorId.trim()
            ? `访客: ${searchVisitorId}`
            : `共 ${sessions.length} 个进行中的会话`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {displaySessions.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center text-gray-400">
              <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {searchVisitorId.trim() ? '未找到历史记录' : '暂无进行中的会话'}
              </p>
            </div>
          </div>
        ) : (
          displaySessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleSelectSession(session)}
              className={`sidebar-item border-b border-gray-100 ${
                activeSessionId === session.id ? 'sidebar-item-active' : ''
              }`}
            >
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={20} className="text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-gray-800 truncate">
                    {session.visitorId}
                  </span>
                  {session.lastMessage && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatTime(session.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 truncate">
                    {session.lastMessage
                      ? truncateText(session.lastMessage.content, 20)
                      : '暂无消息'}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`status-badge status-${session.status}`}>
                      {getStatusText(session.status)}
                    </span>
                    {session.unreadCount && session.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                        {session.unreadCount > 99 ? '99+' : session.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SessionList;
