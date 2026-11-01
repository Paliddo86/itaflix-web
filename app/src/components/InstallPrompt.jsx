import { useEffect, useState } from 'react';

import { t } from '../lib/i18n.js';
import { dismissInstall, isInstallDismissed, isIos, isStandalone } from '../lib/pwa.js';

const APP_ICON = `${import.meta.env.BASE_URL}icon-192.png`;

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 15V4" />
      <path d="m8 8 4-4 4 4" />
      <path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" />
    </svg>
  );
}

/**
 * Banner "Installa ITAFlix".
 *
 * - Chrome/Edge/Android: usa `beforeinstallprompt` → installazione in un tap
 *   (icona aggiunta alla Home/desktop automaticamente dal browser).
 * - iOS/iPadOS: Apple non permette l'installazione automatica, quindi si
 *   mostrano le istruzioni con l'icona Condividi → "Aggiungi a Home".
 *
 * Non compare se l'app è già in modalità standalone o se l'utente ha scelto
 * "non ora" negli ultimi 7 giorni.
 */
export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalone()) return undefined;

    setIos(isIos());
    if (!isInstallDismissed()) setVisible(true);

    const onBeforeInstall = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setVisible(true);
    };

    const onInstalled = () => {
      setVisible(false);
      setHelpOpen(false);
    };

    const onManualOpen = () => {
      setVisible(true);
      if (isIos()) setHelpOpen(true);
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setHelpOpen(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('itaflix-install-open', onManualOpen);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('itaflix-install-open', onManualOpen);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const install = async () => {
    // Su iOS/iPadOS non esiste alcun prompt di installazione: si mostrano
    // sempre le istruzioni per "Aggiungi a Home".
    if (ios) {
      setHelpOpen(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();

      let outcome = 'dismissed';
      try {
        outcome = (await deferredPrompt.userChoice).outcome;
      } catch (error) {
        /* prompt chiuso */
      }

      setDeferredPrompt(null);

      if (outcome === 'accepted') {
        setVisible(false);
      } else {
        // l'installazione non è partita: mostriamo comunque come fare a mano
        setHelpOpen(true);
      }
      return;
    }

    // iOS (o browser senza prompt nativo): mostra le istruzioni
    setHelpOpen(true);
  };

  const close = () => {
    dismissInstall();
    setVisible(false);
    setHelpOpen(false);
  };

  if (!visible && !helpOpen) return null;

  return (
    <>
      {visible && (
        <aside className="install-banner" role="region" aria-label={t('install-title')}>
          <img className="install-banner-icon" src={APP_ICON} alt="" width="44" height="44" />

          <div className="install-banner-text">
            <strong>{t('install-title')}</strong>
            <span>{ios ? t('install-ios-subtitle') : t('install-subtitle')}</span>
          </div>

          <div className="install-banner-actions">
            <button type="button" className="btn btn-primary btn-small" onClick={install}>
              {t('install-button')}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={close}
              aria-label={t('install-dismiss')}
            >
              ✕
            </button>
          </div>
        </aside>
      )}

      {helpOpen && (
        <div
          className="install-modal"
          role="dialog"
          aria-modal="true"
          aria-label={t('install-help-title')}
        >
          <div className="install-sheet">
            <header className="install-sheet-header">
              <img src={APP_ICON} alt="" width="36" height="36" />
              <h2>{t('install-help-title')}</h2>
            </header>

            <p className="install-help-intro">
              {ios ? t('install-help-intro') : t('install-help-other')}
            </p>

            {ios && (
              <ol className="install-steps">
                <li>
                  <span className="install-step-icon">
                    <ShareIcon />
                  </span>
                  <span>{t('install-step-share')}</span>
                </li>
                <li>
                  <span className="install-step-icon">＋</span>
                  <span>{t('install-step-add')}</span>
                </li>
                <li>
                  <span className="install-step-icon">✓</span>
                  <span>{t('install-step-confirm')}</span>
                </li>
              </ol>
            )}

            <div className="install-sheet-actions">
              <button type="button" className="btn btn-primary" onClick={close}>
                {t('install-close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
