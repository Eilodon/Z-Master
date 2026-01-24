// Digital Phenotyping System
// Privacy-first passive and active behavioral monitoring for mental health insights

export interface DigitalPhenotype {
  user_id: string;
  timestamp: number;
  
  // Passive behavioral signals (with explicit consent)
  typing_dynamics?: TypingDynamics;
  voice_biomarkers?: VoiceBiomarkers;
  behavioral_patterns?: BehavioralPatterns;
  device_usage?: DeviceUsage;
  
  // Active self-reported data
  daily_mood?: DailyMood;
  sleep_patterns?: SleepPatterns;
  social_engagement?: SocialEngagement;
  
  // Privacy and consent metadata
  consent_version: string;
  data_retention_days: number;
  sharing_preferences: SharingPreferences;
}

export interface TypingDynamics {
  // Typing speed and rhythm (text mode only)
  speed_wpm: number;           // Average words per minute
  speed_variance: number;      // Variability in typing speed
  
  // Error patterns
  error_rate: number;          // Percentage of corrections needed
  correction_latency: number; // Time to fix errors (ms)
  
  // Pausing patterns
  pause_duration_avg: number;  // Average pause between words (ms)
  pause_duration_variance: number; // Variability in pauses
  
  // Rhythm metrics
  keystroke_interval_std: number; // Standard deviation of key intervals
  typing_fluency: number;      // Smoothness of typing (0-1)
  
  // Clinical indicators
  rumination_indicators: {
    long_pauses: number;       // Pauses > 2 seconds
    deletions_per_minute: number; // High deletion rate
    typing_bursts: number;     // Erratic typing patterns
  };
}

export interface VoiceBiomarkers {
  // Fundamental frequency (pitch) analysis
  pitch_mean: number;          // Mean fundamental frequency (Hz)
  pitch_variance: number;      // Pitch variability (std dev)
  pitch_range: number;         // Min-max pitch range
  
  // Speech timing
  speech_rate: number;         // Words per minute
  pause_ratio: number;        // Silence vs speech ratio
  pause_duration_avg: number;  // Average pause duration (ms)
  
  // Energy and amplitude
  energy_mean: number;         // Average loudness
  energy_variance: number;     // Loudness variability
  
  // Voice quality
  jitter: number;              // Pitch instability
  shimmer: number;             // Amplitude instability
  harmonics_to_noise_ratio: number; // Voice quality measure
  
  // Emotional prosody
  emotional_tone: {
    arousal: number;           // Energy/arousal level (0-1)
    valence: number;          // Positive/negative valence (-1 to 1)
    stress_markers: number;   // Vocal stress indicators (0-1)
  };
  
  // Clinical indicators
  depression_markers: {
    pitch_flattening: number;  // Reduced pitch variability
    slowed_speech: number;     // Reduced speech rate
    reduced_energy: number;    // Lower vocal energy
    monotony: number;         // Monotone speech pattern
  };
  
  anxiety_markers: {
    pitch_elevation: number;   // Higher average pitch
    speech_acceleration: number; // Faster speech when anxious
    voice_tremor: number;     // Voice instability
    breath_irregularity: number; // Irregular breathing patterns
  };
}

export interface BehavioralPatterns {
  // App engagement patterns
  session_frequency: number;   // Sessions per day
  session_duration_avg: number; // Average session length (minutes)
  session_duration_variance: number; // Variability in session length
  
  // Time-based patterns
  first_open_time: number;     // Hour of day when app first opened
  last_open_time: number;      // Hour of day when app last opened
  peak_usage_hours: number[];  // Hours with highest usage
  
  // Circadian patterns
  sleep_disruption_indicators: {
    night_openings: number;    // App opened between 12am-6am
    early_morning_usage: number; // Usage before 6am
    irregular_schedule: number; // Variance in daily patterns
  };
  
  // Content interaction patterns
  practice_completion_rate: number; // % of assigned practices completed
  feature_usage: {
    voice_sessions: number;    // Voice vs text preference
    meditation_usage: number;  // Meditation feature usage
    journaling_frequency: number; // Journal entry frequency
    breathing_exercises: number; // Breathing exercise usage
  };
  
  // Social patterns (if community features enabled)
  social_engagement: {
    peer_connections: number;  // Number of peer interactions
    group_participation: number; // Community group involvement
    support_given: number;     // Messages of support sent
    support_received: number;  // Messages of support received
  };
  
  // Avoidance patterns
  behavioral_avoidance: {
    session_abandonment: number; // Sessions started but not completed
    difficult_topic_avoidance: number; // Skipping challenging content
    help_seeking_delay: number; // Time before seeking crisis support
  };
}

