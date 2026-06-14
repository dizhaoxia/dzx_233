import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { ticketAPI } from '../services/api';
import { emit } from '../services/socket';
import type { TicketCategory, TicketPriority } from '../types';
import { getTicketCategoryText, getTicketPriorityText } from '../utils/format';

interface CreateTicketModalProps {
  sessionId: number;
  visitorId: string;
  defaultTitle?: string;
}

const categories: TicketCategory[] = ['technical', 'billing', 'product', 'account', 'other'];
const priorities: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ sessionId, visitorId, defaultTitle }) => {
  const setShowCreateTicketModal = useAdminStore((state) => state.setShowCreateTicketModal);
  const addTicket = useAdminStore((state) => state.addTicket);

  const [title, setTitle] = useState(defaultTitle || '');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('other');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const ticket = await ticketAPI.createTicket({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        visitorId,
        sessionId,
      });

      const ticketWithDetails = await ticketAPI.getTicket(ticket.id);
      addTicket(ticketWithDetails);
      emit('ticket:created', { ticket: ticketWithDetails });
      setShowCreateTicketModal(false);
    } catch (error) {
      console.error('Create ticket error:', error);
      alert('创建工单失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-primary-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">创建工单</h3>
              <p className="text-sm text-gray-500">将当前对话转为工单</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateTicketModal(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              工单标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入工单标题"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              问题描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请详细描述问题（选填）"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                问题分类 <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {getTicketCategoryText(cat)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                优先级 <span className="text-red-500">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
              >
                {priorities.map((pri) => (
                  <option key={pri} value={pri}>
                    {getTicketPriorityText(pri)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p><strong>访客ID:</strong> {visitorId}</p>
            <p><strong>会话ID:</strong> {sessionId}</p>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowCreateTicketModal(false)}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '创建中...' : '创建工单'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTicketModal;
