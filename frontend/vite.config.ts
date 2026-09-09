import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// The SPA talks to the backend only over HTTP. In development the dev server
// proxies /api so the browser sees a single origin and CORS stays out of the way.
//
// The proxy target has to come from loadEnv, not process.env: Vite exposes .env
// files to client code through import.meta.env, but it does not push them into
// process.env for this config file. Reading process.env here would silently
// ignore VITE_PROXY_TARGET and always fall back to port 3000.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget =
    env.VITE_PROXY_TARGET ?? process.env.VITE_PROXY_TARGET ?? 'http://localhost:3000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
