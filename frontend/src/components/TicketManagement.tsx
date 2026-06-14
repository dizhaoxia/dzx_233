import React, { useState, useEffect } from 'react';
import { FileText, Filter, RefreshCw, Eye, User, Clock, Tag, AlertTriangle } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { ticketAPI } from '../services/api';
import { on } from '../services/socket';
import type { TicketWithDetails, TicketStatus, TicketPriority, TicketCategory } from '../types';
import {
  getTicketStatusText,
  getTicketPriorityText,
  getTicketCategoryText,
  getTicketStatusColor,
  getTicketPriorityColor,
  formatTime,
} from '../utils/format';

const statusFilters: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
  { value: 'closed', label: '已关闭' },
];

const TicketManagement: React.FC = () => {
  const tickets = useAdminStore((state) => state.tickets);
  const setTickets = useAdminStore((state) => state.setTickets);
  const addTicket = useAdminStore((state) => state.addTicket);
  const updateTicket = useAdminStore((state) => state.updateTicket);
  const setSelectedTicketId = useAdminStore((state) => state.setSelectedTicketId);
  const setShowTicketDetailModal = useAdminStore((state) => state.setShowTicketDetailModal);
  const setAdminsForAssign = useAdminStore((state) => state.setAdminsForAssign);
  const adminsForAssign = useAdminStore((state) => state.adminsForAssign);

  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTickets();
    loadAdmins();
    setupSocketListeners();
  }, []);

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter, categoryFilter]);

  const setupSocketListeners = () => {
    const unsubCreated = on('ticket:created', ({ ticket }: { ticket: TicketWithDetails }) => {
      addTicket(ticket);
    });

    const unsubUpdated = on('ticket:updated', ({ ticket }: { ticket: TicketWithDetails }) => {
      updateTicket(ticket);
    });

    const unsubAssigned = on('ticket:assigned', ({ ticket }: { ticket: TicketWithDetails }) => {
      updateTicket(ticket);
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubAssigned();
    };
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      const filters: {
        status?: TicketStatus;
        priority?: TicketPriority;
        category?: TicketCategory;
      } = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (priorityFilter !== 'all') filters.priority = priorityFilter;
      if (categoryFilter !== 'all') filters.category = categoryFilter;

      const data = await ticketAPI.getAllTickets(filters);
      setTickets(data);
    } catch (error) {
      console.error('Load tickets error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdmins = async () => {
    try {
      const admins = await ticketAPI.getAdmins();
      setAdminsForAssign(admins);
    } catch (error) {
      console.error('Load admins error:', error);
    }
  };

  const handleViewTicket = (ticket: TicketWithDetails) => {
    setSelectedTicketId(ticket.id);
    setShowTicketDetailModal(true);
  };

  const getStats = () => {
    const stats = {
      total: tickets.length,
      pending: tickets.filter(t => t.status === 'pending').length,
      processing: tickets.filter(t => t.status === 'processing').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length,
    };
    return stats;
  };

  const stats = getStats();

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-primary-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">工单管理</h2>
              <p className="text-sm text-gray-500">查看和管理所有工单</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter size={16} />
              筛选
            </button>
            <button
              onClick={loadTickets}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              刷新
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">全部工单</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-yellow-600 mb-1">待处理</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 mb-1">处理中</p>
            <p className="text-2xl font-bold text-blue-700">{stats.processing}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 mb-1">已解决</p>
            <p className="text-2xl font-bold text-green-700">{stats.resolved}</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">已关闭</p>
            <p className="text-2xl font-bold text-gray-700">{stats.closed}</p>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <div className="flex flex-wrap gap-2">
                  {statusFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setStatusFilter(filter.value)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        statusFilter === filter.value
                          ? 'bg-primary-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">全部优先级</option>
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="urgent">紧急</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as TicketCategory | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">全部分类</option>
                  <option value="technical">技术问题</option>
                  <option value="billing">账单问题</option>
                  <option value="product">产品咨询</option>
                  <option value="account">账户问题</option>
                  <option value="other">其他问题</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <FileText size={64} className="mb-4 opacity-30" />
            <p className="text-lg">暂无工单</p>
            <p className="text-sm mt-1">当前筛选条件下没有工单</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-800 text-lg">{ticket.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTicketStatusColor(ticket.status)}`}>
                        {getTicketStatusText(ticket.status)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTicketPriorityColor(ticket.priority)}`}>
                        {getTicketPriorityText(ticket.priority)}
                      </span>
                    </div>
                    {ticket.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ticket.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Tag size={14} />
                        {getTicketCategoryText(ticket.category)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {ticket.admin ? ticket.admin.username : '未分配'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatTime(ticket.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertTriangle size={14} />
                        访客: {ticket.visitorId}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewTicket(ticket)}
                    className="flex items-center gap-1 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <Eye size={16} />
                    查看详情
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketManagement;