export interface DeviceUsage {
  // Mobility patterns (if location consent given)
  mobility_metrics?: {
    location_variance: number;  // GPS coordinate changes
    activity_level: number;     // Physical activity (from device sensors)
    routine_consistency: number; // Daily pattern consistency
  };
  
  // Communication patterns
  communication_metrics?: {
    incoming_calls: number;    // Call frequency
    outgoing_calls: number;
    message_frequency: number; // Text/messaging frequency
    response_latency: number;  // Average response time
  };
  
  // Digital wellbeing
  screen_time_metrics?: {
    total_screen_time: number;  // Daily screen time (minutes)
    social_media_time: number;  // Social media usage
    app_switching: number;     // Number of app changes per session
  };
}

export interface DailyMood {
  date: string;               // YYYY-MM-DD format
  mood_rating: number;         // Self-reported mood (0-10)
  energy_level: number;        // Energy level (0-10)
  stress_level: number;        // Stress level (0-10)
  sleep_quality: number;       // Sleep quality (0-10)
  
  // Contextual factors
  mood_triggers: string[];     // Self-reported triggers
  social_interactions: number; // Number of meaningful social interactions
  physical_activity: number;  // Minutes of physical activity
  
  // Emotional granularity
  primary_emotions: {
    joy: number;              // Intensity (0-1)
    sadness: number;
    anger: number;
    fear: number;
    disgust: number;
    surprise: number;
  };
  
  // Coping mechanisms
  coping_strategies_used: string[]; // Strategies employed today
  coping_effectiveness: number;     // Perceived effectiveness (0-10)
}

export interface SleepPatterns {
  date: string;
  bedtime: number;             // Unix timestamp
  wake_time: number;           // Unix timestamp
  sleep_duration: number;      // Total sleep in hours
  sleep_efficiency: number;    // % of time in bed actually asleep
  
  // Sleep quality indicators
  night_awakenings: number;    // Number of times woke up
  sleep_latency: number;       // Time to fall asleep (minutes)
  wake_after_sleep_onset: number; // Time awake after initial sleep
  
  // Subjective quality
  sleep_quality_rating: number; // Self-rated quality (0-10)
  restfulness_rating: number;   // How rested upon waking (0-10)
  
  // Sleep regularity
  sleep_consistency: number;   // Consistency with usual schedule
  circadian_alignment: number; // Alignment with natural circadian rhythm
}

export interface SocialEngagement {
  date: string;
  meaningful_interactions: number; // Number of deep social connections
  social_support_received: number; // Perceived support level (0-10)
  social_support_given: number;    // Support provided to others (0-10)
  loneliness_rating: number;       // Felt loneliness (0-10)
  social_satisfaction: number;    // Social life satisfaction (0-10)
  
  // Interaction quality
  interaction_depth: {
    superficial: number;      // Surface-level interactions
    meaningful: number;       // Deep, meaningful conversations
    conflict: number;         // Conflictual interactions
    supportive: number;      // Supportive interactions
  };
  
  // Social media patterns (if consented)
  social_media_usage?: {
    time_spent: number;       // Minutes spent on social media
    passive_consumption: number; // Passive scrolling vs active engagement
    meaningful_connections: number; // Meaningful online interactions
    comparison_tendencies: number;  // Social comparison behaviors
  };
}

export interface SharingPreferences {
  // Research participation
  share_for_research: boolean;
  research_identification: 'anonymous' | 'pseudonymous' | 'identified';
  
  // Clinical sharing
  share_with_therapist: boolean;
  therapist_data_detail: 'summaries' | 'patterns' | 'raw_data';
  
  // Commercial sharing (never enabled by default)
  share_commercial: boolean;  // Always false unless explicitly enabled
  
  // Data retention preferences
  auto_delete_after_days: number;
  export_format: 'json' | 'pdf' | 'csv';
}

export interface RiskAssessment {
  timestamp: number;
  risk_score: number;         // Overall risk level (0-1)
  confidence: number;         // Model confidence (0-1)
  
  // Risk dimensions
  depression_risk: {
    score: number;            // Depression risk score (0-1)
    indicators: string[];     // Specific indicators
    trend: 'improving' | 'stable' | 'worsening';
  };
  
  anxiety_risk: {
    score: number;            // Anxiety risk score (0-1)
    indicators: string[];     // Specific indicators
    trend: 'improving' | 'stable' | 'worsening';
  };
  
