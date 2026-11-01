import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import { registerServiceWorker } from './lib/sw.js';
import './theme.css';

// `BASE_URL` è la base di Vite: '/' su Vercel, '/itaflix-web/' su GitHub Pages.
// Passandola come basename le route funzionano in entrambi i casi.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

// Service worker solo in produzione (richiede HTTPS o localhost):
// rende l'app installabile e la aggiorna da sola ad ogni release.
if (import.meta.env.PROD) {
  registerServiceWorker({ baseUrl: import.meta.env.BASE_URL });
}
