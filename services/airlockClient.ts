/// <reference types="vite/client" />
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

/**
 * Establishes a raw WebSocket connection to the Gemini Live API via Airlock.
 * Bypasses the SDK entirely for maximum control.
 */
export const connectLive = (modelId: string): WebSocket => {
  const baseUrl = getAirlockBaseUrl();
  // Transform HTTP URL to WebSocket URL
  // e.g. https://worker.dev -> wss://worker.dev/v1beta/models/gemini-2.0-flash-exp/BidiWebsocket
  const wsUrl = baseUrl.replace(/^http/, 'ws') + `/v1beta/models/${modelId}/BidiWebsocket`;

  const ws = new WebSocket(wsUrl);

  // Standard Airlock Headers are not supported in browser WebSocket API directly
  // The Worker/Server must accept the connection authentication via protocol or init message.
  // Assuming Airlock handles the proxying transparently or we send auth in the setup message.

  return ws;
};

