import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Shelf orizzontale — equivalente del `<shelf>` TVML dell'app tvOS,
 * con frecce di scorrimento per desktop e scroll touch su mobile.
 */
export default function Row({ title, subtitle, children, id }) {
  const containerRef = useRef(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  const updateArrows = useCallback(() => {
    const node = containerRef.current;
    if (!node) return;
    setCanScroll({
      left: node.scrollLeft > 8,
      right: node.scrollLeft + node.clientWidth < node.scrollWidth - 8,
    });
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;

    updateArrows();
    node.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);

    return () => {
      node.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows, children]);

  const scrollBy = (direction) => {
    const node = containerRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * Math.max(node.clientWidth * 0.8, 240), behavior: 'smooth' });
  };

  return (
    <section className="row" id={id}>
      <header className="row-header">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </header>

      <div className="row-body">
        <button
          type="button"
          className="row-arrow row-arrow-prev"
          onClick={() => scrollBy(-1)}
          disabled={!canScroll.left}
          aria-label="Scorri a sinistra"
        >
          ‹
        </button>

        <div className="row-track" ref={containerRef}>
          {children}
        </div>

        <button
          type="button"
          className="row-arrow row-arrow-next"
          onClick={() => scrollBy(1)}
          disabled={!canScroll.right}
          aria-label="Scorri a destra"
        >
          ›
        </button>
      </div>
    </section>
  );
}
