import React, { useEffect, useState } from 'react';
import { X, FileText, Clock, Tag, AlertTriangle, User, ChevronRight, Plus } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { ticketAPI } from '../services/api';
import type { TicketWithDetails } from '../types';
import {
  getTicketStatusText,
  getTicketPriorityText,
  getTicketCategoryText,
  getTicketStatusColor,
  getTicketPriorityColor,
  formatTime,
} from '../utils/format';

interface VisitorTicketListProps {
  onClose: () => void;
}

const VisitorTicketList: React.FC<VisitorTicketListProps> = ({ onClose }) => {
  const visitorId = useChatStore((state) => state.visitorId);
  const visitorTickets = useChatStore((state) => state.visitorTickets);
  const setVisitorTickets = useChatStore((state) => state.setVisitorTickets);
  const continueWithTicket = useChatStore((state) => state.continueWithTicket);
  const startNewChat = useChatStore((state) => state.startNewChat);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visitorId) {
      loadTickets();
    }
  }, [visitorId]);

  const loadTickets = async () => {
    if (!visitorId) return;
    setLoading(true);
    try {
      const tickets = await ticketAPI.getVisitorTickets(visitorId, true);
      setVisitorTickets(tickets);
    } catch (error) {
      console.error('Load visitor tickets error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = (ticket: TicketWithDetails) => {
    continueWithTicket(ticket);
    onClose();
  };

  const handleNewChat = () => {
    startNewChat();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-primary-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">我的工单</h3>
              <p className="text-sm text-gray-500">选择工单继续沟通或开始新对话</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : visitorTickets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
              <FileText size={64} className="mb-4 opacity-30" />
              <p className="text-lg">暂无工单</p>
              <p className="text-sm mt-1">您还没有创建过工单</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visitorTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer group"
                  onClick={() => handleContinue(ticket)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-800 group-hover:text-primary-600 transition-colors">
                          {ticket.title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTicketStatusColor(ticket.status)}`}>
                          {getTicketStatusText(ticket.status)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTicketPriorityColor(ticket.priority)}`}>
                          {getTicketPriorityText(ticket.priority)}
                        </span>
                      </div>
                      {ticket.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-1">{ticket.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Tag size={12} />
                          {getTicketCategoryText(ticket.category)}
                        </span>
                        {ticket.admin && (
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            客服: {ticket.admin.username}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatTime(ticket.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertTriangle size={12} />
                          工单 #{ticket.id}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400 group-hover:text-primary-500 transition-colors flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
          >
            <Plus size={20} />
            开始新对话
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitorTicketList;
