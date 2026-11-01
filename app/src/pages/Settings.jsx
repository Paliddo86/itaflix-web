import { t } from '../lib/i18n.js';
import { isStandalone, requestInstall } from '../lib/pwa.js';

/**
 * Impostazioni — installazione PWA e info.
 *
 * Non ci sono preferenze da configurare: qualità, sottotitoli e lingua si
 * scelgono dai controlli del player VixSrc, che è una pagina a sé.
 */
export default function Settings() {
  return (
    <div className="page page-settings">
      <header className="page-header">
        <h1>{t('settings-title')}</h1>
      </header>

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
          La riproduzione apre il player di VixSrc in una pagina dedicata: qualità,
          sottotitoli e lingua si scelgono dai suoi controlli.
        </p>
      </section>
    </div>
  );
}
