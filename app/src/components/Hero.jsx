import { useNavigate } from 'react-router-dom';

import { t } from '../lib/i18n.js';
import { formatRuntime } from '../lib/utils.js';

/**
 * Hero della home — equivalente del `<banner>`/`<heroImg>` del productTemplate.
 */
export default function Hero({ item }) {
  const navigate = useNavigate();
  if (!item) return null;

  const target = item.type === 'tv' ? `/tv/${item.sid}` : `/movie/${item.sid}`;

  return (
    <section className="hero">
      {item.banner && (
        <div className="hero-backdrop" style={{ backgroundImage: `url(${item.banner})` }} />
      )}
      <div className="hero-gradient" />

      <div className="hero-content">
        <p className="hero-kicker">
          {item.type === 'tv' ? t('tv-type') : t('movie-type')}
          {item.released ? ` · ${item.released}` : ''}
          {item.rating ? ` · ⭐ ${(item.rating / 10).toFixed(1)}` : ''}
          {item.runtime ? ` · ${formatRuntime(item.runtime)}` : ''}
        </p>
        <h1>{item.title}</h1>
        <p className="hero-overview">{item.overview || t('no-description')}</p>

        <div className="hero-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigate(target)}>
            ▶ {t('home-play')}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(target)}>
            {t('home-more')}
          </button>
        </div>
      </div>
    </section>
  );
}
