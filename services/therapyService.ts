// Therapy Service - Manages conversational therapy modules
// Handles session state, progress tracking, and clinical outcomes

import { 
  TherapyModule, 
  TherapySession, 
  TherapySessionState, 
  SessionProgress, 
  UserResponse, 
  HomeworkStatus,
  ThoughtRecord,
  ValuesClarification,
  EmotionRegulationSkill,
  TherapyMetrics
} from '../types/therapy';
import { therapyModules } from '../data/therapyModules';
import { dbService } from './db';

export class TherapyService {
  private static instance: TherapyService;
  private currentSession: TherapySessionState | null = null;
  
  static getInstance(): TherapyService {
    if (!TherapyService.instance) {
      TherapyService.instance = new TherapyService();
    }
    return TherapyService.instance;
  }

  // Module Management
  async getAvailableModules(): Promise<TherapyModule[]> {
    return Object.values(therapyModules);
  }

  async getModule(moduleId: string): Promise<TherapyModule | null> {
    return therapyModules[moduleId] || null;
  }

  async recommendModules(symptoms: string[], preferences: string[]): Promise<TherapyModule[]> {
    const recommendations: TherapyModule[] = [];
    
    // Symptom-based matching with clinical weighting
    const symptomWeights: Record<string, number> = {
      'depression': 3,
      'hopelessness': 3,
      'anxiety': 3,
      'worry': 2,
      'panic': 3,
      'stress': 2,
      'burnout': 2,
      'overwhelm': 1
    };

    for (const [moduleId, module] of Object.entries(therapyModules)) {
      let score = 0;
      
      // Calculate symptom match score
      for (const symptom of symptoms) {
        if (module.target_symptoms.includes(symptom)) {
          score += symptomWeights[symptom] || 1;
        }
      }
      
      // Preference bonus
      for (const pref of preferences) {
        if (module.name.toLowerCase().includes(pref.toLowerCase())) {
          score += 2;
        }
      }
      
      // Include if score exceeds threshold
      if (score >= 2) {
        recommendations.push(module);
      }
    }
    
    // Sort by score (descending)
    return recommendations.sort((a, b) => {
      const scoreA = this.calculateModuleScore(a, symptoms, preferences);
      const scoreB = this.calculateModuleScore(b, symptoms, preferences);
      return scoreB - scoreA;
    });
  }

  private calculateModuleScore(module: TherapyModule, symptoms: string[], preferences: string[]): number {
    let score = 0;
    
    for (const symptom of symptoms) {
      if (module.target_symptoms.includes(symptom)) {
        score += 2;
      }
    }
    
    for (const pref of preferences) {
      if (module.name.toLowerCase().includes(pref.toLowerCase())) {
        score += 1;
      }
    }
    
    return score;
  }

  // Session Management
  async startTherapySession(moduleId: string, sessionNumber: number = 1): Promise<TherapySessionState> {
    const module = await this.getModule(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    const session = module.sessions.find(s => s.number === sessionNumber);
    if (!session) {
      throw new Error(`Session ${sessionNumber} not found in module ${moduleId}`);
    }

    // Check prerequisites
    if (session.prerequisites && sessionNumber > 1) {
      const previousSession = module.sessions.find(s => s.number === sessionNumber - 1);
      if (!previousSession) {
        throw new Error(`Prerequisite session ${sessionNumber - 1} not completed`);
      }
    }

    this.currentSession = {
      current_module: module,
      current_session: session,
      session_progress: {
        current_step: 'opening',
        step_progress: 0,
        time_spent: 0,
        exercises_completed: []
      },
      user_responses: [],
      homework_status: []
    };

    // Save session state
    await this.saveSessionState();
    
    return this.currentSession;
  }

  async getCurrentSession(): Promise<TherapySessionState | null> {
    if (!this.currentSession) {
      // Try to load from storage
      this.currentSession = await this.loadSessionState();
    }
    return this.currentSession;
  }

  async advanceSession(): Promise<TherapySessionState> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const { session_progress } = this.currentSession;
    
    // Determine next step
    const stepOrder: Array<'opening' | 'exercise' | 'homework' | 'assessment' | 'complete'> = 
      ['opening', 'exercise', 'homework', 'assessment', 'complete'];
    
    const currentIndex = stepOrder.indexOf(session_progress.current_step);
    
    if (currentIndex < stepOrder.length - 1) {
      session_progress.current_step = stepOrder[currentIndex + 1];
      session_progress.step_progress = 0;
      
      await this.saveSessionState();
      return this.currentSession;
    }
    
    throw new Error('Session already completed');
  }

