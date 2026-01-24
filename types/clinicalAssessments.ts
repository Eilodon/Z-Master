// Clinical Assessment Scales
// PHQ-9, GAD-7, and MAAS with proper scoring and interpretation

// PHQ-9: Depression Assessment
export interface PHQ9Response {
  q1_little_interest: number;     // 0-3: Little interest/pleasure in doing things
  q2_feeling_down: number;       // 0-3: Feeling down, depressed, or hopeless
  q3_sleep_issues: number;       // 0-3: Trouble falling/staying asleep or sleeping too much
  q4_fatigue: number;            // 0-3: Feeling tired or having little energy
  q5_appetite: number;           // 0-3: Poor appetite or overeating
  q6_self_worth: number;         // 0-3: Feeling bad about yourself/failure
  q7_concentration: number;      // 0-3: Trouble concentrating
  q8_psychomotor: number;        // 0-3: Moving/speaking slowly or restlessness
  q9_self_harm: number;          // 0-3: Thoughts of self-harm
}

export interface PHQ9Result {
  id: string;
  timestamp: number;
  responses: PHQ9Response;
  depression_score: number;      // 0-27
  total_score: number;           // Same as depression_score for PHQ-9
  severity: 'minimal' | 'mild' | 'moderate' | 'severe';
  interpretation: string;
  
  // Clinical flags
  self_harm_risk: boolean;       // q9 >= 2
  needs_immediate_attention: boolean; // q9 >= 2 or severe symptoms
  
  // Progress tracking
  change_from_previous?: number; // Score change from last assessment
  trend?: 'improving' | 'stable' | 'worsening';
}

// GAD-7: Anxiety Assessment
export interface GAD7Response {
  q1_nervous: number;            // 0-3: Feeling nervous, anxious, or on edge
  q2_cant_control_worry: number; // 0-3: Not being able to stop or control worrying
  q3_worrying_too_much: number;  // 0-3: Worrying too much about different things
  q4_trouble_relaxing: number;   // 0-3: Trouble relaxing
  q5_restless: number;           // 0-3: Being so restless that it's hard to sit still
  q6_irritable: number;          // 0-3: Becoming easily annoyed or irritable
  q7_afraid: number;            // 0-3: Feeling afraid, as if something awful might happen
}

export interface GAD7Result {
  id: string;
  timestamp: number;
  responses: GAD7Response;
  anxiety_score: number;         // 0-21
  total_score: number;           // Same as anxiety_score for GAD-7
  severity: 'minimal' | 'mild' | 'moderate' | 'severe';
  interpretation: string;
  
  // Clinical flags
  panic_indicators: boolean;     // Multiple high scores on physical symptoms
  needs_immediate_attention: boolean; // Severe symptoms
  
  // Progress tracking
  change_from_previous?: number; // Score change from last assessment
  trend?: 'improving' | 'stable' | 'worsening';
}

// MAAS: Mindful Attention Awareness Scale
export interface MAASResponse {
  q1_emotion_awareness: number;          // 1-6 (reverse scored)
  q2_carelessness: number;               // 1-6 (reverse scored)
  q3_present_focus: number;              // 1-6 (reverse scored)
  q4_walk_attention: number;              // 1-6 (reverse scored)
  q5_body_awareness: number;             // 1-6 (reverse scored)
  q6_name_memory: number;                // 1-6 (reverse scored)
  q7_automatic_pilot: number;           // 1-6 (reverse scored)
  q8_rush_activities: number;            // 1-6 (reverse scored)
  q9_goal_focus: number;                 // 1-6 (reverse scored)
  q10_automatic_tasks: number;           // 1-6 (reverse scored)
  q11_split_attention: number;           // 1-6 (reverse scored)
  q12_driving_automatic: number;         // 1-6 (reverse scored)
  q13_future_past_thoughts: number;      // 1-6 (reverse scored)
  q14_unaware_actions: number;           // 1-6 (reverse scored)
  q15_unaware_eating: number;            // 1-6 (reverse scored)
}

