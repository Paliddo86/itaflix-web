import { useCallback, useEffect, useState } from 'react';

import ErrorBox from '../components/ErrorBox.jsx';
import Row from '../components/Row.jsx';
import Spinner from '../components/Spinner.jsx';
import Tile from '../components/Tile.jsx';
import TmdbLogin from '../components/TmdbLogin.jsx';
import { t } from '../lib/i18n.js';
import { getFavorites } from '../lib/storage.js';
import TMDB from '../lib/tmdb.js';
import { clearSession, getSession, subscribe } from '../lib/user.js';

/**
 * Preferiti — equivalente di itaflix-tvos/src/routes/my.js.
 * Mostra i preferiti locali e, se l'utente ha fatto login, anche quelli
 * sincronizzati sull'account TMDB.
 */
export default function My() {
  const [session, setSessionState] = useState(getSession());
  const [localFavorites, setLocalFavorites] = useState(getFavorites());
  const [remote, setRemote] = useState({ movies: [], tvshows: [] });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [showLogin, setShowLogin] = useState(false);

  useEffect(
    () =>
      subscribe((nextSession) => {
        setSessionState(nextSession);
        if (!nextSession) setRemote({ movies: [], tvshows: [] });
      }),
    [],
  );

  useEffect(() => {
    setLocalFavorites(getFavorites());
  }, []);

  const loadRemote = useCallback(async () => {
    if (!session) {
      setRemote({ movies: [], tvshows: [] });
      setStatus('idle');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const [movies, tvshows] = await Promise.all([
        TMDB.getFavoriteMovies(session.sessionId, session.accountId),
        TMDB.getFavoriteTv(session.sessionId, session.accountId),
      ]);

      setRemote({ movies: movies.movies, tvshows: tvshows.tvshows });
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [session]);

  useEffect(() => {
    loadRemote();
  }, [loadRemote]);

  const logout = async () => {
    if (session) await TMDB.deleteSession(session.sessionId);
    clearSession();
    setShowLogin(false);
  };

  const localItems = localFavorites.map((item) => ({
    sid: item.id,
    type: item.type,
    title: item.title,
    poster: item.poster,
  }));

  const localMovies = localItems.filter((item) => item.type === 'movie');
  const localTv = localItems.filter((item) => item.type === 'tv');

  const hasRemote = remote.movies.length > 0 || remote.tvshows.length > 0;
  const hasLocal = localItems.length > 0;

  return (
    <div className="page page-my">
      <header className="page-header">
        <h1>{t('my-title')}</h1>

        {session ? (
          <div className="my-session">
            <span>{t('my-connected', { username: session.username || 'TMDB' })}</span>
            <button type="button" className="btn btn-ghost btn-small" onClick={logout}>
              {t('my-logout')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => setShowLogin((value) => !value)}
          >
            {showLogin ? t('back') : t('my-open-login')}
          </button>
        )}
      </header>

      {showLogin && !session && (
        <TmdbLogin onSuccess={() => setShowLogin(false)} onCancel={() => setShowLogin(false)} />
      )}

      {status === 'loading' && <Spinner />}
      {status === 'error' && <ErrorBox message={error} onRetry={loadRemote} />}

      {hasRemote && (
        <div className="rows">
          {remote.movies.length > 0 && (
            <Row title={`${t('my-tmdb')} · ${t('my-movies')}`}>
              {remote.movies.map((item) => (
                <Tile key={`remote-movie-${item.sid}`} item={item} />
              ))}
            </Row>
          )}

          {remote.tvshows.length > 0 && (
            <Row title={`${t('my-tmdb')} · ${t('my-tvshows')}`}>
              {remote.tvshows.map((item) => (
                <Tile key={`remote-tv-${item.sid}`} item={item} />
              ))}
            </Row>
          )}
        </div>
      )}

      {(hasLocal || !session) && (
        <div className="rows">
          {localMovies.length > 0 && (
            <Row title={`${t('my-local')} · ${t('my-movies')}`}>
              {localMovies.map((item) => (
                <Tile key={`local-movie-${item.sid}`} item={item} />
              ))}
            </Row>
          )}

          {localTv.length > 0 && (
            <Row title={`${t('my-local')} · ${t('my-tvshows')}`}>
              {localTv.map((item) => (
                <Tile key={`local-tv-${item.sid}`} item={item} />
              ))}
            </Row>
          )}

          {!hasLocal && <p className="search-hint">{t('my-empty')}</p>}
        </div>
      )}

      {session && !hasRemote && status === 'ready' && (
        <p className="search-hint">{t('my-empty-local')}</p>
      )}
    </div>
  );
}
