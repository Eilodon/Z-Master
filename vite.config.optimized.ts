/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React and related
          'react-vendor': ['react', 'react-dom'],
          
          // Three.js ecosystem - split into smaller chunks
          'three-core': ['three'],
          'three-react': ['@react-three/fiber', '@react-three/drei'],
          
          // Audio libraries - lazy loaded
          'audio-core': ['tone'],
          'audio-utils': ['onnxruntime-web'],
          
          // State management
          'state-management': ['zustand'],
          
          // UI components
          'ui-components': ['lucide-react'],
          
          // Utilities
          'utils': ['@testing-library/dom', '@testing-library/jest-dom', '@testing-library/react']
        }
      }
    },
    chunkSizeWarningLimit: 800, // Lower threshold to catch large chunks early
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      mangle: {
        safari10: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei'
    ]
  },
  server: {
    fs: {
      // Allow serving files from node_modules for debugging
      allow: ['..']
    }
  }
});
