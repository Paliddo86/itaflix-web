import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

import { t } from '../lib/i18n.js';

const links = [
  { to: '/', label: t('menu-home'), end: true },
  { to: '/search', label: t('menu-search') },
  { to: '/movies', label: t('menu-movies') },
  { to: '/tv', label: t('menu-tvshows') },
  { to: '/settings', label: t('menu-settings') },
];

/**
 * Barra di navigazione — equivalente della `menuBarTemplate` dell'app tvOS.
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
      <NavLink to="/" className="navbar-logo">
        <span className="navbar-logo-mark">ITA</span>Flix
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
