
export interface SecurityResult {
  isSafe: boolean;
  reason?: 'SELF_HARM' | 'VIOLENCE' | 'EXTREME_PROFANITY';
  triggerWord?: string;
  score: number;
}

interface SafetyPattern {
  pattern: RegExp;
  weight: number;
  category: 'SELF_HARM' | 'VIOLENCE' | 'EXTREME_PROFANITY';
}

const SAFETY_PATTERNS: SafetyPattern[] = [
  // --- SELF HARM (High Weight) ---
  { pattern: /(kill|hurt|cut) (myself|me)/i, weight: 1.0, category: 'SELF_HARM' },
  { pattern: /suicid(e|al)/i, weight: 1.0, category: 'SELF_HARM' },
  { pattern: /end (it|my life)/i, weight: 0.9, category: 'SELF_HARM' },
  { pattern: /want to die/i, weight: 1.0, category: 'SELF_HARM' },
  // Vietnamese
  { pattern: /(muốn|định|sẽ) (chết|tự tử|tự sát|nhảy lầu)/i, weight: 1.0, category: 'SELF_HARM' },
  { pattern: /không (muốn|cần) sống/i, weight: 0.9, category: 'SELF_HARM' },
  { pattern: /cắt tay/i, weight: 0.9, category: 'SELF_HARM' },
  { pattern: /kết thúc cuộc đời/i, weight: 0.9, category: 'SELF_HARM' },

  // --- VIOLENCE (Medium-High Weight) ---
  { pattern: /(kill|shoot|murder|bomb) (them|him|her|people|everyone)/i, weight: 1.0, category: 'VIOLENCE' },
  { pattern: /giết (nó|hắn|người)/i, weight: 1.0, category: 'VIOLENCE' },
  { pattern: /xả súng/i, weight: 1.0, category: 'VIOLENCE' },
  { pattern: /đánh bom/i, weight: 1.0, category: 'VIOLENCE' }
];

export class SafetyGuard {
  static scanInput(text: string): SecurityResult {
    // Normalize
    const normalized = text.toLowerCase().trim();

    let maxScore = 0;
    let worstCategory: SecurityResult['reason'] | undefined;
    let triggeredWord = "";

    for (const p of SAFETY_PATTERNS) {
      const match = normalized.match(p.pattern);
      if (match) {
        if (p.weight > maxScore) {
          maxScore = p.weight;
          worstCategory = p.category;
          triggeredWord = match[0];
        }
      }
    }

    // Thresholds
    const THRESHOLD = 0.8; // High confidence trigger

    if (maxScore >= THRESHOLD && worstCategory) {
      return {
        isSafe: false,
        reason: worstCategory,
        triggerWord: triggeredWord,
        score: maxScore
      };
    }

    return { isSafe: true, score: maxScore };
  }

  static getMockCrisisResponse(trigger: string): any {
    return {
      emotion: 'seeking',
      wisdom_text: "Thầy nghe thấy nỗi đau của con. Hãy dừng lại một chút. Hít thở cùng Thầy.",
      quantum_metrics: { coherence: 0.1, entanglement: 1.0, presence: 1.0 },
      reasoning_steps: [`DETECTED_CRISIS_TRIGGER: ${trigger}`, "ACTIVATING_EMERGENCY_PROTOCOL", "SEVERITY_SCORE: HIGH"],
      breathing: '4-7-8',
      confidence: 1.0,
      user_transcript: "[Safety Protocol Activated]",
      awareness_stage: 'reflexive',
      consciousness_dimensions: { contextual: 0, emotional: 1, cultural: 0, wisdom: 0, uncertainty: 1, relational: 0 }
    };
  }
}
