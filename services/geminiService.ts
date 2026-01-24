import { GoogleGenAI, Type } from "@google/genai";
import { ZenResponse, CulturalMode, Language } from "../types";
import { TOKENS } from "../utils/designSystem";
import { getOfflineZenResponse, isGeminiNanoAvailable } from "./offlineAI";

// Queue for initial text context if needed
let textQueue: { role: string, text: string }[] = [];

export const flushTextQueue = (apiKey: string, mode: CulturalMode, lang: Language) => {
  // No-op in Refactor 2.0
  console.log("Flushing text queue (No-op in Refactor 2.0)");
};

export const validateAndGetApiKey = async (): Promise<string> => {
  try {
    const key = localStorage.getItem('GEMINI_API_KEY');
    if (!key) throw new Error("API_KEY_MISSING");
    return key;
  } catch (error) {
    console.error("[GeminiService] API key retrieval failed:", error);
    throw new Error("API_KEY_MISSING");
  }
};

export const analyzeEnvironment = async (
  apiKey: string,
  base64Image: string
): Promise<{ mode: CulturalMode, detected_items: string[] }> => {
  let key = apiKey;
  if (!key) {
    try {
      key = await validateAndGetApiKey();
    } catch (e) {
      console.warn("[GeminiService] No API Key for camera analysis.");
      throw new Error("API_KEY_REQUIRED_FOR_CAMERA");
    }
  }

  const client = new GoogleGenAI({ apiKey: key });

  const prompt = `
    Analyze this image to determine the best cultural mode for a Zen session.
    - If you see markers of Vietnamese culture (e.g., nón lá, bamboo, altar, specific food), return 'VN'.
    - Otherwise, default to 'EN'.
    - List top 3 detected items relevant to the context.
    `;

  try {
    const result = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mode: { type: Type.STRING, enum: ['VN', 'EN'] },
            detected_items: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['mode', 'detected_items']
        }
      }
    });

    const responseText = result.text;
    if (!responseText) throw new Error("No response from AI");
    return JSON.parse(responseText);
  } catch (error) {
    console.error("[GeminiService] Camera API Failed:", error);
    throw new Error("CAMERA_ANALYSIS_FAILED");
  }
};

/**
 * Send text query - uses Online (Gemini API) or Offline (Gemini Nano) based on aiMode
 */
export const sendZenTextQuery = async (
  apiKey: string,
  text: string,
  mode: CulturalMode,
  lang: Language,
  useOffline: boolean = false
): Promise<ZenResponse> => {
  // If explicitly offline mode, use Gemini Nano
  if (useOffline) {
    console.log("[GeminiService] Using Offline AI (Gemini Nano)");
    return getOfflineZenResponse(text, mode, lang);
  }

  // Online mode - need API key
  let key = apiKey;
  if (!key) {
    try {
      key = await validateAndGetApiKey();
    } catch (e) {
      // No API key - always fallback to Offline AI (Nano or Rule-based)
      console.log("[GeminiService] No API key, using Offline AI fallback");
      return getOfflineZenResponse(text, mode, lang);
    }
  }

  // Basic sanitization
  const sanitized = text
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 2000);

  const client = new GoogleGenAI({ apiKey: key });

  const prompt = `
    User Text: "${sanitized}"
    Cultural Mode: ${mode}
    Language: ${lang}
    
    Analyze the user's text and provide a Zen response.
    If in Vietnamese, use "Thầy" (Teacher) and "con" (Child).
    `;

  try {
    const result = await client.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        { parts: [{ text: prompt }] }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emotion: { type: Type.STRING, enum: ['anxious', 'sad', 'joyful', 'calm', 'neutral', 'stressed', 'confused', 'lonely', 'seeking'] },
            wisdom_text: { type: Type.STRING },
            wisdom_english: { type: Type.STRING },
            breathing: { type: Type.STRING, enum: ['4-7-8', 'box-breathing', 'coherent-breathing', 'none'] },
            mindfulness_metrics: {
              type: Type.OBJECT,
              properties: {
                attention_stability: { type: Type.NUMBER },
                emotional_regulation: { type: Type.NUMBER },
                present_moment_awareness: { type: Type.NUMBER }
              },
              required: ['attention_stability', 'emotional_regulation', 'present_moment_awareness']
            },
            awareness_stage: { type: Type.STRING, enum: ['reflexive', 'aware', 'mindful', 'contemplative'] },
            psychological_dimensions: {
              type: Type.OBJECT,
              properties: {
                contextual: { type: Type.NUMBER },
                emotional: { type: Type.NUMBER },
                cultural: { type: Type.NUMBER },
                wisdom: { type: Type.NUMBER },
                acceptance: { type: Type.NUMBER },
                relational: { type: Type.NUMBER }
              },
              required: ['contextual', 'emotional', 'cultural', 'wisdom', 'acceptance', 'relational']
            },
            reasoning_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            ambient_sound: { type: Type.STRING, enum: ['rain', 'bowl', 'bell', 'silence', 'mekong', 'monsoon'] }
          }
        }
      }
    });

    const responseText = result.text;
    if (!responseText) throw new Error("No response from AI");
    return JSON.parse(responseText);
  } catch (error) {
    console.error("[GeminiService] API Call Failed:", error);

    // Always fallback to Offline AI on error
    console.log("[GeminiService] API failed, using Offline AI fallback");
    return getOfflineZenResponse(text, mode, lang);
  }
};
