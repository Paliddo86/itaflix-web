import { useEffect, useMemo, useRef, useState } from 'react';

import { t } from '../lib/i18n.js';
import { clearResume, setResume } from '../lib/storage.js';

/**
 * Player basato sull'embed ufficiale di VixSrc.
 *
 * Perché un iframe e non hls.js: VixSrc serve l'embed solo a richieste che
 * arrivano da un browser reale e blocca con 403 le chiamate server-side da IP
 * datacenter (Vercel/AWS). Caricando l'embed nel browser dell'utente non serve
 * alcun backend: playlist, chiave AES e segmenti sono richiesti direttamente
 * dal player alla CDN.
 *
 * Ripresa della posizione: `startAt=<secondi>` è supportato dall'embed (il
 * player esegue `seek(startAt)` all'evento `ready`).
 *
 * Comunicazione: il player invia al documento padre
 *   { type: 'PLAYER_EVENT', data: { event, currentTime?, duration?, video_id? } }
 * con `event` in play | pause | seeked | complete. Serve a salvare la posizione
 * e a passare all'episodio successivo.
 *
 * QUALITÀ: l'embed sceglie da sé la resa e non espone controlli, quindi la
 * preferenza di qualità è stata rimossa dalle impostazioni.
 */
export default function Player({ embedUrl, title, subtitle, resumeKey, onClose, onNext }) {
  const iframeRef = useRef(null);
  const lastSavedRef = useRef(0);
  const onNextRef = useRef(onNext);

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  // Il player parla al parent con postMessage: posizione e fine episodio.
  useEffect(() => {
    if (!embedUrl) return undefined;

    const saveProgress = (seconds, duration) => {
      if (!resumeKey || !Number.isFinite(seconds)) return;
      if (Math.abs(seconds - lastSavedRef.current) < 5) return;

      lastSavedRef.current = seconds;

      // Vicino alla fine si azzera, così riaprire riparte dall'inizio.
      if (duration && seconds > duration - 20) {
        clearResume(resumeKey);
        return;
      }
      if (seconds > 5) setResume(resumeKey, seconds);
    };

    const onMessage = (event) => {
      if (!event.origin.includes('vixsrc.to')) return;

      const payload = event.data;
      if (!payload || payload.type !== 'PLAYER_EVENT') return;

      const data = payload.data || {};
      const seconds = Number(data.currentTime);
      const duration = Number(data.duration);

      if (data.event === 'pause' || data.event === 'seeked' || data.event === 'play') {
        saveProgress(seconds, duration);
      }

      if (data.event === 'complete') {
        if (resumeKey) clearResume(resumeKey);
        const next = onNextRef.current;
        if (next) next();
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [embedUrl, resumeKey]);

  // Esc chiude il player.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const src = useMemo(() => embedUrl, [embedUrl]);

  if (!src) return null;

  return (
    <div className="player-overlay" role="dialog" aria-modal="true">
      <div className="player-shell">
        <header className="player-head">
          <div className="player-titles">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>

          <div className="player-actions">
            {onNext && (
              <button type="button" className="btn btn-ghost btn-small" onClick={onNext}>
                {t('player-next')}
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={onClose}
              aria-label={t('player-close')}
            >
              {t('player-close')}
            </button>
          </div>
        </header>

        <div className="player-frame">
          {!loaded && (
            <div className="player-loading" aria-live="polite">
              <span className="spinner" />
              <p>{t('player-loading')}</p>
            </div>
          )}

          <iframe
            ref={iframeRef}
            className="player-iframe"
            src={src}
            title={title || 'Player'}
            // Il player rifiuta esplicitamente no-referrer: serve `origin`.
            referrerPolicy="origin"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            onLoad={() => setLoaded(true)}
          />
        </div>
      </div>
    </div>
  );
}
