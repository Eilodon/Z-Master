// --- PERFORMANCE-OPTIMIZED MAIN VIEW ---
// Implements tap-to-close, performance optimizations, and smooth interactions

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
import { Keyboard, Mic, Languages, SendHorizontal, Brain, Sparkles, Wifi, WifiOff, RotateCcw, Eye, BookOpen, X } from 'lucide-react';
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

    // --- PERFORMANCE STATE ---
    const [isOptimized, setIsOptimized] = useState(false);
    const [fps, setFps] = useState(60);
    const [memoryUsage, setMemoryUsage] = useState(0);

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

    // --- PERFORMANCE MONITORING ---
    const performanceMonitor = useRef({
        frameCount: 0,
        lastTime: performance.now(),
        fps: 60
    });

    const monitorPerformance = useCallback(() => {
        const now = performance.now();
        const delta = now - performanceMonitor.current.lastTime;
        
        performanceMonitor.current.frameCount++;
        
        if (delta >= 1000) {
            const currentFps = Math.round((performanceMonitor.current.frameCount * 1000) / delta);
            setFps(currentFps);
            
            // Auto-optimize if FPS drops below 30
            if (currentFps < 30 && !isOptimized) {
                setIsOptimized(true);
                console.log('🚀 Auto-optimizing due to low FPS:', currentFps);
            }
            
            performanceMonitor.current.frameCount = 0;
            performanceMonitor.current.lastTime = now;
        }
        
        // Monitor memory usage
        if ('memory' in performance) {
            const mem = (performance as any).memory;
            const usageMB = mem.usedJSHeapSize / 1024 / 1024;
            setMemoryUsage(usageMB);
            
            // Force cleanup if memory usage is high
            if (usageMB > 100) {
                forceCleanup();
            }
        }
        
        if (animationFrameRef.current) {
            animationFrameRef.current = requestAnimationFrame(monitorPerformance);
        }
    }, [isOptimized]);

    const forceCleanup = useCallback(() => {
        // Clear unnecessary data
        if (dataArrayRef.current && dataArrayRef.current.length > 0) {
            dataArrayRef.current = new Uint8Array(analyserRef.current?.frequencyBinCount || 0);
        }
        
        // Force garbage collection if available
        if ('gc' in window) {
            (window as any).gc();
        }
        
        console.log('🧹 Forced cleanup completed');
    }, []);

    // Start performance monitoring
    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(monitorPerformance);
        
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [monitorPerformance]);

    // --- TAP-TO-CLOSE FUNCTIONALITY ---
    const overlayRef = useRef<HTMLDivElement>(null);
    const [tapCount, setTapCount] = useState(0);
    const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleOverlayTap = useCallback((e: React.MouseEvent) => {
        // Only close if tapping on the overlay itself, not on children
        if (e.target === overlayRef.current) {
            e.preventDefault();
            
            // Double-tap to close modals
            setTapCount(prev => prev + 1);
            
            if (tapTimeoutRef.current) {
                clearTimeout(tapTimeoutRef.current);
            }
            
            tapTimeoutRef.current = setTimeout(() => {
                setTapCount(0);
            }, 300);
            
            if (tapCount >= 1) { // Second tap
                // Close all open modals/panels
                setIsReasoningOpen(false);
                setShowPractices(false);
                setShowNarrativeMemory(false);
                setTapCount(0);
                haptic('success');
                console.log('🎯 All modals closed via double-tap');
            }
        }
    }, [tapCount]);

    // --- ESC KEY TO CLOSE ---
    useEffect(() => {
        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                // Close modals in order of priority
                if (showNarrativeMemory) {
                    setShowNarrativeMemory(false);
                } else if (showPractices) {
                    setShowPractices(false);
                } else if (isReasoningOpen) {
                    setIsReasoningOpen(false);
                } else {
                    // Disconnect session if no modals open
                    if (status.kind !== 'idling') {
                        disconnect();
                    }
                }
                haptic('light');
            }
        };

        window.addEventListener('keydown', handleEscKey);
        return () => window.removeEventListener('keydown', handleEscKey);
    }, [showNarrativeMemory, showPractices, isReasoningOpen, status.kind, disconnect]);

    // --- OPTIMIZED VISUALIZATION ---
    const optimizedVisualization = useMemo(() => {
        if (isOptimized) {
            return 'low'; // Reduce quality when performance is poor
        }
        return visualizationMode;
    }, [isOptimized, visualizationMode]);

    // --- EVENT HANDLERS ---
    const toggleConnection = useCallback(async () => {
        try {
            if (status.kind === 'idling') {
                await connect();
            } else {
                disconnect();
            }
        } catch (error) {
            console.error('Connection toggle failed:', error);
            setSnackbar({ text: 'Connection failed', kind: 'error' });
        }
    }, [status.kind, connect, disconnect, setSnackbar]);

    const toggleInputMode = useCallback(() => {
        setInputMode(inputMode === 'voice' ? 'text' : 'voice');
        haptic('light');
    }, [inputMode, setInputMode]);

    const toggleLanguage = useCallback(() => {
        setLanguage(language === 'en' ? 'vi' : 'en');
        haptic('light');
    }, [language, setLanguage]);

    const handleModeChange = useCallback((mode: string) => {
        setCulturalMode(mode as any);
        haptic('light');
    }, [setCulturalMode]);

    const handlePracticeSelect = useCallback((practice: string) => {
        setShowPractices(false);
        // Handle practice selection logic here
        console.log('Practice selected:', practice);
    }, []);

    const handleSendText = useCallback(async (text: string) => {
        if (!text.trim()) return;
        
        try {
            setInputText('');
            await sendText(text);
        } catch (error) {
            console.error('Send text failed:', error);
            setSnackbar({ text: 'Failed to send message', kind: 'error' });
        }
    }, [sendText, setSnackbar]);

    const handleResetSession = useCallback(() => {
        setZenData(null);
        setInputText('');
        haptic('success');
    }, [setZenData]);

    const handleLoadingComplete = useCallback(() => {
        setIsLoading(false);
    }, [setIsLoading]);

    const orbMode = useMemo(() => {
        if (!zenData) return 'idle';
        const emotion = zenData.emotion;
        if (emotion === 'calm' || emotion === 'joyful') return 'idle';
        if (emotion === 'anxious' || emotion === 'stressed') return 'listening';
        if (emotion === 'seeking' || emotion === 'neutral') return 'idle';
        return 'idle';
    }, [zenData]);

    // --- RENDER ---
    return (
        <div 
            ref={overlayRef}
            className="relative w-full h-screen overflow-hidden bg-gray-900"
            onClick={handleOverlayTap}
        >
            {/* Performance Indicator (Debug) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed top-2 left-2 z-50 bg-black/50 text-white text-xs p-2 rounded font-mono">
                    <div>FPS: {fps}</div>
                    <div>Memory: {memoryUsage.toFixed(1)}MB</div>
                    <div>Optimized: {isOptimized ? 'Yes' : 'No'}</div>
                </div>
            )}

            {/* Error State */}
            {hasError && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900">
                    <div className="text-center space-y-4 p-8">
                        <div className="text-red-400 text-6xl">⚠️</div>
                        <h2 className="text-white text-xl font-semibold">Something went wrong</h2>
                        <p className="text-gray-400">{errorMessage}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition-colors"
                        >
                            Reload App
                        </button>
                    </div>
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
                    {/* --- 3D SPACE (OPTIMIZED) --- */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
                        {optimizedVisualization === 'soul' ? (
                            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                                <ambientLight intensity={0.5} />
                                <pointLight position={[10, 10, 10]} intensity={1} color="#00f3ff" />
                                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ffd700" />
                                <Stars radius={100} depth={50} count={isOptimized ? 1000 : 5000} factor={4} saturation={0} fade speed={1} />
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

                    {/* --- UI OVERLAY: ENHANCED GLASSMORPHISM --- */}

                    {/* TOP BAR */}
                    <div className="absolute top-0 left-0 right-0 p-4 pt-6 z-50 pointer-events-none flex justify-between items-start">
                        <div className="pointer-events-auto flex items-center gap-1 glass-enhanced rounded-full p-1 shadow-glow transition-smooth hover:scale-105">
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
                                    className="p-2.5 rounded-full glass-card text-gray-400 hover:bg-white/10 transition-all"
                                    aria-label="New Session"
                                >
                                    <RotateCcw size={18} />
                                </button>
                            )}
                            <button
                                onClick={() => setShowNarrativeMemory(true)}
                                className="p-2.5 rounded-full glass-card text-gray-400 hover:bg-white/10 hover:text-purple-400 transition-all"
                                aria-label="View Journey"
                                title="View your journey"
                            >
                                <BookOpen size={18} />
                            </button>
                            <HistoryPanel history={history} onClear={() => setHistory([])} />
                        </div>
                    </div>

                    {/* STATUS INDICATOR */}
                    <div className="absolute top-24 left-0 right-0 z-40 pointer-events-none flex justify-center">
                        {status.kind === 'processing' && (
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full glass-enhanced border border-purple-500/30 text-xs font-mono text-purple-400 animate-pulse animate-glow">
                                <Brain size={12} /> PROCESSING NEURAL PATTERNS
                            </div>
                        )}
                        {status.kind === 'connected_listening' && (
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full glass-enhanced border border-cyan-400/30 text-xs font-mono text-cyan-400 animate-pulse animate-glow">
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
                            <div className="pointer-events-auto mb-4 glass-card rounded-[24px] p-2 shadow-card animate-[slideUp_0.3s_ease-out] max-w-full origin-bottom">
                                <div className="absolute top-2 right-2">
                                    <button
                                        onClick={() => setShowPractices(false)}
                                        className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                        aria-label="Close practices"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <MicroPractices
                                    onSelect={handlePracticeSelect}
                                    disabled={status.kind !== 'idling'}
                                    lang={language}
                                />
                            </div>
                        )}

                        <div
                            className={`pointer-events-auto glass-card border border-white/10 shadow-glow rounded-[32px] p-2 flex items-center justify-center gap-4 transition-smooth hover:border-cyan-400/30 ${inputMode === 'voice' ? 'dock-voice' : 'dock-text'}`}
                        >
                            {inputMode === 'voice' ? (
                                <>
                                    <button
                                        onClick={() => setShowPractices(!showPractices)}
                                        className={`p-4 rounded-full text-gray-500 hover:text-yellow-400 hover:bg-white/5 transition-smooth ${showPractices ? 'text-yellow-400 bg-white/5' : ''}`}
                                        aria-label={showPractices ? "Hide practices" : "Show practices"}
                                        title={showPractices ? "Hide practices" : "Show practices"}
                                    >
                                        <Sparkles size={24} strokeWidth={1.5} />
                                    </button>
                                    <div className="-my-4 relative">
                                        <VoiceButton state={connectionState === 'reconnecting' ? 'processing' : status.kind === 'idling' ? 'idle' : status.kind === 'connecting' ? 'listening' : status.kind === 'connected_listening' ? 'listening' : status.kind === 'processing' ? 'processing' : status.kind === 'speaking' ? 'speaking' : 'idle'} onClick={toggleConnection} />
                                        {/* Enhanced Glow Effect */}
                                        <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full -z-10 animate-pulse-slow pointer-events-none animate-glow"></div>
                                    </div>
                                    <button
                                        onClick={toggleInputMode}
                                        className="p-4 rounded-full text-gray-500 hover:text-cyan-400 hover:bg-white/5 transition-smooth"
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
                                        className="p-3 bg-cyan-400/10 text-cyan-400 rounded-full hover:bg-cyan-400 hover:text-gray-900 disabled:opacity-50 transition-smooth shadow-glow"
                                        aria-label="Send message"
                                        title="Send message"
                                    >
                                        <SendHorizontal size={20} />
                                    </button>
                                    <div className="w-px h-6 bg-white/10 mx-1" />
                                    <button
                                        onClick={toggleInputMode}
                                        className="p-2 text-gray-500 hover:text-cyan-400 transition-smooth"
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
