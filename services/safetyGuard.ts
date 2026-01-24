
import Sentiment from 'sentiment';

// Initialize Sentiment Analyzer (Local, fast, no API)
const sentiment = new Sentiment();

// Register Vietnamese Language Pack (Basic)
// In production, this would be a more comprehensive dictionary
const vnLanguage = {
  labels: {
    'chết': -5, 'tự tử': -10, 'giết': -10, 'đau': -2, 'buồn': -2, 'khổ': -2,
    'tuyệt vọng': -5, 'nhảy lầu': -10, 'cắt tay': -8, 'kết thúc': -3,
    'hận': -4, 'căm': -4, 'ghét': -3,
    'an vui': 3, 'hạnh phúc': 5, 'yêu': 4, 'thương': 3
  }
};
sentiment.registerLanguage('vi', vnLanguage);

export interface SecurityResult {
  isSafe: boolean;
  reason?: 'EXTREME_NEGATIVE' | 'SELF_HARM' | 'VIOLENCE';
  score: number; // -10 to 10
  analysis: any;
}

export class SafetyGuard {

  /**
   * Scans input using Semantic Sentiment Analysis.
   * Deterministic, local, and harder to bypass with simple typos.
   */
  static scanInput(text: string): SecurityResult {
    // 1. Analyze Sentiment
    // Auto-detect language or just run both packs?
    // For now, we run standard + vi custom
    const result = sentiment.analyze(text, { language: 'vi' });

    // 2. Thresholds
    // Score < 0 is negative. Score < -5 is very negative.
    // Comparative score (ratio) is also useful.

    // A sudden drop in valence to Extreme Negative suggests Crisis or Aggression
    if (result.score <= -7) {
      return {
        isSafe: false,
        reason: 'SELF_HARM', // Conservatively assume worst case for extreme negatives
        score: result.score,
        analysis: result
      }
    }

    if (result.score < -4) {
      // Warning zone
      return {
        isSafe: true, // Mark safe but maybe flag for "Compassion Mode"
        reason: 'EXTREME_NEGATIVE',
        score: result.score,
        analysis: result
      }
    }

    return {
      isSafe: true,
      score: result.score,
      analysis: result
    };
  }

  static getMockCrisisResponse(trigger: string): any {
    return {
      emotion: 'seeking',
      wisdom_text: "Thầy cảm nhận được nỗi nặng lòng của con. Mọi thứ đều có thể sẻ chia. Thầy ở đây.",
      mindfulness_metrics: { attention_stability: 0.1, emotional_regulation: 1.0, present_moment_awareness: 1.0 },
      reasoning_steps: [`SENTIMENT_DROP_DETECTED: ${trigger}`, "MODE: COMPASSION_FIRST"],
      breathing: '4-7-8',
      confidence: 1.0,
      user_transcript: "[Deep Listening Mode]",
      awareness_stage: 'reflexive',
      psychological_dimensions: { contextual: 0, emotional: 1, cultural: 0, wisdom: 1, acceptance: 0, relational: 1 }
    };
  }
}
