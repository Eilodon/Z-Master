// Peer Support Communities System
// Anonymous, moderated peer support with voice circles

export interface Community {
  id: string;
  name: string;
  description: string;
  topic: CommunityTopic;
  language: Language;
  cultural_mode: CulturalMode;
  
  // Safety and moderation
  moderation: CommunityModeration;
  
  // Activity structure
  activities: CommunityActivities;
  
  // Community metrics
  metrics: CommunityMetrics;
  
  // Access control
  access_type: 'open' | 'screened' | 'referral_required';
  member_capacity: number;
  
  // Scheduling
  timezone_preference: string;
  active_hours: {
    start: string; // HH:mm
    end: string;   // HH:mm
  };
}

export type CommunityTopic = 
  | 'Depression' 
  | 'Anxiety' 
  | 'Grief' 
  | 'Work-Stress' 
  | 'Relationships'
  | 'Trauma'
  | 'Addiction'
  | 'Chronic-Illness'
  | 'Caregiver-Stress'
  | 'Loneliness';

export type Language = 'vi' | 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'ko';
export type CulturalMode = 'VN' | 'Universal' | 'JP' | 'KR' | 'IN' | 'ID';

export interface CommunityModeration {
  // AI moderation
  ai_content_filter: boolean;
  ai_crisis_detection: boolean;
  toxicity_threshold: number; // 0-1
  
  // Human moderation
  human_moderators: string[]; // Moderator IDs
  moderator_guidelines: string[];
  
  // Community rules
  community_rules: CommunityRule[];
  reporting_system: ReportingSystem;
  
  // Safety protocols
  crisis_protocol: CrisisProtocol;
  conflict_resolution: ConflictResolution;
}

export interface CommunityRule {
  id: string;
  title: string;
  description: string;
  severity: 'warning' | 'temporary_ban' | 'permanent_ban';
  examples: string[];
}

export interface ReportingSystem {
  report_types: ('harassment' | 'spam' | 'self_harm' | 'inappropriate_content' | 'misinformation')[];
  auto_action_threshold: number; // Reports before auto-action
  review_timeframe: number; // Hours to review reports
}

export interface CrisisProtocol {
  if_someone_in_crisis: {
    ai_detection: boolean;
    private_messaging: boolean;
    crisis_resources: CrisisResource[];
    emergency_escalation: boolean;
  };
  
  if_conflict: {
    ai_moderation: boolean;
    human_mediator: boolean;
    temporary_muting: boolean;
    guidelines_reminder: boolean;
  };
}

export interface CrisisResource {
  type: 'hotline' | 'text_line' | 'website' | 'emergency_services';
  title: string;
  contact: string;
  availability: string;
  languages: Language[];
}

export interface ConflictResolution {
  mediation_steps: string[];
  time_limits: {
    initial_response: number; // minutes
    resolution: number;       // hours
  };
  escalation_path: string[];
}

export interface CommunityActivities {
  // Daily activities
  daily_check_ins: {
    enabled: boolean;
    prompt_time: string; // HH:mm
    questions: string[];
    privacy_level: 'anonymous' | 'pseudonymous' | 'identified';
  };
  
  // Voice circles
  voice_circles: VoiceCircleSettings;
  
  // Shared practices
  shared_practices: {
    enabled: boolean;
    types: ('meditation' | 'breathing' | 'gratitude' | 'journaling')[];
    scheduling: 'daily' | 'weekly' | 'as_needed';
  };
  
  // Peer support
  peer_matching: {
    enabled: boolean;
    algorithm: 'symptom_based' | 'personality_based' | 'availability_based';
    match_frequency: 'daily' | 'weekly';
  };
}

export interface VoiceCircleSettings {
  enabled: boolean;
  schedule: VoiceCircleSchedule[];
  format: VoiceCircleFormat;
  participation: VoiceCircleParticipation;
}

export interface VoiceCircleSchedule {
  id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  time: string; // HH:mm
  duration: number; // minutes
  max_participants: number;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  focus_topic?: string;
}

export interface VoiceCircleFormat {
  opening: {
    facilitator: 'ai' | 'human_peer' | 'professional';
    greeting_meditation: number; // minutes
    orientation: number; // minutes
  };
  
  sharing: {
    each_person_time: number; // minutes
    sharing_guidelines: string[];
    response_guidelines: string[];
  };
  
  reflection: {
    facilitator_synthesis: number; // minutes
    group_practice: number; // minutes
    shared_insights: number; // minutes
  };
  
  closing: {
    gratitude_round: number; // minutes
    homework_assignment: number; // minutes
    next_steps: number; // minutes
  };
}

