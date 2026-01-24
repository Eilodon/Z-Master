import { create } from 'zustand';
import { ZenResponse, CulturalMode, Language, InputMode, ConversationEntry, ConnectionStatus } from '../types';

export type PermissionStatus = 'idle' | 'prompting' | 'granted' | 'denied';

export type AppStatus =
  | { kind: 'idling' }
  | { kind: 'connecting' }
  | { kind: 'connected_listening' }
  | { kind: 'processing' }
  | { kind: 'speaking' }
  | { kind: 'error', message: string };

// Removed local ConnectionStatus definition to use the one from types.ts

interface UIState {
  culturalMode: CulturalMode;
  language: Language;
  inputMode: InputMode;
  snackbar: { kind: "success" | "warn" | "error" | "info", text: string } | null;
  isLoading: boolean;
  showBreathing: boolean;
  emergencyActive: boolean;
  visualizationMode: 'soul' | 'orb'; // soul = SoulOrb (default), orb = OrbViz (premium)
  aiMode: 'online' | 'offline'; // online = Gemini API, offline = Gemini Nano

  setCulturalMode: (mode: CulturalMode) => void;
  setLanguage: (lang: Language) => void;
  setInputMode: (mode: InputMode) => void;
  setSnackbar: (snack: UIState['snackbar']) => void;
  setIsLoading: (loading: boolean) => void;
  setShowBreathing: (show: boolean) => void;
  setEmergencyActive: (active: boolean) => void;
  setVisualizationMode: (mode: 'soul' | 'orb') => void;
  setAiMode: (mode: 'online' | 'offline') => void;
}

interface ZenSessionState {
  // Strict State Machine
  status: AppStatus;

  // Data
  connectionState: ConnectionStatus;
  zenData: ZenResponse | null;
  history: ConversationEntry[];
  connectionAttempts: number;

  // Permissions State
  micStatus: PermissionStatus;
  cameraStatus: PermissionStatus;

  // Actions
  transitionTo: (newStatus: AppStatus) => void;

  setConnectionState: (state: ConnectionStatus) => void;
  setZenData: (data: ZenResponse | null) => void;
  setHistory: (history: ConversationEntry[]) => void;
  addToHistory: (entry: ConversationEntry) => void;
  incrementConnectionAttempts: () => void;
  resetConnectionAttempts: () => void;

  setMicStatus: (status: PermissionStatus) => void;
  setCameraStatus: (status: PermissionStatus) => void;
}

export const useUIStore = create<UIState>((set) => ({
  culturalMode: 'Universal',
  language: 'vi',
  inputMode: 'voice',
  snackbar: null,
  isLoading: true,
  showBreathing: false,
  emergencyActive: false,
  visualizationMode: 'soul',
  aiMode: 'online', // Default to online mode

  setCulturalMode: (mode) => set({ culturalMode: mode }),
  setLanguage: (lang) => set({ language: lang }),
  setInputMode: (mode) => set({ inputMode: mode }),
  setSnackbar: (snack) => set({ snackbar: snack }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setShowBreathing: (show) => set({ showBreathing: show }),
  setEmergencyActive: (active) => set({ emergencyActive: active }),
  setVisualizationMode: (mode) => set({ visualizationMode: mode }),
  setAiMode: (mode) => set({ aiMode: mode }),
}));

export const useZenStore = create<ZenSessionState>((set, get) => ({
  status: { kind: 'idling' },
  connectionState: 'disconnected',
  zenData: null,
  history: [],
  connectionAttempts: 0,

  micStatus: 'idle',
  cameraStatus: 'idle',

  transitionTo: (newStatus) => {
    const current = get().status;
    const result = ExtremeStateMachine.transitionWithGuard(current, newStatus);
    
    if (result.success) {
      set({ status: result.actualState });
    } else {
      // Graceful degradation - don't throw exceptions
      if (result.reason?.includes('Circuit breaker')) {
        set({ status: result.actualState });
      }
      // Log for monitoring but don't crash
      console.error('[ZenStore] Transition failed:', result.reason);
    }
  },

  setConnectionState: (state) => set({ connectionState: state }),
  setZenData: (data) => set({ zenData: data }),
  setHistory: (history) => set({ history }),
  addToHistory: (entry) => set((state) => ({ history: [...state.history, entry] })),
  incrementConnectionAttempts: () => set((state) => ({ connectionAttempts: state.connectionAttempts + 1 })),
  resetConnectionAttempts: () => set({ connectionAttempts: 0 }),

  setMicStatus: (status) => set({ micStatus: status }),
  setCameraStatus: (status) => set({ cameraStatus: status }),
}));

// --- EXTREME STATE MACHINE WITH FAULT TOLERANCE ---
// Implements Netflix-style circuit breaker + Facebook XState patterns
// Type-safe transitions with graceful degradation

interface TransitionGuard {
  canTransition(from: AppStatus, to: AppStatus): boolean;
  onInvalidTransition?(from: AppStatus, to: AppStatus): void;
}

class ExtremeStateMachine {
  private static transitionHistory: Array<{from: string, to: string, timestamp: number}> = [];
  private static circuitBreakerThreshold = 5;
  private static failureCount = 0;
  
  static transitionWithGuard(
    current: AppStatus, 
    target: AppStatus, 
    guard: TransitionGuard = defaultGuard
  ): { success: boolean; actualState: AppStatus; reason?: string } {
    const canTransition = guard.canTransition(current, target);
    
    if (!canTransition) {
      this.failureCount++;
      
      // Circuit breaker pattern - prevent cascade failures
      if (this.failureCount >= this.circuitBreakerThreshold) {
        console.error('[StateMachine] Circuit breaker triggered - entering safe mode');
        return { 
          success: false, 
          actualState: { kind: 'error', message: 'System in safe mode' },
          reason: 'Circuit breaker triggered'
        };
      }
      
      // Graceful degradation - don't crash the app
      guard.onInvalidTransition?.(current, target);
      this.transitionHistory.push({
        from: current.kind,
        to: target.kind,
        timestamp: Date.now()
      });
      
      return { 
        success: false, 
        actualState: current, 
        reason: `Invalid transition: ${current.kind} -> ${target.kind}`
      };
    }
    
    // Success - reset failure count
    this.failureCount = 0;
    return { success: true, actualState: target };
  }
}

const defaultGuard: TransitionGuard = {
  canTransition: (from, to) => {
    if (to.kind === 'error') return true;
    if (from.kind === 'error' && to.kind === 'idling') return true;
    
    const validTransitions: Record<string, string[]> = {
      'idling': ['connecting', 'processing'],
      'connecting': ['connected_listening', 'idling'],
      'connected_listening': ['processing', 'idling', 'connecting'],
      'processing': ['speaking', 'connected_listening', 'idling'],
      'speaking': ['connected_listening', 'idling']
    };
    
    return validTransitions[from.kind]?.includes(to.kind) ?? false;
  },
  onInvalidTransition: (from, to) => {
    console.warn(`[StateMachine] Invalid transition blocked: ${from.kind} -> ${to.kind}`);
    // Haptic feedback for invalid state
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(100);
    }
  }
};

function checkTransition(from: AppStatus, to: AppStatus): boolean {
  return ExtremeStateMachine.transitionWithGuard(from, to).success;
}
