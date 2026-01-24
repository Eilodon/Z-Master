import React, { useState, useMemo, useEffect } from 'react';
import { History, TrendingUp, X, Trash2, Brain, Map } from 'lucide-react';
import { ConversationEntry } from '../types';
import { dbService } from '../services/db';
import { getWidthClass } from '../src/utils/progressUtils';

interface Props {
  history: ConversationEntry[];
  onClear: () => void;
}

export const HistoryPanel: React.FC<Props> = ({ history, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // Memoize the heavy analysis logic so it doesn't run on every render
  const analysis = useMemo(() => {
    if (history.length === 0) return null;

    // Use history prop directly
    const displayData = history;

    // Helper for safe access to mindfulness metrics
    const safeMetric = (entry: ConversationEntry, key: 'attention_stability' | 'present_moment_awareness' | 'emotional_regulation') => {
        return entry.mindfulness_metrics ? entry.mindfulness_metrics[key] : 0;
    };

    const avgAttentionStability = displayData.reduce((sum, e) => sum + safeMetric(e, 'attention_stability'), 0) / (displayData.length || 1);
    const avgPresentMomentAwareness = displayData.reduce((sum, e) => sum + safeMetric(e, 'present_moment_awareness'), 0) / (displayData.length || 1);
    const avgEmotionalRegulation = displayData.reduce((sum, e) => sum + safeMetric(e, 'emotional_regulation'), 0) / (displayData.length || 1);

    // DETERMINE MINDFULNESS PROFILE (clinically based)
    let profileTitle = "Beginning";
    let description = "Starting your mindfulness journey";
    
    if (avgPresentMomentAwareness >= 0.7 && avgEmotionalRegulation >= 0.7 && avgAttentionStability >= 0.7) {
      profileTitle = "Advanced";
      description = "Deep mindfulness practice established";
    } else if (avgPresentMomentAwareness >= 0.5 && avgEmotionalRegulation >= 0.5 && avgAttentionStability >= 0.5) {
      profileTitle = "Intermediate";
      description = "Building consistent mindfulness habits";
    } else if (avgPresentMomentAwareness >= 0.3 || avgEmotionalRegulation >= 0.3 || avgAttentionStability >= 0.3) {
      profileTitle = "Developing";
      description = "Early progress in mindfulness practice";
    }

    return {
      profileTitle,
      description,
      avgAttentionStability,
      avgPresentMomentAwareness,
      avgEmotionalRegulation,
      displayData
    };
  }, [history]);

  if (!analysis) return null;

  const { profileTitle, description, avgAttentionStability, avgPresentMomentAwareness, avgEmotionalRegulation, displayData } = analysis;

  const handleClear = () => {
    onClear();
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-full bg-white/40 backdrop-blur-md text-stone-600 hover:bg-white/80 transition-colors shadow-sm border border-white/40"
        aria-label="View history"
      >
        {isOpen ? <Map size={18} /> : <History size={18} />}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-sm p-4"
          onClick={handleBackdropClick}
        >
          <div 
            className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-stone-100 animate-[scaleIn_0.3s_ease-out] max-h-[70vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-stone-800 to-stone-900 text-amber-50 p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-amber-400" />
                <h3 className="font-bold text-sm tracking-wide uppercase">Mindfulness Profile</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="hover:bg-white/10 rounded-full p-1 transition-colors"
                aria-label="Close history"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mindfulness Profile (Clinical Metrics) */}
            <div className="bg-stone-50 p-5 border-b border-stone-200">
               <div className="text-center mb-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400">Practice Level</span>
                  <h4 className="text-xl font-serif font-bold text-stone-800 mt-1">{profileTitle}</h4>
                  <p className="text-xs text-stone-500 italic mt-1">{description}</p>
               </div>

               {/* Mindfulness Metrics Bar Chart */}
               <div className="space-y-2 mt-4">
                  <DnaBar label="Present Moment" value={avgPresentMomentAwareness} color="bg-emerald-500" />
                  <DnaBar label="Emotion Regulation" value={avgEmotionalRegulation} color="bg-purple-500" />
                  <DnaBar label="Attention" value={avgAttentionStability} color="bg-blue-500" />
               </div>
            </div>

            {/* History list */}
            <div className="overflow-y-auto p-4 space-y-3 flex-1 custom-scrollbar">
              <div className="flex items-center gap-2 mb-2 text-stone-400">
                 <TrendingUp size={12} />
                 <span className="text-[10px] uppercase font-bold tracking-wider">Journey Log</span>
              </div>
              {displayData.map((entry, idx) => {
                const timeStr = new Date(entry.timestamp).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });
                return (
                  <div
                    key={entry.id}
                    className="bg-white border border-stone-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">{entry.emotion}</span>
                      <span className="text-[10px] text-stone-400 font-mono">{timeStr}</span>
                    </div>
                    <div className="flex gap-3 text-[10px] font-medium opacity-80">
                      <span className="text-blue-600">Attn: {Math.round((entry.mindfulness_metrics?.attention_stability || 0) * 100)}</span>
                      <span className="text-purple-600">Reg: {Math.round((entry.mindfulness_metrics?.emotional_regulation || 0) * 100)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clear button */}
            <div className="border-t border-stone-100 p-3 bg-stone-50/50 rounded-b-2xl">
              <button
                onClick={handleClear}
                className="w-full py-2 text-xs font-medium text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const DnaBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-stone-400 w-16 text-right">{label}</span>
        <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div 
                className={`h-full ${color} rounded-full dna-bar-fill ${getWidthClass(value * 100)}`}
            />
        </div>
    </div>
);
