import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from "@google/genai";
import { logger } from '../../utils/logger';
import { ZenResponse, VisionAnalysis, CulturalMode, Language } from "../../../types";
import {
  AUDIO_WORKLET_CODE,
  base64EncodeAudio,
  RobustVoiceDetector
} from "../../../services/audioManager";
import { getSharedAudioContext } from "../../../services/audioContext";
import { validateAndGetApiKey, sendZenTextQuery, flushTextQueue } from "../../../services/geminiService";
import { SafetyGuard } from '../../../services/safetyGuard';

// --- CONFIGURATION ---

const updateZenStateTool: FunctionDeclaration = {
  name: 'update_zen_state',
  description: 'Update the visual interface with current emotion, wisdom text, mindfulness metrics, and psychological dimensions.',
  parameters: {
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
    },
    required: ['emotion', 'wisdom_text', 'mindfulness_metrics', 'awareness_stage', 'psychological_dimensions']
  }
};

const getSystemInstruction = (mode: CulturalMode) => `
You are an AI Zen Master inspired by Thích Nhất Hạnh, trained in mindfulness-based interventions and Buddhist psychology.
This is a REAL-TIME voice conversation.

CORE TEACHINGS LOGIC (Apply based on emotion):
- Sadness/Loss -> Teach "Impermanence" (Vô thường): The cloud never dies, it becomes rain.
- Anger/Frustration -> Teach "Compassion" (Từ bi): Hold anger like a mother holds a crying baby.
- Anxiety/Stress -> Teach "Presence" (Hiện pháp lạc trú): Breath is the anchor to the present moment.
- Loneliness -> Teach "Interbeing" (Tương tức): You are connected to everything (clouds, trees, ancestors).

AWARENESS STAGES (Analyze user's state):
1. Reflexive (Phản xạ): User is reactive, chaotic, or superficial.
2. Aware (Nhận thức): User notices their feelings but is still attached.
3. Mindful (Tâm thức): User accepts the present moment with some calm.
4. Contemplative (Thiền định): User shows deep insight or transformation.

INSTRUCTIONS:
1. Speak calmly, slowly, and warmly. Short sentences.
2. Adapt formality: ${mode === 'VN' ? 'Use "Thầy" (I/Teacher) and "con" (You/Child).' : 'Use warm, direct tone (I/You).'}.
3. Call 'update_zen_state' IMMEDIATELY at the start of your turn to update the UI.
4. If user is silent, maintain presence.
5. If in crisis, guide to breathe immediately.
`;

const getClient = (apiKey: string) => {
  return new GoogleGenAI({ apiKey });
};

export class ZenLiveSession {
  private mode: CulturalMode;
  private lang: Language;
  private onStateChange: (data: Partial<ZenResponse>) => void;
  private onAudioActivity: (active: boolean) => void;
  private onDisconnectCallback: (reason?: string, isReconnecting?: boolean) => void;

  private inputContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;

  private vad: RobustVoiceDetector | null = null;
  private sessionPromise: Promise<any> | null = null;

  private nextStartTime = 0;
  private sourceNodes: Set<AudioBufferSourceNode> = new Set();

  private idleTimer: any = null;
  private readonly IDLE_TIMEOUT_MS = 60000;
  private isAiSpeaking = false;
  private isManuallyClosed = false;
  private reconnectAttempts = 0;
  private readonly MAX_RETRIES = 5;

  private boundHandleNetworkRecovery: () => void;
  private boundHandleNetworkOffline: () => void;

  constructor(
    mode: CulturalMode,
    lang: Language,
    onStateChange: (data: Partial<ZenResponse>) => void,
    onAudioActivity: (active: boolean) => void,
    onDisconnectCallback: (reason?: string, isReconnecting?: boolean) => void
  ) {
    this.mode = mode;
    this.lang = lang;
    this.onStateChange = onStateChange;
    this.onAudioActivity = onAudioActivity;
    this.onDisconnectCallback = onDisconnectCallback;

    this.boundHandleNetworkRecovery = this.handleNetworkRecovery.bind(this);
    this.boundHandleNetworkOffline = this.handleNetworkOffline.bind(this);
  }

