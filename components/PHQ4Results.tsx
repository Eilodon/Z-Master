import React, { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp, Minus, Calendar, Activity, Award, X } from 'lucide-react';
import { PHQ4Result } from '../types';
import { PHQ4Service } from '../services/phq4Service';
import { getWidthClass } from '../src/utils/progressUtils';

interface Props {
  latestResult?: PHQ4Result;
  onClose: () => void;
  language: 'vi' | 'en';
}

export const PHQ4Results: React.FC<Props> = ({ latestResult, onClose, language }) => {
  const [trend, setTrend] = useState<any>(null);
  const [history, setHistory] = useState<PHQ4Result[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const loadData = async () => {
    const trendData = await PHQ4Service.analyzeTrend();
    const historyData = await PHQ4Service.getAll();
    setTrend(trendData);
    setHistory(historyData.slice(0, 5)); // Last 5 assessments
  };

  if (!latestResult) return null;

  const severityColors = {
    minimal: 'from-green-500 to-emerald-500',
    mild: 'from-yellow-500 to-amber-500',
    moderate: 'from-orange-500 to-red-500',
    severe: 'from-red-600 to-rose-700'
  };

  const severityIcons = {
    minimal: '😊',
    mild: '😐',
    moderate: '😟',
    severe: '😢'
  };

  const text = language === 'vi' ? {
    title: "Kết Quả Đánh Giá",
    totalScore: "Tổng Điểm",
    depression: "Trầm Cảm",
    anxiety: "Lo Âu",
    interpretation: "Diễn Giải",
    trend: "Xu Hướng",
    recentHistory: "Lịch Sử Gần Đây",
    close: "Đóng",
    improving: "Đang cải thiện",
    stable: "Ổn định",
    worsening: "Đang xấu đi",
    insufficient: "Chưa đủ dữ liệu"
  } : {
    title: "Assessment Results",
    totalScore: "Total Score",
    depression: "Depression",
    anxiety: "Anxiety",
    interpretation: "Interpretation",
    trend: "Trend",
    recentHistory: "Recent History",
    close: "Close",
    improving: "Improving",
    stable: "Stable",
    worsening: "Worsening",
    insufficient: "Insufficient data"
  };

  const getTrendIcon = () => {
    if (!trend || trend.trend === 'insufficient_data') return <Minus size={20} />;
    if (trend.trend === 'improving') return <TrendingDown size={20} className="text-green-500" />;
    if (trend.trend === 'worsening') return <TrendingUp size={20} className="text-red-500" />;
    return <Minus size={20} className="text-yellow-500" />;
  };

  const getTrendText = () => {
    if (!trend) return text.insufficient;
    if (trend.trend === 'improving') return text.improving;
    if (trend.trend === 'worsening') return text.worsening;
    if (trend.trend === 'stable') return text.stable;
    return text.insufficient;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/20 relative animate-[scaleIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-600 hover:text-gray-800 transition-all backdrop-blur-sm"
          aria-label="Close results"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className={`bg-gradient-to-r ${severityColors[latestResult.severity]} text-white p-6 rounded-t-3xl relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold">{text.title}</h2>
              <span className="text-4xl animate-bounce-subtle">{severityIcons[latestResult.severity]}</span>
            </div>
            <p className="text-white/90 text-sm">
              {new Date(latestResult.timestamp).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Score Summary */}
        <div className="p-6 space-y-4">
          {/* Total Score */}
          <div className="bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl p-5 border border-stone-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award size={20} className="text-stone-600" />
                <span className="font-semibold text-stone-700">{text.totalScore}</span>
              </div>
              <span className="text-3xl font-bold text-stone-800">{latestResult.total_score}/12</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${severityColors[latestResult.severity]} results-bar-fill ${getWidthClass((latestResult.total_score / 12) * 100)}`}
              />
            </div>
          </div>

          {/* Component Scores */}
          <div className="grid grid-cols-2 gap-3">
            <ScoreCard
              label={text.depression}
              score={latestResult.depression_score}
              max={6}
              color="from-blue-500 to-indigo-500"
            />
            <ScoreCard
              label={text.anxiety}
              score={latestResult.anxiety_score}
              max={6}
              color="from-purple-500 to-pink-500"
            />
          </div>

          {/* Interpretation */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
              <Activity size={16} />
              {text.interpretation}
            </h3>
            <p className="text-sm text-amber-800 leading-relaxed">
              {latestResult.interpretation}
            </p>
          </div>

          {/* Trend Analysis */}
          {trend && trend.trend !== 'insufficient_data' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                {getTrendIcon()}
                {text.trend}: {getTrendText()}
              </h3>
              <p className="text-sm text-blue-800">
                {trend.message}
              </p>
              <div className="mt-3 flex gap-4 text-xs">
                <span className="text-blue-700">
                  {language === 'vi' ? 'Gần đây' : 'Recent'}: {trend.recent_avg.toFixed(1)}
                </span>
                <span className="text-blue-700">
                  {language === 'vi' ? 'Trước đó' : 'Previous'}: {trend.previous_avg.toFixed(1)}
                </span>
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 1 && (
            <div>
              <h3 className="font-semibold text-stone-700 mb-3 flex items-center gap-2">
                <Calendar size={16} />
                {text.recentHistory}
              </h3>
              <div className="space-y-2">
                {history.map((result, idx) => (
                  <div
                    key={result.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      idx === 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <span className="text-xs text-stone-600">
                      {new Date(result.timestamp).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-stone-500 uppercase">
                        {result.severity}
                      </span>
                      <span className="font-bold text-stone-800">{result.total_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="border-t border-stone-200/60 p-4 bg-stone-50/50 rounded-b-3xl">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            {text.close}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ScoreCardProps {
  label: string;
  score: number;
  max: number;
  color: string;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ label, score, max, color }) => {
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4">
      <div className="text-xs font-medium text-stone-500 mb-2">{label}</div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold text-stone-800">{score}</span>
        <span className="text-sm text-stone-500">/{max}</span>
      </div>
      <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} results-bar-fill ${getWidthClass((score / max) * 100)}`}
        />
      </div>
    </div>
  );
};
