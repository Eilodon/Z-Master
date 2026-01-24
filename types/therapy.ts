// Conversational Therapy Modules System
// Evidence-based therapeutic approaches adapted for AI delivery

export type TherapyModality = 'CBT-Depression' | 'ACT-Anxiety' | 'DBT-Emotion-Regulation' | 'Mindfulness-Stress';

export interface TherapyModule {
  id: string;
  name: TherapyModality;
  description: string;
  target_symptoms: string[];
  evidence_base: string;  // Clinical evidence citation
  
  sessions: TherapySession[];
  completion_metrics: TherapyMetrics;
}

export interface TherapySession {
  number: number;
  duration_target: number;  // minutes
  learning_objectives: string[];
  
  conversation_flow: {
    opening: TherapyPrompt;
    exercises: Array<TherapyExercise>;
    homework: TherapyHomework;
    progress_check: TherapyAssessment;
  };
  
  prerequisites?: string[];  // Previous sessions needed
}

export interface TherapyPrompt {
  voice: string;
  wait_for_response: boolean;
  adaptive_followup?: (response: string) => TherapyPrompt | null;
  response_analysis?: {
    sentiment: boolean;
    keywords: string[];
    therapeutic_relevance: number;  // 0-1
  };
}

export interface TherapyExercise {
  id: string;
  name: string;
  type: 'thought_record' | 'behavioral_activation' | 'exposure' | 'mindfulness' | 'values_clarification';
  
  instructions: {
    voice: string;
    visual?: ExerciseVisual;
  };
  
  data_collection?: {
    prompts: string[];
    response_format: 'text' | 'scale' | 'multiple_choice';
    clinical_relevance: string;
  };
}

export interface ExerciseVisual {
  type: 'breathing_circle' | 'thought_record_form' | 'values_hierarchy' | 'exposure_ladder';
  interactive: boolean;
}

export interface TherapyHomework {
  voice: string;
  description: string;
  reminder: {
    days: number;
    time: string;
    custom_message?: string;
  };
  
  tracking: {
    completion_method: 'self_report' | 'automated' | 'therapist_review';
    metrics: string[];
  };
}

export interface TherapyAssessment {
  type: 'phq9' | 'gad7' | 'maas' | 'custom';
  questions: AssessmentQuestion[];
  scoring: AssessmentScoring;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  response_scale: '0-3' | '0-4' | '1-5' | 'likert';
  clinical_weight: number;  // Importance in scoring
}

export interface AssessmentScoring {
  interpretation: Record<number, { severity: string; recommendation: string }>;
  clinical_threshold: number;  // When to alert therapist
}

export interface TherapyMetrics {
  completion_rate: number;
  symptom_change: number;  // Pre/post effect size
  user_satisfaction: number;
  homework_adherence: number;
  
  // Clinical outcomes
  phq9_change?: number;    // Depression symptom change
  gad7_change?: number;    // Anxiety symptom change
  maas_change?: number;     // Mindfulness change
}

// Session state management
export interface TherapySessionState {
  current_module: TherapyModule | null;
  current_session: TherapySession | null;
  session_progress: SessionProgress;
  user_responses: UserResponse[];
  homework_status: HomeworkStatus[];
}

export interface SessionProgress {
  current_step: 'opening' | 'exercise' | 'homework' | 'assessment' | 'complete';
  step_progress: number;  // 0-1
  time_spent: number;     // minutes
  exercises_completed: string[];
}

export interface UserResponse {
  timestamp: number;
  exercise_id?: string;
  prompt_type: 'opening' | 'exercise' | 'assessment';
  response: string;
  sentiment?: number;  // -1 to 1
  clinical_markers?: string[];  // Therapeutic indicators
}

export interface HomeworkStatus {
  homework_id: string;
  assigned_date: number;
  due_date: number;
  completed: boolean;
  completion_date?: number;
  user_notes?: string;
}

// CBT-Specific Structures
export interface ThoughtRecord {
  id: string;
  timestamp: number;
  situation: string;
  automatic_thought: string;
  emotion: {
    type: string;
    intensity: number;  // 0-10
  };
  cognitive_distortion: CognitiveDistortion;
  alternative_thought: string;
  outcome: string;
}

export type CognitiveDistortion = 
  | 'all_or_nothing'
  | 'catastrophizing'
  | 'overgeneralization'
  | 'mental_filter'
  | 'disqualifying_positive'
  | 'jumping_conclusions'
  | 'magnification_minimization'
  | 'emotional_reasoning'
  | 'should_statements'
  | 'labeling'
  | 'personalization';

// ACT-Specific Structures
export interface ValuesClarification {
  id: string;
  timestamp: number;
  life_domains: {
    domain: string;
    importance: number;  // 0-10
    current_satisfaction: number;  // 0-10
    actions: string[];
  };
  core_values: string[];
  values_congruence: number;  // 0-1
}

export interface AcceptanceExercise {
  id: string;
  timestamp: number;
  trigger: string;
  avoidance_behavior: string;
  willingness_rating: number;  // 0-10
  acceptance_rating: number;   // 0-10
  committed_action: string;
}

// DBT-Specific Structures
export interface EmotionRegulationSkill {
  id: string;
  timestamp: number;
  skill_type: 'opposite_action' | 'check_the_facts' | 'pros_cons' | 'wise_mind';
  triggering_event: string;
  emotion_intensity_before: number;  // 0-10
  skill_application: string;
  emotion_intensity_after: number;   // 0-10
  effectiveness: number;  // 0-10
}

export interface DistressToleranceRecord {
  id: string;
  timestamp: number;
  crisis_trigger: string;
  skill_used: 'tip' | 'accepts' | 'improve' | 'self_soothe' | 'distract';
  effectiveness: number;  // 0-10
  duration: number;  // minutes
}
