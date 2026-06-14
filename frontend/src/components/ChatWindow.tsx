import React, { useEffect, useRef, useCallback, useState } from 'react';
import { User, X, MessageCircle } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { emit, on } from '../services/socket';
import { messageAPI } from '../services/api';
import MessageBubble from './MessageBubble';
import ChatInput, { ChatInputHandle } from './ChatInput';
import QuickReplyPanel from './QuickReplyPanel';
import type { Session, Message } from '../types';
import { formatTime, getStatusText } from '../utils/format';

interface ChatWindowProps {
  session: Session | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ session }) => {
  const activeSessionMessages = useAdminStore((state) => state.activeSessionMessages);
  const activeSessionId = useAdminStore((state) => state.activeSessionId);
  const showQuickReplyPanel = useAdminStore((state) => state.showQuickReplyPanel);
  const setShowQuickReplyPanel = useAdminStore((state) => state.setShowQuickReplyPanel);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const chatInputRef = useRef<ChatInputHandle>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeSessionMessages, scrollToBottom]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const store = useAdminStore.getState();

    const handleMessageNew = ({ message }: { message: Message }) => {
      const currentState = useAdminStore.getState();
      if (currentState.activeSessionId && message.sessionId === currentState.activeSessionId) {
        store.addMessageToActiveSession(message);
        if (message.senderType === 'visitor') {
          store.markSessionAsRead(currentState.activeSessionId);
          emit('message:read', { sessionId: currentState.activeSessionId, senderType: 'visitor' });
          messageAPI.markAsRead(currentState.activeSessionId, 'visitor').catch(console.error);
        }
      }
    };

    const handleSessionEnded = ({ sessionId }: { sessionId: number }) => {
      const currentState = useAdminStore.getState();
      if (currentState.activeSessionId === sessionId) {
        store.removeSession(sessionId);
      }
    };

    const unsubMessage = on('message:new', handleMessageNew);
    const unsubEnded = on('session:ended', handleSessionEnded);

    return () => {
      unsubMessage();
      unsubEnded();
    };
  }, []);

  useEffect(() => {
    if (session && session.status === 'active' && session.id === activeSessionId) {
      const store = useAdminStore.getState();
      store.markSessionAsRead(session.id);
      messageAPI.markAsRead(session.id, 'visitor').catch(console.error);
      emit('message:read', { sessionId: session.id, senderType: 'visitor' });
    }
  }, [session?.id, session?.status, activeSessionId]);

  const handleSendMessage = (content: string) => {
    if (!session?.id) return;
    emit('admin:message', { sessionId: session.id, content });
  };

  const handleEndSession = () => {
    if (!session?.id || session.status === 'ended') return;
    if (confirm('确定要结束本次会话吗？')) {
      emit('admin:end', { sessionId: session.id });
    }
  };

  const handleToggleQuickReply = () => {
    setShowQuickReplyPanel(!showQuickReplyPanel);
  };

  const handleInsertQuickReply = (content: string) => {
    chatInputRef.current?.insertText(content);
  };

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <MessageCircle size={64} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">请选择一个会话</p>
          <p className="text-sm mt-1">从左侧列表选择会话开始聊天</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User size={20} className="text-primary-500" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">{session.visitorId}</h2>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <span className={`status-badge status-${session.status}`}>
                  {getStatusText(session.status)}
                </span>
                {session.startedAt && (
                  <span>开始于 {formatTime(session.startedAt)}</span>
                )}
              </p>
            </div>
          </div>
          {session.status === 'active' && (
            <button
              onClick={handleEndSession}
              className="btn-danger flex items-center gap-2 text-sm"
            >
              <X size={16} />
              结束会话
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeSessionMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
                <p>暂无消息，开始对话吧</p>
              </div>
            </div>
          ) : (
            activeSessionMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isVisitor={false}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {session.status === 'ended' ? (
          <div className="p-4 bg-gray-100 border-t border-gray-200">
            <p className="text-center text-gray-500">本次会话已结束</p>
          </div>
        ) : (
          <ChatInput
            ref={chatInputRef}
            onSend={handleSendMessage}
            onToggleQuickReply={handleToggleQuickReply}
            disabled={session.status !== 'active'}
            placeholder={
              session.status === 'active'
                ? '输入消息... (Ctrl+/ 快捷回复)'
                : '会话已结束，无法发送消息'
            }
          />
        )}
      </div>

      {showQuickReplyPanel && (
        <div className="w-72 border-l border-gray-200 flex-shrink-0">
          <QuickReplyPanel onInsert={handleInsertQuickReply} />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
