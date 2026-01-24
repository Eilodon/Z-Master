// Evidence-Based Therapy Modules
// Clinically validated interventions adapted for AI delivery

import { TherapyModule, TherapySession, TherapyExercise, TherapyPrompt, TherapyHomework, TherapyAssessment } from '../types/therapy';

// CBT Depression Module
export const cbtDepressionModule: TherapyModule = {
  id: 'cbt-depression-v1',
  name: 'CBT-Depression',
  description: 'Cognitive Behavioral Therapy for depression - identifying and changing negative thought patterns',
  target_symptoms: ['depression', 'low_energy', 'negative_thoughts', 'hopelessness'],
  evidence_base: 'Beck et al., 1979; 40+ RCTs showing 60-70% response rate',
  
  sessions: [
    {
      number: 1,
      duration_target: 20,
      learning_objectives: [
        'Understand the cognitive model of depression',
        'Identify automatic negative thoughts',
        'Practice basic thought monitoring'
      ],
      
      conversation_flow: {
        opening: {
          voice: "Chào con, hôm nay chúng ta sẽ bắt đầu hành trình tìm hiểu về những suy nghĩ ảnh hưởng đến cảm xúc của con. Thầy muốn hỏi - gần đây khi con cảm thấy buồn, những suy nghĩ nào thường xuất hiện trong đầu con đầu tiên?",
          wait_for_response: true,
          response_analysis: {
            sentiment: true,
            keywords: ['buồn', 'tệ', 'vô dụng', 'mệt mỏi', 'hy vọng'],
            therapeutic_relevance: 0.8
          }
        },
        
        exercises: [
          {
            id: 'thought-monitoring',
            name: 'Thought Monitoring',
            type: 'thought_record',
            instructions: {
              voice: "Bây giờ chúng ta sẽ thực hành ghi lại suy nghĩ. Con hãy nghĩ về một tình huống gần đây khiến con cảm thấy buồn, và chúng ta sẽ cùng phân tích suy nghĩ đó.",
              visual: {
                type: 'thought_record_form',
                interactive: true
              }
            },
            data_collection: {
              prompts: [
                'Tình huống xảy ra khi nào?',
                'Suy nghĩ tự động là gì?',
                'Cảm xúc của con lúc đó là gì?',
                'Mức độ cảm xúc từ 0-10?'
              ],
              response_format: 'text',
              clinical_relevance: 'Identifies cognitive patterns and emotional triggers'
            }
          }
        ],
        
        homework: {
          voice: "Tuần này, mỗi khi con nhận thấy suy nghĩ tiêu cực, hãy ghi lại nó trong sổ tay. Chúng ta sẽ xem xét lại trong buổi tới. Con chỉ cần ghi lại 3 suy nghĩ mỗi ngày thôi.",
          description: "Monitor and record 3 automatic negative thoughts daily",
          reminder: {
            days: 7,
            time: '20:00',
            custom_message: "Đã ghi lại suy nghĩ của bạn hôm nay chưa?"
          },
          tracking: {
            completion_method: 'self_report',
            metrics: ['thought_frequency', 'emotion_intensity', 'situation_awareness']
          }
        },
        
        progress_check: {
          type: 'phq9',
          questions: [
            {
              id: 'phq9_q1',
              question: "Trong hai tuần qua, bạn thường cảm thấy ít hứng thú hoặc không vui vẻ trong làm việc như thế nào?",
              response_scale: '0-3',
              clinical_weight: 1.0
            },
            {
              id: 'phq9_q2',
              question: "Trong hai tuần qua, bạn thường cảm thấy chán nản, trầm cảm hoặc tuyệt vọng như thế nào?",
              response_scale: '0-3',
              clinical_weight: 1.0
            }
          ],
          scoring: {
            interpretation: {
              0: { severity: 'minimal', recommendation: 'Tiếp tục theo dõi' },
              1: { severity: 'mild', recommendation: 'Tăng cường thực hành' },
              2: { severity: 'moderate', recommendation: 'Cân nhắc tham vấn thêm' },
              3: { severity: 'severe', recommendation: 'Cần can thiệp chuyên nghiệp' }
            },
            clinical_threshold: 2
          }
        }
      }
    },
    
    {
      number: 2,
      duration_target: 25,
      learning_objectives: [
        'Identify cognitive distortions',
        'Practice cognitive restructuring',
        'Develop balanced thinking'
      ],
      
      conversation_flow: {
        opening: {
          voice: "Chào con, hôm nay chúng ta sẽ tìm hiểu về những 'sai lệch nhận thức' - những cách suy nghĩ méo mó khiến chúng ta cảm thấy tệ hơn. Con có nhận thấy mình có xu hướng suy nghĩ cực đoan không?",
          wait_for_response: true
        },
        
        exercises: [
          {
            id: 'cognitive-restructuring',
            name: 'Cognitive Restructuring',
            type: 'thought_record',
            instructions: {
              voice: "Chúng ta sẽ cùng nhau thực hành thay đổi suy nghĩ. Con hãy chọn một suy nghĩ tiêu cực từ tuần trước, và chúng ta sẽ tìm cách nhìn nhận nó một cách cân bằng hơn.",
              visual: {
                type: 'thought_record_form',
                interactive: true
              }
            }
          }
        ],
        
        homework: {
          voice: "Tuần này, khi con ghi lại suy nghĩ tiêu cực, hãy thử tìm một bằng chứng phản bác và một suy nghĩ thay thế cân bằng hơn.",
          description: "Practice cognitive restructuring with recorded thoughts",
          reminder: {
            days: 7,
            time: '20:00'
          },
          tracking: {
            completion_method: 'self_report',
            metrics: ['distortion_identification', 'alternative_thoughts', 'belief_change']
          }
        },
        
        progress_check: {
          type: 'custom',
          questions: [
            {
              id: 'homework_adherence',
              question: "Bạn đã hoàn thành bài tập về nhà trong tuần qua ở mức độ nào?",
              response_scale: '1-5',
              clinical_weight: 0.5
            }
          ],
          scoring: {
            interpretation: {
              1: { severity: 'poor', recommendation: 'Xem lại rào cản' },
              2: { severity: 'fair', recommendation: 'Tăng động lực' },
              3: { severity: 'good', recommendation: 'Tiếp tục tốt' },
              4: { severity: 'very_good', recommendation: 'Xuất sắc' },
              5: { severity: 'excellent', recommendation: 'Duy trì thói quen' }
            },
            clinical_threshold: 2
          }
        }
      }
    }
  ],
  
  completion_metrics: {
    completion_rate: 0,
    symptom_change: 0,
    user_satisfaction: 0,
    homework_adherence: 0,
    phq9_change: 0
  }
};

