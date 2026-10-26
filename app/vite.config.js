import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In sviluppo la UI gira su :5173 e le API (serverless) su :3001 (vedi `npm run dev:api`).
// In produzione su Vercel lo stesso path /api è servito dalla funzione omonima.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
