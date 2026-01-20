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

  setCulturalMode: (mode: CulturalMode) => void;
  setLanguage: (lang: Language) => void;
  setInputMode: (mode: InputMode) => void;
  setSnackbar: (snack: UIState['snackbar']) => void;
  setIsLoading: (loading: boolean) => void;
  setShowBreathing: (show: boolean) => void;
  setEmergencyActive: (active: boolean) => void;
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

  setCulturalMode: (mode) => set({ culturalMode: mode }),
  setLanguage: (lang) => set({ language: lang }),
  setInputMode: (mode) => set({ inputMode: mode }),
  setSnackbar: (snack) => set({ snackbar: snack }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setShowBreathing: (show) => set({ showBreathing: show }),
  setEmergencyActive: (active) => set({ emergencyActive: active }),
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
    const allowed = checkTransition(current, newStatus);
    if (allowed) {
      set({ status: newStatus });
    } else {
      console.error(`[ZenStore] Invalid State Transition: ${current.kind} -> ${newStatus.kind}`);
      // In strict mode, we might throw, but for now we log error
      // set({ status: newStatus }); // Forced for now until UI updates match
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

// -- Invariant Checker --
function checkTransition(from: AppStatus, to: AppStatus): boolean {
  if (to.kind === 'error') return true; // Can error from anywhere
  if (from.kind === 'error' && to.kind === 'idling') return true; // Reset

  switch (from.kind) {
    case 'idling':
      return to.kind === 'connecting';
    case 'connecting':
      return to.kind === 'connected_listening' || to.kind === 'idling'; // cancel or success
    case 'connected_listening':
      return to.kind === 'processing' || to.kind === 'idling' || to.kind === 'connecting'; // re-connect
    case 'processing':
      return to.kind === 'speaking' || to.kind === 'connected_listening' || to.kind === 'idling';
    case 'speaking':
      return to.kind === 'connected_listening' || to.kind === 'idling';
    default:
      return true;
  }
}
