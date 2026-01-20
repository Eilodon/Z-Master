import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { ZenResponse, CulturalMode, Language } from "../types";
import { TOKENS } from "../utils/designSystem";

// Queue for initial text context if needed
let textQueue: { role: string, text: string }[] = [];

export const flushTextQueue = (apiKey: string, mode: CulturalMode, lang: Language) => {
  // No-op in Refactor 2.0
  console.log("Flushing text queue (No-op in Refactor 2.0)");
};

export const analyzeEnvironment = async (
  apiKey: string,
  base64Image: string
): Promise<{ mode: CulturalMode, detected_items: string[] }> => {
  // Fallback key if not provided
  const key = apiKey || await validateAndGetApiKey();
  const genAI = new GoogleGenAI({ apiKey: key });
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
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

  const prompt = `
    Analyze this image to determine the best cultural mode for a Zen session.
    - If you see markers of Vietnamese culture (e.g., nón lá, bamboo, altar, specific food), return 'VN'.
    - Otherwise, default to 'EN'.
    - List top 3 detected items relevant to the context.
    `;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
  ]);
  const responseText = result.response.text();
  return JSON.parse(responseText);
};

export const validateAndGetApiKey = async (): Promise<string> => {
  // Simplified for refactor. Assumes key is in localStorage.
  const key = localStorage.getItem('GEMINI_API_KEY');
  if (!key) throw new Error("API_KEY_MISSING");
  return key;
};

export const sendZenTextQuery = async (
  apiKey: string,
  text: string,
  mode: CulturalMode,
  lang: Language
): Promise<ZenResponse> => {
  const key = apiKey || await validateAndGetApiKey();
  const genAI = new GoogleGenAI({ apiKey: key });
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
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

  const prompt = `
    User Text: "${text}"
    Cultural Mode: ${mode}
    Language: ${lang}
    
    Analyze the user's text and provide a Zen response.
    If in Vietnamese, use "Thầy" (Teacher) and "con" (Child).
    `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return JSON.parse(responseText) as ZenResponse;
};
