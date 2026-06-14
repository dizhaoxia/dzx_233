import React, { useState } from 'react';
import { ThumbsUp, Minus, ThumbsDown, Send, CheckCircle } from 'lucide-react';
import type { RatingScore } from '../types';

interface RatingCardProps {
  sessionId: number;
  visitorId: string;
  onSubmit: (data: { sessionId: number; visitorId: string; score: RatingScore; feedback?: string }) => void;
  onDismiss: () => void;
}

const scoreOptions: { value: RatingScore; label: string; icon: React.ReactNode; color: string; bgColor: string; hoverColor: string }[] = [
  {
    value: 'satisfied',
    label: '满意',
    icon: <ThumbsUp size={24} />,
    color: 'text-green-500',
    bgColor: 'bg-green-100 border-green-300',
    hoverColor: 'hover:bg-green-200 hover:border-green-400',
  },
  {
    value: 'neutral',
    label: '一般',
    icon: <Minus size={24} />,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 border-yellow-300',
    hoverColor: 'hover:bg-yellow-200 hover:border-yellow-400',
  },
  {
    value: 'dissatisfied',
    label: '不满意',
    icon: <ThumbsDown size={24} />,
    color: 'text-red-500',
    bgColor: 'bg-red-100 border-red-300',
    hoverColor: 'hover:bg-red-200 hover:border-red-400',
  },
];

const RatingCard: React.FC<RatingCardProps> = ({ sessionId, visitorId, onSubmit, onDismiss }) => {
  const [selectedScore, setSelectedScore] = useState<RatingScore | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedScore) return;
    setIsSubmitting(true);
    try {
      onSubmit({
        sessionId,
        visitorId,
        score: selectedScore,
        feedback: feedback.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Rating submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm mx-auto text-center border border-gray-100">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle size={28} className="text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">感谢您的评价</h3>
        <p className="text-sm text-gray-500 mb-4">您的反馈对我们非常重要</p>
        <button
          onClick={onDismiss}
          className="btn-primary text-sm w-full"
        >
          关闭
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm mx-auto border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-1 text-center">请对本次服务进行评价</h3>
      <p className="text-sm text-gray-500 mb-4 text-center">您的评价将帮助我们改善服务质量</p>

      <div className="flex justify-center gap-3 mb-4">
        {scoreOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedScore(option.value)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
              selectedScore === option.value
                ? `${option.bgColor} border-current ${option.color}`
                : `bg-gray-50 border-gray-200 text-gray-400 ${option.hoverColor}`
            }`}
          >
            {option.icon}
            <span className="text-xs font-medium">{option.label}</span>
          </button>
        ))}
      </div>

      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="请输入您的建议或意见（选填）"
        rows={3}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
      />

      <div className="flex gap-2">
        <button
          onClick={onDismiss}
          className="btn-secondary text-sm flex-1"
        >
          跳过
        </button>
        <button
          onClick={handleSubmit}
          disabled={!selectedScore || isSubmitting}
          className="btn-primary text-sm flex-1 flex items-center justify-center gap-1"
        >
          <Send size={14} />
          {isSubmitting ? '提交中...' : '提交评价'}
        </button>
      </div>
    </div>
  );
};

export default RatingCard;