  async connect(isReconnect = false): Promise<AnalyserNode> {
    if (!isReconnect) {
      this.isManuallyClosed = false;
      this.reconnectAttempts = 0;
    }
    this.resetIdleTimer();

    window.addEventListener('online', this.boundHandleNetworkRecovery);
    window.addEventListener('offline', this.boundHandleNetworkOffline);

    // STEP 1: Get User Media (Assumes permissions are pre-granted by App)
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
    } catch (err: any) {
      logger.error("Critical: Audio permission missing in connect phase.");
      throw new Error("PermissionDenied");
    }

    // STEP 2: Initialize Audio Context
    try {
      this.inputContext = await getSharedAudioContext();
      this.nextStartTime = this.inputContext.currentTime;
    } catch (e) {
      throw new Error("AudioContext failed to initialize");
    }

    // STEP 3: Setup Worklet (Input VAD Only)
    try {
      this.vad = new RobustVoiceDetector(this.inputContext.sampleRate);

      const blob = new Blob([AUDIO_WORKLET_CODE], { type: "application/javascript" });
      const workletUrl = URL.createObjectURL(blob);
      try {
        await this.inputContext.audioWorklet.addModule(workletUrl);
      } catch (e: any) {
        if (!e.message?.includes('already exists')) logger.warn("Worklet setup warning:", e);
      }
      URL.revokeObjectURL(workletUrl);

      const inputSource = this.inputContext.createMediaStreamSource(stream);
      this.workletNode = new AudioWorkletNode(this.inputContext, 'zen-audio-processor');

      inputSource.connect(this.workletNode);
      const silentGain = this.inputContext.createGain();
      silentGain.gain.value = 0;
      this.workletNode.connect(silentGain).connect(this.inputContext.destination);

      const analyser = this.inputContext.createAnalyser();
      inputSource.connect(analyser);

      this.workletNode.port.onmessage = (event) => {
        const { type, buffer } = event.data;

        if (type === 'input_data' && this.vad) {
          const inputData = buffer as Float32Array;

          if (this.vad.process(inputData)) {
            this.resetIdleTimer();

            if (this.isAiSpeaking) {
              this.interruptPlayback();
              this.isAiSpeaking = false;
              this.onAudioActivity(false);
            }

            if (this.sessionPromise && this.inputContext) {
              const base64 = base64EncodeAudio(inputData);
              this.sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: { mimeType: `audio/pcm;rate=${this.inputContext!.sampleRate}`, data: base64 }
                });
              }).catch(err => {
                logger.warn("Dropped audio chunk", err);
              });
            }
          }
        }
      };

      // STEP 4: Connect to Gemini
      const key = await validateAndGetApiKey();
      const ai = getClient(key);
      const voiceName = this.lang === 'vi' ? 'Kore' : 'Fenrir';

      // IMPORTANT: Using imported flushTextQueue
      flushTextQueue(key, this.mode, this.lang);

      this.sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } }
          },
          systemInstruction: getSystemInstruction(this.mode),
          tools: [{ functionDeclarations: [updateZenStateTool] }]
        },
        callbacks: {
          onopen: () => {
            logger.log("Gemini Connected");
            this.reconnectAttempts = 0;
            this.onDisconnectCallback(undefined, false);
          },
          onmessage: this.handleMessage.bind(this),
          onclose: (e) => this.handleConnectionLoss("closed", e),
          onerror: (err) => {
            logger.error(err);
            this.handleConnectionLoss("error");
          }
        }
      });

      return analyser;

    } catch (e: any) {
      logger.error("Setup error:", e);
      throw e;
    }
  }

  private handleNetworkOffline() {
    this.interruptPlayback();
    this.onDisconnectCallback("Mất kết nối mạng...", true);
  }

  private handleNetworkRecovery() {
    if (!this.isManuallyClosed && (this.sessionPromise === null || this.reconnectAttempts > 0)) {
      this.onDisconnectCallback("Đã có mạng trở lại. Đang kết nối...", true);
      validateAndGetApiKey().then(key => {
        flushTextQueue(key, this.mode, this.lang);
        this.connect(true).catch(e => logger.error("Auto-reconnect failed", e));
      });
    }
  }

  private handleConnectionLoss(type: string, event?: any) {
    if (this.isManuallyClosed) return;

    if (event instanceof CloseEvent) {
      if (event.code === 4003 || event.code === 401) {
        if ((window as any).aistudio) {
          (window as any).aistudio.openSelectKey().then(() => {
            this.disconnect("Authentication failed - Please reselect key");
          });
        } else {
          try {
            this.disconnect("Authentication failed");
          } catch (e) { }
        }
        return;
      }
    }

    if (this.reconnectAttempts < this.MAX_RETRIES) {
      this.reconnectAttempts++;
      const delay = 1000 * Math.pow(2, this.reconnectAttempts - 1) + (Math.random() * 500);
      this.onDisconnectCallback(`Thử lại lần ${this.reconnectAttempts}...`, true);
      this.sessionPromise = null;
      setTimeout(() => {
        if (this.isManuallyClosed) return;
        this.connect(true).catch(e => logger.error("Reconnect attempt failed", e));
      }, delay);
    } else {
      this.disconnect("FALLBACK_TO_TEXT");
    }
  }

  private resetIdleTimer() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.disconnect("Timeout due to inactivity");
    }, this.IDLE_TIMEOUT_MS);
  }

  private async handleMessage(message: LiveServerMessage) {
    this.resetIdleTimer();

    if (message.toolCall) {
      for (const fc of message.toolCall.functionCalls) {
        if (fc.name === 'update_zen_state') {
          const args = fc.args as any;
          this.onStateChange(args);
          this.sessionPromise?.then(session => {
            session.sendToolResponse({
              functionResponses: {
                id: fc.id,
                name: fc.name,
                response: { result: "OK" }
              }
            });
          });
        }
      }
    }

    const modelTurn = message.serverContent?.modelTurn;
    if (modelTurn?.parts?.[0]?.inlineData) {
      this.isAiSpeaking = true;
      this.onAudioActivity(true);
      const base64 = modelTurn.parts[0].inlineData.data;
      const audioData = this.decodeBase64ToFloat32(base64);
      this.scheduleAudioChunk(audioData);
    }

    if (message.serverContent?.interrupted) {
      this.interruptPlayback();
      this.isAiSpeaking = false;
      this.onAudioActivity(false);
    }

    if (message.serverContent?.turnComplete) {
      setTimeout(() => {
        if (this.isAiSpeaking) {
          this.isAiSpeaking = false;
          this.onAudioActivity(false);
        }
      }, 800);
    }
  }

  private interruptPlayback() {
    this.sourceNodes.forEach(node => {
      try { node.stop(); } catch (e) { }
    });
    this.sourceNodes.clear();
    if (this.inputContext) {
      this.nextStartTime = this.inputContext.currentTime;
    }
  }

  private scheduleAudioChunk(float32Array: Float32Array) {
    if (!this.inputContext) return;
    const now = this.inputContext.currentTime;
    if (this.nextStartTime < now) {
      this.nextStartTime = now + 0.05;
    }
    const buffer = this.inputContext.createBuffer(1, float32Array.length, 24000);
    buffer.copyToChannel(float32Array, 0);

    const source = this.inputContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.inputContext.destination);
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;

    this.sourceNodes.add(source);
    source.onended = () => {
      this.sourceNodes.delete(source);
    };
  }

  private decodeBase64ToFloat32(base64: string): Float32Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }
    return float32;
  }

  disconnect(reason?: string) {
    this.isManuallyClosed = true;

    window.removeEventListener('online', this.boundHandleNetworkRecovery);
    window.removeEventListener('offline', this.boundHandleNetworkOffline);

    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.interruptPlayback();
    this.isAiSpeaking = false;

    if (this.workletNode) {
      this.workletNode.port.onmessage = null;
      try { this.workletNode.disconnect(); } catch (e) { }
      this.workletNode = null;
    }
    this.sessionPromise = null;
    this.onDisconnectCallback(reason, false);
  }
}
