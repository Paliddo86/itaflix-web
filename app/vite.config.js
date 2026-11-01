import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import pkg from './package.json' with { type: 'json' };

// In sviluppo la UI gira su :5173 e le API (serverless) su :3001 (vedi `npm run dev:api`).
// In produzione su Vercel lo stesso path /api è servito dalla funzione omonima.
// `VITE_BASE_PATH` permette di servire la build da una sottocartella
// (es. GitHub Pages: /itaflix-web/).
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  // Versione unica: viene da package.json e finisce nel bundle.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  // `npm run preview` serve la build di produzione: anche lì proxiamo le API
  // verso il dev-server locale, così si può testare il bundle reale.
  preview: {
    port: 4173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
