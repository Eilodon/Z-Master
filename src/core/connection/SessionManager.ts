import { ZenLiveSession } from './ZenLiveSession';
import { useZenStore, useUIStore } from '../../../store/zenStore';
import { detectEmergency } from '../../../data/emergencyKeywords';
import { haptic } from '../../../utils/designSystem';
import { sendZenTextQuery } from '../../../services/geminiService';
import { ZenResponse, ConversationEntry } from '../../../types';
import { dbService } from '../../../services/db';
import { logger } from '../../utils/logger';
import { ConversationMemoryService } from '../../../services/conversationMemoryService';

class SessionManager {
    private static instance: SessionManager;
    private session: ZenLiveSession | null = null;
    private analyser: AnalyserNode | null = null;

    private constructor() { }

    static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    getAnalyser(): AnalyserNode | null {
        return this.analyser;
    }

    async connect() {
        const { status, transitionTo, setConnectionState } = useZenStore.getState();
        const { culturalMode, language } = useUIStore.getState();

        if (status.kind !== 'idling') {
            this.disconnect();
            return;
        }

        try {
            this.session = new ZenLiveSession(
                culturalMode,
                language,
                this.handleStateChange,
                (active) => useZenStore.getState().transitionTo(active ? { kind: 'speaking' } : { kind: 'connected_listening' }),
                this.handleDisconnect
            );

            haptic('success');
            transitionTo({ kind: 'connecting' });
            setConnectionState('reconnecting');

            // Trigger Mic Permission
            this.analyser = await this.session.connect();

            transitionTo({ kind: 'connected_listening' });
            setConnectionState('connected');

        } catch (e: any) {
            this.handleError(e);
        }
    }

    disconnect() {
        if (this.session) {
            this.session.disconnect();
            haptic('warn');
            this.session = null;
            this.analyser = null;
        }
    }

    async sendText(text: string): Promise<ZenResponse | null> {
        if (!text.trim()) return null;
        if (this.session) this.disconnect();

        try {
            haptic('selection');
            useZenStore.getState().transitionTo({ kind: 'processing' });
            const { culturalMode, language } = useUIStore.getState();

            const apiKey = ""; // API key is handled inside service with secure fallback
            const response = await sendZenTextQuery(apiKey, text, culturalMode, language);

            useZenStore.getState().setZenData(response);
            haptic('success');
            useZenStore.getState().transitionTo({ kind: 'idling' });

            // Process conversation for memory tracking (text mode)
            if (response && response.emotion) {
                ConversationMemoryService.processConversation(
                    text,
                    response.emotion
                ).catch(err => logger.error('[Memory] Text processing failed:', err));
            }

            return response;

        } catch (e: any) {
            logger.error(e);
            useZenStore.getState().transitionTo({ kind: 'idling' });
            return null;
        }
    }

    // --- Handlers ---

    private handleStateChange = (data: Partial<ZenResponse>) => {
        useZenStore.setState((prev) => {
            const { zenData, addToHistory, history } = useZenStore.getState();
            const newData = prev.zenData ? { ...prev.zenData, ...data } : data as ZenResponse;

            // Emergency Check
            if (newData.wisdom_text && detectEmergency(newData.wisdom_text)) {
                useUIStore.getState().setEmergencyActive(true);
                this.session?.disconnect();
            }

            // DB Logging Logic & Conversation Memory Tracking
            if (data.emotion && data.mindfulness_metrics && data.reasoning_steps) {
                if (data.reasoning_steps[0] !== 'Offline Mode') {
                    const newEntry: ConversationEntry = {
                        id: Date.now().toString(),
                        timestamp: Date.now(),
                        emotion: data.emotion,
                        mindfulness_metrics: data.mindfulness_metrics!,
                        stage: data.awareness_stage,
                        psychological_dimensions: data.psychological_dimensions
                    };

                    // Debounce: Check timestamp of last history item
                    const last = history[history.length - 1];
                    // Only save if > 2 seconds have passed since last entry to avoid rapid-fire updates
                    if (!last || Date.now() - last.timestamp > 2000) {
                        dbService.saveEntry(newEntry);
                        addToHistory(newEntry);

                        // Process conversation for memory tracking
                        if (data.user_transcript && data.emotion) {
                            ConversationMemoryService.processConversation(
                                data.user_transcript,
                                data.emotion
                            ).catch(err => logger.error('[Memory] Processing failed:', err));
                        }
                    }
                }
            }

            return { zenData: newData };
        });
    };

    private handleDisconnect = (reason?: string, isReconnecting?: boolean) => {
        const { setConnectionState, transitionTo } = useZenStore.getState();
        const { setInputMode } = useUIStore.getState();

        if (isReconnecting) {
            setConnectionState('reconnecting');
            return;
        }

        setConnectionState('disconnected');
        this.session = null;
        this.analyser = null;
        transitionTo({ kind: 'idling' });

        if (reason === "FALLBACK_TO_TEXT") {
            setInputMode('text');
            haptic('warn');
        }
    };

    private handleError(e: any) {
        const { transitionTo, setConnectionState } = useZenStore.getState();
        const { setInputMode } = useUIStore.getState();

            logger.error("Connection failed:", e);
        transitionTo({ kind: 'idling' });
        setConnectionState('disconnected');

        if (e.message.includes("PermissionDenied") || e.message.includes("NoMicrophone")) {
            setInputMode('text');
        }
    }
}

export const sessionManager = SessionManager.getInstance();
