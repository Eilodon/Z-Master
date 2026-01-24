import React, { useState } from 'react';
import { PHQ9Response, PHQ9Result, GAD7Response, GAD7Result, MAASResponse, MAASResult } from '../types/clinicalAssessments.js';
import './styles/ClinicalAssessments.css';

interface ClinicalAssessmentsProps {
  onAssessmentComplete: (type: 'phq9' | 'gad7' | 'maas', result: any) => void;
  currentLanguage: 'vi' | 'en';
}

const ClinicalAssessments: React.FC<ClinicalAssessmentsProps> = ({ 
  onAssessmentComplete, 
  currentLanguage 
}) => {
  const [currentAssessment, setCurrentAssessment] = useState<'phq9' | 'gad7' | 'maas' | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});

  const translations = {
    en: {
      phq9: {
        title: "PHQ-9: Depression Assessment",
        subtitle: "Over the last 2 weeks, how often have you been bothered by...",
        questions: [
          "Little interest or pleasure in doing things",
          "Feeling down, depressed, or hopeless",
          "Trouble falling or staying asleep, or sleeping too much",
          "Feeling tired or having little energy",
          "Poor appetite or overeating",
          "Feeling bad about yourself—or that you are a failure or have let yourself or your family down",
          "Trouble concentrating on things, such as reading the newspaper or watching television",
          "Moving or speaking so slowly that other people could have noticed. Or the opposite—being so fidgety or restless that you have been moving around a lot more than usual",
          "Thoughts that you would be better off dead, or of hurting yourself in some way"
        ],
        responseOptions: ["Not at all", "Several days", "More than half the days", "Nearly every day"]
      },
      gad7: {
        title: "GAD-7: Anxiety Assessment",
        subtitle: "Over the last 2 weeks, how often have you been bothered by...",
        questions: [
          "Feeling nervous, anxious, or on edge",
          "Not being able to stop or control worrying",
          "Worrying too much about different things",
          "Trouble relaxing",
          "Being so restless that it is hard to sit still",
          "Becoming easily annoyed or irritable",
          "Feeling afraid, as if something awful might happen"
        ],
        responseOptions: ["Not at all", "Several days", "More than half the days", "Nearly every day"]
      },
      maas: {
        title: "MAAS: Mindful Attention Awareness Scale",
        subtitle: "Please indicate how frequently you have each experience using the scale below:",
        questions: [
          "I could be experiencing some emotion and not be conscious of it until some time later",
          "I break or spill things because of carelessness, not paying attention, or thinking of something else",
          "I find it difficult to stay focused on what's happening in the present",
          "I tend to walk quickly to get where I'm going without paying attention to what I experience along the way",
          "I tend not to notice feelings of physical tension or discomfort until they really grab my attention",
          "I forget a person's name almost as soon as I've been told it for the first time",
          "It seems I am 'running on automatic' without much awareness of what I'm doing",
          "I rush through activities without being really attentive to them",
          "I get so focused on the goal I want to achieve that I lose touch with what I'm doing right now to get there",
          "I do jobs or tasks automatically, without being aware of what I'm doing",
          "I find myself listening to someone with one ear, doing something else at the same time",
          "I drive places on 'automatic pilot' and then wonder why I went there",
          "I find myself preoccupied with the future or the past",
          "I find myself doing things without paying attention",
          "I snack without being aware that I'm eating"
        ],
        responseOptions: ["Almost always", "Very frequently", "Somewhat frequently", "Somewhat infrequently", "Very infrequently", "Almost never"]
      }
    },
    vi: {
      phq9: {
        title: "PHQ-9: Đánh giá trầm cảm",
        subtitle: "Trong 2 tuần qua, bạn thường xuyên bị làm phiền bởi...",
        questions: [
          "Ít hứng thú hoặc niềm vui khi làm việc",
          "Cảm thấy chán nản, trầm cảm, hoặc tuyệt vọng",
          "Khó đi vào giấc ngủ hoặc ngủ quá nhiều",
          "Cảm thấy mệt mỏi hoặc ít năng lượng",
          "Chán ăn hoặc ăn quá nhiều",
          "Cảm thấy tệ về bản thân—or rằng bạn là thất bại hoặc làm thất vọng gia đình",
          "Khó tập trung vào việc gì đó, chẳng hạn như đọc báo hoặc xem TV",
          "Di chuyển hoặc nói chậm đến mức người khác nhận ra. Hoặc ngược lại—bồn chồn hoặc restless đến mức di chuyển nhiều hơn bình thường",
          "Suy nghĩ rằng bạn sẽ chết đi, hoặc làm tổn thương bản thân theo một cách nào đó"
        ],
        responseOptions: ["Hoàn toàn không", "Vài ngày", "Hơn nửa số ngày", "Gần như mỗi ngày"]
      },
      gad7: {
        title: "GAD-7: Đánh giá lo âu",
        subtitle: "Trong 2 tuần qua, bạn thường xuyên bị làm phiền bởi...",
        questions: [
          "Cảm thấy lo lắng, bồn chồn, hoặc căng thẳng",
          "Không thể ngừng hoặc kiểm soát lo lắng",
          "Lo lắng quá nhiều về nhiều thứ khác nhau",
          "Khó thư giãn",
          "Bồn chồn đến mức khó ngồi yên",
          "Dễ bị khó chịu hoặc cáu kỉnh",
          "Cảm thấy sợ hãi, như thể điều gì đó khủng khiếp sắp xảy ra"
        ],
        responseOptions: ["Hoàn toàn không", "Vài ngày", "Hơn nửa số ngày", "Gần như mỗi ngày"]
      },
      maas: {
        title: "MAAS: Thang nhận thức chú ý chánh niệm",
        subtitle: "Vui lòng cho biết tần suất bạn có mỗi trải nghiệm bằng thang điểm dưới đây:",
        questions: [
          "Tôi có thể trải nghiệm một số cảm xúc và không nhận ra cho đến sau này",
          "Tôi làm vỡ hoặc làm đổ đồ vật vì sự cẩu thả, không chú ý, hoặc đang nghĩ về việc khác",
          "Tôi thấy khó tập trung vào những gì đang xảy ra trong hiện tại",
          "Tôi có xu hướng đi nhanh để đến nơi cần đến mà không chú ý đến những gì tôi trải nghiệm trên đường đi",
          "Tôi có xu hướng không nhận ra cảm giác căng cơ hoặc khó chịu về thể chất cho đến khi chúng thực sự thu hút sự chú ý của tôi",
          "Tôi quên tên của một người ngay sau khi được nghe lần đầu tiên",
          "Có vẻ như tôi đang 'chạy tự động' mà không có nhiều nhận thức về những gì tôi đang làm",
          "Tôi vội vàng qua các hoạt động mà không thực sự chú ý đến chúng",
          "Tôi quá tập trung vào mục tiêu muốn đạt được đến mức mất kết nối với những gì tôi đang làm ngay bây giờ để đến đó",
          "Tôi làm công việc hoặc nhiệm vụ một cách tự động, mà không nhận ra mình đang làm gì",
          "Tôi thấy mình nghe một người này bằng một tai, đồng thời làm việc khác",
          "Tôi lái xe đến nơi trên 'chế độ tự động' và sau đó tự hỏi tại sao tôi lại đến đó",
          "Tôi thấy mình bận tâm về tương lai hoặc quá khứ",
          "Tôi thấy mình làm việc mà không chú ý",
          "Tôi ăn vặt mà không nhận ra mình đang ăn"
        ],
        responseOptions: ["Gần như luôn luôn", "Rất thường xuyên", "Thường xuyên đôi chút", "Ít thường xuyên đôi chút", "Rất ít thường xuyên", "Gần như không bao giờ"]
      }
    }
  };

  const getAssessmentQuestions = () => {
    if (!currentAssessment) return [];
    return translations[currentLanguage][currentAssessment].questions;
  };

  const getResponseOptions = () => {
    if (!currentAssessment) return [];
    return translations[currentLanguage][currentAssessment].responseOptions;
  };

  const handleResponse = (questionIndex: number, value: number) => {
    const newResponses = { ...responses };
    newResponses[`q${questionIndex + 1}`] = value;
    setResponses(newResponses);
  };

  const nextQuestion = () => {
    const questions = getAssessmentQuestions();
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      completeAssessment();
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const completeAssessment = () => {
    if (!currentAssessment) return;

    let result;
    const timestamp = Date.now();

    if (currentAssessment === 'phq9') {
      const depression_score = Object.values(responses).reduce((sum, val) => sum + val, 0);
      let severity: 'minimal' | 'mild' | 'moderate' | 'severe';
      let interpretation;

      if (depression_score <= 4) {
        severity = 'minimal';
        interpretation = currentLanguage === 'en' 
          ? "Minimal depression symptoms" 
          : "Triệu chứng trầm cảm tối thiểu";
      } else if (depression_score <= 9) {
        severity = 'mild';
        interpretation = currentLanguage === 'en'
          ? "Mild depression symptoms"
          : "Triệu chứng trầm cảm nhẹ";
      } else if (depression_score <= 14) {
        severity = 'moderate';
        interpretation = currentLanguage === 'en'
          ? "Moderate depression symptoms"
          : "Triệu chứng trầm cảm vừa";
      } else {
        severity = 'severe';
        interpretation = currentLanguage === 'en'
          ? "Severe depression symptoms"
          : "Triệu chứng trầm cảm nặng";
      }

      const phq9Responses: PHQ9Response = {
        q1_little_interest: responses.q1_little_interest || 0,
        q2_feeling_down: responses.q2_feeling_down || 0,
        q3_sleep_issues: responses.q3_sleep_issues || 0,
        q4_fatigue: responses.q4_fatigue || 0,
        q5_appetite: responses.q5_appetite || 0,
        q6_self_worth: responses.q6_self_worth || 0,
        q7_concentration: responses.q7_concentration || 0,
        q8_psychomotor: responses.q8_psychomotor || 0,
        q9_self_harm: responses.q9_self_harm || 0,
      };

      result = {
        id: `phq9_${timestamp}`,
        timestamp,
        responses: phq9Responses,
        depression_score,
        total_score: depression_score,
        severity,
        interpretation
      } as PHQ9Result;
    } else if (currentAssessment === 'gad7') {
      const anxiety_score = Object.values(responses).reduce((sum, val) => sum + val, 0);
      let severity: 'minimal' | 'mild' | 'moderate' | 'severe';
      let interpretation;

      if (anxiety_score <= 4) {
        severity = 'minimal';
        interpretation = currentLanguage === 'en'
          ? "Minimal anxiety symptoms"
          : "Triệu chứng lo âu tối thiểu";
      } else if (anxiety_score <= 9) {
        severity = 'mild';
        interpretation = currentLanguage === 'en'
          ? "Mild anxiety symptoms"
          : "Triệu chứng lo âu nhẹ";
      } else if (anxiety_score <= 14) {
        severity = 'moderate';
        interpretation = currentLanguage === 'en'
          ? "Moderate anxiety symptoms"
          : "Triệu chứng lo âu vừa";
      } else {
        severity = 'severe';
        interpretation = currentLanguage === 'en'
          ? "Severe anxiety symptoms"
          : "Triệu chứng lo âu nặng";
      }

      const gad7Responses: GAD7Response = {
        q1_nervous: responses.q1_nervous || 0,
        q2_cant_control_worry: responses.q2_cant_control_worry || 0,
        q3_worrying_too_much: responses.q3_worrying_too_much || 0,
        q4_trouble_relaxing: responses.q4_trouble_relaxing || 0,
        q5_restless: responses.q5_restless || 0,
        q6_irritable: responses.q6_irritable || 0,
        q7_afraid: responses.q7_afraid || 0,
      };

      result = {
        id: `gad7_${timestamp}`,
        timestamp,
        responses: gad7Responses,
        anxiety_score,
        total_score: anxiety_score,
        severity,
        interpretation
      } as GAD7Result;
    } else if (currentAssessment === 'maas') {
      // MAAS uses reverse scoring (1-6 scale, higher = more mindful)
      const raw_score = Object.values(responses).reduce((sum, val) => sum + val, 0);
      const mindful_score = 6 * 15 - raw_score; // Reverse score
      const average_score = mindful_score / 15;

      let interpretation;
      if (average_score >= 4.5) {
        interpretation = currentLanguage === 'en'
          ? "High level of mindfulness"
          : "Mức độ chánh niệm cao";
      } else if (average_score >= 3.5) {
        interpretation = currentLanguage === 'en'
          ? "Moderate level of mindfulness"
          : "Mức độ chánh niệm vừa";
      } else {
        interpretation = currentLanguage === 'en'
          ? "Low level of mindfulness"
          : "Mức độ chánh niệm thấp";
      }

      const maasResponses: MAASResponse = {
        q1_emotion_awareness: responses.q1_emotion_awareness || 0,
        q2_carelessness: responses.q2_carelessness || 0,
        q3_present_focus: responses.q3_present_focus || 0,
        q4_walk_attention: responses.q4_walk_attention || 0,
        q5_body_awareness: responses.q5_body_awareness || 0,
        q6_name_memory: responses.q6_name_memory || 0,
        q7_automatic_pilot: responses.q7_automatic_pilot || 0,
        q8_rush_activities: responses.q8_rush_activities || 0,
        q9_goal_focus: responses.q9_goal_focus || 0,
        q10_automatic_tasks: responses.q10_automatic_tasks || 0,
        q11_split_attention: responses.q11_split_attention || 0,
        q12_driving_automatic: responses.q12_driving_automatic || 0,
        q13_future_past_thoughts: responses.q13_future_past_thoughts || 0,
        q14_unaware_actions: responses.q14_unaware_actions || 0,
        q15_unaware_eating: responses.q15_unaware_eating || 0,
      };

      result = {
        id: `maas_${timestamp}`,
        timestamp,
        responses: maasResponses,
        mindful_score,
        average_score,
        interpretation
      } as MAASResult;
    }

    onAssessmentComplete(currentAssessment, result);
    resetAssessment();
  };

  const resetAssessment = () => {
    setCurrentAssessment(null);
    setCurrentQuestion(0);
    setResponses({});
  };

  const getProgressClass = () => {
    const percentage = Math.round(((currentQuestion + 1) / questions.length) * 100);
    return `progress-${percentage}`;
  };

  const questions = getAssessmentQuestions();
  const responseOptions = getResponseOptions();
  const currentResponse = responses[`q${currentQuestion + 1}`];

  if (!currentAssessment) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {currentLanguage === 'en' ? 'Clinical Assessments' : 'Đánh giá lâm sàng'}
        </h2>
        
        <div className="space-y-4">
          <button
            onClick={() => setCurrentAssessment('phq9')}
            className="w-full p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <h3 className="font-semibold text-blue-800">
              {translations[currentLanguage].phq9.title}
            </h3>
            <p className="text-sm text-blue-600 mt-1">
              {currentLanguage === 'en' 
                ? '9 questions • 2-3 minutes'
                : '9 câu hỏi • 2-3 phút'}
            </p>
          </button>

          <button
            onClick={() => setCurrentAssessment('gad7')}
            className="w-full p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <h3 className="font-semibold text-green-800">
              {translations[currentLanguage].gad7.title}
            </h3>
            <p className="text-sm text-green-600 mt-1">
              {currentLanguage === 'en'
                ? '7 questions • 1-2 minutes'
                : '7 câu hỏi • 1-2 phút'}
            </p>
          </button>

          <button
            onClick={() => setCurrentAssessment('maas')}
            className="w-full p-4 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <h3 className="font-semibold text-purple-800">
              {translations[currentLanguage].maas.title}
            </h3>
            <p className="text-sm text-purple-600 mt-1">
              {currentLanguage === 'en'
                ? '15 questions • 3-4 minutes'
                : '15 câu hỏi • 3-4 phút'}
            </p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {translations[currentLanguage][currentAssessment].title}
          </h2>
          <button
            onClick={resetAssessment}
            className="text-gray-500 hover:text-gray-700"
          >
            {currentLanguage === 'en' ? 'Cancel' : 'Hủy'}
          </button>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4 progress-bar">
          <div 
            className={`bg-blue-600 h-2 rounded-full transition-all duration-300 progress-bar-fill ${getProgressClass()}`}
          />
        </div>
        
        <p className="text-sm text-gray-600">
          {currentLanguage === 'en' 
            ? `Question ${currentQuestion + 1} of ${questions.length}`
            : `Câu hỏi ${currentQuestion + 1} của ${questions.length}`}
        </p>
      </div>

      <div className="mb-8">
        <p className="text-gray-700 mb-6">
          {translations[currentLanguage][currentAssessment].subtitle}
        </p>
        
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          {questions[currentQuestion]}
        </h3>
        
        <div className="space-y-3">
          {responseOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => handleResponse(currentQuestion, index)}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                currentResponse === index
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                  currentResponse === index
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {currentResponse === index && (
                    <div className="w-2 h-2 rounded-full bg-white m-0.5" />
                  )}
                </div>
                <span className="text-gray-700">{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={previousQuestion}
          disabled={currentQuestion === 0}
          className={`px-6 py-2 rounded-lg ${
            currentQuestion === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {currentLanguage === 'en' ? 'Previous' : 'Trước'}
        </button>
        
        <button
          onClick={nextQuestion}
          disabled={currentResponse === undefined}
          className={`px-6 py-2 rounded-lg ${
            currentResponse === undefined
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {currentQuestion === questions.length - 1
            ? (currentLanguage === 'en' ? 'Complete' : 'Hoàn thành')
            : (currentLanguage === 'en' ? 'Next' : 'Tiếp')}
        </button>
      </div>
    </div>
  );
};

export default ClinicalAssessments;