export interface VoiceCircleParticipation {
  requirements: {
    minimum_sessions_attended: number;
    community_standing_days: number;
    completed_orientation: boolean;
  };
  
  etiquette: {
    arrive_on_time: boolean;
    stay_full_duration: boolean;
    video_required: boolean;
    background_blur_allowed: boolean;
  };
  
  accessibility: {
    closed_captioning: boolean;
    transcript_available: boolean;
    recording_available: boolean;
    alternative_formats: string[];
  };
}

export interface CommunityMetrics {
  member_count: number;
  active_members: number;
  retention_rate: number;
  engagement_score: number;
  
  // Safety metrics
  safety_incidents: number;
  response_time_average: number; // minutes
  member_satisfaction: number; // 0-1
  
  // Outcomes
  peer_support_quality: number; // 0-1
  connection_strength: number;   // 0-1
  recovery_indicators: number;  // 0-1
}

export interface CommunityMember {
  id: string;
  profile: MemberProfile;
  preferences: MemberPreferences;
  participation: MemberParticipation;
  safety_flags: SafetyFlag[];
  join_date: number;
  last_active: number;
}

export interface MemberProfile {
  // Anonymous identifier
  display_name: string;
  avatar_type: 'abstract' | 'nature' | 'geometric' | 'color';
  bio?: string;
  
  // Demographics (optional, for matching only)
  age_range?: '18-25' | '26-35' | '36-45' | '46-55' | '56+';
  timezone?: string;
  languages: Language[];
  
  // Clinical info (for matching only)
  primary_concerns: CommunityTopic[];
  secondary_concerns?: CommunityTopic[];
  experience_level: 'beginner' | 'intermediate' | 'advanced'; // With peer support
  
  // Personality for matching
  personality_traits: {
    introversion_extraversion: number; // 0-1
    communication_style: 'direct' | 'gentle' | 'analytical' | 'expressive';
    support_preference: 'emotional' | 'practical' | 'spiritual' | 'informational';
  };
}

export interface MemberPreferences {
  // Communication preferences
  preferred_communication: 'voice' | 'text' | 'both';
  voice_circle_preference: 'participant' | 'observer' | 'facilitator';
  
  // Privacy preferences
  anonymity_level: 'complete' | 'pseudonymous' | 'partial';
  data_sharing: 'none' | 'aggregated_only' | 'research_opt_in';
  
  // Matching preferences
  matching_preferences: {
    age_similarity: boolean;
    gender_similarity: boolean;
    concern_similarity: boolean;
    personality_compatibility: boolean;
    timezone_compatibility: boolean;
  };
  
  // Content preferences
  content_filters: {
    sensitive_topics: CommunityTopic[];
    trigger_warnings: boolean;
    content_warnings: boolean;
  };
  
  // Notification preferences
  notifications: {
    voice_circles: boolean;
    messages: boolean;
    community_updates: boolean;
    safety_alerts: boolean;
  };
}

export interface MemberParticipation {
  // Activity history
  voice_circles_attended: number;
  voice_circles_facilitated: number;
  messages_sent: number;
  support_interactions: number;
  
  // Quality indicators
  attendance_rate: number; // 0-1
  participation_quality: number; // 0-1 (peer ratings)
  helpfulness_score: number; // 0-1 (peer ratings)
  
  // Recent activity
  last_voice_circle: number;
  last_message: number;
  current_streak: number; // Days of activity
  
  // Roles and achievements
  roles: CommunityRole[];
  achievements: Achievement[];
}

export type CommunityRole = 
  | 'member'
  | 'facilitator_in_training'
  | 'facilitator'
  | 'moderator'
  | 'community_guide';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earned_at: number;
  category: 'participation' | 'support' | 'leadership' | 'safety';
}

export interface SafetyFlag {
  id: string;
  type: 'warning' | 'suspension' | 'investigation';
  reason: string;
  reported_by: string; // Member ID or 'ai_system'
  created_at: number;
  expires_at?: number;
  status: 'active' | 'resolved' | 'expired';
}

export interface VoiceCircle {
  id: string;
  community_id: string;
  schedule: VoiceCircleSchedule;
  participants: VoiceCircleParticipant[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  
  // Session data
  session_data?: VoiceCircleSession;
  
  // Facilitation
  facilitator: {
    type: 'ai' | 'human';
    id: string;
    name: string;
  };
  
  // Safety
  safety_measures: SafetyMeasures;
  
  // Outcomes
  outcomes?: VoiceCircleOutcomes;
}

export interface VoiceCircleParticipant {
  member_id: string;
  display_name: string;
  joined_at: number;
  participation_level: 'active' | 'observer' | 'left_early';
  
