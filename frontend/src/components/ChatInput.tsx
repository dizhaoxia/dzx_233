import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Send, Zap } from 'lucide-react';

interface ChatInputProps {
  onSend: (content: string) => void;
  onToggleQuickReply?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export interface ChatInputHandle {
  insertText: (text: string) => void;
}

const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(({
  onSend,
  onToggleQuickReply,
  disabled = false,
  placeholder = '输入消息...',
}, ref) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      setMessage((prev) => {
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newMessage = prev.substring(0, start) + text + prev.substring(end);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + text.length;
            textarea.focus();
          }, 0);
          return newMessage;
        }
        return prev + text;
      });
    },
  }));

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === '/' && e.ctrlKey) {
      e.preventDefault();
      onToggleQuickReply?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200">
      <div className="flex items-end gap-2">
        {onToggleQuickReply && (
          <button
            type="button"
            onClick={onToggleQuickReply}
            className="p-2.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-full transition-colors"
            title="快捷回复 (Ctrl+/)"
          >
            <Zap size={20} />
          </button>
        )}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="p-3 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
        </button>
      </div>
    </form>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
