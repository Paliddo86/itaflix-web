import { useEffect, useRef, useState } from 'react';

import ErrorBox from '../components/ErrorBox.jsx';
import Row from '../components/Row.jsx';
import Spinner from '../components/Spinner.jsx';
import Tile from '../components/Tile.jsx';
import { t } from '../lib/i18n.js';
import TMDB from '../lib/tmdb.js';

const THROTTLE_TIMEOUT = 500;

/**
 * Ricerca — equivalente di itaflix-tvos/src/routes/search.js
 * (searchTemplate con due shelf: film e serie TV).
 */
export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ moviesFounded: [], tvshowFounded: [] });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const inputRef = useRef(null);
  const throttleRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
    return () => clearTimeout(throttleRef.current);
  }, []);

  const runSearch = async (value) => {
    const currentRequest = requestIdRef.current + 1;
    requestIdRef.current = currentRequest;

    if (!value.trim()) {
      setResults({ moviesFounded: [], tvshowFounded: [] });
      setStatus('idle');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const { searchResults } = await TMDB.searchMovieAndTvShow(value);

      // ignora risposte obsolete
      if (requestIdRef.current !== currentRequest) return;

      setResults(searchResults);
      setStatus('ready');
    } catch (err) {
      if (requestIdRef.current !== currentRequest) return;
      setError(err.message);
      setStatus('error');
    }
  };

  const handleChange = (event) => {
    const value = event.target.value;
    setQuery(value);

    clearTimeout(throttleRef.current);
    throttleRef.current = setTimeout(() => runSearch(value), THROTTLE_TIMEOUT);
  };

  const hasResults = results.moviesFounded.length > 0 || results.tvshowFounded.length > 0;

  return (
    <div className="page page-search">
      <div className="search-bar">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleChange}
          placeholder={t('search-placeholder')}
          aria-label={t('search-placeholder')}
        />
      </div>

      {status === 'idle' && <p className="search-hint">{t('search-hint')}</p>}
      {status === 'loading' && <Spinner />}
      {status === 'error' && (
        <ErrorBox message={error} onRetry={() => runSearch(query)} />
      )}

      {status === 'ready' && !hasResults && (
        <p className="search-hint">{t('search-empty')}</p>
      )}

      {status === 'ready' && hasResults && (
        <div className="rows">
          {results.moviesFounded.length > 0 && (
            <Row title={t('search-result-movie')}>
              {results.moviesFounded.map((item) => (
                <Tile key={`movie-${item.sid}`} item={item} />
              ))}
            </Row>
          )}

          {results.tvshowFounded.length > 0 && (
            <Row title={t('search-result-tvshow')}>
              {results.tvshowFounded.map((item) => (
                <Tile key={`tv-${item.sid}`} item={item} />
              ))}
            </Row>
          )}
        </div>
      )}
    </div>
  );
}
