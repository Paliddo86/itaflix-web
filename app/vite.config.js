import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import pkg from './package.json' with { type: 'json' };

/**
 * Sostituisce `__BUILD_ID__` in `public/sw.js` con un id unico per build.
 * Così la cache del service worker cambia da sola ad ogni release: gli utenti
 * con l'app installata ricevono la nuova shell senza dover rimuovere il
 * segnalibro dalla schermata Home.
 */
function serviceWorkerBuildId() {
  const id = `${pkg.version}-${Date.now().toString(36)}`;

  return {
    name: 'itaflix-sw-build-id',
    apply: 'build',
    // `public/` viene copiata su disco DOPO i bundle: riscriviamo il file a
    // fine build, così ogni release ha una cache con nome diverso.
    closeBundle() {
      const target = resolve(process.cwd(), 'dist/sw.js');
      if (!existsSync(target)) return;

      const source = readFileSync(target, 'utf8');
      writeFileSync(target, source.replaceAll('__BUILD_ID__', id));
    },
  };
}

// `VITE_BASE_PATH` permette di servire la build da una sottocartella
// (es. GitHub Pages: /itaflix-web/).
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), serviceWorkerBuildId()],
  // Versione unica: viene da package.json e finisce nel bundle.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
