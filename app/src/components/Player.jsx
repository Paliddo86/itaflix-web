import { useCallback, useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

import { t } from '../lib/i18n.js';
import { getPreferredHeight } from '../lib/settings.js';
import { clearResume, getResume, setResume } from '../lib/storage.js';
import { formatTime } from '../lib/utils.js';

/**
 * Player HLS — sostituisce `Player`/`Playlist` di TVMLKit.
 * - hls.js su Chrome/Firefox/Edge, HLS nativo su Safari/iOS
 * - scelta del livello in base alla qualità preferita (impostazioni)
 * - ripresa della posizione e salvataggio ogni ~5s
 * - scorciatoie tastiera: spazio, ←/→, M, F, Esc
 */
export default function Player({ url, title, subtitle, resumeKey, onClose, onNext, onEnded }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const lastSavedRef = useRef(0);
  const onNextRef = useRef(onNext);
  const onEndedRef = useRef(onEnded);

  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [levels, setLevels] = useState([]);
  const [level, setLevel] = useState(-1);
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const [resumeAt, setResumeAt] = useState(0);

  useEffect(() => {
    onNextRef.current = onNext;
    onEndedRef.current = onEnded;
  }, [onNext, onEnded]);

  const saveProgress = useCallback(
    (force = false) => {
      const video = videoRef.current;
      if (!video || !resumeKey) return;

      const current = video.currentTime || 0;
      if (!force && Math.abs(current - lastSavedRef.current) < 5) return;

      lastSavedRef.current = current;
      if (video.duration && current > 5 && current < video.duration - 15) {
        setResume(resumeKey, current);
      }
    },
    [resumeKey],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return undefined;

    setStatus('loading');
    setErrorMessage('');
    setLevels([]);
    setLevel(-1);
    setResumeAt(getResume(resumeKey));

    let hls = null;

    const handleLoadedMetadata = () => {
      const saved = getResume(resumeKey);
      if (saved > 5 && video.duration && saved < video.duration - 10) {
        video.currentTime = saved;
      }
      setStatus('ready');
      video.play().catch(() => {});
    };

    const handleError = () => {
      setStatus('error');
      setErrorMessage(t('player-error'));
    };

    const handleTimeUpdate = () => {
      setProgress({
        current: video.currentTime || 0,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
      });
      saveProgress();
    };

    const handlePause = () => saveProgress(true);

    const handleEnded = () => {
      if (resumeKey) clearResume(resumeKey);
      saveProgress(true);
      if (onEndedRef.current) onEndedRef.current();
      else if (onNextRef.current) onNextRef.current();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    // Ordine importante: Chrome riporta "maybe" anche per
    // `application/vnd.apple.mpegurl` pur non supportando HLS nativamente,
    // quindi hls.js (MSE) va preferito; il percorso nativo resta per Safari/iOS.
    if (Hls.isSupported()) {
      hls = new Hls({ maxBufferLength: 40, backBufferLength: 30, enableWorker: true });
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const list = hls.levels.map((item, index) => ({
          index,
          height: item.height,
          label: item.height ? `${item.height}p` : `Livello ${index + 1}`,
        }));
        setLevels(list);

        const preferred = getPreferredHeight();
        const candidates = hls.levels
          .map((item, index) => ({ index, height: item.height || 0 }))
          .filter((item) => item.height > 0 && item.height <= preferred)
          .sort((a, b) => b.height - a.height);

        if (candidates.length) {
          hls.currentLevel = candidates[0].index;
          setLevel(candidates[0].index);
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
          return;
        }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
          return;
        }

        setStatus('error');
        setErrorMessage(`${t('player-error')} (${data.details})`);
      });

      hls.loadSource(url);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari / iOS: HLS nativo
      video.src = url;
    } else {
      setStatus('error');
      setErrorMessage('HLS non supportato da questo browser');
    }

    return () => {
      saveProgress(true);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);

      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }

      video.removeAttribute('src');
      video.load();
    };
  }, [url, resumeKey, saveProgress]);

  const changeLevel = (value) => {
    const index = Number(value);
    setLevel(index);
    if (hlsRef.current) hlsRef.current.currentLevel = index;
  };

  const close = useCallback(() => {
    saveProgress(true);
    if (onClose) onClose();
  }, [onClose, saveProgress]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const video = videoRef.current;
      if (!video) return;

      if (event.code === 'Space') {
        event.preventDefault();
        if (video.paused) video.play().catch(() => {});
        else video.pause();
      } else if (event.key === 'ArrowRight') {
        video.currentTime = Math.min(video.currentTime + 10, video.duration || Infinity);
      } else if (event.key === 'ArrowLeft') {
        video.currentTime = Math.max(video.currentTime - 10, 0);
      } else if (event.key.toLowerCase() === 'm') {
        video.muted = !video.muted;
      } else if (event.key.toLowerCase() === 'f') {
        if (document.fullscreenElement) document.exitFullscreen?.();
        else video.requestFullscreen?.();
      } else if (event.key === 'Escape') {
        close();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close]);

  return (
    <div className="player-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="player-shell">
        <div className="player-topbar">
          <div className="player-titles">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>

          <div className="player-actions">
            {levels.length > 0 && (
              <label className="player-quality">
                <span>{t('player-quality')}</span>
                <select value={level} onChange={(event) => changeLevel(event.target.value)}>
                  <option value={-1}>{t('player-auto')}</option>
                  {levels.map((item) => (
                    <option key={item.index} value={item.index}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {onNext && (
              <button type="button" className="btn btn-ghost" onClick={() => onNext()}>
                ⏭ {t('player-next-episode')}
              </button>
            )}

            <button type="button" className="btn btn-ghost" onClick={close}>
              ✕ {t('player-close')}
            </button>
          </div>
        </div>

        <div className="player-video-wrapper">
          <video ref={videoRef} controls playsInline preload="metadata" />

          {status === 'loading' && (
            <div className="player-loading">
              <span className="spinner" />
              <p>{t('player-loading')}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="player-error">
              <h3>{t('player-error')}</h3>
              <p>{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="player-footer">
          <span>
            {formatTime(progress.current)} / {formatTime(progress.duration)}
          </span>
          {resumeAt > 0 && (
            <span className="player-resume">
              {t('movie-resume', { time: formatTime(resumeAt) })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
