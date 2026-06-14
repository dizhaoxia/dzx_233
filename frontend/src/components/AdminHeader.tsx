import React from 'react';
import { useRouter } from 'next/router';
import { LogOut, User, Search, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAdminStore } from '../store/adminStore';
import { authAPI } from '../services/api';
import { emit } from '../services/socket';
import type { AdminStatus } from '../types';
import { getStatusText } from '../utils/format';

const statusOptions: { value: AdminStatus; label: string; color: string }[] = [
  { value: 'online', label: '在线', color: 'bg-green-500' },
  { value: 'busy', label: '忙碌', color: 'bg-yellow-500' },
  { value: 'offline', label: '离线', color: 'bg-gray-500' },
];

const AdminHeader: React.FC = () => {
  const router = useRouter();
  const { admin, logout, updateStatus } = useAuthStore();
  const { setSearchVisitorId, resetAdminStore } = useAdminStore();

  const handleStatusChange = async (status: AdminStatus) => {
    try {
      await authAPI.updateStatus(status);
      updateStatus(status);
      if (admin?.id) {
        emit('admin:status', { adminId: admin.id, status });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleLogout = async () => {
    try {
      if (admin?.id) {
        emit('admin:logout', { adminId: admin.id });
      }
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      logout();
      resetAdminStore();
      router.push('/admin/login');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVisitorId(e.target.value);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
          <MessageSquare className="text-white" size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg text-gray-800">客服工作台</h1>
          <p className="text-sm text-gray-500">在线客服管理系统</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="按访客ID查询历史记录..."
            onChange={handleSearch}
            className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  admin?.status === option.value
                    ? `${option.color} text-white`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-gray-300" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User size={18} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{admin?.username}</p>
              <p className={`text-xs ${admin?.status === 'online' ? 'text-green-600' : admin?.status === 'busy' ? 'text-yellow-600' : 'text-gray-500'}`}>
                {getStatusText(admin?.status || 'offline')}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            title="退出登录"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
