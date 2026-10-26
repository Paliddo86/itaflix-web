import { useNavigate } from 'react-router-dom';

import { t } from '../lib/i18n.js';

/**
 * Tile poster — port di itaflix-tvos/src/components/tile.js
 * (poster 190x285, titolo, sottotitolo "Film"/"Serie TV", badge).
 */
export default function Tile({ item, onSelect }) {
  const navigate = useNavigate();

  if (!item) return null;

  const target = item.type === 'tv' ? `/tv/${item.sid}` : `/movie/${item.sid}`;

  const handleClick = () => {
    if (onSelect) {
      onSelect(item);
      return;
    }
    navigate(target);
  };

  return (
    <button
      type="button"
      className="tile"
      onClick={handleClick}
      title={item.title}
      aria-label={`${item.title} (${item.type === 'tv' ? t('tv-type') : t('movie-type')})`}
    >
      <span className="tile-poster">
        {item.poster ? (
          <img src={item.poster} alt="" loading="lazy" />
        ) : (
          <span className="tile-placeholder">{item.title}</span>
        )}

        <span className="tile-badges">
          {item.isUpdated && <span className="badge badge-new">{t('tvshow-new')}</span>}
          {item.isSubIta && <span className="badge">SUB</span>}
        </span>
      </span>

      <span className="tile-meta">
        <span className="tile-title">{item.title}</span>
        <span className="tile-subtitle">
          {item.type === 'tv' ? t('tv-type') : t('movie-type')}
        </span>
      </span>
    </button>
  );
}
