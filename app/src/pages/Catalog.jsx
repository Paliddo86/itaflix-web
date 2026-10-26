import { useCallback, useEffect, useState } from 'react';

import ErrorBox from '../components/ErrorBox.jsx';
import Spinner from '../components/Spinner.jsx';
import Tile from '../components/Tile.jsx';
import { t } from '../lib/i18n.js';
import TMDB from '../lib/tmdb.js';

/**
 * Catalogo (/movies e /tv) — equivalente di moviesGenres/tvShowsGenres
 * dell'app tvOS, in versione "griglia + carica altri".
 */
export default function Catalog({ type = 'movie' }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);

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
            ? await TMDB.getGenreTvShow(offset)
            : await TMDB.getGenreMovies(offset);

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
    [type],
  );

  useEffect(() => {
    setItems([]);
    load(0);
  }, [load]);

  const title = type === 'tv' ? t('menu-tvshows') : t('menu-movies');

  if (status === 'loading') return <Spinner />;
  if (status === 'error') return <ErrorBox message={error} onRetry={() => load(0)} />;

  return (
    <div className="page page-catalog">
      <header className="page-header">
        <h1>{title}</h1>
      </header>

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
    </div>
  );
}
