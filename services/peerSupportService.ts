// Peer Support Communities Service
// Anonymous, moderated peer support with voice circles

import { 
  Community, 
  CommunityMember, 
  VoiceCircle, 
  VoiceCircleSession,
  MatchingAlgorithm,
  CommunityAnalytics,
  CommunityTopic,
  Language,
  CulturalMode,
  CircleMatch,
  MemberProfile
} from '../types/peerSupport';

export class PeerSupportService {
  private static instance: PeerSupportService;
  private communities: Map<string, Community> = new Map();
  private members: Map<string, CommunityMember> = new Map();
  private voiceCircles: Map<string, VoiceCircle> = new Map();
  
  static getInstance(): PeerSupportService {
    if (!PeerSupportService.instance) {
      PeerSupportService.instance = new PeerSupportService();
      PeerSupportService.instance.initializeDefaultCommunities();
    }
    return PeerSupportService.instance;
  }

  // Community Management
  async createCommunity(communityData: Omit<Community, 'id' | 'metrics'>): Promise<Community> {
    const community: Community = {
      ...communityData,
      id: this.generateId(),
      metrics: {
        member_count: 0,
        active_members: 0,
        retention_rate: 0,
        engagement_score: 0,
        safety_incidents: 0,
        response_time_average: 0,
        member_satisfaction: 0,
        peer_support_quality: 0,
        connection_strength: 0,
        recovery_indicators: 0
      }
    };

    this.communities.set(community.id, community);
    await this.saveCommunity(community);
    return community;
  }

  async getCommunity(communityId: string): Promise<Community | null> {
    const cached = this.communities.get(communityId);
    if (cached) return cached;

    const stored = await this.loadCommunity(communityId);
    if (stored) {
      this.communities.set(communityId, stored);
      return stored;
    }
    return null;
  }

  async getCommunitiesByTopic(topic: CommunityTopic): Promise<Community[]> {
    const allCommunities = Array.from(this.communities.values());
    return allCommunities.filter(community => community.topic === topic);
  }

  async getAvailableCommunities(memberProfile: MemberProfile): Promise<Community[]> {
    const allCommunities = Array.from(this.communities.values());
    
    return allCommunities.filter(community => {
      // Language compatibility
      const languageMatch = community.language === memberProfile.languages[0] || 
                           community.language === 'en'; // English as fallback
      
      // Topic compatibility
      const topicMatch = community.topic === memberProfile.primary_concerns[0] ||
                        memberProfile.primary_concerns.includes(community.topic);
      
      // Capacity check
      const hasCapacity = community.metrics.member_count < community.member_capacity;
      
      // Access control
      const canAccess = community.access_type === 'open' || 
                       (community.access_type === 'screened' && this.isEligibleForScreened(memberProfile));
      
      return languageMatch && topicMatch && hasCapacity && canAccess;
    });
  }

  // Member Management
  async joinCommunity(communityId: string, memberProfile: MemberProfile): Promise<CommunityMember> {
    const community = await this.getCommunity(communityId);
    if (!community) {
      throw new Error('Community not found');
    }

    // Check capacity
    if (community.metrics.member_count >= community.member_capacity) {
      throw new Error('Community at capacity');
    }

    // Check access requirements
    if (community.access_type === 'screened' && !this.isEligibleForScreened(memberProfile)) {
      throw new Error('Not eligible for screened community');
    }

    // Create member
    const member: CommunityMember = {
      id: this.generateId(),
      profile: memberProfile,
      preferences: this.getDefaultPreferences(memberProfile),
      participation: {
        voice_circles_attended: 0,
        voice_circles_facilitated: 0,
        messages_sent: 0,
        support_interactions: 0,
        attendance_rate: 0,
        participation_quality: 0,
        helpfulness_score: 0,
        last_voice_circle: 0,
        last_message: 0,
        current_streak: 0,
        roles: ['member'],
        achievements: []
      },
      safety_flags: [],
      join_date: Date.now(),
      last_active: Date.now()
    };

    this.members.set(member.id, member);
    
    // Update community metrics
    community.metrics.member_count++;
    await this.saveCommunity(community);
    await this.saveMember(member);

    return member;
  }