  // Audio metrics (for quality assessment)
  audio_quality?: {
    clarity_score: number; // 0-1
    participation_time: number; // minutes
    interruption_count: number;
  };
  
  // Self-reported outcomes
  self_assessment?: {
    connection_felt: number; // 0-1
    support_received: number; // 0-1
    comfort_level: number; // 0-1
    helpfulness_rating: number; // 0-1
  };
}

export interface VoiceCircleSession {
  start_time: number;
  end_time: number;
  duration: number; // minutes
  
  // Transcript (optional, based on consent)
  transcript_available: boolean;
  transcript_summary?: string;
  
  // AI analysis
  emotional_tone: {
    overall: 'supportive' | 'neutral' | 'tense' | 'uplifting';
    progression: string[]; // How tone changed over time
  };
  
  participation_metrics: {
    speaking_turns: number;
    average_response_time: number; // seconds
    balance_score: number; // 0-1 (how balanced participation was)
  };
  
  // Safety incidents
  safety_incidents: SafetyIncident[];
}

export interface SafetyIncident {
  type: 'crisis' | 'conflict' | 'inappropriate_content' | 'technical_issue';
  description: string;
  timestamp: number;
  resolution: string;
  follow_up_required: boolean;
}

export interface SafetyMeasures {
  // Pre-session
  pre_session_check: {
    community_guidelines_review: boolean;
    technical_check: boolean;
    safety_briefing: boolean;
  };
  
  // During session
  live_moderation: {
    ai_monitoring: boolean;
    human_oversight: boolean;
    emergency_protocol: boolean;
  };
  
  // Post-session
  post_session_support: {
    debrief_available: boolean;
    individual_check_ins: boolean;
    resource_sharing: boolean;
  };
}

export interface VoiceCircleOutcomes {
  // Participant outcomes
  participant_outcomes: {
    average_connection_score: number; // 0-1
    average_support_received: number; // 0-1
    average_comfort_level: number; // 0-1
  };
  
  // Community outcomes
  community_impact: {
    social_bonding_increase: number; // 0-1
    trust_level_change: number; // -1 to 1
    belonging_score: number; // 0-1
  };
  
  // Clinical outcomes (if consented)
  clinical_outcomes?: {
    mood_improvement: number; // -1 to 1
    anxiety_reduction: number; // -1 to 1
    coping_skill_increase: number; // 0-1
  };
  
  // Quality metrics
  session_quality: {
    facilitator_effectiveness: number; // 0-1
    group_cohesion: number; // 0-1
    emotional_safety: number; // 0-1
    goal_achievement: number; // 0-1
  };
}

export interface MatchingAlgorithm {
  // Input data
  member_profile: MemberProfile;
  available_circles: VoiceCircle[];
  community_context: Community;
  
  // Matching criteria
  criteria: MatchingCriteria;
  
  // Output
  matches: CircleMatch[];
  
  // Algorithm performance
  confidence_scores: number[];
  reasoning: string[];
}

export interface MatchingCriteria {
  // Clinical matching
  symptom_compatibility: number; // 0-1 weight
  experience_level_match: number; // 0-1 weight
  
  // Personality matching
  personality_compatibility: number; // 0-1 weight
  communication_style_match: number; // 0-1 weight
  
  // Logistical matching
  timezone_compatibility: number; // 0-1 weight
  schedule_availability: number; // 0-1 weight
  language_compatibility: number; // 0-1 weight
  
  // Safety matching
  safety_history_compatibility: number; // 0-1 weight
  trigger_alignment: number; // 0-1 weight
}

export interface CircleMatch {
  circle_id: string;
  confidence_score: number; // 0-1
  match_reasons: string[];
  potential_concerns: string[];
  alternative_options: string[];
}

export interface CommunityAnalytics {
  // Engagement metrics
  daily_active_members: number;
  weekly_active_members: number;
  monthly_active_members: number;
  
  // Voice circle metrics
  voice_circle_attendance_rate: number;
  voice_circle_completion_rate: number;
  voice_circle_satisfaction: number;
  
  // Support quality
  peer_support_interactions: number;
  support_quality_rating: number;
  connection_strength_metrics: number;
  
  // Safety metrics
  safety_incident_rate: number;
  response_time_metrics: number;
  member_retention_by_safety_level: number;
  
  // Outcomes
  clinical_outcomes_aggregated: {
    average_mood_change: number;
    average_anxiety_change: number;
    coping_skill_improvement: number;
    social_connection_increase: number;
  };
  
  // Cost effectiveness
  cost_per_member: number;
  cost_per_successful_match: number;
  clinical_outcome_cost_ratio: number;
}
