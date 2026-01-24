import React, { useEffect, useState } from 'react';
import { BookOpen, TrendingUp, Target, AlertTriangle, X } from 'lucide-react';
import { ConversationMemory } from '../types';
import { ConversationMemoryService } from '../services/conversationMemoryService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: 'vi' | 'en';
}

export const NarrativeMemory: React.FC<Props> = ({ isOpen, onClose, language }) => {
  const [memory, setMemory] = useState<ConversationMemory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadMemory();
    }
  }, [isOpen]);

  const loadMemory = async () => {
    setLoading(true);
    try {
      const data = await ConversationMemoryService.getMemory();
      setMemory(data);
    } catch (error) {
      console.error('[NarrativeMemory] Load failed:', error);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  const text = language === 'vi' ? {
    title: "Hành Trình Của Bạn",
    themes: "Chủ Đề Chính",
    progress: "Tiến Bộ",
    events: "Sự Kiện Gần Đây",
    triggers: "Yếu Tố Khởi Phát",
    baseline: "Tâm Trạng Cơ Bản",
    close: "Đóng",
    noData: "Chưa có dữ liệu",
    loading: "Đang tải..."
  } : {
    title: "Your Journey",
    themes: "Key Themes",
    progress: "Progress Markers",
    events: "Recent Events",
    triggers: "Identified Triggers",
    baseline: "Emotional Baseline",
    close: "Close",
    noData: "No data yet",
    loading: "Loading..."
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen size={24} />
              <h2 className="text-2xl font-bold">{text.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-stone-500">
            {text.loading}
          </div>
        ) : !memory ? (
          <div className="p-12 text-center text-stone-500">
            {text.noData}
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Recurring Themes */}
            {memory.narrative.recurring_themes.length > 0 && (
              <Section
                icon={<TrendingUp size={18} className="text-orange-500" />}
                title={text.themes}
              >
                <div className="flex flex-wrap gap-2">
                  {memory.narrative.recurring_themes.map((theme, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-medium border border-orange-200"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Progress Markers */}
            {memory.narrative.progress_markers.length > 0 && (
              <Section
                icon={<Target size={18} className="text-green-500" />}
                title={text.progress}
              >
                <ul className="space-y-2">
                  {memory.narrative.progress_markers.map((marker, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-sm text-stone-700"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      {marker}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Recent Events */}
            {memory.narrative.key_events.length > 0 && (
              <Section
                icon={<BookOpen size={18} className="text-blue-500" />}
                title={text.events}
              >
                <div className="space-y-3">
                  {memory.narrative.key_events.slice(-5).reverse().map((event, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-blue-700 uppercase">
                          {event.emotion}
                        </span>
                        <span className="text-xs text-blue-600">
                          {new Date(event.timestamp).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                        </span>
                      </div>
                      <p className="text-sm text-stone-700 line-clamp-2">
                        {event.event}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Triggers */}
            {memory.emotional_baseline.triggers.size > 0 && (
              <Section
                icon={<AlertTriangle size={18} className="text-amber-500" />}
                title={text.triggers}
              >
                <div className="space-y-2">
                  {Array.from(memory.emotional_baseline.triggers.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([trigger, intensity]) => (
                      <div key={trigger} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-stone-700">
                              {trigger}
                            </span>
                            <span className="text-xs text-stone-500">
                              {Math.round(intensity * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-stone-200 rounded-full h-1.5">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all"
                              style={{ width: `${intensity * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </Section>
            )}

            {/* Emotional Baseline */}
            <Section
              icon={<TrendingUp size={18} className="text-purple-500" />}
              title={text.baseline}
            >
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-purple-700 font-medium">
                    {language === 'vi' ? 'Điểm trung bình' : 'Average Score'}
                  </span>
                  <span className="text-2xl font-bold text-purple-900">
                    {memory.emotional_baseline.baseline_mood.toFixed(1)}/10
                  </span>
                </div>
                {memory.emotional_baseline.current_deviation !== 0 && (
                  <div className="text-xs text-purple-600">
                    {memory.emotional_baseline.current_deviation > 0 ? '↑' : '↓'}{' '}
                    {language === 'vi' ? 'Hiện tại' : 'Currently'}{' '}
                    {Math.abs(memory.emotional_baseline.current_deviation).toFixed(1)}{' '}
                    {memory.emotional_baseline.current_deviation > 0
                      ? language === 'vi' ? 'cao hơn' : 'above'
                      : language === 'vi' ? 'thấp hơn' : 'below'
                    }{' '}
                    {language === 'vi' ? 'mức cơ bản' : 'baseline'}
                  </div>
                )}
              </div>
            </Section>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-stone-200 p-4 bg-stone-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium transition-all shadow-lg"
          >
            {text.close}
          </button>
        </div>
      </div>
    </div>
  );
};

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ icon, title, children }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-stone-800">{title}</h3>
      </div>
      <div className="pl-7">{children}</div>
    </div>
  );
};
