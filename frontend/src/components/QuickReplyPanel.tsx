import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, X, Zap, MessageSquare, HelpCircle, Smile } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { quickReplyAPI } from '../services/api';
import type { QuickReply, QuickReplyCategory } from '../types';

interface QuickReplyPanelProps {
  onInsert: (content: string) => void;
}

const categoryConfig: { value: QuickReplyCategory | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: '全部', icon: <Zap size={14} /> },
  { value: 'greeting', label: '欢迎语', icon: <Smile size={14} /> },
  { value: 'faq', label: '常见问题', icon: <HelpCircle size={14} /> },
  { value: 'closing', label: '结束语', icon: <MessageSquare size={14} /> },
  { value: 'custom', label: '自定义', icon: <Plus size={14} /> },
];

const QuickReplyPanel: React.FC<QuickReplyPanelProps> = ({ onInsert }) => {
  const quickReplies = useAdminStore((state) => state.quickReplies);
  const setQuickReplies = useAdminStore((state) => state.setQuickReplies);
  const addQuickReply = useAdminStore((state) => state.addQuickReply);
  const updateQuickReplyStore = useAdminStore((state) => state.updateQuickReply);
  const removeQuickReply = useAdminStore((state) => state.removeQuickReply);

  const [activeCategory, setActiveCategory] = useState<QuickReplyCategory | 'all'>('all');
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<QuickReplyCategory>('custom');
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuickReplies();
  }, []);

  const loadQuickReplies = async () => {
    try {
      const data = await quickReplyAPI.getQuickReplies();
      setQuickReplies(data);
    } catch (err) {
      console.error('Failed to load quick replies:', err);
    }
  };

  const filteredReplies = activeCategory === 'all'
    ? quickReplies
    : quickReplies.filter((r) => r.category === activeCategory);

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingReply(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory(activeCategory === 'all' ? 'custom' : activeCategory as QuickReplyCategory);
    setError('');
  };

  const handleStartEdit = (reply: QuickReply) => {
    setEditingReply(reply);
    setIsCreating(false);
    setFormTitle(reply.title);
    setFormContent(reply.content);
    setFormCategory(reply.category);
    setError('');
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingReply(null);
    setFormTitle('');
    setFormContent('');
    setError('');
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      setError('标题和内容不能为空');
      return;
    }

    try {
      if (editingReply) {
        const updated = await quickReplyAPI.updateQuickReply(editingReply.id, {
          title: formTitle.trim(),
          content: formContent.trim(),
          category: formCategory,
        });
        updateQuickReplyStore(updated);
      } else {
        const created = await quickReplyAPI.createQuickReply({
          title: formTitle.trim(),
          content: formContent.trim(),
          category: formCategory,
        });
        addQuickReply(created);
      }
      handleCancelForm();
    } catch (err) {
      console.error('Failed to save quick reply:', err);
      setError('保存失败，请重试');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此快捷回复吗？')) return;
    try {
      await quickReplyAPI.deleteQuickReply(id);
      removeQuickReply(id);
    } catch (err) {
      console.error('Failed to delete quick reply:', err);
    }
  };

  const showForm = isCreating || editingReply;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800 text-sm">快捷回复</h3>
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium"
          >
            <Plus size={14} />
            新建
          </button>
        </div>
        <div className="flex gap-1 flex-wrap">
          {categoryConfig.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="p-3 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">
              {editingReply ? '编辑快捷回复' : '新建快捷回复'}
            </span>
            <button onClick={handleCancelForm} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          <input
            type="text"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="标题"
            className="input-field text-xs mb-2 py-1.5"
          />
          <textarea
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            placeholder="回复内容"
            rows={3}
            className="input-field text-xs mb-2 py-1.5 resize-none"
          />
          <div className="flex gap-1 mb-2">
            {categoryConfig.filter((c) => c.value !== 'all').map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFormCategory(cat.value as QuickReplyCategory)}
                className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                  formCategory === cat.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleSave} className="btn-primary text-xs py-1.5 px-3 flex-1">
              保存
            </button>
            <button onClick={handleCancelForm} className="btn-secondary text-xs py-1.5 px-3">
              取消
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {filteredReplies.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-xs">
            暂无快捷回复模板
          </div>
        ) : (
          filteredReplies.map((reply) => (
            <div
              key={reply.id}
              className="px-3 py-2 border-b border-gray-100 hover:bg-gray-50 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => onInsert(reply.content)}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-gray-800 truncate">
                      {reply.title}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      reply.category === 'greeting' ? 'bg-green-100 text-green-700' :
                      reply.category === 'faq' ? 'bg-blue-100 text-blue-700' :
                      reply.category === 'closing' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {categoryConfig.find((c) => c.value === reply.category)?.label || '自定义'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{reply.content}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => handleStartEdit(reply)}
                    className="p-1 text-gray-400 hover:text-blue-500 rounded"
                    title="编辑"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(reply.id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                    title="删除"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuickReplyPanel;
