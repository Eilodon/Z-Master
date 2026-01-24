// UI Business Logic Service
// Extracts business logic from UI components

import { stateMachine } from '../core/state/StateMachine';
import { sessionService } from '../core/connection/SessionService';
import { ZenResponse, CulturalMode, Language, AppState } from '../../types';
import { haptic } from '../../utils/designSystem';
import { detectEmergency } from '../../data/emergencyKeywords';

export interface UIAction {
  type: 'CONNECT' | 'DISCONNECT' | 'SEND_TEXT' | 'TOGGLE_LANGUAGE' | 'TOGGLE_INPUT_MODE' | 'CHANGE_MODE' | 'RESET_SESSION';
  payload?: any;
}

export interface UIState {
  canConnect: boolean;
  canDisconnect: boolean;
  canSendText: boolean;
  isProcessing: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  currentLanguage: Language;
  currentInputMode: 'voice' | 'text';
  currentCulturalMode: CulturalMode;
}

export class UIBusinessLogic {
  private static instance: UIBusinessLogic;
  private eventListeners: Set<(state: UIState) => void> = new Set();
  private currentState: UIState;

  private constructor() {
    this.currentState = this.initializeState();
    this.setupStateMachineListener();
  }

  static getInstance(): UIBusinessLogic {
    if (!UIBusinessLogic.instance) {
      UIBusinessLogic.instance = new UIBusinessLogic();
    }
    return UIBusinessLogic.instance;
  }

  private initializeState(): UIState {
    const machineState = stateMachine.getCurrentState();
    return {
      canConnect: machineState.kind === 'idling',
      canDisconnect: machineState.kind !== 'idling',
      canSendText: machineState.kind === 'idling',
      isProcessing: machineState.kind === 'processing',
      isListening: machineState.kind === 'connected_listening',
      isSpeaking: machineState.kind === 'speaking',
      currentLanguage: 'vi', // Default, would come from UI store
      currentInputMode: 'voice', // Default, would come from UI store
      currentCulturalMode: 'Universal' // Default, would come from UI store
    };
  }

  private setupStateMachineListener(): void {
    stateMachine.subscribe((event) => {
      if (event.type === 'state:change') {
        this.updateUIState();
      }
    });
  }