  async leaveCommunity(memberId: string, communityId: string): Promise<void> {
    const member = this.members.get(memberId);
    if (!member) return;

    const community = this.communities.get(communityId);
    if (!community) return;

    // Remove member from community
    this.members.delete(memberId);
    
    // Update community metrics
    community.metrics.member_count--;
    await this.saveCommunity(community);
  }

  // Voice Circle Management
  async scheduleVoiceCircle(
    communityId: string, 
    schedule: any, 
    facilitatorId?: string
  ): Promise<VoiceCircle> {
    const community = await this.getCommunity(communityId);
    if (!community) {
      throw new Error('Community not found');
    }

    const voiceCircle: VoiceCircle = {
      id: this.generateId(),
      community_id: communityId,
      schedule,
      participants: [],
      status: 'scheduled',
      facilitator: {
        type: facilitatorId ? 'human' : 'ai',
        id: facilitatorId || 'ai_facilitator',
        name: facilitatorId ? await this.getMemberName(facilitatorId) : 'AI Facilitator'
      },
      safety_measures: this.getDefaultSafetyMeasures()
    };

    this.voiceCircles.set(voiceCircle.id, voiceCircle);
    await this.saveVoiceCircle(voiceCircle);
    return voiceCircle;
  }

  async joinVoiceCircle(circleId: string, memberId: string): Promise<void> {
    const circle = this.voiceCircles.get(circleId);
    if (!circle) {
      throw new Error('Voice circle not found');
    }

    const member = this.members.get(memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    // Check capacity
    if (circle.participants.length >= circle.schedule.max_participants) {
      throw new Error('Voice circle at capacity');
    }

    // Add participant
    const participant = {
      member_id: memberId,
      display_name: member.profile.display_name,
      joined_at: Date.now(),
      participation_level: 'active' as const
    };

    circle.participants.push(participant);
    await this.saveVoiceCircle(circle);
  }

  async startVoiceCircle(circleId: string): Promise<VoiceCircleSession> {
    const circle = this.voiceCircles.get(circleId);
    if (!circle) {
      throw new Error('Voice circle not found');
    }

    circle.status = 'in_progress';
    
    const session: VoiceCircleSession = {
      start_time: Date.now(),
      end_time: 0,
      duration: 0,
      transcript_available: false,
      emotional_tone: {
        overall: 'neutral',
        progression: []
      },
      participation_metrics: {
        speaking_turns: 0,
        average_response_time: 0,
        balance_score: 0
      },
      safety_incidents: []
    };

    circle.session_data = session;
    await this.saveVoiceCircle(circle);
    return session;
  }

  async endVoiceCircle(circleId: string): Promise<VoiceCircleSession> {
    const circle = this.voiceCircles.get(circleId);
    if (!circle || !circle.session_data) {
      throw new Error('Voice circle not found or not started');
    }

    const session = circle.session_data;
    session.end_time = Date.now();
    session.duration = (session.end_time - session.start_time) / 1000 / 60; // minutes

    // Generate outcomes
    circle.outcomes = await this.calculateVoiceCircleOutcomes(circle);
    circle.status = 'completed';

    // Update member participation
    for (const participant of circle.participants) {
      const member = this.members.get(participant.member_id);
      if (member) {
        member.participation.voice_circles_attended++;
        member.participation.last_voice_circle = Date.now();
        await this.saveMember(member);
      }
    }

    await this.saveVoiceCircle(circle);
    return session;
  }

  // Matching Algorithm
  async findMatchingCircles(memberProfile: MemberProfile): Promise<CircleMatch[]> {
    const availableCommunities = await this.getAvailableCommunities(memberProfile);
    const allCircles = Array.from(this.voiceCircles.values())
      .filter(circle => 
        circle.status === 'scheduled' && 
        availableCommunities.some(c => c.id === circle.community_id)
      );

    const matches: CircleMatch[] = [];

    for (const circle of allCircles) {
      const match = await this.calculateCircleMatch(memberProfile, circle);
      if (match.confidence_score > 0.3) { // Minimum threshold
        matches.push(match);
      }
    }

    // Sort by confidence score
    return matches.sort((a, b) => b.confidence_score - a.confidence_score);
  }

  private async calculateCircleMatch(memberProfile: MemberProfile, circle: VoiceCircle): Promise<CircleMatch> {
    const community = this.communities.get(circle.community_id);
    if (!community) {
      return { circle_id: circle.id, confidence_score: 0, match_reasons: [], potential_concerns: [], alternative_options: [] };
    }

    let confidenceScore = 0;
    const matchReasons: string[] = [];
    const potentialConcerns: string[] = [];

    // Topic compatibility (40% weight)
    if (memberProfile.primary_concerns.includes(community.topic)) {
      confidenceScore += 0.4;
      matchReasons.push('Primary concern matches community topic');
    } else if (memberProfile.secondary_concerns?.includes(community.topic)) {
      confidenceScore += 0.2;
      matchReasons.push('Secondary concern matches community topic');
    }

    // Language compatibility (20% weight)
    if (memberProfile.languages.includes(community.language)) {
      confidenceScore += 0.2;
      matchReasons.push('Language compatibility');
    }

    // Experience level (15% weight)
    if (circle.schedule.skill_level === 'mixed' || 
        circle.schedule.skill_level === memberProfile.experience_level) {
      confidenceScore += 0.15;
      matchReasons.push('Experience level match');
    }

    // Time zone compatibility (15% weight)
    if (this.isTimezoneCompatible(memberProfile.timezone, community.timezone_preference)) {
      confidenceScore += 0.15;
      matchReasons.push('Time zone compatible');
    }

    // Capacity check (10% weight)
    const capacityRatio = circle.participants.length / circle.schedule.max_participants;
    if (capacityRatio < 0.8) {
      confidenceScore += 0.1;
      matchReasons.push('Good availability');
    } else if (capacityRatio > 0.9) {
      potentialConcerns.push('Nearly full');
    }

    return {
      circle_id: circle.id,
      confidence_score: Math.min(1, confidenceScore),
      match_reasons: matchReasons,
      potential_concerns: potentialConcerns,
      alternative_options: this.findAlternativeCircles(circle, Array.from(this.voiceCircles.values()))
    };
  }

  // Analytics
  async getCommunityAnalytics(communityId: string): Promise<CommunityAnalytics> {
    const community = this.communities.get(communityId);
    if (!community) {
      throw new Error('Community not found');
    }

    const communityCircles = Array.from(this.voiceCircles.values())
      .filter(circle => circle.community_id === communityId);

    const communityMembers = Array.from(this.members.values())
      .filter(member => this.isMemberInCommunity(member.id, communityId));

    return {
      daily_active_members: this.calculateDailyActiveMembers(communityMembers),
      weekly_active_members: this.calculateWeeklyActiveMembers(communityMembers),
      monthly_active_members: this.calculateMonthlyActiveMembers(communityMembers),
      voice_circle_attendance_rate: this.calculateAttendanceRate(communityCircles),
      voice_circle_completion_rate: this.calculateCompletionRate(communityCircles),
      voice_circle_satisfaction: this.calculateSatisfactionRate(communityCircles),
      peer_support_interactions: this.calculateSupportInteractions(communityMembers),
      support_quality_rating: this.calculateSupportQuality(communityMembers),
      connection_strength_metrics: this.calculateConnectionStrength(communityMembers),
      safety_incident_rate: community.metrics.safety_incidents / community.metrics.member_count,
      response_time_metrics: community.metrics.response_time_average,
      member_retention_by_safety_level: community.metrics.retention_rate,
      clinical_outcomes_aggregated: await this.calculateClinicalOutcomes(communityMembers),
      cost_per_member: this.calculateCostPerMember(community),
      cost_per_successful_match: this.calculateCostPerMatch(communityCircles),
      clinical_outcome_cost_ratio: this.calculateOutcomeCostRatio(community)
    };
  }

  // Safety and Moderation
  async reportIncident(
    reporterId: string, 
    targetId: string, 
    incidentType: string, 
    description: string
  ): Promise<void> {
    // Create safety flag
    const safetyFlag = {
      id: this.generateId(),
      type: 'warning' as const,
      reason: description,
      reported_by: reporterId,
      created_at: Date.now(),
      status: 'active' as const
    };

    const targetMember = this.members.get(targetId);
    if (targetMember) {
      targetMember.safety_flags.push(safetyFlag);
      await this.saveMember(targetMember);
    }

    // Update community metrics
    const community = await this.findMemberCommunity(targetId);
    if (community) {
      community.metrics.safety_incidents++;
      await this.saveCommunity(community);
    }
  }

  async detectCrisis(memberId: string, indicators: string[]): Promise<void> {
    // AI-based crisis detection
    const member = this.members.get(memberId);
    if (!member) return;

    // Add crisis flag
    const crisisFlag = {
      id: this.generateId(),
      type: 'investigation' as const,
      reason: `AI crisis detection: ${indicators.join(', ')}`,
      reported_by: 'ai_system',
      created_at: Date.now(),
      status: 'active' as const
    };

    member.safety_flags.push(crisisFlag);
    await this.saveMember(member);

    // Trigger crisis protocol
    await this.triggerCrisisProtocol(memberId, indicators);
  }

  // Helper methods
  private initializeDefaultCommunities(): void {
    // Create default communities
    const defaultCommunities: Omit<Community, 'id' | 'metrics'>[] = [
      {
        name: 'Depression Support',
        description: 'Peer support for managing depression',
        topic: 'Depression',
        language: 'en',
        cultural_mode: 'Universal',
        moderation: {
          ai_content_filter: true,
          ai_crisis_detection: true,
          toxicity_threshold: 0.7,
          human_moderators: [],
          moderator_guidelines: ['Be supportive', 'Maintain confidentiality'],
          community_rules: [
            {
              id: 'respect',
              title: 'Respect Others',
              description: 'Treat all members with respect and kindness',
              severity: 'warning',
              examples: ['No judgment', 'No unsolicited advice']
            }
          ],
          reporting_system: {
            report_types: ['harassment', 'spam', 'self_harm'],
            auto_action_threshold: 3,
            review_timeframe: 24
          },
          conflict_resolution: {
            mediation_steps: ['Step 1: Acknowledge feelings', 'Step 2: Find common ground', 'Step 3: Agree on solution'],
            time_limits: {
              initial_response: 15,
              resolution: 48
            },
            escalation_path: ['moderator', 'community_manager', 'admin']
          },
          crisis_protocol: {
            if_someone_in_crisis: {
              ai_detection: true,
              private_messaging: true,
              crisis_resources: [
                {
                  type: 'hotline',
                  title: 'Crisis Hotline',
                  contact: '988',
                  availability: '24/7',
                  languages: ['en']
                }
              ],
              emergency_escalation: true
            },
            if_conflict: {
              ai_moderation: true,
              human_mediator: true,
              temporary_muting: true,
              guidelines_reminder: true
            }
          }
        },
        activities: {
          daily_check_ins: {
            enabled: true,
            prompt_time: '09:00',
            questions: ['How are you feeling today?', 'What support do you need?'],
            privacy_level: 'anonymous'
          },
          voice_circles: {
            enabled: true,
            schedule: [
              {
                id: 'morning_circle',
                day_of_week: 1, // Monday
                time: '10:00',
                duration: 60,
                max_participants: 8,
                skill_level: 'mixed'
              }
            ],
            format: {
              opening: {
                facilitator: 'ai',
                greeting_meditation: 5,
                orientation: 5
              },
              sharing: {
                each_person_time: 5,
                sharing_guidelines: ['Speak from "I"', 'No advice giving'],
                response_guidelines: ['Listen deeply', 'Offer support, not solutions']
              },
              reflection: {
                facilitator_synthesis: 10,
                group_practice: 10,
                shared_insights: 5
              },
              closing: {
                gratitude_round: 5,
                homework_assignment: 5,
                next_steps: 5
              }
            },
            participation: {
              requirements: {
                minimum_sessions_attended: 0,
                community_standing_days: 0,
                completed_orientation: false
              },
              etiquette: {
                arrive_on_time: true,
                stay_full_duration: true,
                video_required: false,
                background_blur_allowed: true
              },
              accessibility: {
                closed_captioning: true,
                transcript_available: false,
                recording_available: false,
                alternative_formats: []
              }
            }
          },
          shared_practices: {
            enabled: true,
            types: ['meditation', 'breathing', 'gratitude'],
            scheduling: 'daily'
          },
          peer_matching: {
            enabled: true,
            algorithm: 'symptom_based',
            match_frequency: 'weekly'
          }
        },
        access_type: 'open',
        member_capacity: 50,
        timezone_preference: 'UTC',
        active_hours: {
          start: '06:00',
          end: '22:00'
        }
      }
    ];

    defaultCommunities.forEach(communityData => {
      this.createCommunity(communityData);
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getDefaultPreferences(memberProfile: MemberProfile): any {
    return {
      preferred_communication: 'both',
      voice_circle_preference: 'participant',
      anonymity_level: 'complete',
      data_sharing: 'aggregated_only',
      matching_preferences: {
        age_similarity: true,
        gender_similarity: false,
        concern_similarity: true,
        personality_compatibility: true,
        timezone_compatibility: true
      },
      content_filters: {
        sensitive_topics: [],
        trigger_warnings: true,
        content_warnings: true
      },
      notifications: {
        voice_circles: true,
        messages: true,
        community_updates: false,
        safety_alerts: true
      }
    };
  }

  private getDefaultSafetyMeasures(): any {
    return {
      pre_session_check: {
        community_guidelines_review: true,
        technical_check: true,
        safety_briefing: true
      },
      live_moderation: {
        ai_monitoring: true,
        human_oversight: false,
        emergency_protocol: true
      },
      post_session_support: {
        debrief_available: true,
        individual_check_ins: false,
        resource_sharing: true
      }
    };
  }

  private isEligibleForScreened(memberProfile: MemberProfile): boolean {
    // Basic eligibility for screened communities
    return memberProfile.experience_level !== 'beginner' && 
           memberProfile.primary_concerns.length > 0;
  }

  private isTimezoneCompatible(memberTimezone?: string, communityTimezone?: string): boolean {
    // Simplified timezone compatibility check
    return true; // Would implement actual timezone logic
  }

  private isMemberInCommunity(memberId: string, communityId: string): boolean {
    // Simplified check - would implement proper membership tracking
    return this.members.has(memberId);
  }

  private async calculateVoiceCircleOutcomes(circle: VoiceCircle): Promise<any> {
    // Simplified outcomes calculation
    return {
      participant_outcomes: {
        average_connection_score: 0.8,
        average_support_received: 0.7,
        average_comfort_level: 0.9
      },
      community_impact: {
        social_bonding_increase: 0.6,
        trust_level_change: 0.3,
        belonging_score: 0.8
      },
      session_quality: {
        facilitator_effectiveness: 0.8,
        group_cohesion: 0.7,
        emotional_safety: 0.9,
        goal_achievement: 0.8
      }
    };
  }

  private findAlternativeCircles(circle: VoiceCircle, allCircles: VoiceCircle[]): string[] {
    return allCircles
      .filter(c => c.id !== circle.id && c.community_id === circle.community_id)
      .slice(0, 3)
      .map(c => c.id);
  }

  private async getMemberName(memberId: string): Promise<string> {
    const member = this.members.get(memberId);
    return member?.profile.display_name || 'Unknown';
  }

  // Analytics calculation methods (simplified)
  private calculateDailyActiveMembers(members: CommunityMember[]): number {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    return members.filter(m => m.last_active > oneDayAgo).length;
  }

  private calculateWeeklyActiveMembers(members: CommunityMember[]): number {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return members.filter(m => m.last_active > oneWeekAgo).length;
  }

  private calculateMonthlyActiveMembers(members: CommunityMember[]): number {
    const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    return members.filter(m => m.last_active > oneMonthAgo).length;
  }

  private calculateAttendanceRate(circles: VoiceCircle[]): number {
    if (circles.length === 0) return 0;
    const totalCapacity = circles.reduce((sum, c) => sum + c.schedule.max_participants, 0);
    const totalParticipants = circles.reduce((sum, c) => sum + c.participants.length, 0);
    return totalParticipants / totalCapacity;
  }

  private calculateCompletionRate(circles: VoiceCircle[]): number {
    if (circles.length === 0) return 0;
    const completedCircles = circles.filter(c => c.status === 'completed').length;
    return completedCircles / circles.length;
  }

  private calculateSatisfactionRate(circles: VoiceCircle[]): number {
    // Would aggregate participant satisfaction ratings
    return 0.85; // Placeholder
  }

  private calculateSupportInteractions(members: CommunityMember[]): number {
    return members.reduce((sum, m) => sum + m.participation.support_interactions, 0);
  }

  private calculateSupportQuality(members: CommunityMember[]): number {
    if (members.length === 0) return 0;
    const totalQuality = members.reduce((sum, m) => sum + m.participation.helpfulness_score, 0);
    return totalQuality / members.length;
  }

  private calculateConnectionStrength(members: CommunityMember[]): number {
    // Would calculate based on interaction patterns
    return 0.7; // Placeholder
  }

  private async calculateClinicalOutcomes(members: CommunityMember[]): Promise<any> {
    // Would aggregate clinical outcomes if consented
    return {
      average_mood_change: 0.3,
      average_anxiety_change: -0.2,
      coping_skill_improvement: 0.4,
      social_connection_increase: 0.5
    };
  }

  private calculateCostPerMember(community: Community): number {
    // Would calculate actual costs
    return 10; // Placeholder $10 per member
  }

  private calculateCostPerMatch(circles: VoiceCircle[]): number {
    // Would calculate cost per successful match
    return 5; // Placeholder $5 per match
  }

  private calculateOutcomeCostRatio(community: Community): number {
    // Would calculate ROI based on clinical outcomes
    return 2.5; // Placeholder
  }

  private async findMemberCommunity(memberId: string): Promise<Community | null> {
    // Would find which community a member belongs to
    const allCommunities = Array.from(this.communities.values());
    return allCommunities[0] || null; // Simplified
  }

  private async triggerCrisisProtocol(memberId: string, indicators: string[]): Promise<void> {
    // Would implement crisis protocol
    console.log(`Crisis protocol triggered for member ${memberId}: ${indicators.join(', ')}`);
  }

  // Data persistence (simplified)
  private async saveCommunity(community: Community): Promise<void> {
    localStorage.setItem(`community_${community.id}`, JSON.stringify(community));
  }

  private async loadCommunity(communityId: string): Promise<Community | null> {
    const stored = localStorage.getItem(`community_${communityId}`);
    return stored ? JSON.parse(stored) : null;
  }

  private async saveMember(member: CommunityMember): Promise<void> {
    localStorage.setItem(`member_${member.id}`, JSON.stringify(member));
  }

  private async saveVoiceCircle(circle: VoiceCircle): Promise<void> {
    localStorage.setItem(`voice_circle_${circle.id}`, JSON.stringify(circle));
  }
}

// Export singleton
export const peerSupportService = PeerSupportService.getInstance();