// ACT Anxiety Module
export const actAnxietyModule: TherapyModule = {
  id: 'act-anxiety-v1',
  name: 'ACT-Anxiety',
  description: 'Acceptance and Commitment Therapy for anxiety - accepting thoughts and committing to values-based action',
  target_symptoms: ['anxiety', 'worry', 'avoidance', 'panic'],
  evidence_base: 'Hayes et al., 1999; Meta-analysis showing d=0.68 for anxiety disorders',
  
  sessions: [
    {
      number: 1,
      duration_target: 20,
      learning_objectives: [
        'Understand creative hopelessness',
        'Practice present moment awareness',
        'Identify control strategies'
      ],
      
      conversation_flow: {
        opening: {
          voice: "Chào con, hôm nay chúng ta sẽ khám phá một cách tiếp cận khác với lo âu - thay vì chiến đấu với nó, chúng ta học cách chấp nhận nó. Con đã thử những cách nào để kiểm soát lo âu của mình?",
          wait_for_response: true
        },
        
        exercises: [
          {
            id: 'control-strategies',
            name: 'Control Strategies Assessment',
            type: 'values_clarification',
            instructions: {
              voice: "Hãy cùng xem xét những cách con đã cố gắng kiểm soát lo âu. Chúng có thực sự hiệu quả lâu dài không?",
              visual: {
                type: 'values_hierarchy',
                interactive: true
              }
            }
          }
        ],
        
        homework: {
          voice: "Tuần này, khi lo âu xuất hiện, thay vì cố gắng kiểm soát nó, hãy chỉ quan sát nó như một đám mây trôi qua bầu trời.",
          description: "Practice mindful observation of anxiety without control",
          reminder: {
            days: 7,
            time: '09:00'
          },
          tracking: {
            completion_method: 'self_report',
            metrics: ['observation_frequency', 'control_attempts', 'acceptance_willingness']
          }
        },
        
        progress_check: {
          type: 'gad7',
          questions: [
            {
              id: 'gad7_q1',
              question: "Trong hai tuần qua, bạn cảm thấy bồn chồn hoặc lo lắng đến mức nào?",
              response_scale: '0-3',
              clinical_weight: 1.0
            },
            {
              id: 'gad7_q2',
              question: "Trong hai tuần qua, bạn không thể ngừng hoặc kiểm soát lo lắng đến mức nào?",
              response_scale: '0-3',
              clinical_weight: 1.0
            }
          ],
          scoring: {
            interpretation: {
              0: { severity: 'minimal', recommendation: 'Tiếp tục thực hành' },
              1: { severity: 'mild', recommendation: 'Tăng cường chánh niệm' },
              2: { severity: 'moderate', recommendation: 'Cân nhắc kỹ năng thêm' },
              3: { severity: 'severe', recommendation: 'Cần hỗ trợ chuyên nghiệp' }
            },
            clinical_threshold: 2
          }
        }
      }
    }
  ],
  
  completion_metrics: {
    completion_rate: 0,
    symptom_change: 0,
    user_satisfaction: 0,
    homework_adherence: 0,
    gad7_change: 0
  }
};

