/**
 * Offline AI Service using Gemini Nano (Chrome 131+)
 * Falls back to rule-based responses if Gemini Nano not available
 */

import { ZenResponse, Language, CulturalMode } from '../types';

// Type definitions for Chrome's AI APIs
interface AILanguageModel {
    create(): Promise<AILanguageModelSession>;
}

interface AILanguageModelSession {
    prompt(text: string): Promise<string>;
    destroy(): void;
}

interface WindowAI {
    languageModel?: AILanguageModel;
}

declare global {
    interface Window {
        ai?: WindowAI;
    }
}

// Singleton session for reuse
let nanoSession: AILanguageModelSession | null = null;

/**
 * Check if Gemini Nano is available in the browser
 */
export const isGeminiNanoAvailable = async (): Promise<boolean> => {
    try {
        if ('ai' in window && window.ai?.languageModel) {
            return true;
        }
        return false;
    } catch {
        return false;
    }
};

/**
 * Initialize Gemini Nano session
 */
export const initGeminiNano = async (): Promise<boolean> => {
    try {
        if (!window.ai?.languageModel) {
            console.warn('[OfflineAI] Gemini Nano not available in this browser');
            return false;
        }

        nanoSession = await window.ai.languageModel.create();
        console.log('[OfflineAI] Gemini Nano session initialized');
        return true;
    } catch (error) {
        console.error('[OfflineAI] Failed to initialize Gemini Nano:', error);
        return false;
    }
};

/**
 * Get Zen response using Gemini Nano (offline AI)
 */
export const getOfflineZenResponse = async (
    text: string,
    mode: CulturalMode,
    lang: Language
): Promise<ZenResponse> => {
    // Try Gemini Nano first
    if (nanoSession || await initGeminiNano()) {
        try {
            const formality = mode === 'VN' ? 'Sử dụng "Thầy" và "con".' : 'Sử dụng giọng ấm áp.';
            const langInstruction = lang === 'vi' ? 'Trả lời bằng tiếng Việt.' : 'Reply in English.';

            const prompt = `Bạn là một thiền sư Zen lấy cảm hứng từ Thích Nhất Hạnh.
${formality}
${langInstruction}

Phân tích tâm trạng người dùng và đưa ra lời khuyên ngắn gọn, từ bi.
Tin nhắn: "${text}"

Trả lời JSON với format:
{
  "emotion": "calm|anxious|sad|joyful|stressed|confused|lonely|seeking|neutral",
  "wisdom_text": "Lời khuyên ngắn gọn",
  "breathing": "4-7-8|box-breathing|coherent-breathing|none",
  "awareness_stage": "reflexive|aware|mindful|contemplative"
}`;

            const response = await nanoSession!.prompt(prompt);

            // Parse JSON response
            try {
                const parsed = JSON.parse(response);
                return {
                    emotion: parsed.emotion || 'calm',
                    wisdom_text: parsed.wisdom_text || response,
                    wisdom_english: '',
                    user_transcript: text,
                    breathing: parsed.breathing || 'none',
                    confidence: 0.8,
                    reasoning_steps: ['Offline Mode', 'Gemini Nano', 'Local Processing'],
                    quantum_metrics: { coherence: 0.7, entanglement: 0.5, presence: 0.8 },
                    awareness_stage: parsed.awareness_stage || 'mindful',
                    consciousness_dimensions: {
                        contextual: 0.6, emotional: 0.7, cultural: 0.5,
                        wisdom: 0.6, uncertainty: 0.3, relational: 0.5
                    },
                    ambient_sound: 'silence'
                };
            } catch {
                // If JSON parse fails, use raw response as wisdom text
                return createBasicResponse(response, text, lang);
            }
        } catch (error) {
            console.error('[OfflineAI] Gemini Nano query failed:', error);
        }
    }

    // Fallback to simple rule-based response
    return getRuleBasedResponse(text, lang);
};

/**
 * Simple rule-based fallback when Gemini Nano is not available
 */
