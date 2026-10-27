import { useCallback, useEffect, useState } from 'react';

import ErrorBox from '../components/ErrorBox.jsx';
import Spinner from '../components/Spinner.jsx';
import Tile from '../components/Tile.jsx';
import { t } from '../lib/i18n.js';
import { services } from '../lib/settings.js';
import TMDB from '../lib/tmdb.js';

/**
 * Catalogo (/movies e /tv) — equivalente di moviesGenres/tvShowsGenres
 * dell'app tvOS, con filtri per piattaforma e genere + "carica altri".
 */
export default function Catalog({ type = 'movie' }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);

  const [provider, setProvider] = useState('');
  const [genre, setGenre] = useState('');
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    let active = true;

    TMDB.getGenres()
      .then((all) => {
        if (active) setGenres(all[type] || []);
      })
      .catch(() => {
        if (active) setGenres([]);
      });

    return () => {
      active = false;
    };
  }, [type]);

  const load = useCallback(
    async (offset = 0) => {
      if (offset === 0) {
        setStatus('loading');
        setError('');
      } else {
        setLoadingMore(true);
      }

      try {
        const result =
          type === 'tv'
            ? await TMDB.getGenreTvShow(offset, provider || undefined, genre || undefined)
            : await TMDB.getGenreMovies(offset, provider || undefined, genre || undefined);

        const nextItems = type === 'tv' ? result.tvshows : result.movies;

        setItems((previous) => (offset === 0 ? nextItems : [...previous, ...nextItems]));
        setStatus('ready');
      } catch (err) {
        setError(err.message);
        setStatus('error');
      } finally {
        setLoadingMore(false);
      }
    },
    [type, provider, genre],
  );

  useEffect(() => {
    setItems([]);
    load(0);
  }, [load]);

  const title = type === 'tv' ? t('menu-tvshows') : t('menu-movies');

  return (
    <div className="page page-catalog">
      <header className="page-header">
        <h1>{title}</h1>
      </header>

      <div className="filters">
        <div className="filter-group">
          <span className="filter-label">{t('filters-provider')}</span>

          <button
            type="button"
            className={`filter-chip${provider === '' ? ' is-active' : ''}`}
            onClick={() => setProvider('')}
          >
            {t('filters-all')}
          </button>

          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              className={`filter-chip${provider === service.id ? ' is-active' : ''}`}
              onClick={() => setProvider(service.id)}
            >
              {service.name}
            </button>
          ))}
        </div>

        <div className="filter-group">
          <span className="filter-label">{t('filters-genre')}</span>

          <select value={genre} onChange={(event) => setGenre(event.target.value)}>
            <option value="">{t('filters-all')}</option>
            {genres.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {status === 'loading' && <Spinner />}
      {status === 'error' && <ErrorBox message={error} onRetry={() => load(0)} />}

      {status === 'ready' && (
        <>
          <div className="grid">
            {items.map((item) => (
              <Tile key={`${item.type}-${item.sid}`} item={item} />
            ))}
          </div>

          <div className="load-more">
            <button
              type="button"
              className="btn btn-primary"
              disabled={loadingMore}
              onClick={() => load(items.length)}
            >
              {loadingMore ? t('loading') : 'Carica altri'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

