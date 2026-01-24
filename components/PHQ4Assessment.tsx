import React, { useState, useEffect } from 'react';
import { ClipboardCheck, AlertCircle, TrendingUp, X } from 'lucide-react';
import { PHQ4Response, PHQ4Result } from '../types';

interface Props {
  onComplete: (result: PHQ4Result) => void;
  onClose: () => void;
  language: 'vi' | 'en';
}

export const PHQ4Assessment: React.FC<Props> = ({ onComplete, onClose, language }) => {
  const [responses, setResponses] = useState<PHQ4Response>({
    q1_little_interest: -1,
    q2_feeling_down: -1,
    q3_nervous: -1,
    q4_worry: -1
  });

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

  const questions = language === 'vi' ? {
    title: "Đánh Giá Sức Khỏe Tâm Lý",
    subtitle: "Trong 2 tuần qua, con có bị làm phiền bởi những vấn đề sau không?",
    q1: "Ít hứng thú hoặc vui thích khi làm việc gì?",
    q2: "Cảm thấy buồn, chán nản, hoặc tuyệt vọng?",
    q3: "Cảm thấy lo lắng, bồn chồn, hoặc căng thẳng?",
    q4: "Không thể ngừng hoặc kiểm soát được sự lo lắng?",
    options: ["Không bao giờ", "Vài ngày", "Hơn nửa số ngày", "Gần như mỗi ngày"],
    submit: "Hoàn Thành",
    cancel: "Hủy"
  } : {
    title: "Mental Health Check-In",
    subtitle: "Over the last 2 weeks, how often have you been bothered by:",
    q1: "Little interest or pleasure in doing things?",
    q2: "Feeling down, depressed, or hopeless?",
    q3: "Feeling nervous, anxious, or on edge?",
    q4: "Not being able to stop or control worrying?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    submit: "Complete",
    cancel: "Cancel"
  };

  const handleSelect = (question: keyof PHQ4Response, value: number) => {
    setResponses(prev => ({ ...prev, [question]: value }));
  };

  const isComplete = Object.values(responses).every(v => v >= 0);

  const calculateResult = (): PHQ4Result => {
    const depression_score = responses.q1_little_interest + responses.q2_feeling_down;
    const anxiety_score = responses.q3_nervous + responses.q4_worry;
    const total_score = depression_score + anxiety_score;

    let severity: PHQ4Result['severity'];
    let interpretation: string;

    if (total_score <= 2) {
      severity = 'minimal';
      interpretation = language === 'vi'
        ? "Triệu chứng tối thiểu. Hãy tiếp tục thực hành chánh niệm."
        : "Minimal symptoms. Continue your mindfulness practice.";
    } else if (total_score <= 5) {
      severity = 'mild';
      interpretation = language === 'vi'
        ? "Triệu chứng nhẹ. Thực hành chánh niệm đều đặn có thể giúp ích."
        : "Mild symptoms. Regular mindfulness practice can be helpful.";
    } else if (total_score <= 8) {
      severity = 'moderate';
      interpretation = language === 'vi'
        ? "Triệu chứng trung bình. Nên cân nhắc gặp chuyên gia tâm lý."
        : "Moderate symptoms. Consider speaking with a mental health professional.";
    } else {
      severity = 'severe';
      interpretation = language === 'vi'
        ? "Triệu chứng nặng. Rất khuyến khích gặp chuyên gia tâm lý."
        : "Severe symptoms. Strongly recommend professional support.";
    }

    return {
      id: Date.now().toString(),
      timestamp: Date.now(),
      responses,
      depression_score,
      anxiety_score,
      total_score,
      severity,
      interpretation
    };
  };

  const handleSubmit = () => {
    const result = calculateResult();
    onComplete(result);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20 relative animate-[scaleIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-600 hover:text-gray-800 transition-all backdrop-blur-sm"
          aria-label="Close assessment"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8 rounded-t-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <ClipboardCheck size={28} className="text-blue-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{questions.title}</h2>
                <p className="text-blue-200 text-sm mt-1 leading-relaxed">{questions.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <div className="h-px bg-blue-400 flex-1"></div>
              <div className="px-3 py-1 bg-blue-500/20 rounded-full text-xs text-blue-300 font-medium">PHQ-4</div>
              <div className="h-px bg-blue-400 flex-1"></div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="p-8 space-y-8">
          {/* Depression Questions */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">D</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800">{language === 'vi' ? 'Trầm cảm' : 'Depression'}</h3>
            </div>
            <QuestionCard
              number={1}
              question={questions.q1}
              selected={responses.q1_little_interest}
              onSelect={(v) => handleSelect('q1_little_interest', v)}
              options={questions.options}
            />
            <QuestionCard
              number={2}
              question={questions.q2}
              selected={responses.q2_feeling_down}
              onSelect={(v) => handleSelect('q2_feeling_down', v)}
              options={questions.options}
            />
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
            </div>
            <div className="relative flex justify-center">
              <div className="px-4 py-2 bg-slate-100 rounded-full">
                <span className="text-xs font-medium text-slate-500">{language === 'vi' ? 'Lo lắng' : 'Anxiety'}</span>
              </div>
            </div>
          </div>

          {/* Anxiety Questions */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">A</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800">{language === 'vi' ? 'Lo lắng' : 'Anxiety'}</h3>
            </div>
            <QuestionCard
              number={3}
              question={questions.q3}
              selected={responses.q3_nervous}
              onSelect={(v) => handleSelect('q3_nervous', v)}
              options={questions.options}
            />
            <QuestionCard
              number={4}
              question={questions.q4}
              selected={responses.q4_worry}
              onSelect={(v) => handleSelect('q4_worry', v)}
              options={questions.options}
            />
          </div>

          {/* Info Note */}
          <div className="flex gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl p-6 shadow-sm">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <AlertCircle size={20} className="text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm text-blue-900 leading-relaxed font-medium">
                {language === 'vi'
                  ? "PHQ-4 là bài đánh giá sàng lọc ngắn gọn, được chứng minh lâm sàng. Kết quả không thay thế chẩn đoán chuyên nghiệp."
                  : "PHQ-4 is a brief, clinically validated screening. Results do not replace professional diagnosis."}
              </p>
              <p className="text-xs text-blue-700 mt-2">
                {language === 'vi' ? '⏱️ Khoảng 2 phút để hoàn thành' : '⏱️ Takes about 2 minutes to complete'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-200/60 p-6 flex gap-4 bg-slate-50/50 rounded-b-3xl">
          <button
            onClick={onClose}
            className="flex-1 py-4 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-medium transition-all border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md"
          >
            {questions.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isComplete}
            className={`flex-1 py-4 px-6 rounded-2xl font-medium transition-all shadow-lg hover:shadow-xl ${
              isComplete
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border border-transparent transform hover:scale-[1.02]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
            }`}
          >
            {isComplete ? (
              <span className="flex items-center justify-center gap-2">
                {questions.submit}
                <ClipboardCheck size={18} />
              </span>
            ) : (
              questions.submit
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface QuestionCardProps {
  number: number;
  question: string;
  selected: number;
  onSelect: (value: number) => void;
  options: string[];
}

const QuestionCard: React.FC<QuestionCardProps> = ({ number, question, selected, onSelect, options }) => {
  return (
    <div className="space-y-4 bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center border border-slate-300">
          {number}
        </div>
        <p className="text-base font-medium text-slate-800 leading-relaxed flex-1">{question}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 ml-12">
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className={`py-3 px-4 rounded-xl text-sm font-medium transition-all border-2 transform hover:scale-[1.02] ${
              selected === idx
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50/50 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              {selected === idx && (
                <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              )}
              {option}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