export interface MAASResult {
  id: string;
  timestamp: number;
  responses: MAASResponse;
  mindful_score: number;         // 15-90 (reverse scored, higher = more mindful)
  average_score: number;         // 1-6 average
  interpretation: string;
  
  // Mindfulness levels
  mindfulness_level: 'low' | 'moderate' | 'high';
  
  // Progress tracking
  change_from_previous?: number; // Score change from last assessment
  trend?: 'improving' | 'stable' | 'worsening';
}

// Combined Assessment Results
export interface CombinedAssessmentResult {
  timestamp: number;
  phq9?: PHQ9Result;
  gad7?: GAD7Result;
  maas?: MAASResult;
  
  // Overall clinical picture
  overall_severity: 'minimal' | 'mild' | 'moderate' | 'severe';
  primary_concern: 'depression' | 'anxiety' | 'both' | 'mindfulness' | 'none';
  treatment_recommendations: string[];
  
  // Risk assessment
  risk_level: 'low' | 'medium' | 'high';
  urgent_concerns: string[];
  
  // Progress indicators
  overall_trend: 'improving' | 'stable' | 'worsening';
  engagement_level: 'high' | 'medium' | 'low';
}

// Assessment History and Tracking
export interface AssessmentHistory {
  user_id: string;
  assessments: {
    phq9_history: PHQ9Result[];
    gad7_history: GAD7Result[];
    maas_history: MAASResult[];
  };
  
  // Longitudinal trends
  trends: {
    depression_trend: TrendData;
    anxiety_trend: TrendData;
    mindfulness_trend: TrendData;
  };
  
  // Clinical milestones
  milestones: AssessmentMilestone[];
  
  // Treatment response
  treatment_response: {
    baseline_scores: BaselineScores;
    current_scores: CurrentScores;
    percent_improvement: number;
    response_category: 'remission' | 'response' | 'partial_response' | 'no_response';
  };
}

export interface TrendData {
  slope: number;               // Rate of change (negative = improving for depression/anxiety)
  correlation: number;          // Strength of trend (0-1)
  significant_change: boolean; // Statistically significant change
  time_to_improvement: number;  // Days until meaningful improvement
}

export interface AssessmentMilestone {
  type: 'first_assessment' | 'clinical_improvement' | 'remission' | 'relapse' | 'consistent_engagement';
  achieved_at: number;
  details: string;
}

export interface BaselineScores {
  phq9: number;
  gad7: number;
  maas: number;
  date: number;
}

export interface CurrentScores {
  phq9: number;
  gad7: number;
  maas: number;
  date: number;
}

// Assessment Configuration
export interface AssessmentConfig {
  // Frequency settings
  phq9_frequency: 'weekly' | 'biweekly' | 'monthly' | 'as_needed';
  gad7_frequency: 'weekly' | 'biweekly' | 'monthly' | 'as_needed';
  maas_frequency: 'monthly' | 'quarterly' | 'as_needed';
  
  // Reminder settings
  reminders_enabled: boolean;
  reminder_time: string;        // HH:mm format
  reminder_days: number[];      // 0-6 (Sunday-Saturday)
  
  // Clinical thresholds
  alert_thresholds: {
    phq9_severe: number;        // Default: 15
    gad7_severe: number;        // Default: 15
    self_harm_flag: number;     // Default: 2 (on PHQ-9 item 9)
  };
  
  // Progress tracking
  minimum_assessments_for_trend: number; // Default: 3
  trend_analysis_period: number;          // Days to consider for trend analysis
}

// Assessment Validation
export interface AssessmentValidation {
  is_valid: boolean;
  completion_time: number;      // Seconds taken to complete
  response_consistency: number; // 0-1, checks for random responding
  attention_check_passed: boolean;
  validity_flags: ValidityFlag[];
}

export interface ValidityFlag {
  type: 'speeding' | 'inconsistent' | 'attention_failed' | 'extreme_responses';
  severity: 'warning' | 'invalid';
  description: string;
}

// Export types for external use
export type AssessmentType = 'phq9' | 'gad7' | 'maas';
export type AssessmentSeverity = 'minimal' | 'mild' | 'moderate' | 'severe';
export type MindfulnessLevel = 'low' | 'moderate' | 'high';
