// Digital Phenotyping Service
// Privacy-first behavioral monitoring and mental health insights

import {
  DigitalPhenotype,
  TypingDynamics,
  VoiceBiomarkers,
  BehavioralPatterns,
  RiskAssessment,
  PhenotypingConsent,
  PhenotypingInsights,
  SharingPreferences
} from '../types/digitalPhenotyping';
import { VaultService } from './crypto';

export class DigitalPhenotypingService {
  private static instance: DigitalPhenotypingService;
  private consent: PhenotypingConsent | null = null;
  private isCollecting = false;
  private collectionInterval: NodeJS.Timeout | null = null;

  // Data collection buffers
  private typingBuffer: TypingDataPoint[] = [];
  private voiceBuffer: VoiceDataPoint[] = [];
  private behaviorBuffer: BehaviorDataPoint[] = [];

  static getInstance(): DigitalPhenotypingService {
    if (!DigitalPhenotypingService.instance) {
      DigitalPhenotypingService.instance = new DigitalPhenotypingService();
    }
    return DigitalPhenotypingService.instance;
  }

  // Consent Management
  async requestConsent(consentChoices: Partial<PhenotypingConsent>): Promise<boolean> {
    const consent: PhenotypingConsent = {
      version: '1.0',
      timestamp: Date.now(),
      consent_choices: {
        typing_analysis: false,
        voice_analysis: false,
        usage_patterns: false,
        device_sensors: false,
        location_data: false,
        communication_data: false,
        ...consentChoices.consent_choices
      },
      sharing_preferences: {
        share_for_research: false,
        research_identification: 'anonymous',
        share_with_therapist: false,
        therapist_data_detail: 'summaries',
        share_commercial: false,
        auto_delete_after_days: 365,
        export_format: 'json',
        ...consentChoices.sharing_preferences
      },
      purpose_understood: consentChoices.purpose_understood || false,
      risks_understood: consentChoices.risks_understood || false,
      withdrawal_rights_understood: consentChoices.withdrawal_rights_understood || false
    };

    // Validate consent
    if (!this.validateConsent(consent)) {
      throw new Error('Invalid consent: Missing required understandings');
    }

    this.consent = consent;
    await this.saveConsent();
    return true;
  }

  private validateConsent(consent: PhenotypingConsent): boolean {
    return consent.purpose_understood &&
      consent.risks_understood &&
      consent.withdrawal_rights_understood;
  }

  async hasConsent(feature: keyof PhenotypingConsent['consent_choices']): Promise<boolean> {
    if (!this.consent) {
      await this.loadConsent();
    }
    return this.consent?.consent_choices[feature] || false;
  }

  async withdrawConsent(): Promise<void> {
    // Stop all data collection
    this.stopDataCollection();

    // Delete collected data according to retention policy
    await this.deleteCollectedData();

    // Clear consent
    this.consent = null;
    await this.saveConsent();
  }

  // Data Collection Control
  async startDataCollection(): Promise<void> {
    if (!this.consent) {
      throw new Error('No consent on file');
    }

    if (this.isCollecting) {
      return;
    }

    this.isCollecting = true;

    // Start collection intervals
    this.collectionInterval = setInterval(() => {
      this.processDataBuffers();
    }, 60000); // Process every minute

    // Initialize event listeners
    this.initializeEventListeners();
  }

  stopDataCollection(): void {
    this.isCollecting = false;

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }

