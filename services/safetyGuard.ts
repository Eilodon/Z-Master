
export interface SecurityResult {
  isSafe: boolean;
  reason?: 'SELF_HARM' | 'VIOLENCE' | 'EXTREME_PROFANITY';
  triggerWord?: string;
}

const CRISIS_KEYWORDS = [
  'kill myself', 'suicide', 'hurt myself', 'die', 'end it all', 'cutting myself', 
  'muốn chết', 'tự tử', 'tự sát', 'đau khổ quá', 'không muốn sống', 'nhảy lầu', 'cắt tay'
];

const VIOLENCE_KEYWORDS = [
  'bomb', 'kill them', 'shoot', 'murder',
  'giết người', 'đánh bom', 'xả súng', 'đâm chết'
];

export class SafetyGuard {
  static scanInput(text: string): SecurityResult {
    const lower = text.toLowerCase();

    // Check Crisis (Priority 1)
    for (const kw of CRISIS_KEYWORDS) {
      if (lower.includes(kw)) {
        return { isSafe: false, reason: 'SELF_HARM', triggerWord: kw };
      }
    }

    // Check Violence
    for (const kw of VIOLENCE_KEYWORDS) {
        if (lower.includes(kw)) {
            return { isSafe: false, reason: 'VIOLENCE', triggerWord: kw };
        }
    }

    return { isSafe: true };
  }

  static getMockCrisisResponse(trigger: string): any {
      return {
          emotion: 'seeking',
          wisdom_text: "Thầy nghe thấy nỗi đau của con. Hãy dừng lại một chút. Hít thở cùng Thầy.",
          quantum_metrics: { coherence: 0.1, entanglement: 1.0, presence: 1.0 },
          reasoning_steps: [`DETECTED_CRISIS_TRIGGER: ${trigger}`, "ACTIVATING_EMERGENCY_PROTOCOL"],
          breathing: '4-7-8',
          confidence: 1.0,
          user_transcript: "[Safety Protocol Activated]",
          awareness_stage: 'reflexive',
          consciousness_dimensions: { contextual: 0, emotional: 1, cultural: 0, wisdom: 0, uncertainty: 1, relational: 0 }
      };
  }
}
