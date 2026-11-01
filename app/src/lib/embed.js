/**
 * Costruzione degli URL dell'embed ufficiale di VixSrc.
 *
 * Modulo separato (senza React) così le pagine possono importarlo senza
 * trascinarsi dietro il componente del player, che resta lazy.
 *
 * L'embed usa gli stessi id TMDB dell'app tvOS:
 *   film    https://vixsrc.to/movie/{id}
 *   episodio https://vixsrc.to/tv/{id}/{season}/{episode}
 *
 * `startAt` (secondi) è letto dal player all'evento `ready` e usato per
 * eseguire `seek(startAt)`: è il meccanismo di ripresa della posizione.
 */

const BASE = 'https://vixsrc.to';

// Sotto i 5 secondi la ripresa è inutile e fastidiosa.
const MIN_RESUME_SECONDS = 5;

function withStart(url, startAt) {
  const seconds = Number(startAt);
  if (Number.isFinite(seconds) && seconds > MIN_RESUME_SECONDS) {
    url.searchParams.set('startAt', String(Math.floor(seconds)));
  }
  return url.toString();
}

/** URL dell'embed per un film: `/movie/{id}`. */
export function movieEmbedUrl(id, { startAt = 0 } = {}) {
  return withStart(new URL(`${BASE}/movie/${id}`), startAt);
}

/** URL dell'embed per un episodio: `/tv/{id}/{season}/{episode}`. */
export function tvEmbedUrl(id, season, episode, { startAt = 0 } = {}) {
  return withStart(new URL(`${BASE}/tv/${id}/${season}/${episode}`), startAt);
}
