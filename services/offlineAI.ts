import { CreateMLCEngine, MLCEngine, InitProgressReport } from "@mlc-ai/web-llm";
import { ZenResponse, Language, CulturalMode } from '../types';

// --- MODEL CONFIGURATION (SOTA JAN 2026) ---
// Sắp xếp theo thứ tự: Nhẹ nhất -> Nặng nhất
const MODELS = {
    ULTRA_LIGHT: "SmolLM2-360M-Instruct-q0f16-MLC", // ~200MB - Luôn chạy được
    BALANCED: "Llama-3.2-1B-Instruct-q4f16_1-MLC",   // ~800MB - Mobile chuẩn
    PERFORMANCE: "Llama-3.2-3B-Instruct-q4f16_1-MLC" // ~1.8GB - Desktop/PC
};

export class OfflineAIService {
    private static instance: OfflineAIService;
    private engine: MLCEngine | null = null;
    private currentModelId: string | null = null;
    // Helper to track loading state if needed externally, though not strictly required by interface
    private isModelLoaded = false;
    private loadProgressCallback: ((text: string) => void) | null = null;

    private constructor() { }

    static getInstance(): OfflineAIService {
        if (!OfflineAIService.instance) {
            OfflineAIService.instance = new OfflineAIService();
        }
        return OfflineAIService.instance;
    }

    setUpdateCallback(callback: (text: string) => void) {
        this.loadProgressCallback = callback;
    }

    // Compatibility method for legacy code calling isAvailable
    async isAvailable(): Promise<boolean> {
        // Assume always available via WebLLM fallback or native if implemented later
        return true;
    }

    /**
     * Tự động chọn model dựa trên phần cứng (Heuristic check)
     */
    private detectBestModel(): string {
        // 1. Kiểm tra RAM (nếu trình duyệt hỗ trợ)
        // @ts-ignore
        const deviceMemory = navigator.deviceMemory || 4; // GB
        const logicalCores = navigator.hardwareConcurrency || 4;

        // 2. Kiểm tra GPU (Sơ bộ qua WebGL debug info hoặc userAgent)
        const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

        console.log(`[OfflineAI] Hardware: RAM~${deviceMemory}GB, Cores=${logicalCores}, Mobile=${isMobile}`);

        if (deviceMemory >= 16 && !isMobile) {
            return MODELS.PERFORMANCE; // PC Mạnh
        } else if (deviceMemory >= 6 || (deviceMemory >= 4 && !isMobile)) {
            return MODELS.BALANCED;    // Mobile xịn hoặc Laptop thường
        } else {
            return MODELS.ULTRA_LIGHT; // Điện thoại yếu hoặc fallback an toàn
        }
    }

    async initialize(): Promise<boolean> {
        if (this.engine) return true;

        const selectedModel = this.detectBestModel();
        this.currentModelId = selectedModel;

        this.loadProgressCallback?.(`Đang tối ưu hóa cho thiết bị... (Chọn: ${selectedModel})`);

        try {
            // Cấu hình Cache để không phải tải lại lần sau
            this.engine = await CreateMLCEngine(selectedModel, {
                initProgressCallback: (report: InitProgressReport) => {
                    this.loadProgressCallback?.(report.text);
                },
                appConfig: {
                    // Cache model vào trình duyệt để dùng offline lần sau
                    useIndexedDBCache: true,
                    model_list: []
                }
            });

            console.log(`[OfflineAI] Loaded ${selectedModel} successfully`);
            this.isModelLoaded = true;
            return true;
        } catch (error) {
            console.error("[OfflineAI] Init failed:", error);
            // Fallback cực đoan: Nếu model xịn lỗi, thử load model siêu nhẹ
            if (selectedModel !== MODELS.ULTRA_LIGHT) {
                this.loadProgressCallback?.("Thử lại với phiên bản siêu nhẹ...");
                return this.fallbackLoad(MODELS.ULTRA_LIGHT);
            }
            return false;
        }
    }

