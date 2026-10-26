import { t } from '../lib/i18n.js';

/**
 * Loader (equivalente del componente `Loader` TVML dell'app tvOS).
 */
export default function Spinner({ label }) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <span className="spinner" />
      <p>{label || t('loading')}</p>
    </div>
  );
}
