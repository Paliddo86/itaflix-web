import { t } from '../lib/i18n.js';

/**
 * Messaggio di errore con eventuale azione di retry
 * (equivalente del `descriptiveAlertTemplate` dell'app tvOS).
 */
export default function ErrorBox({ title, message, onRetry, onBack }) {
  return (
    <div className="error-box" role="alert">
      <h2>{title || t('error')}</h2>
      <p>{message || t('generic-error')}</p>
      <div className="error-actions">
        {onRetry && (
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            {t('retry')}
          </button>
        )}
        {onBack && (
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            {t('back')}
          </button>
        )}
      </div>
    </div>
  );
}
