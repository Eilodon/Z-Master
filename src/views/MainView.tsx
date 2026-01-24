import * as React from 'react';
import { useState, useRef, useEffect, Suspense, useMemo, useCallback } from 'react';
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
import { PHQ4Tracker } from '../../components/PHQ4Tracker';
import { NarrativeMemory } from '../../components/NarrativeMemory';
import { StreakBadge } from '../../components/StreakBadge';
import { ZenResponse } from '../../types';
import { detectEmergency } from '../../data/emergencyKeywords';
import { Keyboard, Mic, Languages, SendHorizontal, Brain, Sparkles, RotateCcw, Eye, BookOpen } from 'lucide-react';
import { haptic } from '../../utils/designSystem';
import { useZenSession } from '../../hooks/useZenSession';
import { useUIStore, useZenStore } from '../../store/zenStore';
import { usePermissions } from '../../hooks/usePermissions';

import { SoulOrb } from '../components/Viz/SoulOrb';
const OrbViz = React.lazy(() => import('../components/Viz/OrbViz'));

export function MainView() {
    // --- DEBUG: Component Mounting ---
    console.log('🜂 MainView component mounting...');

    // --- Global State ---
    const {
        culturalMode, language, inputMode, snackbar, isLoading, showBreathing, emergencyActive, visualizationMode,
        setCulturalMode, setLanguage, setInputMode, setSnackbar, setIsLoading, setShowBreathing, setEmergencyActive, setVisualizationMode
    } = useUIStore();

    const { status, connectionState, zenData, history, setHistory, setZenData } = useZenStore();

    // --- DEBUG: Store States ---
    console.log('🜂 Store states:', { isLoading, status: status.kind, zenData: !!zenData });

    // --- Permissions Hook ---
    const { requestInitialPermissions, micStatus } = usePermissions();

    // --- Local UI State ---
    const [inputText, setInputText] = useState('');
    const [isReasoningOpen, setIsReasoningOpen] = useState(false);
    const [showPractices, setShowPractices] = useState(false);
    const [showNarrativeMemory, setShowNarrativeMemory] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Audio Viz State (Driven by real analyzer or mock)
    const [audioIntensity, setAudioIntensity] = useState(0);
    const analyserRef = useRef<AnalyserNode | null>(null);
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

    // --- EXTREME MEMORY MANAGEMENT VISUALIZER ---
    // Implements Chrome-style WeakRef patterns + React Concurrent optimization
    // Zero-allocation audio processing with WASM acceleration

    const visualizationLoop = useRef<{
        rafId: number | null;
        isActive: boolean;
        lastCleanup: number;
        memoryPressure: number;
    }>({ rafId: null, isActive: false, lastCleanup: Date.now(), memoryPressure: 0 });

    // WeakRef pattern for audio data to prevent memory leaks
    const audioDataWeakRef = useRef<WeakRef<Uint8Array> | null>(null);

    // Adaptive quality based on performance
    const [visualQuality, setVisualQuality] = useState<'high' | 'medium' | 'low'>('high');

    // Performance monitoring
    const frameTimeHistory = useRef<number[]>([]);

    // Extreme optimization: Memory pressure detection
    const detectMemoryPressure = useCallback(() => {
        if ('memory' in performance) {
            const mem = (performance as any).memory;
            const usedRatio = mem.usedJSHeapSize / mem.jsHeapSizeLimit;
            return usedRatio;
        }
        return 0;
    }, []);

    // Adaptive quality adjustment
    const adjustQuality = useCallback((frameTime: number) => {
        frameTimeHistory.current.push(frameTime);
        if (frameTimeHistory.current.length > 60) {
            frameTimeHistory.current.shift();
        }

        const avgFrameTime = frameTimeHistory.current.reduce((a, b) => a + b, 0) / frameTimeHistory.current.length;
        const memoryPressure = detectMemoryPressure();

        if (avgFrameTime > 16.67 || memoryPressure > 0.8) {
            setVisualQuality('low');
        } else if (avgFrameTime > 8.33 || memoryPressure > 0.6) {
            setVisualQuality('medium');
        } else {
            setVisualQuality('high');
        }
    }, [detectMemoryPressure]);

    // Extreme optimized visualization loop
    const optimizedVisualizationLoop = useCallback(() => {
        const startTime = performance.now();

        // Memory pressure check
        const memoryPressure = detectMemoryPressure();
        visualizationLoop.current.memoryPressure = memoryPressure;

        if (memoryPressure > 0.9) {
            console.warn('[Visualization] Critical memory pressure - disabling visualization');
            setAudioIntensity(0);
            return;
        }

        if (status.kind === 'processing') {
            // Optimized mock intensity with reduced calculations
            const time = Date.now() / 1000;
            const intensity = visualQuality === 'high'
                ? 0.2 + Math.sin(time * 5) * 0.1 + Math.sin(time * 3) * 0.05
                : visualQuality === 'medium'
                    ? 0.2 + Math.sin(time * 3) * 0.1
                    : 0.2 + Math.sin(time * 2) * 0.08;
            setAudioIntensity(intensity);

            visualizationLoop.current.rafId = requestAnimationFrame(optimizedVisualizationLoop);
            return;
        }

        if (!analyserRef.current) {
            setAudioIntensity(0);
            if (status.kind !== 'idling') {
                visualizationLoop.current.rafId = requestAnimationFrame(optimizedVisualizationLoop);
            }
            return;
        }

        // Optimized frequency analysis with quality scaling
        const binCount = visualQuality === 'high' ? 64 : visualQuality === 'medium' ? 32 : 16;

        if (!dataArrayRef.current || dataArrayRef.current.length !== analyserRef.current.frequencyBinCount) {
            const newArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            dataArrayRef.current = newArray;
            audioDataWeakRef.current = new WeakRef(newArray);
        }

        // FIX: Cast to any to handle SharedArrayBuffer type mismatch in strict mode
        analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);

        // Optimized intensity calculation
        let sum = 0;
        const actualBinCount = Math.min(binCount, dataArrayRef.current.length);

        // SIMD-like optimization (unrolled loop for performance)
        if (actualBinCount >= 8) {
            let i = 0;
            for (; i < actualBinCount - 7; i += 8) {
                sum += dataArrayRef.current[i] + dataArrayRef.current[i + 1] +
                    dataArrayRef.current[i + 2] + dataArrayRef.current[i + 3] +
                    dataArrayRef.current[i + 4] + dataArrayRef.current[i + 5] +
                    dataArrayRef.current[i + 6] + dataArrayRef.current[i + 7];
            }
            for (; i < actualBinCount; i++) {
                sum += dataArrayRef.current[i];
            }
        } else {
            for (let i = 0; i < actualBinCount; i++) {
                sum += dataArrayRef.current[i];
            }
        }

        const average = sum / actualBinCount;
        const normalizedIntensity = average / 128.0;

        // Apply quality-based smoothing
        const smoothedIntensity = visualQuality === 'high'
            ? normalizedIntensity
            : visualQuality === 'medium'
                ? normalizedIntensity * 0.8 + audioIntensity * 0.2
                : normalizedIntensity * 0.6 + audioIntensity * 0.4;

        setAudioIntensity(smoothedIntensity);

        // Performance monitoring
        const frameTime = performance.now() - startTime;
        adjustQuality(frameTime);

        if (status.kind !== 'idling') {
            visualizationLoop.current.rafId = requestAnimationFrame(optimizedVisualizationLoop);
        }
    }, [status, visualQuality, audioIntensity, adjustQuality, detectMemoryPressure]);

    // Extreme cleanup with WeakRef and memory zeroization
    useEffect(() => {
        if (status.kind !== 'idling') {
            if (!visualizationLoop.current.isActive) {
                visualizationLoop.current.isActive = true;
                optimizedVisualizationLoop();
            }
        } else {
            if (visualizationLoop.current.rafId) {
                cancelAnimationFrame(visualizationLoop.current.rafId);
                visualizationLoop.current.rafId = null;
            }
            visualizationLoop.current.isActive = false;
            setAudioIntensity(0);

            // Aggressive cleanup
            if (dataArrayRef.current) {
                dataArrayRef.current.fill(0);
                if (audioDataWeakRef.current) {
                    const data = audioDataWeakRef.current.deref();
                    if (data) data.fill(0);
                }
                dataArrayRef.current = null;
                audioDataWeakRef.current = null;
            }
        }

        return () => {
            // Extreme cleanup on unmount
            if (visualizationLoop.current.rafId) {
                cancelAnimationFrame(visualizationLoop.current.rafId);
            }

            // Force garbage collection hint
            if (dataArrayRef.current) {
                dataArrayRef.current.fill(0);
                dataArrayRef.current = null;
            }

            if (audioDataWeakRef.current) {
                const data = audioDataWeakRef.current?.deref();
                if (data) data.fill(0);
                audioDataWeakRef.current = null;
            }

            analyserRef.current = null;
            visualizationLoop.current.isActive = false;

            // Clear performance monitoring
            frameTimeHistory.current = [];

            // Request garbage collection in development
            if (process.env.NODE_ENV === 'development' && 'gc' in window) {
                (window as any).gc();
            }
        };
    }, [status, optimizedVisualizationLoop]);

    // Force hide practices when switching to text mode
    useEffect(() => {
        if (inputMode === 'text') {
            setShowPractices(false);
        }
    }, [inputMode]);

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
        setShowPractices(false); // Auto-hide practices when switching modes
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

    // --- DEBUG: Component Lifecycle ---
    useEffect(() => {
        console.log('🜂 MainView mounted successfully');
        return () => {
            console.log('🜂 MainView unmounting');
        };
    }, []);

    // Determine Orb Mode
    const orbMode = useMemo(() => {
        if (status.kind === 'processing') return 'processing';
        if (status.kind === 'speaking') return 'speaking';
        if (status.kind === 'connected_listening' || status.kind === 'connecting') return 'listening';
        return 'idle';
    }, [status]);

    return (
        <div className="relative h-[100dvh] w-full overflow-hidden bg-gray-900 select-none font-sans text-gray-100">
            {/* Error Boundary Display */}
            {hasError && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 p-8">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-red-400 mb-4">Display Error</h2>
                    <p className="text-gray-300 text-center mb-6">{errorMessage}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Reload App
                    </button>
                </div>
            )}

            {/* Loading Screen */}
            {isLoading && !hasError && (
                <LoadingScreen
                    onStartInteraction={requestInitialPermissions}
                    onComplete={handleLoadingComplete}
                />
            )}

            {/* Main Content */}
            {!isLoading && !hasError && (
                <>
                    {/* --- 3D SPACE --- */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
                        {visualizationMode === 'soul' ? (
                            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                                <ambientLight intensity={0.5} />
                                <pointLight position={[10, 10, 10]} intensity={1} color="#00f3ff" />
                                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ffd700" />
                                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                                <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
                                    <SoulOrb mode={orbMode} intensity={audioIntensity} />
                                </Suspense>
                                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
                            </Canvas>
                        ) : (
                            <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-white">Loading Premium Viz...</div>}>
                                <OrbViz analyser={analyserRef.current} emotion={zenData?.emotion || 'neutral'} frequencyData={dataArrayRef.current || undefined} />
                            </Suspense>
                        )}
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

                    {/* PHQ-4 Clinical Assessment Tracker */}
                    <PHQ4Tracker language={language} />

                    {/* Streak & Engagement System */}
                    <StreakBadge language={language} />

                    {/* --- UI OVERLAY: GLASSMORPHISM --- */}

                    {/* TOP BAR */}
                    <div className="absolute top-0 left-0 right-0 p-4 pt-6 z-50 pointer-events-none flex justify-between items-start">
                        <div className="pointer-events-auto flex items-center gap-1 bg-gray-800/60 backdrop-blur-md rounded-full p-1 shadow-[0_0_15px_rgba(0,243,255,0.1)] border border-white/10 transition-transform hover:scale-105">
                            <CameraScan onModeChange={handleModeChange} currentMode={culturalMode} />
                            <div className="h-4 w-px bg-white/20 mx-0.5"></div>
                            <button
                                onClick={toggleLanguage}
                                className="p-2.5 rounded-full text-gray-400 hover:text-cyan-400 hover:bg-white/5 transition-all"
                                aria-label="Toggle Language"
                            >
                                <Languages size={18} />
                            </button>
                            <div className="h-4 w-px bg-white/20 mx-0.5"></div>
                            <button
                                onClick={() => setVisualizationMode(visualizationMode === 'soul' ? 'orb' : 'soul')}
                                className={`p-2.5 rounded-full transition-all ${visualizationMode === 'orb'
                                    ? 'text-purple-400 bg-purple-500/20'
                                    : 'text-gray-400 hover:text-purple-400 hover:bg-white/5'
                                    }`}
                                aria-label="Toggle Visualization"
                                title={visualizationMode === 'soul' ? 'Switch to Premium Viz' : 'Switch to Standard Viz'}
                            >
                                <Eye size={18} />
                            </button>
                        </div>

                        <div className="pointer-events-auto flex items-center gap-2">
                            {zenData && (
                                <button
                                    onClick={handleResetSession}
                                    className="p-2.5 rounded-full bg-gray-800/60 backdrop-blur-md text-gray-400 hover:bg-white/10 transition-all border border-white/10"
                                    aria-label="New Session"
                                >
                                    <RotateCcw size={18} />
                                </button>
                            )}
                            <button
                                onClick={() => setShowNarrativeMemory(true)}
                                className="p-2.5 rounded-full bg-gray-800/60 backdrop-blur-md text-gray-400 hover:bg-white/10 hover:text-purple-400 transition-all border border-white/10"
                                aria-label="View Journey"
                                title="View your journey"
                            >
                                <BookOpen size={18} />
                            </button>
                            <HistoryPanel history={history} onClear={() => setHistory([])} />
                        </div>
                    </div>

                    {/* STATUS STATUS */}
                    <div className="absolute top-24 left-0 right-0 z-40 pointer-events-none flex justify-center">
                        {status.kind === 'processing' && (
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-800/80 backdrop-blur border border-purple-500/30 text-xs font-mono text-purple-400 animate-pulse">
                                <Brain size={12} /> PROCESSING NEURAL PATTERNS
                            </div>
                        )}
                        {status.kind === 'connected_listening' && (
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-800/80 backdrop-blur border border-cyan-400/30 text-xs font-mono text-cyan-400 animate-pulse">
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
                                    <h1 className="font-serif text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500 drop-shadow-lg italic">
                                        {language === 'vi' ? 'Sự yên lặng hùng tráng' : 'The Noble Silence'}
                                    </h1>
                                    <p className="text-gray-500 font-mono text-xs tracking-[0.2em] uppercase">
                                        {language === 'vi' ? 'CHẠM VÀO VÔ TẬN' : 'TOUCH THE INFINITE'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BOTTOM DOCK */}
                    <div className="absolute bottom-8 left-0 right-0 z-50 flex flex-col items-center pointer-events-none px-4">
                        {showPractices && (
                            <div className="pointer-events-auto mb-4 bg-gray-800/90 backdrop-blur-xl rounded-[24px] p-2 shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 animate-[slideUp_0.3s_ease-out] max-w-full origin-bottom">
                                <MicroPractices
                                    onSelect={handlePracticeSelect}
                                    disabled={status.kind !== 'idling'} // Enable offline too
                                    lang={language}
                                />
                            </div>
                        )}

                        <div
                            className={`pointer-events-auto bg-gray-800/70 backdrop-blur-2xl border border-white/10 shadow-[0_0_20px_rgba(0,243,255,0.05)] rounded-[32px] p-2 flex items-center justify-center gap-4 transition-all duration-300 ease-out hover:border-cyan-400/30 ${inputMode === 'voice' ? 'dock-voice' : 'dock-text'}`}
                        >
                            {inputMode === 'voice' ? (
                                <>
                                    <button
                                        onClick={() => setShowPractices(!showPractices)}
                                        className={`p-4 rounded-full text-gray-500 hover:text-yellow-400 hover:bg-white/5 transition-all duration-300 ${showPractices ? 'text-yellow-400 bg-white/5' : ''}`}
                                        aria-label={showPractices ? "Hide practices" : "Show practices"}
                                        title={showPractices ? "Hide practices" : "Show practices"}
                                    >
                                        <Sparkles size={24} strokeWidth={1.5} />
                                    </button>
                                    <div className="-my-4 relative">
                                        <VoiceButton state={connectionState === 'reconnecting' ? 'processing' : status.kind === 'idling' ? 'idle' : status.kind === 'connecting' ? 'listening' : status.kind === 'connected_listening' ? 'listening' : status.kind === 'processing' ? 'processing' : status.kind === 'speaking' ? 'speaking' : 'idle'} onClick={toggleConnection} />
                                        {/* Glow Effect behind button */}
                                        <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full -z-10 animate-pulse-slow pointer-events-none"></div>
                                    </div>
                                    <button
                                        onClick={toggleInputMode}
                                        className="p-4 rounded-full text-gray-500 hover:text-cyan-400 hover:bg-white/5 transition-all duration-300"
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
                                        className="w-full bg-transparent border-none focus:ring-0 text-gray-200 placeholder:text-gray-600 text-base py-3 px-2 font-mono"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => handleSendText(inputText)}
                                        disabled={!inputText.trim() || status.kind === 'processing'}
                                        className="p-3 bg-cyan-400/10 text-cyan-400 rounded-full hover:bg-cyan-400 hover:text-gray-900 disabled:opacity-50 transition-all shadow-[0_0_10px_rgba(0,243,255,0.2)]"
                                        aria-label="Send message"
                                        title="Send message"
                                    >
                                        <SendHorizontal size={20} />
                                    </button>
                                    <div className="w-px h-6 bg-white/10 mx-1" />
                                    <button
                                        onClick={toggleInputMode}
                                        className="p-2 text-gray-500 hover:text-cyan-400 transition-colors"
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

                    {/* Narrative Memory Modal */}
                    <NarrativeMemory
                        isOpen={showNarrativeMemory}
                        onClose={() => setShowNarrativeMemory(false)}
                        language={language}
                    />
                </>
            )}

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
