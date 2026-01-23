// Event-Driven Session Service
// Replaces SessionManager singleton with proper event handling

import { stateMachine, SessionEvent, AppStatus } from '../state/StateMachine';
import { ZenLiveSession } from './ZenLiveSession';
import { ZenResponse, ConversationEntry, CulturalMode, Language } from '../../../types';
import { detectEmergency } from '../../../data/emergencyKeywords';
import { haptic } from '../../../utils/designSystem';
import { sendZenTextQuery } from '../../../services/geminiService';
import { dbService } from '../../../services/db';
import { logger } from '../../utils/logger';

export class SessionService {
  private session: ZenLiveSession | null = null;
  private analyser: AnalyserNode | null = null;
  private unsubscribe: (() => void) | null = null;
  private history: ConversationEntry[] = [];
  private zenData: ZenResponse | null = null;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.unsubscribe = stateMachine.subscribe((event: SessionEvent) => {
      this.handleSessionEvent(event);
    });
  }

  private handleSessionEvent(event: SessionEvent): void {
    switch (event.type) {
      case 'state:change':
        this.handleStateChange(event.payload);
        break;
      case 'data:update':
        this.handleDataUpdate(event.payload);
        break;
      case 'connection:change':
        this.handleConnectionChange(event.payload);
        break;
      case 'error:occurred':
        this.handleError(event.payload);
        break;
    }
  }

  private handleStateChange(payload: { from: AppStatus, to: AppStatus }): void {
    logger.info(`State transition: ${payload.from.kind} -> ${payload.to.kind}`);
    
    // Cleanup on disconnection
    if (payload.to.kind === 'idling') {
      this.cleanup();
    }
  }

  private handleDataUpdate(data: Partial<ZenResponse>): void {
    // Update local state
    this.zenData = this.zenData ? { ...this.zenData, ...data } : data as ZenResponse;

    // Emergency detection
    if (this.zenData.wisdom_text && detectEmergency(this.zenData.wisdom_text)) {
      this.triggerEmergency();
    }

    // Database logging with debouncing
    if (data.emotion && data.quantum_metrics && data.reasoning_steps) {
      if (data.reasoning_steps[0] !== 'Offline Mode') {
        const newEntry: ConversationEntry = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          emotion: data.emotion,
          quantum_metrics: data.quantum_metrics!,
          stage: data.awareness_stage,
          consciousness_dimensions: data.consciousness_dimensions
        };

        // Debounce: Only save if > 2 seconds have passed since last entry
        const last = this.history[this.history.length - 1];
        if (!last || Date.now() - last.timestamp > 2000) {
          dbService.saveEntry(newEntry);
          this.history.push(newEntry);
        }
      }
    }
  }

  private handleConnectionChange(status: string): void {
    logger.info(`Connection status: ${status}`);
  }

  private handleError(payload: { message: string }): void {
    logger.error(`Session error: ${payload.message}`);
    haptic('error');
  }

  private triggerEmergency(): void {
    // Emit emergency event through data update
    stateMachine.updateData({ action: 'emergency_protocol' as any });
    this.disconnect();
  }

  // Public API
  async connect(): Promise<AnalyserNode | null> {
    const currentState = stateMachine.getCurrentState();
    
    if (currentState.kind !== 'idling') {
      this.disconnect();
      return null;
    }

    try {
      stateMachine.transition({ kind: 'connecting' });
      stateMachine.updateConnection('reconnecting');

      // Get current UI state (would be injected or passed in)
      const culturalMode: CulturalMode = 'Universal'; // Default
      const language: Language = 'vi';

      this.session = new ZenLiveSession(
        culturalMode,
        language,
        (data) => stateMachine.updateData(data),
        (active) => stateMachine.transition(active ? { kind: 'speaking' } : { kind: 'connected_listening' }),
        (reason, isReconnecting) => this.handleDisconnect(reason, isReconnecting)
      );

      haptic('success');
      this.analyser = await this.session.connect();
      
      stateMachine.transition({ kind: 'connected_listening' });
      stateMachine.updateConnection('connected');

      return this.analyser;

    } catch (error: any) {
      logger.error('Connection failed:', error);
      stateMachine.transition({ kind: 'error', message: error.message });
      stateMachine.updateConnection('disconnected');
      return null;
    }
  }

  disconnect(): void {
    if (this.session) {
      this.session.disconnect();
      haptic('warn');
    }
    this.cleanup();
  }

  async sendText(text: string): Promise<ZenResponse | null> {
    if (!text.trim()) return null;
    if (this.session) this.disconnect();

    try {
      haptic('selection');
      stateMachine.transition({ kind: 'processing' });

      // Get current UI state
      const culturalMode: CulturalMode = 'Universal'; // Default
      const language: Language = 'vi';

      const apiKey = await this.getApiKey();
      const response = await sendZenTextQuery(apiKey, text, culturalMode, language);

      stateMachine.updateData(response);
      haptic('success');
      stateMachine.transition({ kind: 'idling' });

      return response;

    } catch (error: any) {
      logger.error('Text query failed:', error);
      stateMachine.transition({ kind: 'idling' });
      return null;
    }
  }

  private handleDisconnect(reason?: string, isReconnecting?: boolean): void {
    if (isReconnecting) {
      stateMachine.updateConnection('reconnecting');
      return;
    }

    stateMachine.updateConnection('disconnected');
    this.cleanup();

    if (reason === "FALLBACK_TO_TEXT") {
      // Emit event to switch to text mode
      stateMachine.updateData({ action: 'switch_to_text' as any });
      haptic('warn');
    }
  }

  private cleanup(): void {
    this.session = null;
    this.analyser = null;
    stateMachine.transition({ kind: 'idling' });
  }

  private async getApiKey(): Promise<string> {
    // Implement secure API key retrieval
    const key = localStorage.getItem('GEMINI_API_KEY');
    if (!key) throw new Error("API_KEY_MISSING");
    return key;
  }

  // Getters for UI components
  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  getZenData(): ZenResponse | null {
    return this.zenData;
  }

  getHistory(): ConversationEntry[] {
    return [...this.history];
  }

  // Cleanup
  destroy(): void {
    this.disconnect();
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

// Singleton service instance
export const sessionService = new SessionService();
