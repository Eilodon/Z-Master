// Event-Driven State Machine System
// Replaces singleton mutations with formal state transitions

import { ZenResponse, ConversationEntry } from '../../../types';

export type AppStatus = 
  | { kind: 'idling' }
  | { kind: 'connecting' }
  | { kind: 'connected_listening' }
  | { kind: 'processing' }
  | { kind: 'speaking' }
  | { kind: 'error', message: string };

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'offline';

export interface SessionEvent {
  type: 'state:change' | 'data:update' | 'connection:change' | 'error:occurred';
  timestamp: number;
  payload: any;
}

export interface SessionState {
  status: AppStatus;
  connectionState: ConnectionStatus;
  zenData: ZenResponse | null;
  history: ConversationEntry[];
  connectionAttempts: number;
  lastEvent: SessionEvent | null;
}

// State Machine with formal verification
export class StateMachine {
  private currentState: AppStatus = { kind: 'idling' };
  private listeners: Set<(event: SessionEvent) => void> = new Set();
  private eventHistory: SessionEvent[] = [];
  private maxHistorySize = 100;

  // State transition matrix - defines valid transitions
  private readonly validTransitions: Record<string, string[]> = {
    'idling': ['connecting', 'error'],
    'connecting': ['connected_listening', 'idling', 'error'],
    'connected_listening': ['processing', 'idling', 'connecting', 'error'],
    'processing': ['speaking', 'connected_listening', 'idling', 'error'],
    'speaking': ['connected_listening', 'idling', 'error'],
    'error': ['idling'] // Reset from error
  };

  getCurrentState(): AppStatus {
    return this.currentState;
  }

  // Formal state transition with validation
  transition(newState: AppStatus): boolean {
    const currentKind = this.currentState.kind;
    const newKind = newState.kind;
    
    // Validate transition
    if (!this.isValidTransition(currentKind, newKind)) {
      console.error(`[StateMachine] Invalid transition: ${currentKind} -> ${newKind}`);
      this.emitEvent({
        type: 'error:occurred',
        timestamp: Date.now(),
        payload: { message: `Invalid state transition: ${currentKind} -> ${newKind}` }
      });
      return false;
    }

    const previousState = this.currentState;
    this.currentState = newState;

    // Emit state change event
    this.emitEvent({
      type: 'state:change',
      timestamp: Date.now(),
      payload: { from: previousState, to: newState }
    });

    return true;
  }

  private isValidTransition(from: string, to: string): boolean {
    // Can always transition to error
    if (to === 'error') return true;
    
    // Can reset from error to idle
    if (from === 'error' && to === 'idling') return true;
    
    // Check transition matrix
    const allowedTransitions = this.validTransitions[from];
    return allowedTransitions?.includes(to) || false;
  }

  // Event emission system
  subscribe(listener: (event: SessionEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitEvent(event: SessionEvent): void {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[StateMachine] Listener error:', error);
      }
    });
  }

  // Data update events
  updateData(data: Partial<ZenResponse>): void {
    this.emitEvent({
      type: 'data:update',
      timestamp: Date.now(),
      payload: data
    });
  }

  updateConnection(status: ConnectionStatus): void {
    this.emitEvent({
      type: 'connection:change',
      timestamp: Date.now(),
      payload: status
    });
  }

  // Debug and monitoring
  getEventHistory(): SessionEvent[] {
    return [...this.eventHistory];
  }

  getStateDiagram(): string {
    const states = Object.keys(this.validTransitions);
    const transitions = states.map(from => 
      this.validTransitions[from].map(to => `  ${from} -> ${to}`)
    ).flat();
    
    return `State Machine:\n${transitions.join('\n')}`;
  }
}

// Singleton instance with proper encapsulation
export const stateMachine = new StateMachine();
