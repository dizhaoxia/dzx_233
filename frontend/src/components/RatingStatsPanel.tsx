import React, { useEffect, useState } from 'react';
import { BarChart3, ThumbsUp, Minus, ThumbsDown, TrendingUp, Calendar } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { ratingAPI } from '../services/api';
import type { Rating, AdminRatingStats } from '../types';

const RatingStatsPanel: React.FC = () => {
  const ratingStats = useAdminStore((state) => state.ratingStats);
  const setRatingStats = useAdminStore((state) => state.setRatingStats);
  const ratings = useAdminStore((state) => state.ratings);
  const setRatings = useAdminStore((state) => state.setRatings);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadStats();
    loadRatings();
  }, []);

  const loadStats = async () => {
    try {
      const stats = await ratingAPI.getAdminStats(startDate || undefined, endDate || undefined);
      setRatingStats(stats);
    } catch (err) {
      console.error('Failed to load rating stats:', err);
    }
  };

  const loadRatings = async () => {
    try {
      const data = await ratingAPI.getRatings(20);
      setRatings(data);
    } catch (err) {
      console.error('Failed to load ratings:', err);
    }
  };

  const handleFilter = () => {
    loadStats();
  };

  const scoreIcon = (score: string) => {
    switch (score) {
      case 'satisfied': return <ThumbsUp size={14} className="text-green-500" />;
      case 'neutral': return <Minus size={14} className="text-yellow-500" />;
      case 'dissatisfied': return <ThumbsDown size={14} className="text-red-500" />;
      default: return null;
    }
  };

  const scoreLabel = (score: string) => {
    switch (score) {
      case 'satisfied': return '满意';
      case 'neutral': return '一般';
      case 'dissatisfied': return '不满意';
      default: return score;
    }
  };

  const scoreColor = (score: string) => {
    switch (score) {
      case 'satisfied': return 'bg-green-100 text-green-700';
      case 'neutral': return 'bg-yellow-100 text-yellow-700';
      case 'dissatisfied': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={18} className="text-primary-500" />
          <h3 className="font-semibold text-gray-800">满意度统计</h3>
        </div>

        <div className="flex gap-2 items-end mb-2">
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field text-xs py-1.5"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field text-xs py-1.5"
            />
          </div>
          <button onClick={handleFilter} className="btn-primary text-xs py-1.5 px-3">
            筛选
          </button>
        </div>
      </div>

      {ratingStats && (
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-600 mb-1">总会话数</p>
              <p className="text-xl font-bold text-blue-700">{ratingStats.totalSessions}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-xs text-purple-600 mb-1">已评价数</p>
              <p className="text-xl font-bold text-purple-700">{ratingStats.ratedSessions}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3 bg-primary-50 rounded-lg p-3">
            <TrendingUp size={20} className="text-primary-500" />
            <div>
              <p className="text-xs text-primary-600">满意度</p>
              <p className="text-lg font-bold text-primary-700">{ratingStats.satisfactionRate}%</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ThumbsUp size={14} className="text-green-500" />
                <span className="text-xs text-gray-600">满意</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{
                      width: ratingStats.ratedSessions > 0
                        ? `${(ratingStats.satisfiedCount / ratingStats.ratedSessions) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-8 text-right">
                  {ratingStats.satisfiedCount}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Minus size={14} className="text-yellow-500" />
                <span className="text-xs text-gray-600">一般</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full transition-all"
                    style={{
                      width: ratingStats.ratedSessions > 0
                        ? `${(ratingStats.neutralCount / ratingStats.ratedSessions) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-8 text-right">
                  {ratingStats.neutralCount}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ThumbsDown size={14} className="text-red-500" />
                <span className="text-xs text-gray-600">不满意</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{
                      width: ratingStats.ratedSessions > 0
                        ? `${(ratingStats.dissatisfiedCount / ratingStats.ratedSessions) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-8 text-right">
                  {ratingStats.dissatisfiedCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h4 className="text-xs font-semibold text-gray-500 mb-2">最近评价</h4>
          {ratings.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">暂无评价记录</p>
          ) : (
            ratings.slice(0, 10).map((rating) => (
              <div key={rating.id} className="flex items-start gap-2 py-2 border-b border-gray-50">
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${scoreColor(rating.score)}`}>
                  {scoreIcon(rating.score)}
                  {scoreLabel(rating.score)}
                </div>
                <div className="flex-1 min-w-0">
                  {rating.feedback && (
                    <p className="text-xs text-gray-600 truncate">{rating.feedback}</p>
                  )}
                  <p className="text-[10px] text-gray-400">
                    {new Date(rating.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RatingStatsPanel;
