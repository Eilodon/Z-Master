import { GoogleGenAI } from "@google/genai";

const DEFAULT_API_VERSION = "v1beta";
const AIRLOCK_CLIENT_KEY = "AIRLOCK_CLIENT";

const normalizeBaseUrl = (raw: string): string => raw.replace(/\/+$/, "");

export const getAirlockBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_AIRLOCK_URL as string | undefined;
  if (envUrl && envUrl.trim().length > 0) {
    return normalizeBaseUrl(envUrl.trim());
  }
  return normalizeBaseUrl(window.location.origin);
};

export const createAirlockClient = (): GoogleGenAI => {
  return new GoogleGenAI({
    apiKey: AIRLOCK_CLIENT_KEY,
    apiVersion: DEFAULT_API_VERSION,
    httpOptions: {
      baseUrl: getAirlockBaseUrl(),
      apiVersion: DEFAULT_API_VERSION,
      headers: {
        "x-airlock-client": "thay-ai-web",
      },
    },
  });
};