  async recordResponse(response: Omit<UserResponse, 'timestamp'>): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const fullResponse: UserResponse = {
      ...response,
      timestamp: Date.now()
    };

    // Analyze response for clinical markers
    if (response.response) {
      fullResponse.clinical_markers = this.analyzeClinicalMarkers(response.response);
      fullResponse.sentiment = this.analyzeSentiment(response.response);
    }

    this.currentSession.user_responses.push(fullResponse);
    await this.saveSessionState();
  }

  private analyzeClinicalMarkers(text: string): string[] {
    const markers: string[] = [];
    const lowerText = text.toLowerCase();

    // Depression markers
    if (lowerText.includes('vô dụng') || lowerText.includes('tệ hại') || lowerText.includes('hy vọng')) {
      markers.push('depression_risk');
    }

    // Anxiety markers
    if (lowerText.includes('lo lắng') || lowerText.includes('sợ hãi') || lowerText.includes('hoảng loạn')) {
      markers.push('anxiety_risk');
    }

    // Suicide/self-harm markers (CRITICAL)
    if (lowerText.includes('tự tử') || lowerText.includes('tự làm hại') || lowerText.includes('chết đi')) {
      markers.push('crisis_immediate');
    }

    // Positive markers
    if (lowerText.includes('hy vọng') || lowerText.includes('cải thiện') || lowerText.includes('tốt hơn')) {
      markers.push('positive_outlook');
    }

    return markers;
  }

  private analyzeSentiment(text: string): number {
    // Simple sentiment analysis (-1 to 1)
    const positiveWords = ['tốt', 'hạnh phúc', 'vui vẻ', 'hy vọng', 'cải thiện', 'thành công'];
    const negativeWords = ['tệ', 'buồn', 'lo lắng', 'sợ hãi', 'vô dụng', 'thất bại', 'đau khổ'];
    
    const lowerText = text.toLowerCase();
    let score = 0;
    
    for (const word of positiveWords) {
      if (lowerText.includes(word)) score += 1;
    }
    
    for (const word of negativeWords) {
      if (lowerText.includes(word)) score -= 1;
    }
    
    // Normalize to -1 to 1
    return Math.max(-1, Math.min(1, score / 5));
  }

  // Homework Management
  async assignHomework(homeworkId: string): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const homework = this.currentSession.current_session?.conversation_flow.homework;
    if (!homework) {
      throw new Error('No homework in current session');
    }

    const homeworkStatus: HomeworkStatus = {
      homework_id: homeworkId,
      assigned_date: Date.now(),
      due_date: Date.now() + (homework.reminder.days * 24 * 60 * 60 * 1000),
      completed: false
    };

    this.currentSession.homework_status.push(homeworkStatus);
    await this.saveSessionState();
    
    // Schedule reminder (would need notification service)
    this.scheduleHomeworkReminder(homeworkStatus, homework);
  }

  async completeHomework(homeworkId: string, notes?: string): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const homework = this.currentSession.homework_status.find(h => h.homework_id === homeworkId);
    if (!homework) {
      throw new Error(`Homework ${homeworkId} not found`);
    }

    homework.completed = true;
    homework.completion_date = Date.now();
    homework.user_notes = notes;

    await this.saveSessionState();
  }

  private scheduleHomeworkReminder(homework: HomeworkStatus, homeworkData: any): void {
    // This would integrate with device notification system
    // For now, just log the reminder
    console.log(`Homework reminder scheduled for ${new Date(homework.due_date)}`);
  }

  // Progress Tracking & Outcomes
  async calculateSessionMetrics(): Promise<TherapyMetrics> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const module = this.currentSession.current_module;
    const responses = this.currentSession.user_responses;
    const homework = this.currentSession.homework_status;

    // Calculate completion rate
    const completedExercises = this.currentSession.session_progress.exercises_completed.length;
    const totalExercises = this.currentSession.current_session?.conversation_flow.exercises.length || 1;
    const completionRate = completedExercises / totalExercises;

    // Calculate homework adherence
    const completedHomework = homework.filter(h => h.completed).length;
    const homeworkAdherence = homework.length > 0 ? completedHomework / homework.length : 0;

    // Calculate user satisfaction (based on sentiment)
    const avgSentiment = responses.length > 0 
      ? responses.reduce((sum, r) => sum + (r.sentiment || 0), 0) / responses.length 
      : 0;
    const userSatisfaction = (avgSentiment + 1) / 2; // Convert from -1,1 to 0,1

    // Symptom change would be calculated from pre/post assessments
    const symptomChange = 0; // Placeholder - would need assessment data

    return {
      completion_rate: completionRate,
      symptom_change: symptomChange,
      user_satisfaction: userSatisfaction,
      homework_adherence: homeworkAdherence,
      phq9_change: module.completion_metrics.phq9_change,
      gad7_change: module.completion_metrics.gad7_change,
      maas_change: module.completion_metrics.maas_change
    };
  }

  async completeSession(): Promise<TherapyMetrics> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const metrics = await this.calculateSessionMetrics();
    
    // Save completion metrics
    await this.saveSessionMetrics(metrics);
    
    // Clear current session
    this.currentSession = null;
    await this.saveSessionState();

    return metrics;
  }

  // Data Persistence
  private async saveSessionState(): Promise<void> {
    if (!this.currentSession) return;
    
    const key = 'therapy_session_state';
    // Store in localStorage for now - therapy data is less sensitive than conversations
    localStorage.setItem(key, JSON.stringify(this.currentSession));
  }

  private async loadSessionState(): Promise<TherapySessionState | null> {
    const key = 'therapy_session_state';
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  }

  private async saveSessionMetrics(metrics: TherapyMetrics): Promise<void> {
    const key = 'therapy_metrics';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push({
      timestamp: Date.now(),
      ...metrics
    });
    localStorage.setItem(key, JSON.stringify(existing));
  }

  // Clinical Data Export
  async getClinicalData(): Promise<{
    sessions: TherapySessionState[];
    metrics: TherapyMetrics[];
    assessments: any[];
  }> {
    const sessions = await this.getAllSessions();
    const metrics = await this.getAllMetrics();
    const assessments = await this.getAllAssessments();

    return { sessions, metrics, assessments };
  }

  private async getAllSessions(): Promise<TherapySessionState[]> {
    // Would retrieve all completed sessions from storage
    return [];
  }

  private async getAllMetrics(): Promise<TherapyMetrics[]> {
    const key = 'therapy_metrics';
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  private async getAllAssessments(): Promise<any[]> {
    // Would retrieve all assessment results
    return [];
  }

  // Crisis Detection
  async checkForCrisisIndicators(): Promise<{
    is_crisis: boolean;
    severity: 'low' | 'medium' | 'high' | 'immediate';
    indicators: string[];
    recommendations: string[];
  }> {
    if (!this.currentSession) {
      return { is_crisis: false, severity: 'low', indicators: [], recommendations: [] };
    }

    const recentResponses = this.currentSession.user_responses.slice(-5); // Last 5 responses
    const crisisMarkers = recentResponses.flatMap(r => r.clinical_markers || []);
    
    const isCrisis = crisisMarkers.includes('crisis_immediate');
    const hasRiskMarkers = crisisMarkers.some(m => m.includes('risk'));
    
    let severity: 'low' | 'medium' | 'high' | 'immediate' = 'low';
    const recommendations: string[] = [];

    if (isCrisis) {
      severity = 'immediate';
      recommendations.push('Activate emergency protocol immediately');
      recommendations.push('Provide crisis hotline resources');
    } else if (hasRiskMarkers) {
      severity = 'high';
      recommendations.push('Increase session frequency');
      recommendations.push('Consider therapist referral');
    } else if (crisisMarkers.length > 0) {
      severity = 'medium';
      recommendations.push('Monitor closely');
      recommendations.push('Add check-in sessions');
    }

    return {
      is_crisis: isCrisis || hasRiskMarkers,
      severity,
      indicators: crisisMarkers,
      recommendations
    };
  }
}

// Export singleton instance
export const therapyService = TherapyService.getInstance();