  private updateUIState(): void {
    const machineState = stateMachine.getCurrentState();
    const newState: UIState = {
      ...this.currentState,
      canConnect: machineState.kind === 'idling',
      canDisconnect: machineState.kind !== 'idling',
      canSendText: machineState.kind === 'idling',
      isProcessing: machineState.kind === 'processing',
      isListening: machineState.kind === 'connected_listening',
      isSpeaking: machineState.kind === 'speaking'
    };

    if (JSON.stringify(newState) !== JSON.stringify(this.currentState)) {
      this.currentState = newState;
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(this.currentState);
      } catch (error) {
        console.error('[UIBusinessLogic] Listener error:', error);
      }
    });
  }

  // Public API for UI components
  subscribe(listener: (state: UIState) => void): () => void {
    this.eventListeners.add(listener);
    listener(this.currentState); // Send current state immediately
    return () => this.eventListeners.delete(listener);
  }

  getCurrentState(): UIState {
    return { ...this.currentState };
  }

  // Action handlers
  async handleAction(action: UIAction): Promise<any> {
    switch (action.type) {
      case 'CONNECT':
        return this.handleConnect(action.payload);
      case 'DISCONNECT':
        return this.handleDisconnect();
      case 'SEND_TEXT':
        return this.handleSendText(action.payload);
      case 'TOGGLE_LANGUAGE':
        return this.handleToggleLanguage();
      case 'TOGGLE_INPUT_MODE':
        return this.handleToggleInputMode();
      case 'CHANGE_MODE':
        return this.handleModeChange(action.payload);
      case 'RESET_SESSION':
        return this.handleResetSession();
      default:
        console.warn('[UIBusinessLogic] Unknown action:', action.type);
        return null;
    }
  }

  private async handleConnect(micStatus?: string): Promise<AnalyserNode | null> {
    if (micStatus === 'denied') {
      throw new Error('MICROPHONE_DENIED');
    }

    if (micStatus === 'granted') {
      return await sessionService.connect();
    }

    // Need to request permissions first
    throw new Error('PERMISSION_REQUIRED');
  }

  private handleDisconnect(): void {
    sessionService.disconnect();
  }

  private async handleSendText(text: string): Promise<ZenResponse | null> {
    if (!text.trim()) {
      return null;
    }

    // Offline check
    if (!navigator.onLine) {
      return this.getOfflineResponse(text);
    }

    try {
      const response = await sessionService.sendText(text);
      
      // Emergency detection
      if (detectEmergency(text) || (response && detectEmergency(response.wisdom_text))) {
        this.triggerEmergency();
      }

      return response;
    } catch (error) {
      console.error('[UIBusinessLogic] Send text failed:', error);
      return null;
    }
  }

  private handleToggleLanguage(): void {
    const newLang = this.currentState.currentLanguage === 'vi' ? 'en' : 'vi';
    this.currentState.currentLanguage = newLang;
    
    // Update UI store (would be injected)
    haptic('selection');
    
    // Restart session if active
    if (this.currentState.isListening || this.currentState.isSpeaking) {
      sessionService.disconnect();
      setTimeout(() => sessionService.connect(), 500);
    }
    
    this.notifyListeners();
  }

  private handleToggleInputMode(): void {
    const newMode = this.currentState.currentInputMode === 'voice' ? 'text' : 'voice';
    this.currentState.currentInputMode = newMode;
    
    // Update UI store (would be injected)
    haptic('selection');
    
    // Disconnect voice session if switching to text
    if (newMode === 'text') {
      sessionService.disconnect();
    }
    
    this.notifyListeners();
  }

  private handleModeChange(mode: CulturalMode): void {
    this.currentState.currentCulturalMode = mode;
    
    // Update UI store (would be injected)
    haptic('success');
    
    // Restart session if active
    if (this.currentState.isListening || this.currentState.isSpeaking) {
      sessionService.disconnect();
      setTimeout(() => sessionService.connect(), 500);
    }
    
    this.notifyListeners();
  }

  private handleResetSession(): void {
    haptic('warn');
    sessionService.disconnect();
    
    // Clear session data
    stateMachine.updateData(null);
    
    this.notifyListeners();
  }

  private triggerEmergency(): void {
    stateMachine.updateData({ action: 'emergency_protocol' as any });
  }

  private getOfflineResponse(text: string): ZenResponse {
    const lang = this.currentState.currentLanguage;
    return {
      emotion: 'calm',
      wisdom_text: lang === 'vi'
        ? \"Mạng không ổn định. Hãy quay về nương tựa nơi hơi thở.\"
        : \"Connection lost. Return to the island of self through breathing.\",
      wisdom_english: \"Breathing in, I calm my body.\",
      user_transcript: text,
      breathing: '4-7-8',
      confidence: 1,
      reasoning_steps: ['Offline Mode', 'Triggering Local Breathing'],
      mindfulness_metrics: { attention_stability: 0.8, emotional_regulation: 0.5, present_moment_awareness: 0.9 },
      awareness_stage: 'mindful',
      psychological_dimensions: { contextual: 0.5, emotional: 0.5, cultural: 0.5, wisdom: 0.5, acceptance: 0.5, relational: 0.5 },
      ambient_sound: 'rain'
    };
  }

  // Utility methods
  canPerformAction(action: UIAction['type']): boolean {
    switch (action) {
      case 'CONNECT':
        return this.currentState.canConnect;
      case 'DISCONNECT':
        return this.currentState.canDisconnect;
      case 'SEND_TEXT':
        return this.currentState.canSendText;
      default:
        return true;
    }
  }

  // Get session data for UI
  getSessionData(): ZenResponse | null {
    return sessionService.getZenData();
  }

  getHistory(): any[] {
    return sessionService.getHistory();
  }

  getAnalyser(): AnalyserNode | null {
    return sessionService.getAnalyser();
  }
}

// Export singleton instance
export const uiBusinessLogic = UIBusinessLogic.getInstance();
