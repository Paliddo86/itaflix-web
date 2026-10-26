import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ErrorBox from '../components/ErrorBox.jsx';
import Spinner from '../components/Spinner.jsx';

const Player = lazy(() => import('../components/Player.jsx'));
import { getStream } from '../lib/api.js';
import { t } from '../lib/i18n.js';
import { params as settingsParams, get as getSetting } from '../lib/settings.js';
import { contentKey, getResume } from '../lib/storage.js';
import TMDB from '../lib/tmdb.js';
import { formatTime, isMoreThanDaysAhead } from '../lib/utils.js';

/**
 * Stagione — equivalente di itaflix-tvos/src/routes/season.js
 * (compilationTemplate: elenco episodi, riproduzione, "prossimo episodio").
 */
export default function Season() {
  const { id, season: seasonParam } = useParams();
  const navigate = useNavigate();

  const seasonNumber = Number(seasonParam);

  const [tvshow, setTvshow] = useState(null);
  const [season, setSeason] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const [playing, setPlaying] = useState(null);
  const [playBusy, setPlayBusy] = useState(null);
  const [playError, setPlayError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');

    try {
      const show = await TMDB.getTvShowDetails(id);
      const seasonData = await TMDB.getSeasonDetails(seasonNumber, show);

      setTvshow(show);
      setSeason(seasonData);
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [id, seasonNumber]);

  useEffect(() => {
    load();
  }, [load]);

  const playEpisode = async (episode) => {
    if (!tvshow || !episode) return;

    setPlayBusy(episode.number);
    setPlayError('');

    try {
      const data = await getStream({
        type: 'tv',
        id: tvshow.tmdb_id,
        season: seasonNumber,
        episode: episode.number,
      });
      setPlaying({ stream: data, episode });
    } catch (err) {
      setPlayError(err.message);
    } finally {
      setPlayBusy(null);
    }
  };

  if (status === 'loading') return <Spinner />;
  if (status === 'error') return <ErrorBox message={error} onRetry={load} />;
  if (!tvshow || !season) {
    return <ErrorBox message={t('no-content')} onBack={() => navigate(`/tv/${id}`)} />;
  }

  const episodes = season.episodes || [];
  const nextEpisode = playing
    ? episodes.find((episode) => episode.number === playing.episode.number + 1)
    : null;
  const autoplay = Boolean(getSetting(settingsParams.AUTOPLAY));

  return (
    <div className="page page-season">
      <header className="season-header">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => navigate(`/tv/${tvshow.tmdb_id}`)}
        >
          ← {tvshow.title}
        </button>

        <h1>{season.title || t('tvshow-season', { number: seasonNumber })}</h1>

        <p className="season-meta">
          {t('tvshow-episodes', { count: episodes.length })}
          {season.released ? ` · ${season.released}` : ''}
        </p>
      </header>

      {tvshow.seasons.length > 1 && (
        <div className="season-tabs" role="tablist" aria-label={t('tvshow-seasons')}>
          {tvshow.seasons.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.number === seasonNumber}
              className={`season-tab${item.number === seasonNumber ? ' is-active' : ''}`}
              onClick={() => navigate(`/tv/${tvshow.tmdb_id}/season/${item.number}`)}
            >
              {t('tvshow-season', { number: item.number })}
            </button>
          ))}
        </div>
      )}

      {playError && <p className="inline-error">{playError}</p>}

      <ul className="episodes">
        {episodes.map((episode) => {
          const resumeKey = contentKey({
            type: 'tv',
            id: tvshow.tmdb_id,
            season: seasonNumber,
            episode: episode.number,
          });
          const resumeAt = getResume(resumeKey);

          return (
            <li key={episode.id || episode.number} className="episode">
              <button
                type="button"
                className="episode-thumb"
                onClick={() => playEpisode(episode)}
                aria-label={t('episode-play')}
              >
                {episode.poster ? (
                  <img src={episode.poster} alt="" loading="lazy" />
                ) : (
                  <span className="episode-thumb-placeholder">{episode.number}</span>
                )}
                <span className="episode-play">▶</span>
              </button>

              <div className="episode-body">
                <div className="episode-top">
                  <h3>
                    {episode.number}.{' '}
                    {episode.title || t('episode-number', { number: episode.number })}
                  </h3>
                  {isMoreThanDaysAhead(episode.updated_at) && (
                    <span className="badge badge-new">{t('tvshow-new')}</span>
                  )}
                </div>

                <p className="episode-overview">
                  {episode.overview || t('no-description')}
                </p>

                <div className="episode-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-small"
                    onClick={() => playEpisode(episode)}
                    disabled={playBusy === episode.number}
                  >
                    {playBusy === episode.number
                      ? t('loading')
                      : resumeAt > 5
                        ? `▶ ${t('movie-resume', { time: formatTime(resumeAt) })}`
                        : `▶ ${t('episode-play')}`}
                  </button>
                  {episode.runtime ? (
                    <span className="episode-runtime">{episode.runtime} min</span>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {playing && (
        <Suspense fallback={<Spinner />}>
          <Player
            url={playing.stream.url}
            title={`${tvshow.title} · ${t('tvshow-season', { number: seasonNumber })}`}
            subtitle={`${playing.episode.number}. ${playing.episode.title || ''}`}
            resumeKey={contentKey({
              type: 'tv',
              id: tvshow.tmdb_id,
              season: seasonNumber,
              episode: playing.episode.number,
            })}
            onClose={() => setPlaying(null)}
            onNext={nextEpisode ? () => playEpisode(nextEpisode) : undefined}
            onEnded={autoplay && nextEpisode ? () => playEpisode(nextEpisode) : undefined}
          />
        </Suspense>
      )}
    </div>
  );
}
