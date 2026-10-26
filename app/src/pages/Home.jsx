import { useCallback, useEffect, useState } from 'react';

import ErrorBox from '../components/ErrorBox.jsx';
import Hero from '../components/Hero.jsx';
import Row from '../components/Row.jsx';
import Spinner from '../components/Spinner.jsx';
import Tile from '../components/Tile.jsx';
import TMDB from '../lib/tmdb.js';

/**
 * Home — equivalente di itaflix-tvos/src/routes/home.js
 * (stackTemplate + collectionList di shelf).
 */
export default function Home() {
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');

    try {
      const { categories: result } = await TMDB.getHome();
      setCategories(result || []);
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (status === 'loading') return <Spinner />;
  if (status === 'error') return <ErrorBox message={error} onRetry={load} />;
  if (!categories.length) return <ErrorBox message="Nessun contenuto disponibile" onRetry={load} />;

  const firstCategory = categories[0];
  const heroItem = firstCategory.values[Math.min(3, firstCategory.values.length - 1)];

  return (
    <div className="page page-home">
      <Hero item={heroItem} />

      <div className="rows">
        {categories.map((category, index) => (
          <Row key={`${category.name}-${index}`} title={category.name}>
            {category.values.map((item) => (
              <Tile key={`${item.type}-${item.sid}`} item={item} />
            ))}
          </Row>
        ))}
      </div>
    </div>
  );
}
