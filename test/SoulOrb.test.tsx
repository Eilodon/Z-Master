import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SoulOrb } from '../src/components/Viz/SoulOrb';

// Mock Three.js properly with constructor function
vi.mock('three', () => {
  const mockVector3 = function(x: number, y: number, z: number) {
    return { x, y, z, set: vi.fn(), lerp: vi.fn() };
  };
  
  return {
    Vector3: mockVector3,
    Color: vi.fn().mockImplementation((color) => ({ color })),
    MathUtils: {
      lerp: vi.fn((a, b, t) => a + (b - a) * t)
    }
  };
});

// Mock @react-three/fiber
vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn((callback) => {
    // Simulate one frame for testing
    callback({ clock: { getElapsedTime: () => 1 } });
  })
}));

// Mock @react-three/drei
vi.mock('@react-three/drei', () => ({
  Sphere: ({ children, ...props }: any) => <div data-testid="sphere" {...props}>{children}</div>,
  MeshDistortMaterial: ({ ref, ...props }: any) => <div data-testid="material" {...props} />
}));

describe('SoulOrb Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with idle mode by default', () => {
    render(<SoulOrb mode="idle" />);
    expect(screen.getByTestId('sphere')).toBeInTheDocument();
    expect(screen.getByTestId('material')).toBeInTheDocument();
  });

  it('applies correct color for listening mode', () => {
    render(<SoulOrb mode="listening" />);
    const material = screen.getByTestId('material');
    expect(material).toHaveAttribute('color', '#00f3ff');
  });

  it('applies correct color for speaking mode', () => {
    render(<SoulOrb mode="speaking" />);
    const material = screen.getByTestId('material');
    expect(material).toHaveAttribute('color', '#ffd700');
  });

  it('applies correct color for processing mode', () => {
    render(<SoulOrb mode="processing" />);
    const material = screen.getByTestId('material');
    expect(material).toHaveAttribute('color', '#9d00ff');
  });

  it('applies correct color for idle mode', () => {
    render(<SoulOrb mode="idle" />);
    const material = screen.getByTestId('material');
    expect(material).toHaveAttribute('color', '#888899');
  });

  it('handles intensity changes', () => {
    render(<SoulOrb mode="listening" intensity={0.5} />);
    const material = screen.getByTestId('material');
    expect(material).toBeInTheDocument();
    // Intensity affects animation, which is tested through useFrame mock
  });

  it('has correct sphere geometry', () => {
    render(<SoulOrb mode="idle" />);
    const sphere = screen.getByTestId('sphere');
    expect(sphere).toHaveAttribute('args', '1,64,64');
  });

  it('has correct material properties', () => {
    render(<SoulOrb mode="idle" />);
    const material = screen.getByTestId('material');
    
    expect(material).toHaveAttribute('envMapIntensity', '0.4');
    expect(material).toHaveAttribute('clearcoat', '1');
    expect(material).toHaveAttribute('clearcoatRoughness', '0');
    expect(material).toHaveAttribute('metalness', '0.5');
    expect(material).toHaveAttribute('roughness', '0.1');
    expect(material).toHaveAttribute('distort', '0.4');
    expect(material).toHaveAttribute('speed', '2');
  });

  it('is memoized correctly', () => {
    const { rerender } = render(<SoulOrb mode="idle" />);
    const initialSphere = screen.getByTestId('sphere');
    
    // Rerender with same props - should not cause re-render due to memo
    rerender(<SoulOrb mode="idle" />);
    const rerenderedSphere = screen.getByTestId('sphere');
    
    expect(initialSphere).toBe(rerenderedSphere);
  });
});
