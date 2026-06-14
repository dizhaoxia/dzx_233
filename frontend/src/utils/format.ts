export const formatTime = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (diff < 60 * 1000) {
    return '刚刚';
  }

  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes}分钟前`;
  }

  if (diff < oneDay && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  if (diff < 2 * oneDay) {
    return '昨天';
  }

  return d.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatFullTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    online: '在线',
    offline: '离线',
    busy: '忙碌',
    waiting: '排队中',
    active: '进行中',
    ended: '已结束',
  };
  return statusMap[status] || status;
};

export const getTicketStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭',
  };
  return statusMap[status] || status;
};

export const getTicketPriorityText = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  };
  return priorityMap[priority] || priority;
};

export const getTicketCategoryText = (category: string): string => {
  const categoryMap: Record<string, string> = {
    technical: '技术问题',
    billing: '账单问题',
    product: '产品咨询',
    account: '账户问题',
    other: '其他问题',
  };
  return categoryMap[category] || category;
};

export const getTicketStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

export const getTicketPriorityColor = (priority: string): string => {
  const colorMap: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };
  return colorMap[priority] || 'bg-gray-100 text-gray-800';
};
