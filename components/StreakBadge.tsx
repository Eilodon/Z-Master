import React, { useEffect, useState } from 'react';
import { Flame, Award, X } from 'lucide-react';
import { StreakData } from '../types';
import { StreakService } from '../services/streakService';

interface Props {
  language: 'vi' | 'en';
}

export const StreakBadge: React.FC<Props> = ({ language }) => {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [newMilestone, setNewMilestone] = useState<StreakData['milestones'][0] | null>(null);

  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = async () => {
    const data = await StreakService.getStreak();
    setStreak(data);

    // Auto check-in on load
    const { isNewDay, newMilestones } = await StreakService.checkIn();

    if (isNewDay) {
      // Reload to get updated data
      const updated = await StreakService.getStreak();
      setStreak(updated);

      // Show milestone celebration if any
      if (newMilestones.length > 0) {
        setNewMilestone(newMilestones[0]);
      }
    }
  };

  const handleCelebrate = async () => {
    if (newMilestone) {
      await StreakService.celebrateMilestone(newMilestone.type);
      setNewMilestone(null);
    }
  };

  if (!streak) return null;

  const text = language === 'vi' ? {
    streak: 'Chuỗi',
    days: 'ngày',
    longest: 'Dài nhất',
    total: 'Tổng số',
    sessions: 'buổi',
    milestones: 'Thành Tựu',
    close: 'Đóng',
    celebrate: 'Tuyệt vời!'
  } : {
    streak: 'Streak',
    days: 'days',
    longest: 'Longest',
    total: 'Total',
    sessions: 'sessions',
    milestones: 'Milestones',
    close: 'Close',
    celebrate: 'Awesome!'
  };

  return (
    <>
      {/* Floating Badge */}
      <button
        onClick={() => setShowDetails(true)}
        className={`fixed bottom-36 left-4 z-40 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-all ${
          streak.current_streak > 0
            ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
            : 'bg-white/90 backdrop-blur-md hover:bg-white text-stone-700 border border-stone-200'
        }`}
        aria-label="View streak"
      >
        <Flame size={18} className={streak.current_streak > 0 ? 'animate-pulse' : ''} />
        <span className="font-bold text-sm">{streak.current_streak}</span>
      </button>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Flame size={28} />
                  <div>
                    <h2 className="text-2xl font-bold">{text.streak}</h2>
                    <p className="text-orange-100 text-sm">
                      {language === 'vi' ? 'Thực hành đều đặn' : 'Consistent practice'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="p-6 space-y-4">
              {/* Current Streak */}
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200">
                <div className="text-5xl font-bold text-orange-600 mb-1">
                  {streak.current_streak}
                </div>
                <div className="text-sm text-orange-700 font-medium">
                  {text.days} {text.streak.toLowerCase()}
                </div>
              </div>

              {/* Other Stats */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label={text.longest}
                  value={streak.longest_streak}
                  suffix={text.days}
                  color="from-yellow-500 to-amber-500"
                />
                <StatCard
                  label={text.total}
                  value={streak.total_check_ins}
                  suffix={text.sessions}
                  color="from-green-500 to-emerald-500"
                />
              </div>

              {/* Milestones */}
              {streak.milestones.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Award size={16} className="text-purple-600" />
                    <h3 className="font-semibold text-stone-800">{text.milestones}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {streak.milestones.map((milestone, idx) => {
                      const info = StreakService.getMilestoneInfo(milestone.type, language);
                      return (
                        <div
                          key={idx}
                          className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-200 flex items-center gap-1"
                          title={info.description}
                        >
                          <span>{info.emoji}</span>
                          <span>{info.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-stone-200 p-4 bg-stone-50 rounded-b-2xl">
              <button
                onClick={() => setShowDetails(false)}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium transition-all shadow-lg"
              >
                {text.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Celebration */}
      {newMilestone && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center transform animate-[scaleIn_0.5s_ease-out]">
            <div className="text-6xl mb-4 animate-bounce">
              {StreakService.getMilestoneInfo(newMilestone.type, language).emoji}
            </div>
            <h2 className="text-2xl font-bold text-stone-800 mb-2">
              {StreakService.getMilestoneInfo(newMilestone.type, language).title}
            </h2>
            <p className="text-stone-600 mb-6">
              {StreakService.getMilestoneInfo(newMilestone.type, language).description}
            </p>
            <button
              onClick={handleCelebrate}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold transition-all shadow-lg"
            >
              {text.celebrate}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

interface StatCardProps {
  label: string;
  value: number;
  suffix: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, suffix, color }) => {
  return (
    <div className="p-3 bg-white rounded-lg border border-stone-200 shadow-sm">
      <div className="text-xs text-stone-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
        {value}
      </div>
      <div className="text-xs text-stone-400">{suffix}</div>
    </div>
  );
};