  crisis_risk: {
    score: number;            // Immediate crisis risk (0-1)
    indicators: string[];     // Crisis indicators
    urgency: 'low' | 'medium' | 'high' | 'immediate';
  };
  
  // Protective factors
  protective_factors: {
    social_support: number;   // Strength of social support (0-1)
    coping_skills: number;    // Effectiveness of coping strategies (0-1)
    treatment_engagement: number; // Engagement with treatment (0-1)
    routine_stability: number; // Daily routine consistency (0-1)
  };
  
  // Recommendations
  recommendations: RiskRecommendation[];
}

export interface RiskRecommendation {
  type: 'immediate' | 'preventive' | 'supportive' | 'resource';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  action_required: boolean;
  resources?: string[];       // Links to resources or support
}

export interface PhenotypingConsent {
  version: string;
  timestamp: number;
  
  // Granular consent choices
  consent_choices: {
    typing_analysis: boolean;
    voice_analysis: boolean;
    usage_patterns: boolean;
    device_sensors: boolean;
    location_data: boolean;
    communication_data: boolean;
  };
  
  // Data sharing preferences
  sharing_preferences: SharingPreferences;
  
  // Understanding confirmation
  purpose_understood: boolean;
  risks_understood: boolean;
  withdrawal_rights_understood: boolean;
  
  // Consent metadata
  ip_address_hash?: string;   // For audit purposes only
  user_agent_hash?: string;   // For audit purposes only
}

export interface PhenotypingInsights {
  user_id: string;
  generated_at: number;
  insight_period: {
    start_date: string;
    end_date: string;
  };
  
  // Pattern insights
  behavioral_patterns: {
    daily_routines: RoutineInsight[];
    stress_triggers: TriggerInsight[];
    coping_effectiveness: CopingInsight[];
    social_patterns: SocialInsight[];
  };
  
  // Progress tracking
  progress_metrics: {
    symptom_trends: SymptomTrend[];
    treatment_response: TreatmentResponse[];
    goal_progress: GoalProgress[];
  };
  
  // Predictive insights
  predictions: {
    relapse_risk: RelapsePrediction[];
    optimal_intervention_times: InterventionTiming[];
    recommended_adjustments: TreatmentAdjustment[];
  };
  
  // Clinical summaries
  clinical_summary: {
    current_state: string;
    trajectory: string;
    concerns: string[];
    strengths: string[];
    recommendations: string[];
  };
}

export interface RoutineInsight {
  type: 'sleep' | 'activity' | 'social' | 'treatment';
  consistency_score: number;   // How consistent the routine is (0-1)
  optimal_times: number[];     // Best times for activities
  disruptions: string[];       // Recent disruptions
  recommendations: string[];
}

export interface TriggerInsight {
  trigger: string;
  frequency: number;           // How often it occurs
  intensity: number;           // Average impact intensity (0-1)
  context: string[];           // When/where it occurs
  coping_strategies: string[]; // What helps
}

export interface CopingInsight {
  strategy: string;
  effectiveness: number;       // Self-reported effectiveness (0-1)
  usage_frequency: number;     // How often used
  situational_fit: string[];   // Best situations for this strategy
}

export interface SocialInsight {
  interaction_type: string;
  frequency: number;
  impact_on_mood: number;      // Average mood impact (-1 to 1)
  quality_rating: number;      // Interaction quality (0-1)
}

export interface SymptomTrend {
  symptom: string;
  trend: 'improving' | 'stable' | 'worsening';
  rate_of_change: number;      // Rate of symptom change
  correlation_factors: string[]; // What correlates with changes
}

export interface TreatmentResponse {
  intervention: string;
  response_score: number;      // Effectiveness (0-1)
  time_to_effect: number;      // Days until improvement seen
  durability: number;          // How long effects last
  side_effects: string[];      // Any negative impacts
}

export interface GoalProgress {
  goal: string;
  current_progress: number;    // Progress toward goal (0-1)
  milestones_achieved: string[];
  barriers_identified: string[];
  next_steps: string[];
}

export interface RelapsePrediction {
  risk_level: number;          // Relapse risk (0-1)
  time_horizon: number;         // Days until likely relapse
  warning_signs: string[];     // Early indicators
  preventive_actions: string[]; // Recommended prevention
}

export interface InterventionTiming {
  optimal_time: string;        // Best time for intervention
  intervention_type: string;
  expected_effectiveness: number; // Predicted effectiveness (0-1)
  preparation_needed: string[];
}

export interface TreatmentAdjustment {
  current_approach: string;
  recommended_change: string;
  rationale: string;
  expected_benefit: string;
  implementation_steps: string[];
}
