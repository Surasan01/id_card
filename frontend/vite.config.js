import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'https://8000-dep-01kmk05e8pn0fq29yk9kc07jbm-d.cloudspaces.litng.ai',
                changeOrigin: true,
            },
            '/health': {
                target: 'https://8000-dep-01kmk05e8pn0fq29yk9kc07jbm-d.cloudspaces.litng.ai',
                changeOrigin: true,
            },
        },
    },
    test: {
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',
    },
});