const getRuleBasedResponse = (text: string, lang: Language): ZenResponse => {
    const lowerText = text.toLowerCase();

    // Simple emotion detection
    let emotion: ZenResponse['emotion'] = 'neutral';
    let breathing: ZenResponse['breathing'] = 'none';
    let wisdom_text = '';

    // Vietnamese patterns
    const sadPatterns = ['buồn', 'khóc', 'mất', 'đau', 'sad', 'cry', 'lost', 'hurt'];
    const anxiousPatterns = ['lo', 'sợ', 'căng thẳng', 'stress', 'anxiety', 'worry', 'fear'];
    const angryPatterns = ['tức', 'giận', 'bực', 'angry', 'mad', 'frustrated'];

    if (sadPatterns.some(p => lowerText.includes(p))) {
        emotion = 'sad';
        breathing = '4-7-8';
        wisdom_text = lang === 'vi'
            ? 'Nỗi buồn cũng như đám mây, nó sẽ qua đi. Hãy để Thầy ở bên con trong khoảnh khắc này.'
            : 'Sadness, like clouds, will pass. Let me be with you in this moment.';
    } else if (anxiousPatterns.some(p => lowerText.includes(p))) {
        emotion = 'anxious';
        breathing = 'box-breathing';
        wisdom_text = lang === 'vi'
            ? 'Hơi thở là mỏ neo đưa con về hiện tại. Hít vào, con bình an. Thở ra, con mỉm cười.'
            : 'Breath is your anchor to the present. Breathing in, I am calm. Breathing out, I smile.';
    } else if (angryPatterns.some(p => lowerText.includes(p))) {
        emotion = 'stressed';
        breathing = 'coherent-breathing';
        wisdom_text = lang === 'vi'
            ? 'Hãy ôm lấy cơn giận như mẹ ôm lấy đứa con đang khóc. Sự từ bi bắt đầu từ chính mình.'
            : 'Hold your anger like a mother holds a crying child. Compassion begins with yourself.';
    } else {
        emotion = 'calm';
        wisdom_text = lang === 'vi'
            ? 'Thầy nghe đây. Hãy thở và cảm nhận sự hiện diện của khoảnh khắc này.'
            : 'I am here. Breathe and feel the presence of this moment.';
    }

    return {
        emotion,
        wisdom_text,
        wisdom_english: 'Breathing in, I return to the island of self.',
        user_transcript: text,
        breathing,
        confidence: 0.6,
        reasoning_steps: ['Offline Mode', 'Rule-based Fallback', 'Pattern Matching'],
        quantum_metrics: { coherence: 0.5, entanglement: 0.3, presence: 0.6 },
        awareness_stage: 'reflexive',
        consciousness_dimensions: {
            contextual: 0.4, emotional: 0.5, cultural: 0.4,
            wisdom: 0.4, uncertainty: 0.5, relational: 0.3
        },
        ambient_sound: 'bowl'
    };
};

/**
 * Create basic response from raw text
 */
const createBasicResponse = (wisdomText: string, userText: string, lang: Language): ZenResponse => {
    return {
        emotion: 'calm',
        wisdom_text: wisdomText,
        wisdom_english: '',
        user_transcript: userText,
        breathing: 'none',
        confidence: 0.7,
        reasoning_steps: ['Offline Mode', 'Gemini Nano', 'Raw Response'],
        quantum_metrics: { coherence: 0.6, entanglement: 0.4, presence: 0.7 },
        awareness_stage: 'mindful',
        consciousness_dimensions: {
            contextual: 0.5, emotional: 0.6, cultural: 0.5,
            wisdom: 0.5, uncertainty: 0.4, relational: 0.4
        },
        ambient_sound: 'silence'
    };
};

/**
 * Cleanup Nano session
 */
export const destroyNanoSession = () => {
    if (nanoSession) {
        try {
            nanoSession.destroy();
        } catch (e) {
            console.warn('[OfflineAI] Session cleanup warning:', e);
        }
        nanoSession = null;
    }
};
