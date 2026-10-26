import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ErrorBox from '../components/ErrorBox.jsx';
import Row from '../components/Row.jsx';
import Spinner from '../components/Spinner.jsx';
import Tile from '../components/Tile.jsx';
import { t } from '../lib/i18n.js';
import { isFavorite, toggleFavorite } from '../lib/storage.js';
import TMDB from '../lib/tmdb.js';

/**
 * Dettaglio serie TV — equivalente di itaflix-tvos/src/routes/tvshow.js
 * (productTemplate + shelf delle stagioni + raccomandati).
 */
export default function TvShow() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tvshow, setTvshow] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [favorite, setFavorite] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');

    try {
      const details = await TMDB.getTvShowDetails(id);
      setTvshow(details);
      setFavorite(isFavorite(`tv:${details.tmdb_id}`));
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFavorite = () => {
    if (!tvshow) return;
    const nowFavorite = toggleFavorite({
      key: `tv:${tvshow.tmdb_id}`,
      type: 'tv',
      id: tvshow.tmdb_id,
      title: tvshow.title,
      poster: tvshow.poster,
    });
    setFavorite(nowFavorite);
  };

  if (status === 'loading') return <Spinner />;
  if (status === 'error') return <ErrorBox message={error} onRetry={load} />;
  if (!tvshow) return null;

  return (
    <div className="page page-detail">
      <section className="detail-hero">
        {tvshow.banner && (
          <div
            className="detail-backdrop"
            style={{ backgroundImage: `url(${tvshow.banner})` }}
          />
        )}
        <div className="detail-gradient" />

        <div className="detail-content">
          <div className="detail-poster">
            {tvshow.poster && <img src={tvshow.poster} alt={tvshow.title} />}
          </div>

          <div className="detail-info">
            <h1>{tvshow.title}</h1>

            <p className="detail-meta">
              <span>{t('tv-type')}</span>
              {tvshow.released && <span>{tvshow.released}</span>}
              {tvshow.seasons.length > 0 && (
                <span>
                  {tvshow.seasons.length} {t('tvshow-seasons').toLowerCase()}
                </span>
              )}
              <span>⭐ {(tvshow.rating / 10).toFixed(1)}</span>
            </p>

            <p className="detail-overview">{tvshow.overview || t('no-description')}</p>

            {tvshow.genres.length > 0 && (
              <ul className="chips">
                {tvshow.genres.map((genre) => (
                  <li key={genre.id}>{genre.name}</li>
                ))}
              </ul>
            )}

            <div className="detail-actions">
              {tvshow.seasons.length > 0 && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    navigate(`/tv/${tvshow.tmdb_id}/season/${tvshow.seasons[0].number}`)
                  }
                >
                  ▶ {t('season')} {tvshow.seasons[0].number}
                </button>
              )}

              <button
                type="button"
                className={`btn btn-ghost${favorite ? ' is-active' : ''}`}
                onClick={handleFavorite}
              >
                {favorite ? '❤' : '♡'} Preferiti
              </button>
            </div>
          </div>
        </div>
      </section>

      {tvshow.seasons.length > 0 && (
        <div className="rows">
          <Row title={`${t('tvshow-seasons')} · ${tvshow.seasons.length}`}>
            {tvshow.seasons.map((season) => (
              <button
                key={season.id}
                type="button"
                className="tile"
                onClick={() =>
                  navigate(`/tv/${tvshow.tmdb_id}/season/${season.number}`)
                }
              >
                <span className="tile-poster">
                  {season.poster || tvshow.poster ? (
                    <img src={season.poster || tvshow.poster} alt="" loading="lazy" />
                  ) : (
                    <span className="tile-placeholder">{season.title}</span>
                  )}
                  <span className="tile-badges">
                    <span className="badge">{season.episodes_count}</span>
                  </span>
                </span>
                <span className="tile-meta">
                  <span className="tile-title">
                    {season.title || t('tvshow-season', { number: season.number })}
                  </span>
                  <span className="tile-subtitle">
                    {t('tvshow-episodes', { count: season.episodes_count })}
                  </span>
                </span>
              </button>
            ))}
          </Row>
        </div>
      )}

      {tvshow.recommendations.length > 0 && (
        <div className="rows">
          <Row title={t('tvshow-recommendations')}>
            {tvshow.recommendations.map((item) => (
              <Tile key={`rec-${item.sid}`} item={item} />
            ))}
          </Row>
        </div>
      )}
    </div>
  );
}
