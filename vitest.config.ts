
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: ['./test/setup.ts'],
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        coverage: {
            reporter: ['text', 'json', 'html'],
            lines: 90,
            functions: 90,
            branches: 90,
            statements: 90
        }
    },
});
