import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { SoulOrb } from './SoulOrb';
const OrbViz = React.lazy(() => import('./OrbViz'));
import { ZenResponse } from '../../../types';
import { AppStatus } from '../../../store/zenStore';

interface VisualizationManagerProps {
    status: AppStatus;
    visualizationMode: 'soul' | 'orb';
    analyser: AnalyserNode | null;
    zenData: ZenResponse | null;
}

export function VisualizationManager({ status, visualizationMode, analyser, zenData }: VisualizationManagerProps) {
    // Audio Viz State
    const [audioIntensity, setAudioIntensity] = useState(0);
    const dataArrayRef = useRef<Uint8Array | null>(null);

    // WeakRef pattern for audio data to prevent memory leaks
    const audioDataWeakRef = useRef<WeakRef<Uint8Array> | null>(null);

    // Adaptive quality based on performance
    const [visualQuality, setVisualQuality] = useState<'high' | 'medium' | 'low'>('high');

    // Performance monitoring
    const frameTimeHistory = useRef<number[]>([]);

    const visualizationLoop = useRef<{
        rafId: number | null;
        isActive: boolean;
        lastCleanup: number;
        memoryPressure: number;
    }>({ rafId: null, isActive: false, lastCleanup: Date.now(), memoryPressure: 0 });

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

        if (!analyser) {
            setAudioIntensity(0);
            if (status.kind !== 'idling') {
                visualizationLoop.current.rafId = requestAnimationFrame(optimizedVisualizationLoop);
            }
            return;
        }

        // Optimized frequency analysis with quality scaling
        const binCount = visualQuality === 'high' ? 64 : visualQuality === 'medium' ? 32 : 16;

        if (!dataArrayRef.current || dataArrayRef.current.length !== analyser.frequencyBinCount) {
            const newArray = new Uint8Array(analyser.frequencyBinCount);
            dataArrayRef.current = newArray;
            audioDataWeakRef.current = new WeakRef(newArray);
        }

        // FIX: Cast to any to handle SharedArrayBuffer type mismatch in strict mode
        analyser.getByteFrequencyData(dataArrayRef.current as any);

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
    }, [status, visualQuality, audioIntensity, adjustQuality, detectMemoryPressure, analyser]);

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
            if (visualizationLoop.current.rafId) {
                cancelAnimationFrame(visualizationLoop.current.rafId);
            }

            if (dataArrayRef.current) {
                dataArrayRef.current.fill(0);
                dataArrayRef.current = null;
            }

            if (audioDataWeakRef.current) {
                const data = audioDataWeakRef.current?.deref();
                if (data) data.fill(0);
                audioDataWeakRef.current = null;
            }

            visualizationLoop.current.isActive = false;
            frameTimeHistory.current = [];
        };
    }, [status, optimizedVisualizationLoop]);

    // Determine Orb Mode
    const orbMode = React.useMemo(() => {
        if (status.kind === 'processing') return 'processing';
        if (status.kind === 'speaking') return 'speaking';
        if (status.kind === 'connected_listening' || status.kind === 'connecting') return 'listening';
        return 'idle';
    }, [status]);

    return (
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
            {visualizationMode === 'soul' ? (
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
            ) : (
                <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-white">Loading Premium Viz...</div>}>
                    <OrbViz analyser={analyser} emotion={zenData?.emotion || 'neutral'} frequencyData={dataArrayRef.current || undefined} />
                </Suspense>
            )}
        </div>
    );
}
