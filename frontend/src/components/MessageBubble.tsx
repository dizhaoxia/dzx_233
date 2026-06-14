import React from 'react';
import type { Message } from '../types';
import { formatFullTime } from '../utils/format';

interface MessageBubbleProps {
  message: Message;
  isVisitor: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isVisitor }) => {
  const isOwn = (isVisitor && message.senderType === 'visitor') || (!isVisitor && message.senderType === 'admin');

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`message-bubble ${isOwn ? 'message-visitor' : 'message-admin'}`}>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div
          className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}
        >
          {formatFullTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
