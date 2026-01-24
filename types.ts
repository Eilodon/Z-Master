

// Clinical mindfulness metrics (replacing quantum pseudoscience)
export interface MindfulnessMetrics {
  attention_stability: number;      // Sustained attention (0-1, replaces "coherence")
  emotional_regulation: number;     // Emotion regulation capacity (0-1, replaces "entanglement")
  present_moment_awareness: number; // Present-focused attention (0-1, replaces "presence")
}

// Psychological assessment dimensions
export interface PsychologicalDimensions {
  contextual: number; // Context awareness
  emotional: number;  // Emotional depth
  cultural: number;   // Cultural connection
  wisdom: number;     // Insight/wisdom
  acceptance: number; // Acceptance of impermanence (replaces "uncertainty")
  relational: number; // Interbeing/connectedness
}

// Buddhist-informed awareness stages (clinically valid construct)
export type AwarenessStage = 'reflexive' | 'aware' | 'mindful' | 'contemplative';

export interface ZenResponse {
  emotion: 'anxious' | 'sad' | 'joyful' | 'calm' | 'neutral' | 'stressed' | 'confused' | 'lonely' | 'seeking';
  wisdom_text: string;
  wisdom_english?: string;
  user_transcript: string;
  breathing: '4-7-8' | 'box-breathing' | 'coherent-breathing' | 'none' | null;
  confidence: number;
  reasoning_steps: string[];
  mindfulness_metrics: MindfulnessMetrics;  // Clinical metrics replacing quantum pseudoscience
  awareness_stage: AwarenessStage;
  psychological_dimensions: PsychologicalDimensions;  // Psychological assessment replacing consciousness
  // Extended soundscapes from PDF ideas
  ambient_sound?: 'rain' | 'bowl' | 'bell' | 'silence' | 'mekong' | 'monsoon';
  voice_tone?: 'calm_warm' | 'grounding_firm' | 'uplifting_bright' | 'gentle_soft';
  action?: 'emergency_protocol';
}

export interface ConversationEntry {
  id: string;
  timestamp: number;
  emotion: string;
  mindfulness_metrics: MindfulnessMetrics;  // Updated from quantum_metrics
  stage?: AwarenessStage;
  psychological_dimensions?: PsychologicalDimensions;  // Updated from consciousness_dimensions
}

export type AppState = 'idle' | 'listening' | 'processing' | 'speaking';
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'offline';

export type CulturalMode = 'VN' | 'Universal';
export type Language = 'vi' | 'en';
export type InputMode = 'voice' | 'text';

export interface VisionAnalysis {
  buddhist_score: number;
  modern_score: number;
  natural_score: number;
  detected_items: string[];
  mode: CulturalMode;
}

// --- CLINICAL ASSESSMENTS ---

// PHQ-4: Ultra-brief screening for depression and anxiety
export interface PHQ4Response {
  q1_little_interest: number;     // 0-3: Little interest/pleasure in doing things
  q2_feeling_down: number;         // 0-3: Feeling down, depressed, or hopeless
  q3_nervous: number;              // 0-3: Feeling nervous, anxious, or on edge
  q4_worry: number;                // 0-3: Not being able to stop or control worrying
}

export interface PHQ4Result {
  id: string;
  timestamp: number;
  responses: PHQ4Response;
  depression_score: number;        // q1 + q2 (0-6)
  anxiety_score: number;           // q3 + q4 (0-6)
  total_score: number;             // 0-12
  severity: 'minimal' | 'mild' | 'moderate' | 'severe';
  interpretation: string;
}

// Conversation memory for longitudinal tracking
export interface ConversationMemory {
  user_id: string;
  narrative: {
    key_events: Array<{ event: string; emotion: string; timestamp: number }>;
    recurring_themes: string[];    // e.g., "work stress", "family conflict"
    progress_markers: string[];    // e.g., "started exercising", "had difficult conversation"
  };
  emotional_baseline: {
    baseline_mood: number;         // Average mood score (0-10)
    current_deviation: number;     // Current deviation from baseline
    triggers: Map<string, number>; // "Monday mornings" → stress spike
  };
  clinical_tracking: {
    phq4_scores: PHQ4Result[];
    last_assessment: number;       // Timestamp
    trend: 'improving' | 'stable' | 'worsening';
  };
}

// Engagement & Gamification
export interface StreakData {
  user_id: string;
  current_streak: number;          // Current consecutive days
  longest_streak: number;          // All-time longest streak
  last_check_in: number;           // Timestamp of last activity
  total_check_ins: number;         // Total number of check-ins
  milestones: Array<{
    type: 'streak_3' | 'streak_7' | 'streak_30' | 'streak_100' | 'total_10' | 'total_50' | 'total_100';
    achieved_at: number;
    celebrated: boolean;
  }>;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}