import React, { useState } from 'react';
import { ClipboardCheck, AlertCircle, TrendingUp } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardCheck size={24} />
            <h2 className="text-xl font-bold">{questions.title}</h2>
          </div>
          <p className="text-blue-100 text-sm">{questions.subtitle}</p>
        </div>

        {/* Questions */}
        <div className="p-6 space-y-6">
          {/* Depression Questions */}
          <div className="space-y-4">
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

          <div className="border-t border-stone-200 my-4"></div>

          {/* Anxiety Questions */}
          <div className="space-y-4">
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
          <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              {language === 'vi'
                ? "PHQ-4 là bài đánh giá sàng lọc ngắn gọn, được chứng minh lâm sàng. Kết quả không thay thế chẩn đoán chuyên nghiệp."
                : "PHQ-4 is a brief, clinically validated screening. Results do not replace professional diagnosis."}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-stone-200 p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors"
          >
            {questions.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isComplete}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              isComplete
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            {questions.submit}
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
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
          {number}
        </span>
        <p className="text-sm font-medium text-stone-800 leading-relaxed">{question}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 ml-9">
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className={`py-2.5 px-3 rounded-lg text-xs font-medium transition-all border-2 ${
              selected === idx
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                : 'bg-white border-stone-200 text-stone-600 hover:border-indigo-200 hover:bg-indigo-50/50'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};
