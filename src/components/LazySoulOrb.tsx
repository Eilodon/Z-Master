import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { threeLoader, dreiLoader, fiberLoader, loadOnDemand } from '../utils/lazyLoader';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

// Lazy-loaded components
const SoulOrbComponent = React.lazy(() => 
  import('./Viz/SoulOrb').then(module => ({ 
    default: module.SoulOrb 
  }))
);

interface Props {
  mode: 'idle' | 'listening' | 'speaking' | 'processing';
  intensity: number;
}

export function LazySoulOrb({ mode, intensity }: Props) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { startRender, endRender } = usePerformanceMonitor('LazySoulOrb');

  useEffect(() => {
    const loadVisualization = async () => {
      if (isLoaded) return;
      
      setIsLoading(true);
      startRender();
      
      try {
        // Load Three.js ecosystem on demand
        await Promise.all([
          loadOnDemand(threeLoader),
          loadOnDemand(dreiLoader),
          loadOnDemand(fiberLoader)
        ]);
        
        setIsLoaded(true);
      } catch (error) {
        console.error('[LazySoulOrb] Failed to load 3D libraries:', error);
      } finally {
        setIsLoading(false);
        endRender();
      }
    };

    // Load only when user interacts or when component becomes visible
    const timer = setTimeout(loadVisualization, 100); // Small delay for non-blocking
    
    return () => clearTimeout(timer);
  }, [isLoaded, startRender, endRender]);

  if (!isLoaded) {
    return (
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        {isLoading ? (
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-sm text-gray-400">Đang tải không gian thiền định...</p>
            <p className="text-xs text-gray-500 mt-1">Loading meditation space...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-4">🪷</div>
            <p className="text-gray-400 text-sm">Chạm để bắt đầu</p>
            <p className="text-gray-500 text-xs">Touch to begin</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00f3ff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ffd700" />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <Suspense fallback={
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
          </div>
        }>
          <SoulOrbComponent mode={mode} intensity={intensity} />
        </Suspense>
        
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
