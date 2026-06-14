import React, { useState, useEffect } from 'react';
import { X, FileText, User, Clock, Tag, AlertTriangle, MessageSquare, Send } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { ticketAPI } from '../services/api';
import { emit } from '../services/socket';
import type { TicketWithDetails, TicketStatus, TicketPriority, TicketCategory, AdminForAssign } from '../types';
import {
  getTicketStatusText,
  getTicketPriorityText,
  getTicketCategoryText,
  getTicketStatusColor,
  getTicketPriorityColor,
  formatFullTime,
} from '../utils/format';

const statuses: TicketStatus[] = ['pending', 'processing', 'resolved', 'closed'];
const priorities: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];
const categories: TicketCategory[] = ['technical', 'billing', 'product', 'account', 'other'];

const TicketDetailModal: React.FC = () => {
  const selectedTicketId = useAdminStore((state) => state.selectedTicketId);
  const setShowTicketDetailModal = useAdminStore((state) => state.setShowTicketDetailModal);
  const updateTicket = useAdminStore((state) => state.updateTicket);
  const adminsForAssign = useAdminStore((state) => state.adminsForAssign);

  const [ticket, setTicket] = useState<TicketWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    category: 'other' as TicketCategory,
    priority: 'medium' as TicketPriority,
  });
  const [selectedAdminId, setSelectedAdminId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedTicketId) {
      loadTicket();
    }
  }, [selectedTicketId]);

  const loadTicket = async () => {
    if (!selectedTicketId) return;
    setLoading(true);
    try {
      const data = await ticketAPI.getTicket(selectedTicketId);
      setTicket(data);
      setEditData({
        title: data.title,
        description: data.description || '',
        category: data.category,
        priority: data.priority,
      });
      setSelectedAdminId(data.adminId);
    } catch (error) {
      console.error('Load ticket error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticket) return;
    setLoading(true);
    try {
      const result = await ticketAPI.updateTicketStatus(ticket.id, status);
      setTicket(result.ticket);
      updateTicket(result.ticket);
      emit('ticket:updated', { ticket: result.ticket });
    } catch (error) {
      console.error('Update status error:', error);
      alert('更新状态失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!ticket) return;
    setLoading(true);
    try {
      const result = await ticketAPI.assignTicket(ticket.id, selectedAdminId);
      setTicket(result.ticket);
      updateTicket(result.ticket);
      emit('ticket:assigned', { ticket: result.ticket });
    } catch (error) {
      console.error('Assign ticket error:', error);
      alert('分配失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!ticket) return;
    setLoading(true);
    try {
      const result = await ticketAPI.updateTicket(ticket.id, editData);
      setTicket(result.ticket);
      updateTicket(result.ticket);
      emit('ticket:updated', { ticket: result.ticket });
      setEditMode(false);
    } catch (error) {
      console.error('Update ticket error:', error);
      alert('保存失败');
    } finally {
      setLoading(false);
    }
  };

  if (!ticket && !loading) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-primary-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">工单详情</h3>
              <p className="text-sm text-gray-500">工单 #{ticket?.id}</p>
            </div>
          </div>
          <button
            onClick={() => setShowTicketDetailModal(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {loading && !ticket ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : ticket ? (
          <>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <div className="flex items-start justify-between mb-4">
                  {editMode ? (
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      className="text-xl font-semibold text-gray-800 border-b-2 border-primary-500 outline-none flex-1 mr-4"
                    />
                  ) : (
                    <h4 className="text-xl font-semibold text-gray-800">{ticket.title}</h4>
                  )}
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTicketStatusColor(ticket.status)}`}>
                      {getTicketStatusText(ticket.status)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTicketPriorityColor(ticket.priority)}`}>
                      {getTicketPriorityText(ticket.priority)}
                    </span>
                  </div>
                </div>

                {editMode ? (
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none resize-none"
                    placeholder="问题描述"
                  />
                ) : ticket.description ? (
                  <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{ticket.description}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Tag size={14} />
                    <span>问题分类</span>
                  </div>
                  {editMode ? (
                    <select
                      value={editData.category}
                      onChange={(e) => setEditData({ ...editData, category: e.target.value as TicketCategory })}
                      className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{getTicketCategoryText(cat)}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-medium text-gray-800">{getTicketCategoryText(ticket.category)}</p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <AlertTriangle size={14} />
                    <span>优先级</span>
                  </div>
                  {editMode ? (
                    <select
                      value={editData.priority}
                      onChange={(e) => setEditData({ ...editData, priority: e.target.value as TicketPriority })}
                      className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                    >
                      {priorities.map((pri) => (
                        <option key={pri} value={pri}>{getTicketPriorityText(pri)}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-medium text-gray-800">{getTicketPriorityText(ticket.priority)}</p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <User size={14} />
                    <span>处理客服</span>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedAdminId || ''}
                      onChange={(e) => setSelectedAdminId(e.target.value ? parseInt(e.target.value) : null)}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="">未分配</option>
                      {adminsForAssign.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.username} ({admin.status === 'online' ? '在线' : '离线'})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssign}
                      disabled={loading || selectedAdminId === ticket.adminId}
                      className="px-3 py-1 bg-primary-500 text-white rounded text-sm hover:bg-primary-600 transition-colors disabled:opacity-50"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Clock size={14} />
                    <span>创建时间</span>
                  </div>
                  <p className="font-medium text-gray-800">{formatFullTime(ticket.createdAt)}</p>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">状态更新</h5>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={loading || ticket.status === status}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        ticket.status === status
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } disabled:opacity-50`}
                    >
                      {getTicketStatusText(status)}
                    </button>
                  ))}
                </div>
              </div>

              {ticket.sessionId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <MessageSquare size={16} />
                    <span className="font-medium">关联会话</span>
                  </div>
                  <p className="text-sm text-blue-600">会话ID: {ticket.sessionId}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              {editMode ? (
                <>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={loading || !editData.title.trim()}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                  >
                    保存修改
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowTicketDetailModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    关闭
                  </button>
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    编辑工单
                  </button>
                </>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default TicketDetailModal;
