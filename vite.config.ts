import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          vendor: ['react', 'react-dom'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          ui: ['lucide-react', 'zustand'],
          audio: ['tone', 'onnxruntime-web'],
          utils: ['@google/genai', 'sentiment']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  // Security Note: We strictly DO NOT use 'define' for process.env.API_KEY here.
  // The key must be injected at runtime by the environment (window.aistudio) to prevent leaking in the build bundle.
});