    private async fallbackLoad(modelId: string): Promise<boolean> {
        try {
            this.engine = await CreateMLCEngine(modelId, {
                initProgressCallback: (report) => this.loadProgressCallback?.(report.text),
                appConfig: { useIndexedDBCache: true, model_list: [] }
            });
            this.currentModelId = modelId;
            this.isModelLoaded = true;
            return true;
        } catch (e) {
            console.error("[OfflineAI] Critical Fallback Failed", e);
            return false;
        }
    }

    async generateResponse(text: string, mode: CulturalMode, lang: Language): Promise<ZenResponse> {
        if (!this.engine) await this.initialize();

        // System Prompt tối ưu cho model nhỏ (SmolLM/Llama-1B cần prompt ngắn gọn hơn)
        const isSmallModel = this.currentModelId === MODELS.ULTRA_LIGHT;

        const formality = mode === 'VN' ? 'Sử dụng "Thầy" và "con".' : 'Sử dụng giọng ấm áp.';
        const langInstruction = lang === 'vi' ? 'Trả lời bằng tiếng Việt.' : 'Reply in English.';

        let systemPrompt = `You are a Zen Master. ${langInstruction}`;

        if (!isSmallModel) {
            systemPrompt = `Bạn là thiền sư Zen lấy cảm hứng từ Thích Nhất Hạnh.
${formality}
${langInstruction}
Phân tích tâm trạng người dùng và đưa ra lời khuyên ngắn gọn, từ bi.
Trả lời JSON format: { "emotion": "...", "wisdom_text": "...", "breathing": "..." }`;
        } else {
            // Prompt tối giản cho model nhỏ
            systemPrompt += ` Reply JSON.`;
        }

        const userPrompt = `Tin nhắn: "${text}"`;
        let rawResponse = "";

        try {
            if (!this.engine) throw new Error("Engine not initialized");

            const response = await this.engine.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                // temperature: 0.7, // Optional: add flexibility
                stream: false,
                response_format: { type: "json_object" }
            });
            rawResponse = response.choices[0].message.content || "";

            // Basic parsing attempt
            const parsed = JSON.parse(rawResponse);
            return {
                emotion: parsed.emotion || 'calm',
                wisdom_text: parsed.wisdom_text || rawResponse,
                wisdom_english: '',
                user_transcript: text,
                breathing: parsed.breathing || 'none',
                confidence: 0.9,
                reasoning_steps: ['On-device inference', this.currentModelId || 'Unknown'],
                mindfulness_metrics: { attention_stability: 0.8, emotional_regulation: 0.9, present_moment_awareness: 0.8 },
                awareness_stage: 'aware',
                psychological_dimensions: { contextual: 0.5, emotional: 0.5, cultural: 0.5, wisdom: 0.5, acceptance: 0.5, relational: 0.5 },
                ambient_sound: 'silence'
            };

        } catch (e) {
            console.error("[OfflineAI] Generation failed", e);
            return this.getRuleBasedResponse(text, lang, rawResponse);
        }
    }

    private getRuleBasedResponse(text: string, lang: Language, rawWisdom: string): ZenResponse {
        return {
            emotion: 'calm',
            wisdom_text: rawWisdom || (lang === 'vi' ? `[${this.currentModelId?.split('-')[0]}] Tâm an vạn sự an.` : `[${this.currentModelId?.split('-')[0]}] Peace in mind, peace in world.`),
            wisdom_english: '',
            user_transcript: text,
            breathing: '4-7-8',
            confidence: 0.6,
            reasoning_steps: ['Offline Mode', 'Fallback Rules'],
            mindfulness_metrics: { attention_stability: 0.5, emotional_regulation: 0.5, present_moment_awareness: 0.5 },
            awareness_stage: 'reflexive',
            psychological_dimensions: {
                contextual: 0.5, emotional: 0.5, cultural: 0.5,
                wisdom: 0.5, acceptance: 0.5, relational: 0.5
            },
            ambient_sound: 'bowl'
        };
    }
}

// --- LEGACY EXPORTS FOR COMPATIBILITY ---
export const isGeminiNanoAvailable = async () => OfflineAIService.getInstance().isAvailable();
export const initGeminiNano = async () => OfflineAIService.getInstance().initialize();
export const getOfflineZenResponse = async (text: string, mode: CulturalMode, lang: Language) =>
    OfflineAIService.getInstance().generateResponse(text, mode, lang);
