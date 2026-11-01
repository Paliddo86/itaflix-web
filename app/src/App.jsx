import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import NavBar from './components/NavBar.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';
import Catalog from './pages/Catalog.jsx';
import Home from './pages/Home.jsx';
import Movie from './pages/Movie.jsx';
import My from './pages/My.jsx';
import Search from './pages/Search.jsx';
import Season from './pages/Season.jsx';
import Settings from './pages/Settings.jsx';
import TvShow from './pages/TvShow.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

/**
 * Routing della web app:
 *  /                       home (shelf)
 *  /search                 ricerca
 *  /movies · /tv           cataloghi
 *  /movie/:id              dettaglio film
 *  /tv/:id                 dettaglio serie
 *  /tv/:id/season/:season  episodi
 *  /settings               impostazioni
 */
export default function App() {
  return (
    <>
      <NavBar />
      <ScrollToTop />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/movies" element={<Catalog type="movie" />} />
          <Route path="/tv" element={<Catalog type="tv" />} />
          <Route path="/movie/:id" element={<Movie />} />
          <Route path="/tv/:id" element={<TvShow />} />
          <Route path="/tv/:id/season/:season" element={<Season />} />
          <Route path="/my" element={<My />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      <InstallPrompt />
    </>
  );
}
