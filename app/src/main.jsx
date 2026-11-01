import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';
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
// serve per l'installazione come app e per la shell offline.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch((error) => console.warn('[sw] registrazione fallita', error));
  });
}
