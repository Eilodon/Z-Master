import { CreateMLCEngine, MLCEngine, InitProgressReport } from "@mlc-ai/web-llm";
import { ZenResponse, Language, CulturalMode } from '../types';

// --- CONFIGURATION ---
const FALLBACK_MODEL = "Llama-3-8B-Instruct-q4f32_1";
// Note: "Llama-3-8B-Instruct-q4f32_1" is just an example tag. 
// A safer, smaller one for browser is "Llama-3.2-1B-Instruct-q4f16_1" or "Gemma-2-2b-it-q4f16_1"
const SELECTED_MODEL = "Gemma-2-2b-it-q4f16_1";

export class OfflineAIService {
    private static instance: OfflineAIService;
    private isModelLoaded = false;
    private isLoading = false;
    private engine: MLCEngine | null = null;

    // Progress callback
    private onProgress: ((text: string) => void) | null = null;

    private constructor() { }

    static getInstance(): OfflineAIService {
        if (!OfflineAIService.instance) {
            OfflineAIService.instance = new OfflineAIService();
        }
        return OfflineAIService.instance;
    }

    setUpdateCallback(callback: (text: string) => void) {
        this.onProgress = callback;
    }

    async isAvailable(): Promise<boolean> {
        if ('ai' in window && (window as any).ai) {
            return true; // Gemini Nano might be available
        }
        // WebGPU check could go here
        return true;
    }

    async initialize(): Promise<boolean> {
        if (this.isModelLoaded) return true;
        if (this.isLoading) return false;

        this.isLoading = true;
        this.onProgress?.("Initializing Offline AI...");

        try {
            // 1. Try Native Gemini Nano (window.ai)
            if ('ai' in window && (window as any).ai) {
                try {
                    const capabilities = await (window as any).ai.assistant.capabilities();
                    if (capabilities.available === 'readily') {
                        this.isModelLoaded = true;
                        this.onProgress?.("Gemini Nano Ready");
                        return true;
                    }
                } catch (e) { console.warn("Gemini Nano check failed", e); }
            }

            // 2. Fallback to Web-LLM
            this.onProgress?.(`Loading local model ${SELECTED_MODEL}...`);

            this.engine = await CreateMLCEngine(SELECTED_MODEL, {
                initProgressCallback: (report: InitProgressReport) => {
                    this.onProgress?.(report.text);
                }
            });

            this.isModelLoaded = true;
            this.onProgress?.("Local AI Ready");
            return true;

        } catch (error) {
            console.error("[OfflineAI] Init failed:", error);
            this.onProgress?.("Offline AI Failed to Load");
            return false;
        } finally {
            this.isLoading = false;
        }
    }

    async generateResponse(
        text: string,
        mode: CulturalMode,
        lang: Language
    ): Promise<ZenResponse> {
        if (!this.isModelLoaded) await this.initialize();

        // Construct System Prompt
        const formality = mode === 'VN' ? 'Sử dụng "Thầy" và "con".' : 'Sử dụng giọng ấm áp.';
        const langInstruction = lang === 'vi' ? 'Trả lời bằng tiếng Việt.' : 'Reply in English.';

        const systemPrompt = `Bạn là một thiền sư Zen lấy cảm hứng từ Thích Nhất Hạnh.
${formality}
${langInstruction}
Phân tích tâm trạng người dùng và đưa ra lời khuyên ngắn gọn, từ bi.
Trả lời JSON với format:
{
  "emotion": "calm|anxious|sad|joyful|stressed|confused|lonely|seeking|neutral",
  "wisdom_text": "Lời khuyên ngắn gọn",
  "breathing": "4-7-8|box-breathing|coherent-breathing|none",
  "awareness_stage": "reflexive|aware|mindful|contemplative"
}`;

        const userPrompt = `Tin nhắn: "${text}"`;

        let rawResponse = "";

        // 1. Native Gemini Nano
        if ('ai' in window && (window as any).ai && !this.engine) {
            try {
                const session = await (window as any).ai.assistant.create({
                    systemPrompt: systemPrompt
                });
                rawResponse = await session.prompt(userPrompt);
                session.destroy();
            } catch (e) {
                console.warn("Nano prompt failed", e);
            }
        }

        // 2. Web-LLM
        if (!rawResponse && this.engine) {
            try {
                const response = await this.engine.chat.completions.create({
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    stream: false,
                    response_format: { type: "json_object" }
                });
                rawResponse = response.choices[0].message.content || "";
            } catch (e) {
                console.error("Web-LLM failed", e);
            }
        }

        // Parse JSON
        try {
            const parsed = JSON.parse(rawResponse);
            return {
                emotion: parsed.emotion || 'calm',
                wisdom_text: parsed.wisdom_text || rawResponse,
                wisdom_english: '',
                user_transcript: text,
                breathing: parsed.breathing || 'none',
                confidence: 0.8,
                reasoning_steps: ['Offline Mode', this.engine ? 'Web-LLM' : 'Gemini Nano'],
                mindfulness_metrics: { attention_stability: 0.7, emotional_regulation: 0.5, present_moment_awareness: 0.8 },
                awareness_stage: parsed.awareness_stage || 'mindful',
                psychological_dimensions: {
                    contextual: 0.6, emotional: 0.7, cultural: 0.5,
                    wisdom: 0.6, acceptance: 0.3, relational: 0.5
                },
                ambient_sound: 'silence'
            };
        } catch {
            return this.getRuleBasedResponse(text, lang, rawResponse);
        }
    }

    private getRuleBasedResponse(text: string, lang: Language, rawWisdom: string): ZenResponse {
        return {
            emotion: 'calm',
            wisdom_text: rawWisdom || (lang === 'vi' ? 'Thầy nghe đây.' : 'I am here.'),
            wisdom_english: '',
            user_transcript: text,
            breathing: 'none',
            confidence: 0.6,
            reasoning_steps: ['Offline Mode', 'Fallback'],
            mindfulness_metrics: { attention_stability: 0.5, emotional_regulation: 0.3, present_moment_awareness: 0.6 },
            awareness_stage: 'reflexive',
            psychological_dimensions: {
                contextual: 0.4, emotional: 0.5, cultural: 0.4,
                wisdom: 0.4, acceptance: 0.5, relational: 0.3
            },
            ambient_sound: 'bowl'
        };
    }
}
// Export legacy standalone functions mapped to Singleton
export const isGeminiNanoAvailable = async () => OfflineAIService.getInstance().isAvailable();
export const initGeminiNano = async () => OfflineAIService.getInstance().initialize();
export const getOfflineZenResponse = async (text: string, mode: CulturalMode, lang: Language) =>
    OfflineAIService.getInstance().generateResponse(text, mode, lang);

