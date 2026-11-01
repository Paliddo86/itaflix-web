import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

import { t } from '../lib/i18n.js';

const links = [
  { to: '/', label: t('menu-home'), end: true },
  { to: '/search', label: t('menu-search') },
  { to: '/movies', label: t('menu-movies') },
  { to: '/tv', label: t('menu-tvshows') },
  { to: '/my', label: t('menu-my') },
  { to: '/settings', label: t('menu-settings') },
];

/**
 * Barra di navigazione — equivalente della `menuBarTemplate` dell'app tvOS.
 * Logo originale dell'app (`public/logo.png`) e voci con lo stesso highlight
 * rosso (`rgba(185,5,5,1)`) che TVML applica alla voce a fuoco.
 */
export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`navbar${scrolled ? ' navbar-scrolled' : ''}`}>
      <NavLink to="/" className="navbar-logo" aria-label={t('app-name')}>
        <img src="/logo.png" alt={t('app-name')} />
        <span className="navbar-version">v{__APP_VERSION__}</span>
      </NavLink>

      <nav className="navbar-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `navbar-link${isActive ? ' is-active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
