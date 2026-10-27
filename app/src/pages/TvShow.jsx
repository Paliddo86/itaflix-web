import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ErrorBox from '../components/ErrorBox.jsx';
import Row from '../components/Row.jsx';
import Spinner from '../components/Spinner.jsx';
import Tile from '../components/Tile.jsx';
import { t } from '../lib/i18n.js';
import { isFavorite, toggleFavorite } from '../lib/storage.js';
import TMDB from '../lib/tmdb.js';
import { getSession } from '../lib/user.js';

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
  const [syncError, setSyncError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');

    try {
      const details = await TMDB.getTvShowDetails(id);
      const key = `tv:${details.tmdb_id}`;
      const localFavorite = isFavorite(key);
      let favoriteNow = localFavorite;

      const session = getSession();
      if (session?.sessionId) {
        try {
          const states = await TMDB.getAccountStates(details.tmdb_id, 'tv', session.sessionId);
          favoriteNow = Boolean(states?.favorite) || localFavorite;

          if (favoriteNow && !localFavorite) {
            toggleFavorite({
              key,
              type: 'tv',
              id: details.tmdb_id,
              title: details.title,
              poster: details.poster,
            });
          }
        } catch (err) {
          console.warn('[tmdb] account states:', err.message);
        }
      }

      setTvshow(details);
      setFavorite(favoriteNow);
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFavorite = async () => {
    if (!tvshow) return;

    const key = `tv:${tvshow.tmdb_id}`;
    const nowFavorite = toggleFavorite({
      key,
      type: 'tv',
      id: tvshow.tmdb_id,
      title: tvshow.title,
      poster: tvshow.poster,
    });
    setFavorite(nowFavorite);
    setSyncError('');

    const session = getSession();
    if (!session?.sessionId) return;

    try {
      await TMDB.toggleFavorite(
        session.sessionId,
        session.accountId,
        'tv',
        tvshow.tmdb_id,
        nowFavorite,
      );
    } catch (err) {
      setSyncError(`TMDB: ${err.message}`);
    }
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

            {syncError && <p className="inline-error">{syncError}</p>}
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
