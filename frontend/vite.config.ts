import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The SPA talks to the backend only over HTTP. In development the dev server
// proxies /api so the browser sees a single origin and CORS stays out of the way.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
