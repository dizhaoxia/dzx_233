import React, { useEffect, useRef, useCallback, useState } from 'react';
import { X, User, Clock, MessageCircle, PhoneOff, FileText, Tag, AlertTriangle } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { emit, on, getSocket } from '../services/socket';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import RatingCard from './RatingCard';
import VisitorTicketList from './VisitorTicketList';
import { getStatusText, getTicketStatusText, getTicketStatusColor, getTicketPriorityText, getTicketPriorityColor, getTicketCategoryText } from '../utils/format';
import type { RatingScore } from '../types';

const VisitorChat: React.FC = () => {
  const visitorId = useChatStore((state) => state.visitorId);
  const session = useChatStore((state) => state.session);
  const messages = useChatStore((state) => state.messages);
  const queuePosition = useChatStore((state) => state.queuePosition);
  const sessionStatus = useChatStore((state) => state.sessionStatus);
  const assignedAdmin = useChatStore((state) => state.assignedAdmin);
  const showRatingCard = useChatStore((state) => state.showRatingCard);
  const pendingRatingSessionId = useChatStore((state) => state.pendingRatingSessionId);
  const startNewChat = useChatStore((state) => state.startNewChat);
  const setSessionStatus = useChatStore((state) => state.setSessionStatus);
  const showTicketList = useChatStore((state) => state.showTicketList);
  const setShowTicketList = useChatStore((state) => state.setShowTicketList);
  const selectedTicket = useChatStore((state) => state.selectedTicket);
  const setSelectedTicket = useChatStore((state) => state.setSelectedTicket);
  const ticketNotification = useChatStore((state) => state.ticketNotification);
  const setTicketNotification = useChatStore((state) => state.setTicketNotification);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentVisitorId, setCurrentVisitorId] = useState<string | null>(visitorId);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!currentVisitorId) return;

    const socket = getSocket();
    const store = useChatStore.getState();

    const handleConnect = () => {
      store.setIsConnected(true);
      emit('visitor:connect', { visitorId: currentVisitorId });
    };

    const handleDisconnect = () => {
      store.setIsConnected(false);
    };

    const handleSessionQueued = ({ position }: { position: number }) => {
      store.setQueuePosition(position);
      store.setSessionStatus('waiting');
    };

    const handleSessionAssigned = (data: {
      session: any;
      admin?: any;
      messages?: any[];
    }) => {
      store.setSession(data.session);
      store.setSessionStatus(data.session.status);
      store.setQueuePosition(null);
      if (data.admin) {
        store.setAssignedAdmin(data.admin);
      }
      if (data.messages) {
        store.setMessages(data.messages);
      }
    };

    const handleMessageNew = ({ message }: { message: any }) => {
      store.addMessage(message);
    };

    const handleSessionEnded = ({ sessionId }: { sessionId: number }) => {
      const currentSession = useChatStore.getState().session;
      if (currentSession?.id === sessionId) {
        store.setSessionStatus('ended');
      }
    };

    const handleRatingRequest = ({ sessionId }: { sessionId: number }) => {
      const currentSession = useChatStore.getState().session;
      if (currentSession?.id === sessionId) {
        store.setShowRatingCard(true);
        store.setPendingRatingSessionId(sessionId);
      }
    };

    const handleRatingSubmitted = () => {
      store.setShowRatingCard(false);
      store.setPendingRatingSessionId(null);
    };

    const handleError = ({ message }: { message: string }) => {
      console.error('Socket error:', message);
    };

    const handleTicketCreatedVisitor = ({ ticket }: { ticket: any }) => {
      store.setTicketNotification(ticket);
      store.setSelectedTicket(ticket);
    };

    const handleTicketUpdatedVisitor = ({ ticket }: { ticket: any }) => {
      const currentSelected = store.selectedTicket;
      if (currentSelected && currentSelected.id === ticket.id) {
        store.setSelectedTicket(ticket);
      }
      store.setTicketNotification(ticket);
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    const unsubQueued = on('session:queued', handleSessionQueued);
    const unsubAssigned = on('session:assigned', handleSessionAssigned);
    const unsubMessage = on('message:new', handleMessageNew);
    const unsubEnded = on('session:ended', handleSessionEnded);
    const unsubRatingRequest = on('rating:request', handleRatingRequest);
    const unsubRatingSubmitted = on('rating:submitted', handleRatingSubmitted);
    const unsubError = on('error', handleError);
    const unsubTicketCreated = on('ticket:created:visitor', handleTicketCreatedVisitor);
    const unsubTicketUpdated = on('ticket:updated:visitor', handleTicketUpdatedVisitor);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      unsubQueued();
      unsubAssigned();
      unsubMessage();
      unsubEnded();
      unsubRatingRequest();
      unsubRatingSubmitted();
      unsubError();
      unsubTicketCreated();
      unsubTicketUpdated();
    };
  }, [currentVisitorId]);

  const handleSendMessage = (content: string) => {
    if (!session?.id) return;
    emit('visitor:message', { sessionId: session.id, content });
  };

  const handleEndSession = () => {
    if (!session?.id || sessionStatus === 'ended') return;
    if (confirm('确定要结束本次会话吗？')) {
      emit('visitor:close', { sessionId: session.id });
    }
  };

  const handleNewChat = () => {
    const newVisitorId = startNewChat();
    setCurrentVisitorId(newVisitorId);
  };

  const handleRatingSubmit = (data: { sessionId: number; visitorId: string; score: RatingScore; feedback?: string }) => {
    emit('rating:submit', data);
  };

  const handleRatingDismiss = () => {
    const store = useChatStore.getState();
    store.setShowRatingCard(false);
    store.setPendingRatingSessionId(null);
  };

  return (
    <div className="chat-container h-screen">
      <div className="bg-primary-500 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle size={20} />
          </div>
          <div>
            <h1 className="font-semibold">在线客服</h1>
            {sessionStatus === 'waiting' && queuePosition !== null && (
              <p className="text-xs text-blue-100 flex items-center gap-1">
                <Clock size={12} />
                排队中，前方 {queuePosition} 人
              </p>
            )}
            {sessionStatus === 'active' && assignedAdmin && (
              <p className="text-xs text-blue-100 flex items-center gap-1">
                <User size={12} />
                客服 {assignedAdmin.username} 为您服务
              </p>
            )}
            {sessionStatus === 'ended' && (
              <p className="text-xs text-blue-100">会话已结束</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTicketList(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
            title="我的工单"
          >
            <FileText size={16} />
            我的工单
          </button>
          {sessionStatus === 'active' && (
            <button
              onClick={handleEndSession}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
              title="结束会话"
            >
              <PhoneOff size={16} />
              结束会话
            </button>
          )}
        </div>
      </div>

      {ticketNotification && !selectedTicket && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={16} className="text-amber-600" />
                <span className="text-sm font-medium text-amber-800">客服已为您创建工单 #{ticketNotification.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTicketStatusColor(ticketNotification.status)}`}>
                  {getTicketStatusText(ticketNotification.status)}
                </span>
              </div>
              <p className="text-sm text-amber-700 font-medium">{ticketNotification.title}</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-amber-600">
                <span className="flex items-center gap-1">
                  <Tag size={12} />
                  {getTicketCategoryText(ticketNotification.category)}
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {getTicketPriorityText(ticketNotification.priority)}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedTicket(ticketNotification);
                  setTicketNotification(null);
                }}
                className="px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
              >
                查看详情
              </button>
              <button
                onClick={() => setTicketNotification(null)}
                className="p-1.5 hover:bg-amber-100 rounded-lg transition-colors"
              >
                <X size={16} className="text-amber-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTicket && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-blue-800">关联工单: #{selectedTicket.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTicketStatusColor(selectedTicket.status)}`}>
                  {getTicketStatusText(selectedTicket.status)}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTicketPriorityColor(selectedTicket.priority)}`}>
                  {getTicketPriorityText(selectedTicket.priority)}
                </span>
              </div>
              <p className="text-sm text-blue-700 font-medium">{selectedTicket.title}</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-blue-600">
                <span className="flex items-center gap-1">
                  <Tag size={12} />
                  {getTicketCategoryText(selectedTicket.category)}
                </span>
                {selectedTicket.admin && (
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    处理客服: {selectedTicket.admin.username}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedTicket(null)}
              className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
              title="取消关联"
            >
              <X size={16} className="text-blue-600" />
            </button>
          </div>
        </div>
      )}

      {sessionStatus === 'waiting' && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-2">正在等待客服接入</h2>
            <p className="text-gray-500">您当前排在第 {queuePosition} 位，请稍候...</p>
          </div>
        </div>
      )}

      {(sessionStatus === 'active' || sessionStatus === 'ended') && (
        <>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
                  <p>暂无消息，开始对话吧</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} isVisitor={true} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {showRatingCard && pendingRatingSessionId && visitorId ? (
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <RatingCard
                sessionId={pendingRatingSessionId}
                visitorId={visitorId}
                onSubmit={handleRatingSubmit}
                onDismiss={handleRatingDismiss}
              />
            </div>
          ) : sessionStatus === 'ended' ? (
            <div className="p-4 bg-gray-100 border-t border-gray-200">
              <p className="text-center text-gray-500 mb-3">本次会话已结束</p>
              <button onClick={handleNewChat} className="w-full btn-primary">
                开始新对话
              </button>
            </div>
          ) : (
            <ChatInput
              onSend={handleSendMessage}
              disabled={sessionStatus !== 'active'}
              placeholder={sessionStatus === 'active' ? '输入消息...' : '等待客服接入中...'}
            />
          )}
        </>
      )}

      {showTicketList && (
        <VisitorTicketList onClose={() => setShowTicketList(false)} />
      )}
    </div>
  );
};

export default VisitorChat;
