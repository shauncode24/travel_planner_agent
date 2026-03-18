// ─────────────────────────────────────────────────
// FILE: vite.config.js
// ─────────────────────────────────────────────────

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',          // index.html lives in /frontend/
  server: {
    port: 5173,
    proxy: {
      // Forward all /api/* requests to the Flask server
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
