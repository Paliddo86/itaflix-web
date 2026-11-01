import { useState } from 'react';

import { t } from '../lib/i18n.js';
import { isStandalone, requestInstall } from '../lib/pwa.js';
import {
  getAll,
  getPreferredQuality,
  params,
  quality,
  set as setSetting,
} from '../lib/settings.js';

const QUALITY_OPTIONS = [
  { value: quality.SD, label: 'settings-quality-sd' },
  { value: quality.HD, label: 'settings-quality-hd' },
  { value: quality.FULLHD, label: 'settings-quality-fullhd' },
  { value: quality.UHD, label: 'settings-quality-uhd' },
];

/**
 * Impostazioni — equivalente di itaflix-tvos/src/routes/settings.js
 * (qualità video e riproduzione automatica).
 */
export default function Settings() {
  const [values, setValues] = useState(() => getAll());
  const [saved, setSaved] = useState(false);

  const update = (key, value) => {
    const next = setSetting(key, value);
    setValues((previous) => ({ ...previous, [key]: next }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page page-settings">
      <header className="page-header">
        <h1>{t('settings-title')}</h1>
        {saved && <span className="settings-saved">{t('settings-saved')}</span>}
      </header>

      <section className="settings-group">
        <h2>{t('settings-video-quality')}</h2>
        <div className="settings-options">
          {QUALITY_OPTIONS.map((option) => (
            <label key={option.value} className="settings-option">
              <input
                type="radio"
                name="video-quality"
                value={option.value}
                checked={getPreferredQuality() === option.value}
                onChange={() => update(params.VIDEO_QUALITY, option.value)}
              />
              <span>{t(option.label)}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="settings-group">
        <h2>{t('settings-autoplay')}</h2>
        <label className="settings-switch">
          <input
            type="checkbox"
            checked={Boolean(values[params.AUTOPLAY])}
            onChange={(event) => update(params.AUTOPLAY, event.target.checked)}
          />
          <span>{values[params.AUTOPLAY] ? 'Attivo' : 'Disattivo'}</span>
        </label>
      </section>

      <section className="settings-group">
        <h2>{t('settings-install')}</h2>
        <p className="settings-about">
          {isStandalone() ? t('settings-installed') : t('settings-install-hint')}
        </p>
        {!isStandalone() && (
          <button type="button" className="btn btn-primary btn-small" onClick={requestInstall}>
            {t('settings-install')}
          </button>
        )}
      </section>

      <section className="settings-group">
        <h2>{t('settings-about')}</h2>
        <p className="settings-about">
          ITAFlix Web {t('settings-version')} 1.0.0 — porting web dell&apos;app tvOS
          (React + Vite). I contenuti sono forniti da servizi di terze parti: questo
          progetto non ospita alcun file video.
        </p>
        <p className="settings-about">
          Scorciatoie del player: <code>spazio</code> play/pausa, <code>←</code>/
          <code>→</code> 10s, <code>M</code> muto, <code>F</code> schermo intero,
          <code>Esc</code> chiudi.
        </p>
      </section>
    </div>
  );
}
