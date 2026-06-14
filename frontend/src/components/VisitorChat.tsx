import React, { useEffect, useRef, useCallback } from 'react';
import { X, User, Clock, MessageCircle } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { emit, on, getSocket } from '../services/socket';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { getStatusText } from '../utils/format';

const VisitorChat: React.FC = () => {
  const {
    visitorId,
    session,
    messages,
    queuePosition,
    sessionStatus,
    assignedAdmin,
    setSession,
    setMessages,
    addMessage,
    setQueuePosition,
    setSessionStatus,
    setAssignedAdmin,
    setIsConnected,
    resetChat,
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!visitorId) return;

    const socket = getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      emit('visitor:connect', { visitorId });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleSessionQueued = ({ position }: { position: number }) => {
      setQueuePosition(position);
      setSessionStatus('waiting');
    };

    const handleSessionAssigned = (data: {
      session: any;
      admin?: any;
      messages?: any[];
    }) => {
      setSession(data.session);
      setSessionStatus(data.session.status);
      setQueuePosition(null);
      if (data.admin) {
        setAssignedAdmin(data.admin);
      }
      if (data.messages) {
        setMessages(data.messages);
      }
    };

    const handleMessageNew = ({ message }: { message: any }) => {
      addMessage(message);
    };

    const handleSessionEnded = ({ sessionId }: { sessionId: number }) => {
      if (session?.id === sessionId) {
        setSessionStatus('ended');
      }
    };

    const handleError = ({ message }: { message: string }) => {
      console.error('Socket error:', message);
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
    const unsubError = on('error', handleError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      unsubQueued();
      unsubAssigned();
      unsubMessage();
      unsubEnded();
      unsubError();
    };
  }, [visitorId, session?.id, setSession, setMessages, addMessage, setQueuePosition, setSessionStatus, setAssignedAdmin, setIsConnected]);

  const handleSendMessage = (content: string) => {
    if (!session?.id) return;
    emit('visitor:message', { sessionId: session.id, content });
  };

  const handleCloseChat = () => {
    if (session?.id && sessionStatus !== 'ended') {
      emit('visitor:close', { sessionId: session.id });
    }
    resetChat();
    if (visitorId) {
      localStorage.removeItem('visitor_id');
    }
    window.location.reload();
  };

  const handleNewChat = () => {
    resetChat();
    localStorage.removeItem('visitor_id');
    window.location.reload();
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
        <button
          onClick={handleCloseChat}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          title="关闭对话"
        >
          <X size={20} />
        </button>
      </div>

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

          {sessionStatus === 'ended' ? (
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
    </div>
  );
};

export default VisitorChat;
