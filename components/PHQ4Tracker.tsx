import React, { useState, useEffect } from 'react';
import { ClipboardCheck, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { PHQ4Assessment } from './PHQ4Assessment';
import { PHQ4Results } from './PHQ4Results';
import { PHQ4Service } from '../services/phq4Service';
import { PHQ4Result } from '../types';

interface Props {
  language: 'vi' | 'en';
}

export const PHQ4Tracker: React.FC<Props> = ({ language }) => {
  const [showAssessment, setShowAssessment] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [latestResult, setLatestResult] = useState<PHQ4Result | null>(null);
  const [shouldTake, setShouldTake] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const latest = await PHQ4Service.getLatest();
    const shouldTakeCheck = await PHQ4Service.shouldTakeAssessment();
    const summaryData = await PHQ4Service.getSummary();

    setLatestResult(latest);
    setShouldTake(shouldTakeCheck);
    setSummary(summaryData);
  };

  const handleComplete = async (result: PHQ4Result) => {
    await PHQ4Service.save(result);
    setLatestResult(result);
    setShowAssessment(false);
    setShowResults(true);
    await loadData();
  };

  const text = language === 'vi' ? {
    takeAssessment: "Đánh Giá Tâm Lý",
    viewResults: "Xem Kết Quả",
    recommended: "Khuyến nghị",
    lastScore: "Lần trước"
  } : {
    takeAssessment: "Take Assessment",
    viewResults: "View Results",
    recommended: "Recommended",
    lastScore: "Last score"
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'minimal': return 'text-green-600 bg-green-50 border-green-200';
      case 'mild': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'moderate': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'severe': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-stone-600 bg-stone-50 border-stone-200';
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-2">
        {/* Assessment Button */}
        <button
          onClick={() => setShowAssessment(true)}
          className={`relative group p-3 rounded-full shadow-lg transition-all ${
            shouldTake
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white animate-pulse'
              : 'bg-white/90 backdrop-blur-md hover:bg-white text-stone-700 border border-stone-200'
          }`}
          aria-label={text.takeAssessment}
        >
          <ClipboardCheck size={20} />
          {shouldTake && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
          )}

          {/* Tooltip */}
          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-stone-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {text.takeAssessment}
            {shouldTake && (
              <span className="ml-2 text-yellow-300">• {text.recommended}</span>
            )}
          </span>
        </button>

        {/* Results Button (if has data) */}
        {latestResult && (
          <button
            onClick={() => setShowResults(true)}
            className={`p-3 rounded-full shadow-lg transition-all border ${getSeverityColor(latestResult.severity)} hover:shadow-xl`}
            aria-label={text.viewResults}
          >
            {summary?.trend === 'improving' && <TrendingDown size={20} />}
            {summary?.trend === 'worsening' && <TrendingUp size={20} />}
            {(summary?.trend === 'stable' || !summary?.trend) && <AlertCircle size={20} />}

            <span className="absolute -top-1 -left-1 text-[10px] font-bold bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
              {latestResult.total_score}
            </span>
          </button>
        )}
      </div>

      {/* Modals */}
      {showAssessment && (
        <PHQ4Assessment
          onComplete={handleComplete}
          onClose={() => setShowAssessment(false)}
          language={language}
        />
      )}

      {showResults && latestResult && (
        <PHQ4Results
          latestResult={latestResult}
          onClose={() => setShowResults(false)}
          language={language}
        />
      )}
    </>
  );
};