    this.removeEventListeners();
  }

  // Typing Dynamics Collection
  async recordTypingEvent(event: TypingEvent): Promise<void> {
    if (!this.isCollecting || !(await this.hasConsent('typing_analysis'))) {
      return;
    }

    const dataPoint: TypingDataPoint = {
      timestamp: Date.now(),
      key: event.key,
      keyDownTime: event.keyDownTime,
      keyUpTime: event.keyUpTime,
      currentTextLength: event.currentTextLength,
      corrections: event.corrections
    };

    this.typingBuffer.push(dataPoint);

    // Process buffer if it gets too large
    if (this.typingBuffer.length > 100) {
      await this.processTypingData();
    }
  }

  private async processTypingData(): Promise<void> {
    if (this.typingBuffer.length === 0) return;

    // PRIVACY-FIRST: Process locally and immediately discard raw data
    const typingDynamics = this.analyzeTypingDynamics(this.typingBuffer);

    // Store ONLY aggregated insights - never raw keystroke data
    await this.storeAggregatedInsights(typingDynamics);

    // IMMEDIATELY clear raw data buffer - never persist raw timing
    this.typingBuffer = [];

    // Clear any temporary references
    this.clearTemporaryTypingData();
  }

  private clearTemporaryTypingData(): void {
    // Ensure no references to raw typing data remain
    if (this.typingBuffer.length > 0) {
      // Overwrite buffer with zeros for security
      for (let i = 0; i < this.typingBuffer.length; i++) {
        const dataPoint = this.typingBuffer[i];
        if (dataPoint) {
          // Clear sensitive timing data
          dataPoint.keyDownTime = 0;
          dataPoint.keyUpTime = 0;
          dataPoint.key = ''; // Clear key instead of keyCode
        }
      }
      this.typingBuffer = [];
    }
  }

  private async storeAggregatedInsights(typingDynamics: TypingDynamics): Promise<void> {
    // Store ONLY aggregated metrics - never raw keystroke timings
    const aggregatedData = {
      timestamp: Date.now(),
      speed_wpm: typingDynamics.speed_wpm,
      speed_variance: typingDynamics.speed_variance,
      error_rate: typingDynamics.error_rate,
      typing_fluency: typingDynamics.typing_fluency,
      // IMPORTANT: NO raw timing data, NO key sequences, NO individual keystrokes
      session_id: this.generateSessionId(),
      data_type: 'aggregated_insights' // Explicitly mark as aggregated
    };

    // Store in secure local database only
    await this.saveToSecureStorage(aggregatedData);
  }

  private generateSessionId(): string {
    // Generate anonymous session ID - no user identifiers
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveToSecureStorage(data: any): Promise<void> {
    try {
      // Use encrypted local storage via Vault
      const encrypted = await this.encryptData(data);
      // serialized format: { iv: string(base64), cipher: string(base64) }
      localStorage.setItem(`phenotype_${data.session_id}`, JSON.stringify(encrypted));
    } catch (error) {
      console.error('[DigitalPhenotyping] Failed to store insights:', error);
    }
  }

  private async encryptData(data: any): Promise<{ iv: string, cipher: string }> {
    // secure encryption using VaultService
    // We must ensure Vault is unlocked. If locked, we cannot save sensitive data.
    if (!VaultService.isAuthenticated()) {
      console.warn("[DigitalPhenotyping] Vault locked - cannot save data");
      throw new Error("VAULT_LOCKED");
    }

    const { iv, cipher } = await VaultService.encrypt(data);

    return {
      iv: this.arrayBufferToBase64(iv),
      cipher: this.arrayBufferToBase64(cipher)
    };
  }

  // Helper for buffer conversion
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    let binary = '';
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private analyzeTypingDynamics(events: TypingDataPoint[]): TypingDynamics {
    if (events.length < 2) {
      return this.getDefaultTypingDynamics();
    }

    // Calculate typing speed
    const timeSpan = (events[events.length - 1].keyDownTime - events[0].keyDownTime) / 1000 / 60; // minutes
    const wordCount = events[events.length - 1].currentTextLength / 5; // Average 5 chars per word
    const speedWpm = wordCount / timeSpan;

    // Calculate inter-key intervals
    const intervals: number[] = [];
    for (let i = 1; i < events.length; i++) {
      intervals.push(events[i].keyDownTime - events[i - 1].keyDownTime);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const intervalStd = Math.sqrt(intervals.reduce((sq, n) => sq + Math.pow(n - avgInterval, 2), 0) / intervals.length);

    // Analyze pauses (intervals > 2 seconds)
    const longPauses = intervals.filter(i => i > 2000).length;
    const pauseDurationAvg = intervals.filter(i => i > 500).reduce((a, b) => a + b, 0) / intervals.filter(i => i > 500).length || 0;

    // Count corrections
    const totalCorrections = events.reduce((sum, e) => sum + (e.corrections || 0), 0);
    const errorRate = totalCorrections / events.length;

    return {
      speed_wpm: Math.max(0, speedWpm),
      speed_variance: intervalStd / 1000, // Convert to seconds
      error_rate: errorRate,
      correction_latency: 0, // Would need more detailed tracking
      pause_duration_avg: pauseDurationAvg,
      pause_duration_variance: this.calculateVariance(intervals.filter(i => i > 500)),
      keystroke_interval_std: intervalStd,
      typing_fluency: Math.max(0, 1 - (intervalStd / avgInterval)), // Normalized fluency
      rumination_indicators: {
        long_pauses: longPauses,
        deletions_per_minute: totalCorrections / timeSpan,
        typing_bursts: this.calculateTypingBursts(events)
      }
    };
  }

  private getDefaultTypingDynamics(): TypingDynamics {
    return {
      speed_wpm: 0,
      speed_variance: 0,
      error_rate: 0,
      correction_latency: 0,
      pause_duration_avg: 0,
      pause_duration_variance: 0,
      keystroke_interval_std: 0,
      typing_fluency: 0,
      rumination_indicators: {
        long_pauses: 0,
        deletions_per_minute: 0,
        typing_bursts: 0
      }
    };
  }

  // Voice Biomarker Collection
  async recordVoiceSegment(audioData: Float32Array, sampleRate: number): Promise<void> {
    if (!this.isCollecting || !(await this.hasConsent('voice_analysis'))) {
      return;
    }

    const voiceBiomarkers = await this.analyzeVoiceBiomarkers(audioData, sampleRate);

    const dataPoint: VoiceDataPoint = {
      timestamp: Date.now(),
      biomarkers: voiceBiomarkers
    };

    this.voiceBuffer.push(dataPoint);

    if (this.voiceBuffer.length > 10) {
      await this.processVoiceData();
    }
  }

  private async analyzeVoiceBiomarkers(audioData: Float32Array, sampleRate: number): Promise<VoiceBiomarkers> {
    // Simplified voice analysis - in production would use more sophisticated signal processing

    // Calculate basic energy
    const energy = audioData.reduce((sum, sample) => sum + sample * sample, 0) / audioData.length;

    // Find fundamental frequency (simplified)
    const pitch = this.estimatePitch(audioData, sampleRate);

    // Calculate speech rate (would need speech detection)
    const speechRate = this.estimateSpeechRate(audioData, sampleRate);

    return {
      pitch_mean: pitch,
      pitch_variance: 0, // Would need multiple segments
      pitch_range: 0,
      speech_rate: speechRate,
      pause_ratio: this.estimatePauseRatio(audioData),
      pause_duration_avg: 0,
      energy_mean: energy,
      energy_variance: 0,
      jitter: 0,
      shimmer: 0,
      harmonics_to_noise_ratio: 0,
      emotional_tone: {
        arousal: this.estimateArousal(energy),
        valence: this.estimateValence(pitch, energy),
        stress_markers: this.estimateStressMarkers(pitch, energy)
      },
      depression_markers: {
        pitch_flattening: this.estimatePitchFlattening(pitch),
        slowed_speech: speechRate < 120 ? 0.7 : 0.3,
        reduced_energy: energy < 0.01 ? 0.8 : 0.2,
        monotony: this.estimateMonotony(audioData)
      },
      anxiety_markers: {
        pitch_elevation: pitch > 200 ? 0.7 : 0.3,
        speech_acceleration: speechRate > 150 ? 0.6 : 0.4,
        voice_tremor: this.estimateTremor(audioData),
        breath_irregularity: this.estimateBreathIrregularity(audioData)
      }
    };
  }

  // Behavioral Pattern Collection
  async recordBehaviorEvent(event: BehaviorEvent): Promise<void> {
    if (!this.isCollecting || !(await this.hasConsent('usage_patterns'))) {
      return;
    }

    const dataPoint: BehaviorDataPoint = {
      timestamp: Date.now(),
      eventType: event.type,
      details: event.details
    };

    this.behaviorBuffer.push(dataPoint);

    if (this.behaviorBuffer.length > 50) {
      await this.processBehaviorData();
    }
  }

  private async processBehaviorData(): Promise<void> {
    if (this.behaviorBuffer.length === 0) return;

    const patterns = this.analyzeBehavioralPatterns(this.behaviorBuffer);
    await this.storeBehavioralPatterns(patterns);
    this.behaviorBuffer = [];
  }

  private analyzeBehavioralPatterns(events: BehaviorDataPoint[]): BehavioralPatterns {
    // Analyze session patterns
    const sessionEvents = events.filter(e => e.eventType === 'session_start' || e.eventType === 'session_end');
    const sessionDurations = this.calculateSessionDurations(sessionEvents);

    // Analyze time patterns
    const hourUsage = this.calculateHourlyUsage(events);
    const firstOpenTime = this.findFirstOpenTime(events);

    return {
      session_frequency: sessionEvents.length / 7, // Sessions per day (last week)
      session_duration_avg: sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length || 0,
      session_duration_variance: this.calculateVariance(sessionDurations),
      first_open_time: firstOpenTime,
      last_open_time: this.findLastOpenTime(events),
      peak_usage_hours: this.findPeakUsageHours(hourUsage),
      sleep_disruption_indicators: {
        night_openings: events.filter(e => new Date(e.timestamp).getHours() < 6).length,
        early_morning_usage: events.filter(e => new Date(e.timestamp).getHours() < 6).length,
        irregular_schedule: this.calculateScheduleIrregularity(events)
      },
      practice_completion_rate: this.calculatePracticeCompletion(events),
      feature_usage: this.calculateFeatureUsage(events),
      social_engagement: this.calculateSocialEngagement(events),
      behavioral_avoidance: this.calculateBehavioralAvoidance(events)
    };
  }

  // Risk Assessment
  async assessRisk(): Promise<RiskAssessment> {
    const recentData = await this.getRecentPhenotypeData();

    if (!recentData) {
      return this.getDefaultRiskAssessment();
    }

    const depressionRisk = this.assessDepressionRisk(recentData);
    const anxietyRisk = this.assessAnxietyRisk(recentData);
    const crisisRisk = this.assessCrisisRisk(recentData);

    const overallRisk = Math.max(depressionRisk.score, anxietyRisk.score, crisisRisk.score);

    return {
      timestamp: Date.now(),
      risk_score: overallRisk,
      confidence: this.calculateConfidence(recentData),
      depression_risk: depressionRisk,
      anxiety_risk: anxietyRisk,
      crisis_risk: {
        score: crisisRisk.score,
        indicators: crisisRisk.indicators,
        urgency: crisisRisk.urgency || 'medium'
      },
      protective_factors: this.assessProtectiveFactors(recentData),
      recommendations: this.generateRecommendations(depressionRisk, anxietyRisk, crisisRisk)
    };
  }

  private assessDepressionRisk(data: DigitalPhenotype): RiskDimension {
    const indicators: string[] = [];
    let score = 0;

    // Voice biomarkers
    if (data.voice_biomarkers) {
      const { depression_markers } = data.voice_biomarkers;
      if (depression_markers.pitch_flattening > 0.7) {
        score += 0.3;
        indicators.push('reduced_pitch_variability');
      }
      if (depression_markers.slowed_speech > 0.6) {
        score += 0.2;
        indicators.push('slowed_speech');
      }
      if (depression_markers.reduced_energy > 0.7) {
        score += 0.3;
        indicators.push('reduced_vocal_energy');
      }
    }

    // Behavioral patterns
    if (data.behavioral_patterns) {
      const { session_frequency, sleep_disruption_indicators } = data.behavioral_patterns;
      if (session_frequency < 0.3) {
        score += 0.2;
        indicators.push('reduced_engagement');
      }
      if (sleep_disruption_indicators.night_openings > 3) {
        score += 0.2;
        indicators.push('sleep_disruption');
      }
    }

    // Self-reported mood
    if (data.daily_mood && data.daily_mood.mood_rating < 4) {
      score += 0.3;
      indicators.push('low_self_reported_mood');
    }

    return {
      score: Math.min(1, score),
      indicators,
      trend: this.calculateTrend(data, 'depression')
    };
  }

  private assessAnxietyRisk(data: DigitalPhenotype): RiskDimension {
    const indicators: string[] = [];
    let score = 0;

    // Voice biomarkers
    if (data.voice_biomarkers) {
      const { anxiety_markers } = data.voice_biomarkers;
      if (anxiety_markers.pitch_elevation > 0.7) {
        score += 0.3;
        indicators.push('elevated_pitch');
      }
      if (anxiety_markers.speech_acceleration > 0.6) {
        score += 0.2;
        indicators.push('accelerated_speech');
      }
      if (anxiety_markers.voice_tremor > 0.5) {
        score += 0.3;
        indicators.push('voice_instability');
      }
    }

    // Typing patterns
    if (data.typing_dynamics) {
      const { error_rate, rumination_indicators } = data.typing_dynamics;
      if (error_rate > 0.1) {
        score += 0.2;
        indicators.push('increased_typing_errors');
      }
      if (rumination_indicators.long_pauses > 5) {
        score += 0.2;
        indicators.push('hesitant_typing');
      }
    }

    // Self-reported anxiety
    if (data.daily_mood && data.daily_mood.stress_level > 7) {
      score += 0.3;
      indicators.push('high_self_reported_stress');
    }

    return {
      score: Math.min(1, score),
      indicators,
      trend: this.calculateTrend(data, 'anxiety')
    };
  }

  private assessCrisisRisk(data: DigitalPhenotype): RiskDimension {
    const indicators: string[] = [];
    let score = 0;

    // Immediate crisis indicators
    if (data.behavioral_patterns) {
      const { sleep_disruption_indicators, behavioral_avoidance } = data.behavioral_patterns;
      if (sleep_disruption_indicators.night_openings > 5) {
        score += 0.4;
        indicators.push('severe_sleep_disruption');
      }
      if (behavioral_avoidance.session_abandonment > 0.8) {
        score += 0.3;
        indicators.push('complete_avoidance');
      }
    }

    // Self-reported crisis indicators
    if (data.daily_mood && data.daily_mood.mood_rating < 2) {
      score += 0.5;
      indicators.push('extremely_low_mood');
    }

    return {
      score: Math.min(1, score),
      indicators,
      trend: 'worsening' // Crisis risk is always considered worsening
    };
  }

  // Insights Generation
  async generateInsights(startDate: string, endDate: string): Promise<PhenotypingInsights> {
    const phenotypeData = await this.getPhenotypeDataInRange(startDate, endDate);

    return {
      user_id: 'current_user', // Would get from auth
      generated_at: Date.now(),
      insight_period: { start_date: startDate, end_date: endDate },
      behavioral_patterns: this.analyzeBehavioralInsights(phenotypeData),
      progress_metrics: this.analyzeProgressMetrics(phenotypeData),
      predictions: this.generatePredictions(phenotypeData),
      clinical_summary: this.generateClinicalSummary(phenotypeData)
    };
  }

  // Data Storage and Retrieval
  private async storeTypingDynamics(dynamics: TypingDynamics): Promise<void> {
    // Store in encrypted database
    const key = `typing_dynamics_${Date.now()}`;
    await this.secureStore(key, dynamics);
  }

  private async storeVoiceBiomarkers(biomarkers: VoiceBiomarkers): Promise<void> {
    const key = `voice_biomarkers_${Date.now()}`;
    await this.secureStore(key, biomarkers);
  }

  private async storeBehavioralPatterns(patterns: BehavioralPatterns): Promise<void> {
    const key = `behavioral_patterns_${Date.now()}`;
    await this.secureStore(key, patterns);
  }

  private async secureStore(key: string, data: any): Promise<void> {
    try {
      const encrypted = await this.encryptData(data);
      localStorage.setItem(`phenotype_${key}`, JSON.stringify(encrypted));
    } catch (e) {
      console.warn("[DigitalPhenotyping] Encryption failed", e);
    }
  }

  private async getRecentPhenotypeData(): Promise<DigitalPhenotype | null> {
    // Get recent data from storage
    const keys = Object.keys(localStorage).filter(k => k.startsWith('phenotype_'));
    if (keys.length === 0) return null;

    // Get the most recent data
    const latestKey = keys.sort().pop();
    if (!latestKey) return null;

    try {
      const stored = localStorage.getItem(latestKey);
      if (!stored) return null;

      const { iv, cipher } = JSON.parse(stored);

      if (!VaultService.isAuthenticated()) {
        console.warn("[DigitalPhenotyping] Vault locked - cannot read data");
        return null;
      }

      const ivBuffer = this.base64ToArrayBuffer(iv);
      const cipherBuffer = this.base64ToArrayBuffer(cipher);

      // Decrypt
      const data = await VaultService.decrypt(new Uint8Array(ivBuffer), cipherBuffer);
      return data;
    } catch (error) {
      console.error('Failed to decode/decrypt phenotype data:', error);
      return null;
    }
  }

  // Helper methods (simplified implementations)
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length;
  }

  private calculateTypingBursts(events: TypingDataPoint[]): number {
    // Simplified burst detection
    return 0;
  }

  private estimatePitch(audioData: Float32Array, sampleRate: number): number {
    // Simplified pitch estimation
    return 150; // Hz
  }

  private estimateSpeechRate(audioData: Float32Array, sampleRate: number): number {
    // Simplified speech rate estimation
    return 130; // Words per minute
  }

  private estimatePauseRatio(audioData: Float32Array): number {
    // Simplified pause ratio
    return 0.3;
  }

  private estimateArousal(energy: number): number {
    return Math.min(1, energy * 100);
  }

  private estimateValence(pitch: number, energy: number): number {
    // Simplified valence estimation
    return 0.1;
  }

  private estimateStressMarkers(pitch: number, energy: number): number {
    return Math.min(1, (pitch - 150) / 100 + energy * 50);
  }

  private estimatePitchFlattening(pitch: number): number {
    return pitch < 130 ? 0.7 : 0.3;
  }

  private estimateMonotony(audioData: Float32Array): number {
    return 0.3;
  }

  private estimateTremor(audioData: Float32Array): number {
    return 0.2;
  }

  private estimateBreathIrregularity(audioData: Float32Array): number {
    return 0.3;
  }

  private calculateSessionDurations(sessionEvents: BehaviorDataPoint[]): number[] {
    // Simplified session duration calculation
    return [15, 20, 10]; // minutes
  }

  private calculateHourlyUsage(events: BehaviorDataPoint[]): number[] {
    const hourlyUsage = new Array(24).fill(0);
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourlyUsage[hour]++;
    });
    return hourlyUsage;
  }

  private findFirstOpenTime(events: BehaviorDataPoint[]): number {
    const openEvents = events.filter(e => e.eventType === 'session_start');
    if (openEvents.length === 0) return 9; // Default 9 AM
    const hours = openEvents.map(e => new Date(e.timestamp).getHours());
    return Math.round(hours.reduce((a, b) => a + b, 0) / hours.length);
  }

  private findLastOpenTime(events: BehaviorDataPoint[]): number {
    return 21; // Default 9 PM
  }

  private findPeakUsageHours(hourlyUsage: number[]): number[] {
    const maxUsage = Math.max(...hourlyUsage);
    return hourlyUsage
      .map((usage, hour) => ({ usage, hour }))
      .filter(({ usage }) => usage === maxUsage)
      .map(({ hour }) => hour);
  }

  private calculateScheduleIrregularity(events: BehaviorDataPoint[]): number {
    return 0.3;
  }

  private calculatePracticeCompletion(events: BehaviorDataPoint[]): number {
    return 0.7;
  }

  private calculateFeatureUsage(events: BehaviorDataPoint[]): any {
    return {
      voice_sessions: 0.6,
      meditation_usage: 0.4,
      journaling_frequency: 0.3,
      breathing_exercises: 0.8
    };
  }

  private calculateSocialEngagement(events: BehaviorDataPoint[]): any {
    return {
      peer_connections: 2,
      group_participation: 1,
      support_given: 0.7,
      support_received: 0.8
    };
  }

  private calculateBehavioralAvoidance(events: BehaviorDataPoint[]): any {
    return {
      session_abandonment: 0.2,
      difficult_topic_avoidance: 0.3,
      help_seeking_delay: 0.4
    };
  }

  private calculateTrend(data: DigitalPhenotype, type: 'depression' | 'anxiety'): 'improving' | 'stable' | 'worsening' {
    return 'stable';
  }

  private calculateConfidence(data: DigitalPhenotype): number {
    return 0.7;
  }

  private assessProtectiveFactors(data: DigitalPhenotype): any {
    return {
      social_support: 0.7,
      coping_skills: 0.6,
      treatment_engagement: 0.8,
      routine_stability: 0.5
    };
  }

  private generateRecommendations(depression: RiskDimension, anxiety: RiskDimension, crisis: RiskDimension): any[] {
    const recommendations = [];

    if (crisis.score > 0.7) {
      recommendations.push({
        type: 'immediate',
        priority: 'urgent',
        title: 'Immediate Support Needed',
        description: 'Consider reaching out to crisis support',
        action_required: true,
        resources: ['crisis_hotline', 'emergency_services']
      });
    }

    if (depression.score > 0.6) {
      recommendations.push({
        type: 'preventive',
        priority: 'high',
        title: 'Increase Therapy Sessions',
        description: 'Consider more frequent therapy sessions',
        action_required: true
      });
    }

    return recommendations;
  }

  private getDefaultRiskAssessment(): RiskAssessment {
    return {
      timestamp: Date.now(),
      risk_score: 0,
      confidence: 0,
      depression_risk: { score: 0, indicators: [], trend: 'stable' as const },
      anxiety_risk: { score: 0, indicators: [], trend: 'stable' as const },
      crisis_risk: { score: 0, indicators: [], urgency: 'low' as const },
      protective_factors: {
        social_support: 0,
        coping_skills: 0,
        treatment_engagement: 0,
        routine_stability: 0
      },
      recommendations: []
    };
  }

  private analyzeBehavioralInsights(data: DigitalPhenotype[]): any {
    return {
      daily_routines: [],
      stress_triggers: [],
      coping_effectiveness: [],
      social_patterns: []
    };
  }

  private analyzeProgressMetrics(data: DigitalPhenotype[]): any {
    return {
      symptom_trends: [],
      treatment_response: [],
      goal_progress: []
    };
  }

  private generatePredictions(data: DigitalPhenotype[]): any {
    return {
      relapse_risk: [],
      optimal_intervention_times: [],
      recommended_adjustments: []
    };
  }

  private generateClinicalSummary(data: DigitalPhenotype[]): any {
    return {
      current_state: 'Stable',
      trajectory: 'Maintaining progress',
      concerns: [],
      strengths: ['Regular engagement'],
      recommendations: ['Continue current treatment plan', 'Consider increasing therapy sessions']
    };
  }

  private async getPhenotypeDataInRange(startDate: string, endDate: string): Promise<DigitalPhenotype[]> {
    // Implementation for getting data in date range
    return [];
  }

  private async deleteCollectedData(): Promise<void> {
    // Delete all phenotype data from storage
    const keys = Object.keys(localStorage).filter(k => k.startsWith('phenotype_'));
    keys.forEach(key => localStorage.removeItem(key));
  }

  private async saveConsent(): Promise<void> {
    localStorage.setItem('phenotyping_consent', JSON.stringify(this.consent));
  }

  private async loadConsent(): Promise<void> {
    const stored = localStorage.getItem('phenotyping_consent');
    if (stored) {
      this.consent = JSON.parse(stored);
    }
  }

  private initializeEventListeners(): void {
    // Add event listeners for typing, voice, etc.
    // This would integrate with the main app components
  }

  private removeEventListeners(): void {
    // Remove event listeners
  }

  private processDataBuffers(): void {
    // Process all buffers
    this.processTypingData();
    this.processVoiceData();
    this.processBehaviorData();
  }

  private async processVoiceData(): Promise<void> {
    if (this.voiceBuffer.length === 0) return;

    // Process voice data
    this.voiceBuffer = [];
  }
}

// Type definitions for internal use
interface TypingDataPoint {
  timestamp: number;
  key: string;
  keyDownTime: number;
  keyUpTime: number;
  currentTextLength: number;
  corrections?: number;
}

interface VoiceDataPoint {
  timestamp: number;
  biomarkers: VoiceBiomarkers;
}

interface BehaviorDataPoint {
  timestamp: number;
  eventType: string;
  details: any;
}

interface TypingEvent {
  key: string;
  keyDownTime: number;
  keyUpTime: number;
  currentTextLength: number;
  corrections?: number;
}

interface BehaviorEvent {
  type: string;
  details: any;
}

interface RiskDimension {
  score: number;
  indicators: string[];
  trend: 'improving' | 'stable' | 'worsening';
  urgency?: 'low' | 'medium' | 'high' | 'immediate';
}

// Export singleton
export const digitalPhenotypingService = DigitalPhenotypingService.getInstance();
