import { useState } from 'react';

import { t } from '../lib/i18n.js';
import { isStandalone, requestInstall } from '../lib/pwa.js';
import { getAll, params, set as setSetting } from '../lib/settings.js';

/**
 * Impostazioni — riproduzione automatica e installazione PWA.
 * La qualità video non è configurabile: la gestisce il player di VixSrc.
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
          ITAFlix Web {t('settings-version')} {__APP_VERSION__} — porting web
          dell&apos;app tvOS (React + Vite). I contenuti sono forniti da servizi di
          terze parti: questo progetto non ospita alcun file video.
        </p>
        <p className="settings-about">
          La riproduzione usa il player di VixSrc: qualità, sottotitoli e lingua
          si scelgono dai suoi controlli. <code>Esc</code> chiude il player.
        </p>
      </section>
    </div>
  );
}
