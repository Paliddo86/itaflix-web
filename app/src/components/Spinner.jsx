import { t } from '../lib/i18n.js';

/**
 * Loader (equivalente del componente `Loader` TVML dell'app tvOS),
 * con il logo grande dell'app come splash.
 */
export default function Spinner({ label }) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <img className="spinner-logo" src="/logo-big.png" alt={t('app-name')} />
      <span className="spinner" />
      <p>{label || t('loading')}</p>
    </div>
  );
}
