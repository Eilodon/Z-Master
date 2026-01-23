
import * as React from 'react';
import { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';

import { VoiceButton } from '../../components/VoiceButton';
import { ZenCard } from '../../components/ZenCard';
import { Snackbar } from '../../components/Snackbar';
import { CameraScan } from '../../components/CameraScan';
import { ReasoningPanel } from '../../components/ReasoningPanel';
import { BottomSheet } from '../../components/PandoraParts';
const AudioEngine = React.lazy(() => import('../../components/AudioEngine'));
import { BreathingCircle } from '../../components/BreathingCircle';
import { EmergencyProtocol } from '../../components/EmergencyProtocol';
import { HistoryPanel } from '../../components/HistoryPanel';
import { LoadingScreen } from '../../components/LoadingScreen';
import { MicroPractices } from '../../components/MicroPractices';
import { ZenResponse } from '../../types';
import { detectEmergency } from '../../data/emergencyKeywords';
import { Keyboard, Mic, Languages, SendHorizontal, Brain, Sparkles, Wifi, WifiOff, RotateCcw } from 'lucide-react';
import { haptic } from '../../utils/designSystem';
import { useZenSession } from '../../hooks/useZenSession';
import { useUIStore, useZenStore } from '../../store/zenStore';
import { usePermissions } from '../../hooks/usePermissions';

import { SoulOrb } from '../components/Viz/SoulOrb';

export function MainView() {
    // --- Global State ---
    const {
        culturalMode, language, inputMode, snackbar, isLoading, showBreathing, emergencyActive,
        setCulturalMode, setLanguage, setInputMode, setSnackbar, setIsLoading, setShowBreathing, setEmergencyActive
    } = useUIStore();

    const { status, connectionState, zenData, history, setHistory, setZenData } = useZenStore();

    // --- Permissions Hook ---
    const { requestInitialPermissions, micStatus } = usePermissions();

    // --- Local UI State ---
    const [inputText, setInputText] = useState('');
    const [isReasoningOpen, setIsReasoningOpen] = useState(false);
    const [showPractices, setShowPractices] = useState(false);

    // Audio Viz State (Driven by real analyzer or mock)
    const [audioIntensity, setAudioIntensity] = useState(0);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);

    // --- Session Hook ---
    const {
        connect,
        disconnect,
        sendText,
        analyserRef: sessionAnalyserRef
    } = useZenSession({
        onEmergencyDetected: () => setEmergencyActive(true),
        onError: (msg, kind) => {
            haptic('light');
            setSnackbar({ text: msg, kind });
        }
    });

    // Sync Analyser
    useEffect(() => {
        analyserRef.current = sessionAnalyserRef.current;
    }, [sessionAnalyserRef.current]);

    // Visualizer Loop (Optimized for memory)
    useEffect(() => {
        const updateViz = () => {
            if (status.kind === 'processing') {
                // Mock intensity when processing (thinking)
                setAudioIntensity(0.2 + Math.sin(Date.now() / 200) * 0.1);
                animationFrameRef.current = requestAnimationFrame(updateViz);
                return;
            }

            if (!analyserRef.current) {
                setAudioIntensity(0);
                // Keep loop running to catch reconnects or status changes? 
                // Better to simple check status
                if (status.kind !== 'idling') animationFrameRef.current = requestAnimationFrame(updateViz);
                return;
            }

            // Reuse dataArray to prevent garbage collection
            if (!dataArrayRef.current || dataArrayRef.current.length !== analyserRef.current.frequencyBinCount) {
                dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
            }
            
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);

            // Calculate Average Intensity (Bass heavy) - optimized loop
            let sum = 0;
            const binCount = Math.min(32, dataArrayRef.current.length); // Low freq only
            for (let i = 0; i < binCount; i++) {
                sum += dataArrayRef.current[i];
            }
            const average = sum / binCount;
            // Normalize 0-255 to 0-1
            setAudioIntensity(average / 128.0);

            animationFrameRef.current = requestAnimationFrame(updateViz);
        };

        if (status.kind !== 'idling') {
            if (!animationFrameRef.current) updateViz();
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
                setAudioIntensity(0);
            }
        }
        
        // Enhanced cleanup
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            dataArrayRef.current = null;
        };
    }, [status, inputMode, analyserRef]);

    // --- Handlers ---

    const handleLoadingComplete = () => {
        setIsLoading(false);
    };

    const toggleConnection = () => {
        if (status.kind === 'idling') {
            if (micStatus === 'granted') {
                connect();
            } else if (micStatus === 'denied') {
                setSnackbar({ text: "Bạn đã từ chối quyền Micro. Vui lòng cấp lại trong cài đặt.", kind: "error" });
            } else {
                requestInitialPermissions().then(() => connect());
            }
        } else {
            disconnect();
        }
    };

    const toggleLanguage = () => {
        const newLang = language === 'vi' ? 'en' : 'vi';
        setLanguage(newLang);
        setSnackbar({ text: newLang === 'vi' ? "Ngôn ngữ: Tiếng Việt" : "Language: English", kind: "success" });
        if (status.kind !== 'idling') {
            disconnect();
            setTimeout(() => connect(), 500);
        }
    };

    const toggleInputMode = () => {
        disconnect();
        setInputMode(inputMode === 'voice' ? 'text' : 'voice');
        haptic('selection');
    };

    const handleModeChange = (mode: any, items: string[]) => {
        setCulturalMode(mode);
        setSnackbar({ text: `Chế độ: ${mode}`, kind: "success" });
        haptic('success');
        if (status.kind !== 'idling') {
            disconnect();
            setTimeout(() => connect(), 500);
        }
    };

    const handleSendText = async (text: string) => {
        if (!text.trim()) return;
        if (!navigator.onLine) {
            const offlineResponse: ZenResponse = {
                emotion: 'calm',
                wisdom_text: language === 'vi'
                    ? "Mạng không ổn định. Hãy quay về nương tựa nơi hơi thở."
                    : "Connection lost. Return to the island of self through breathing.",
                wisdom_english: "Breathing in, I calm my body.",
                user_transcript: text,
                breathing: '4-7-8',
                confidence: 1,
                reasoning_steps: ['Offline Mode', 'Triggering Local Breathing'],
                quantum_metrics: { coherence: 0.8, entanglement: 0.5, presence: 0.9 },
                awareness_stage: 'mindful',
                consciousness_dimensions: { contextual: 0.5, emotional: 0.5, cultural: 0.5, wisdom: 0.5, uncertainty: 0.5, relational: 0.5 },
                ambient_sound: 'rain'
            };
            setZenData(offlineResponse);
            setInputText('');
            setSnackbar({ text: "Chế độ Offline: Tập thở", kind: "info" });
            return;
        }
        const response = await sendText(text);
        if (response) {
            setInputText('');
            if (detectEmergency(text) || detectEmergency(response.wisdom_text)) {
                setEmergencyActive(true);
            }
        }
    };

    const handlePracticeSelect = (txt: string) => {
        setShowPractices(false);
        handleSendText(txt);
    };

    const handleResetSession = () => {
        haptic('warn');
        setZenData(null);
        setInputText('');
        setSnackbar({ text: "Bắt đầu phiên mới", kind: 'info' });
    };

    // Determine Orb Mode
    const orbMode = useMemo(() => {
        if (status.kind === 'processing') return 'processing';
        if (status.kind === 'speaking') return 'speaking';
        if (status.kind === 'connected_listening' || status.kind === 'connecting') return 'listening';
        return 'idle';
    }, [status]);

    return (
        <div className="relative h-[100dvh] w-full overflow-hidden bg-void select-none font-sans text-stone-100">

            {isLoading && (
                <LoadingScreen
                    onStartInteraction={requestInitialPermissions}
                    onComplete={handleLoadingComplete} // Pass function reference correctly
                />
            )}

            {/* --- 3D SPACE --- */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-void via-voidLight to-void">
                <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} color="#00f3ff" />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ffd700" />
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    <Suspense fallback={null}>
                        <SoulOrb mode={orbMode} intensity={audioIntensity} />
                    </Suspense>
                    <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
                </Canvas>
            </div>

            <Suspense fallback={null}>
                <AudioEngine
                    emotion={zenData?.emotion}
                    breathing={zenData?.breathing}
                    ambientSound={zenData?.ambient_sound}
                    isSpeaking={status.kind === 'speaking'}
                    isEmergency={emergencyActive}
                />
            </Suspense>

            {showBreathing && (
                <BreathingCircle
                    type={zenData?.breathing || '4-7-8'}
                    isActive={showBreathing}
                    onComplete={() => setShowBreathing(false)}
                />
            )}

            <EmergencyProtocol
                isActive={emergencyActive}
                onComplete={() => {
                    setEmergencyActive(false);
                    disconnect();
                }}
            />

            {/* --- UI OVERLAY: GLASSMORPHISM --- */}

            {/* TOP BAR */}
            <div className="absolute top-0 left-0 right-0 p-4 pt-6 z-50 pointer-events-none flex justify-between items-start">
                <div className="pointer-events-auto flex items-center gap-1 bg-voidLight/60 backdrop-blur-md rounded-full p-1 shadow-[0_0_15px_rgba(0,243,255,0.1)] border border-white/10 transition-transform hover:scale-105">
                    <CameraScan onModeChange={handleModeChange} currentMode={culturalMode} />
                    <div className="h-4 w-px bg-white/20 mx-0.5"></div>
                    <button
                        onClick={toggleLanguage}
                        className="p-2.5 rounded-full text-stone-400 hover:text-neonCyan hover:bg-white/5 transition-all"
                        aria-label="Toggle Language"
                    >
                        <Languages size={18} />
                    </button>
                </div>

                <div className="pointer-events-auto flex items-center gap-2">
                    {zenData && (
                        <button
                            onClick={handleResetSession}
                            className="p-2.5 rounded-full bg-voidLight/60 backdrop-blur-md text-stone-400 hover:bg-white/10 transition-all border border-white/10"
                            aria-label="New Session"
                        >
                            <RotateCcw size={18} />
                        </button>
                    )}
                    <HistoryPanel history={history} onClear={() => setHistory([])} />
                </div>
            </div>

            {/* STATUS STATUS */}
            <div className="absolute top-24 left-0 right-0 z-40 pointer-events-none flex justify-center">
                {status.kind === 'processing' && (
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-voidLight/80 backdrop-blur border border-chakraPurple/30 text-xs font-mono text-chakraPurple animate-pulse">
                        <Brain size={12} /> PROCESSING NEURAL PATTERNS
                    </div>
                )}
                {status.kind === 'connected_listening' && (
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-voidLight/80 backdrop-blur border border-neonCyan/30 text-xs font-mono text-neonCyan animate-pulse">
                        <Mic size={12} /> LISTENING TO RESONANCE
                    </div>
                )}
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="absolute inset-0 z-30 flex flex-col items-center pointer-events-none justify-center">
                <div className="pointer-events-auto w-full max-w-2xl px-6 flex flex-col items-center gap-8">
                    {zenData ? (
                        <div className="animate-[scaleIn_0.5s_ease-out] w-full">
                            <ZenCard data={zenData} isGenerating={status.kind === 'processing'} />
                        </div>
                    ) : (
                        <div className="text-center space-y-4 animate-[fadeIn_2s_ease-in]">
                            <h1 className="font-serif text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-stone-200 to-stone-500 drop-shadow-lg italic">
                                {language === 'vi' ? 'Sự yên lặng hùng tráng' : 'The Noble Silence'}
                            </h1>
                            <p className="text-stone-500 font-mono text-xs tracking-[0.2em] uppercase">
                                {language === 'vi' ? 'CHẠM VÀO VÔ TẬN' : 'TOUCH THE INFINITE'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* BOTTOM DOCK */}
            <div className="absolute bottom-8 left-0 right-0 z-50 flex flex-col items-center pointer-events-none px-4">
                {showPractices && (
                    <div className="pointer-events-auto mb-4 bg-voidLight/90 backdrop-blur-xl rounded-[24px] p-2 shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 animate-[slideUp_0.3s_ease-out] max-w-full origin-bottom">
                        <MicroPractices
                            onSelect={handlePracticeSelect}
                            disabled={status.kind !== 'idling' && navigator.onLine}
                            lang={language}
                        />
                    </div>
                )}

                <div
                    className={`pointer-events-auto bg-voidLight/70 backdrop-blur-2xl border border-white/10 shadow-[0_0_20px_rgba(0,243,255,0.05)] rounded-[32px] p-2 flex items-center justify-center gap-4 transition-all duration-300 ease-out hover:border-neonCyan/30 ${inputMode === 'voice' ? 'dock-voice' : 'dock-text'}`}
                >
                    {inputMode === 'voice' ? (
                        <>
                            <button
                                onClick={() => setShowPractices(!showPractices)}
                                className={`p-4 rounded-full text-stone-500 hover:text-neonGold hover:bg-white/5 transition-all duration-300 ${showPractices ? 'text-neonGold bg-white/5' : ''}`}
                                aria-label={showPractices ? "Hide practices" : "Show practices"}
                                title={showPractices ? "Hide practices" : "Show practices"}
                            >
                                <Sparkles size={24} strokeWidth={1.5} />
                            </button>
                            <div className="-my-4 relative">
                                <VoiceButton state={connectionState === 'reconnecting' ? 'processing' : status.kind === 'idling' ? 'idle' : status.kind === 'connecting' ? 'listening' : status.kind === 'connected_listening' ? 'listening' : status.kind === 'processing' ? 'processing' : status.kind === 'speaking' ? 'speaking' : 'idle'} onClick={toggleConnection} />
                                {/* Glow Effect behind button */}
                                <div className="absolute inset-0 bg-neonCyan/20 blur-xl rounded-full -z-10 animate-pulse-slow pointer-events-none"></div>
                            </div>
                            <button
                                onClick={toggleInputMode}
                                className="p-4 rounded-full text-stone-500 hover:text-neonCyan hover:bg-white/5 transition-all duration-300"
                                aria-label="Switch to keyboard input"
                                title="Switch to keyboard input"
                            >
                                <Keyboard size={24} strokeWidth={1.5} />
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 px-2 w-full max-w-md">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendText(inputText)}
                                placeholder={language === 'vi' ? "Gửi thông điệp..." : "Broadcast intent..."}
                                className="w-full bg-transparent border-none focus:ring-0 text-stone-200 placeholder:text-stone-600 text-base py-3 px-2 font-mono"
                                autoFocus
                            />
                            <button
                                onClick={() => handleSendText(inputText)}
                                disabled={!inputText.trim() || status.kind === 'processing'}
                                className="p-3 bg-neonCyan/10 text-neonCyan rounded-full hover:bg-neonCyan hover:text-void disabled:opacity-50 transition-all shadow-[0_0_10px_rgba(0,243,255,0.2)]"
                                aria-label="Send message"
                                title="Send message"
                            >
                                <SendHorizontal size={20} />
                            </button>
                            <div className="w-px h-6 bg-white/10 mx-1" />
                            <button
                                onClick={toggleInputMode}
                                className="p-2 text-stone-500 hover:text-neonCyan transition-colors"
                                aria-label="Switch to voice input"
                                title="Switch to voice input"
                            >
                                <Mic size={24} strokeWidth={1.5} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <BottomSheet
                open={isReasoningOpen}
                onClose={() => setIsReasoningOpen(false)}
                title="Neural Analysis"
            >
                {zenData && <ReasoningPanel data={zenData} onBack={() => setIsReasoningOpen(false)} />}
            </BottomSheet>

            {snackbar && (
                <Snackbar
                    text={snackbar.text}
                    kind={snackbar.kind}
                    onClose={() => setSnackbar(null)}
                />
            )}
        </div>
    );
}
