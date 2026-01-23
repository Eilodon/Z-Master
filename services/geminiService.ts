import { GoogleGenAI, Type } from "@google/genai";
import { ZenResponse, CulturalMode, Language } from "../types";
import { TOKENS } from "../utils/designSystem";
import { SecureKeyManager } from "./secureKeyManager";
import { InputSanitizer } from "./inputSanitizer";

// Queue for initial text context if needed
let textQueue: { role: string, text: string }[] = [];

export const flushTextQueue = (apiKey: string, mode: CulturalMode, lang: Language) => {
  // No-op in Refactor 2.0
  console.log("Flushing text queue (No-op in Refactor 2.0)");
};

export const validateAndGetApiKey = async (): Promise<string> => {
  try {
    // Use secure key manager instead of localStorage
    return await SecureKeyManager.getApiKey();
  } catch (error) {
    console.error("[GeminiService] API key retrieval failed:", error);
    throw new Error("API_KEY_MISSING");
  }
};

export const analyzeEnvironment = async (
  apiKey: string,
  base64Image: string
): Promise<{ mode: CulturalMode, detected_items: string[] }> => {
  const key = apiKey || await validateAndGetApiKey();
  const client = new GoogleGenAI({ apiKey: key });

  const prompt = `
    Analyze this image to determine the best cultural mode for a Zen session.
    - If you see markers of Vietnamese culture (e.g., nón lá, bamboo, altar, specific food), return 'VN'.
    - Otherwise, default to 'EN'.
    - List top 3 detected items relevant to the context.
    `;

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
};

export const sendZenTextQuery = async (
  apiKey: string,
  text: string,
  mode: CulturalMode,
  lang: Language
): Promise<ZenResponse> => {
  const key = apiKey || await validateAndGetApiKey();
  
  // Sanitize input text
  const sanitizationResult = InputSanitizer.sanitizePrompt(text, `Zen session in ${mode} mode, language: ${lang}`);
  
  if (!sanitizationResult.isSafe) {
    console.warn('[GeminiService] Input sanitization detected threats:', sanitizationResult.threats);
    // For safety threats, return a calm response instead of processing
    return {
      emotion: 'calm',
      wisdom_text: lang === 'vi' 
        ? "Thầy cảm nhận được sự căng thẳng trong lời con. Hãy cùng hít thở thật sâu." 
        : "I sense some tension in your words. Let's take a deep breath together.",
      wisdom_english: "Breathing in, I calm my body.",
      user_transcript: sanitizationResult.sanitized,
      breathing: '4-7-8',
      confidence: 0.9,
      reasoning_steps: ['INPUT_SANITIZATION_TRIGGERED', 'SAFETY_FIRST_RESPONSE'],
      quantum_metrics: { coherence: 0.8, entanglement: 0.6, presence: 0.9 },
      awareness_stage: 'mindful',
      consciousness_dimensions: { contextual: 0.7, emotional: 0.8, cultural: 0.6, wisdom: 0.9, uncertainty: 0.4, relational: 0.7 }
    };
  }

  const client = new GoogleGenAI({ apiKey: key });

  const prompt = `
    User Text: "${sanitizationResult.sanitized}"
    Cultural Mode: ${mode}
    Language: ${lang}
    
    Analyze the user's text and provide a Zen response.
    If in Vietnamese, use "Thầy" (Teacher) and "con" (Child).
    `;

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
          quantum_metrics: {
            type: Type.OBJECT,
            properties: {
              coherence: { type: Type.NUMBER },
              entanglement: { type: Type.NUMBER },
              presence: { type: Type.NUMBER }
            },
            required: ['coherence', 'entanglement', 'presence']
          },
          awareness_stage: { type: Type.STRING, enum: ['reflexive', 'aware', 'mindful', 'contemplative'] },
          consciousness_dimensions: {
            type: Type.OBJECT,
            properties: {
              contextual: { type: Type.NUMBER },
              emotional: { type: Type.NUMBER },
              cultural: { type: Type.NUMBER },
              wisdom: { type: Type.NUMBER },
              uncertainty: { type: Type.NUMBER },
              relational: { type: Type.NUMBER }
            },
            required: ['contextual', 'emotional', 'cultural', 'wisdom', 'uncertainty', 'relational']
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
};