// Mindfulness-Based Stress Reduction
export const mindfulnessStressModule: TherapyModule = {
  id: 'mbsr-stress-v1',
  name: 'Mindfulness-Stress',
  description: 'Mindfulness-Based Stress Reduction - developing present-moment awareness and stress resilience',
  target_symptoms: ['stress', 'overwhelm', 'burnout', 'emotional_dysregulation'],
  evidence_base: 'Kabat-Zinn, 1990; 30+ years of research showing 30-40% stress reduction',
  
  sessions: [
    {
      number: 1,
      duration_target: 15,
      learning_objectives: [
        'Understand mindfulness basics',
        'Practice body scan meditation',
        'Develop non-judgmental awareness'
      ],
      
      conversation_flow: {
        opening: {
          voice: "Chào con, hôm nay chúng ta sẽ học cách sống trọn vẹn hơn trong hiện tại, thay vì bị cuốn theo lo lắng về quá khứ hay tương lai. Con có cảm thấy mình thường xuyên 'mất hút' trong suy nghĩ không?",
          wait_for_response: true
        },
        
        exercises: [
          {
            id: 'body-scan',
            name: 'Body Scan Meditation',
            type: 'mindfulness',
            instructions: {
              voice: "Bây giờ, hãy nằm hoặc ngồi thoải mái. Chúng ta sẽ cùng nhau khám phá cơ thể mình từ chân đến đầu, chỉ quan sát cảm giác mà không phán xét.",
              visual: {
                type: 'breathing_circle',
                interactive: true
              }
            }
          }
        ],
        
        homework: {
          voice: "Tuần này, hãy thực hành quét thân 10 phút mỗi ngày. Có thể là buổi sáng khi thức dậy hoặc buổi tối trước khi ngủ.",
          description: "Daily 10-minute body scan practice",
          reminder: {
            days: 7,
            time: '07:00'
          },
          tracking: {
            completion_method: 'automated',
            metrics: ['practice_duration', 'session_consistency', 'mindfulness_rating']
          }
        },
        
        progress_check: {
          type: 'maas',
          questions: [
            {
              id: 'maas_q1',
              question: "Tôi có thể nhận thức được cảm xúc mà không bị chúng cuốn đi.",
              response_scale: '1-5',
              clinical_weight: 1.0
            },
            {
              id: 'maas_q2',
              question: "Tôi có thể tập trung vào hoạt động hiện tại.",
              response_scale: '1-5',
              clinical_weight: 1.0
            }
          ],
          scoring: {
            interpretation: {
              1: { severity: 'low', recommendation: 'Tăng thực hành' },
              2: { severity: 'below_average', recommendation: 'Cải thiện kỹ năng' },
              3: { severity: 'average', recommendation: 'Tiếp tục phát triển' },
              4: { severity: 'above_average', recommendation: 'Rất tốt' },
              5: { severity: 'high', recommendation: 'Duy trì xuất sắc' }
            },
            clinical_threshold: 2
          }
        }
      }
    }
  ],
  
  completion_metrics: {
    completion_rate: 0,
    symptom_change: 0,
    user_satisfaction: 0,
    homework_adherence: 0,
    maas_change: 0
  }
};

// Module Registry
export const therapyModules: Record<string, TherapyModule> = {
  'cbt-depression': cbtDepressionModule,
  'act-anxiety': actAnxietyModule,
  'mindfulness-stress': mindfulnessStressModule
};

// Module Selection Logic
export const recommendModule = (symptoms: string[], preferences: string[]): TherapyModule[] => {
  const recommendations: TherapyModule[] = [];
  
  // Symptom-based matching
  if (symptoms.includes('depression') || symptoms.includes('hopelessness')) {
    recommendations.push(cbtDepressionModule);
  }
  
  if (symptoms.includes('anxiety') || symptoms.includes('worry') || symptoms.includes('panic')) {
    recommendations.push(actAnxietyModule);
  }
  
  if (symptoms.includes('stress') || symptoms.includes('burnout')) {
    recommendations.push(mindfulnessStressModule);
  }
  
  // Preference-based filtering
  return recommendations.filter(module => 
    preferences.some(pref => 
      module.name.toLowerCase().includes(pref.toLowerCase())
    )
  );
};
