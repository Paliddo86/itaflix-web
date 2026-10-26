import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import ErrorBox from '../components/ErrorBox.jsx';
import Row from '../components/Row.jsx';
import Spinner from '../components/Spinner.jsx';
import Tile from '../components/Tile.jsx';

// hls.js pesa ~700kB: lo carichiamo solo quando serve davvero.
const Player = lazy(() => import('../components/Player.jsx'));
import { getStream } from '../lib/api.js';
import { t } from '../lib/i18n.js';
import { contentKey, getResume, isFavorite, toggleFavorite } from '../lib/storage.js';
import TMDB from '../lib/tmdb.js';
import { formatRuntime, formatTime } from '../lib/utils.js';

/**
 * Dettaglio film — equivalente di itaflix-tvos/src/routes/movie.js
 * (productTemplate: background, banner con info, collection, recommendations).
 */
export default function Movie() {
  const { id } = useParams();

  const [movie, setMovie] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const [stream, setStream] = useState(null);
  const [playBusy, setPlayBusy] = useState(false);
  const [playError, setPlayError] = useState('');
  const [favorite, setFavorite] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');

    try {
      const details = await TMDB.getMovieDetails(id);
      setMovie(details);
      setFavorite(isFavorite(`movie:${details.tmdb_id}`));
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const resumeKey = movie ? contentKey({ type: 'movie', id: movie.tmdb_id }) : null;
  const resumeAt = resumeKey ? getResume(resumeKey) : 0;

  const handlePlay = async () => {
    if (!movie || playBusy) return;

    setPlayBusy(true);
    setPlayError('');

    try {
      const data = await getStream({ type: 'movie', id: movie.tmdb_id });
      setStream(data);
    } catch (err) {
      setPlayError(err.message);
    } finally {
      setPlayBusy(false);
    }
  };

  const handleFavorite = () => {
    if (!movie) return;
    const nowFavorite = toggleFavorite({
      key: `movie:${movie.tmdb_id}`,
      type: 'movie',
      id: movie.tmdb_id,
      title: movie.title,
      poster: movie.poster,
    });
    setFavorite(nowFavorite);
  };

  if (status === 'loading') return <Spinner />;
  if (status === 'error') return <ErrorBox message={error} onRetry={load} />;
  if (!movie) return null;

  return (
    <div className="page page-detail">
      <section className="detail-hero">
        {movie.banner && (
          <div
            className="detail-backdrop"
            style={{ backgroundImage: `url(${movie.banner})` }}
          />
        )}
        <div className="detail-gradient" />

        <div className="detail-content">
          <div className="detail-poster">
            {movie.poster && <img src={movie.poster} alt={movie.title} />}
          </div>

          <div className="detail-info">
            <h1>{movie.title}</h1>

            <p className="detail-meta">
              <span>{t('movie-type')}</span>
              {movie.released && <span>{movie.released}</span>}
              {movie.runtime ? <span>{formatRuntime(movie.runtime)}</span> : null}
              <span>⭐ {(movie.rating / 10).toFixed(1)}</span>
            </p>

            <p className="detail-overview">{movie.overview || t('no-description')}</p>

            {movie.genres.length > 0 && (
              <ul className="chips">
                {movie.genres.map((genre) => (
                  <li key={genre.id}>{genre.name}</li>
                ))}
              </ul>
            )}

            <div className="detail-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePlay}
                disabled={playBusy}
              >
                {playBusy
                  ? t('loading')
                  : resumeAt > 5
                    ? `▶ ${t('movie-resume', { time: formatTime(resumeAt) })}`
                    : `▶ ${t('movie-play')}`}
              </button>

              <button
                type="button"
                className={`btn btn-ghost${favorite ? ' is-active' : ''}`}
                onClick={handleFavorite}
              >
                {favorite ? '❤' : '♡'} Preferiti
              </button>
            </div>

            {playError && <p className="inline-error">{playError}</p>}
          </div>
        </div>
      </section>

      {movie.collection && movie.collection.length > 0 && (
        <div className="rows">
          <Row title={t('movie-collection')}>
            {movie.collection.map((item) => (
              <Tile key={`collection-${item.sid}`} item={item} />
            ))}
          </Row>
        </div>
      )}

      {movie.recommendations.length > 0 && (
        <div className="rows">
          <Row title={t('movie-recommendations')}>
            {movie.recommendations.map((item) => (
              <Tile key={`rec-${item.sid}`} item={item} />
            ))}
          </Row>
        </div>
      )}

      {stream && (
        <Suspense fallback={<Spinner />}>
          <Player
            url={stream.url}
            title={movie.title}
            subtitle={`${t('movie-type')}${movie.released ? ` · ${movie.released}` : ''}`}
            resumeKey={resumeKey}
            onClose={() => setStream(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
