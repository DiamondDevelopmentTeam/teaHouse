import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const loadedEnvironment = loadEnv(mode, process.cwd(), '');
  const contentApiBase = process.env.VITE_CONTENT_API_BASE_URL
    ?? loadedEnvironment.VITE_CONTENT_API_BASE_URL
    ?? '';
  const productionContentApiBase = /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i
    .test(contentApiBase)
    ? ''
    : contentApiBase;

  return {
    plugins: [react()],
    base:
      mode === 'production'
        ? process.env.VITE_BASE_PATH || '/teaHouse/'
        : '/',
    define: mode === 'production'
      ? {
          'import.meta.env.VITE_CONTENT_API_BASE_URL': JSON.stringify(
            productionContentApiBase,
          ),
        }
      : undefined,
  };
});
