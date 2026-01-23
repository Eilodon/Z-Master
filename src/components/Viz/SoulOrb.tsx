
import React, { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface SoulOrbProps {
    mode: 'idle' | 'listening' | 'speaking' | 'processing';
    intensity?: number; // 0 to 1
}

export const SoulOrb: React.FC<SoulOrbProps> = memo(({ mode, intensity = 0 }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<any>(null);

    // Configuration based on mode - memoized for performance
    const config = useMemo(() => {
        switch (mode) {
            case 'listening':
                return { color: '#00f3ff', speed: 2, distort: 0.4 };
            case 'speaking':
                return { color: '#ffd700', speed: 1.5, distort: 0.6 };
            case 'processing':
                return { color: '#9d00ff', speed: 5, distort: 0.2 };
            default: // idle
                return { color: '#888899', speed: 0.5, distort: 0.3 };
        }
    }, [mode]);

    // Pre-compute vectors to avoid garbage collection
    const scaleVector = useMemo(() => new THREE.Vector3(), []);
    const targetScale = useMemo(() => new THREE.Vector3(), []);

    useFrame((state) => {
        if (!meshRef.current || !materialRef.current) return;

        const time = state.clock.getElapsedTime();

        // Pulse Effect (Heartbeat) based on intensity
        const baseScale = 1.8;
        const pulse = Math.sin(time * config.speed) * 0.1;
        const audioImpact = intensity * 0.5;

        const scale = baseScale + pulse + audioImpact;

        // Use pre-computed vectors for better performance
        targetScale.set(scale, scale, scale);
        meshRef.current.scale.lerp(targetScale, 0.1);

        // Rotate slowly
        meshRef.current.rotation.y += 0.005;
        meshRef.current.rotation.z += 0.002;

        // Update Material
        materialRef.current.distort = THREE.MathUtils.lerp(
            materialRef.current.distort,
            config.distort + (intensity * 0.5),
            0.1
        );

        materialRef.current.color.lerp(new THREE.Color(config.color), 0.05);
    });

    return (
        <Sphere args={[1, 64, 64]} ref={meshRef}>
            <MeshDistortMaterial
                ref={materialRef}
                color={config.color}
                envMapIntensity={0.4}
                clearcoat={1}
                clearcoatRoughness={0}
                metalness={0.5}
                roughness={0.1}
                distort={0.4}
                speed={2}
            />
        </Sphere>
    );
});
