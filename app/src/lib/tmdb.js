/**
 * Client TMDB — port di itaflix-tvos/src/request/tmdb.js
 *
 * Differenze rispetto all'originale:
 *  - `request.get().then(request.toJSON())` → `fetch().then((r) => r.json())`;
 *  - `process.env.TMDB_API` → `import.meta.env.VITE_TMDB_API` (Vite);
 *  - cache in-memory (5 min) per non ripetere le stesse chiamate
 *    (la home fa ~15 richieste);
 *  - `defaultErrorHandlers` (modale TVML) → `throw`, gestito dalle pagine.
 */

import { Category, Movie, TvShow, Season, Episode } from './models.js';
import { SERVICE_ID_MAP } from './settings.js';

const API_BASE = 'https://api.themoviedb.org/3';
const IMAGEKIT_URL = 'https://ik.imagekit.io/itaflix/webp/';

const API_KEY = import.meta.env.VITE_TMDB_API || '';
const LANGUAGE = 'it';
const LANGUAGE_CODE = 'it-IT';

const CACHE_TTL = 5 * 60 * 1000;
const requestCache = new Map();
const genres = { movie: {}, tv: {} };

/** Migliora le immagini con ImageKit (come nell'app tvOS). */
function getImageLink(urlImage, gradient = true) {
  if (!urlImage) return null;
  return (
    IMAGEKIT_URL +
    urlImage +
    (gradient
      ? '?tr=fo-auto,e-gradient-ld-280_from-FFFFFF00_to-black_sp-iw_div_0.4'
      : '')
  );
}

const translations = {
  Trending: 'Di tendenza',
  'Popular Movies': 'Film popolari',
  'Popular TV Shows': 'Serie TV popolari',
  'Popular Anime': 'Anime popolari',
  'Popular on Netflix': 'Popolari su Netflix',
  'Popular on Amazon': 'Popolari su Amazon',
  'Popular on Disney+': 'Popolari su Disney+',
  'Popular on Now TV': 'Popolari su Now TV',
  'Popular on Apple TV+': 'Popolari su Apple TV+',
  'Popular on HBO': 'Popolari su HBO',
};

class TMDB {
  static get apiKeyConfigured() {
    return Boolean(API_KEY);
  }

  static _buildImage(path, size = 'w300') {
    if (!path) return '';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }

  static getImageLink(urlImage, gradient = true) {
    return getImageLink(urlImage, gradient);
  }

  static _makeSlug(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  static _getTranslation(key) {
    return translations[key] || key;
  }

  static async _tmdbGet(path, params = {}) {
    if (!API_KEY) {
      throw new Error('TMDB API key mancante: imposta VITE_TMDB_API in .env.local');
    }

    const query = Object.keys(params)
      .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    const url = `${API_BASE}${path}?api_key=${API_KEY}&language=${LANGUAGE_CODE}${
      query ? `&${query}` : ''
    }`;

    const cached = requestCache.get(url);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDB HTTP ${response.status} su ${path}`);
    }

    const data = await response.json();
    requestCache.set(url, { data, expiresAt: Date.now() + CACHE_TTL });

    return data;
  }

  /** Recupera e memorizza la mappa dei generi (film e serie). */
  static async _fetchAndMapGenres() {
    const [movieGenresRes, tvGenresRes] = await Promise.all([
      this._tmdbGet('/genre/movie/list'),
      this._tmdbGet('/genre/tv/list'),
    ]);

    genres.movie = {};
    genres.tv = {};

    (movieGenresRes.genres || []).forEach((genre) => {
      genres.movie[genre.id] = genre.name;
    });
    (tvGenresRes.genres || []).forEach((genre) => {
      genres.tv[genre.id] = genre.name;
    });

    return genres;
  }

  static getGenreName(id, type = 'movie') {
    return genres[type] ? genres[type][id] : undefined;
  }

  static getAllGenres(type = 'movie') {
    return Object.entries(genres[type] || {}).map(([id, name]) => ({
      id: Number(id),
      name,
    }));
  }

  static _mapMovieToItem(it) {
    return new Movie({
      id: it.id,
      title: it.title || it.name,
      poster: this._buildImage(it.poster_path),
      banner: getImageLink(this._buildImage(it.backdrop_path, 'original')),
      rating: it.vote_average,
      slug: this._makeSlug(it.title || it.original_title || it.name),
      isUpdated: false,
      type: 'movie',
    });
  }

  static _mapTvToItem(it) {
    return new TvShow({
      id: it.id,
      title: it.name || it.title,
      poster: this._buildImage(it.poster_path),
      banner: getImageLink(this._buildImage(it.backdrop_path, 'original')),
      rating: it.vote_average,
      slug: this._makeSlug(it.name || it.original_name || it.title),
      isUpdated: false,
      type: 'tv',
    });
  }

  static _mapMultiToItem(it) {
    if (!it) return null;
    if (it.media_type === 'movie' || it.title) return this._mapMovieToItem(it);
    return this._mapTvToItem(it);
  }

  /** Categoria "per provider" (Netflix, Prime, Disney+, Now, Apple, HBO). */
  static async _providerList(providerId, mediaPath, watchRegion, extraParams = {}) {
    const res = await this._tmdbGet(mediaPath, {
      page: 1,
      with_watch_providers: providerId,
      watch_region: watchRegion,
      ...extraParams,
    });
    return (res.results || []).sort(
      (a, b) => (b.popularity || 0) - (a.popularity || 0),
    );
  }

  /* --------------------------------------------------------------------- */
  /* Home                                                                  */
  /* --------------------------------------------------------------------- */

  /**
   * Categorie della home (equivalente di TMDB.getHome() dell'app tvOS).
   * @returns {Promise<{ categories: Category[] }>}
   */
  static async getHome() {
    await this._fetchAndMapGenres();

    const watchRegion = LANGUAGE === 'en' ? 'US' : LANGUAGE.toUpperCase();

    const [moviePages, tvPages, animeRes] = await Promise.all([
      Promise.all([1, 2, 3].map((page) => this._tmdbGet('/movie/popular', { page }))),
      Promise.all([1, 2, 3].map((page) => this._tmdbGet('/tv/popular', { page }))),
      this._tmdbGet('/discover/movie', { with_keywords: '210024,180547' }),
    ]);

    const popularMovies = moviePages.flatMap((res) => res.results || []);
    const popularTv = tvPages.flatMap((res) => res.results || []);
    const anime = (animeRes.results || []).sort(
      (a, b) => (b.popularity || 0) - (a.popularity || 0),
    );

    const providerDefs = [
      ['Popular on Netflix', SERVICE_ID_MAP.NETFLIX],
      ['Popular on Amazon', SERVICE_ID_MAP.PRIME_VIDEO],
      ['Popular on Disney+', SERVICE_ID_MAP.DISNEY],
      ['Popular on Now TV', SERVICE_ID_MAP.NOW],
      ['Popular on Apple TV+', SERVICE_ID_MAP.APPLE],
    ];

    const [providerCategories, hboRes] = await Promise.all([
      Promise.all(
        providerDefs.map(async ([name, providerId]) => {
          const [movies, tvs] = await Promise.all([
            this._providerList(providerId, '/discover/movie', watchRegion),
            this._providerList(providerId, '/discover/tv', watchRegion),
          ]);

          return new Category({
            name: this._getTranslation(name),
            values: [...movies, ...tvs]
              .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
              .map((it) => this._mapMultiToItem(it))
              .filter(Boolean),
          });
        }),
      ),
      this._tmdbGet('/discover/tv', { with_networks: SERVICE_ID_MAP.HBO }),
    ]);

    const categories = [
      new Category({
        name: this._getTranslation('Popular Movies'),
        values: popularMovies.map((it) => this._mapMovieToItem(it)),
      }),
      new Category({
        name: this._getTranslation('Popular TV Shows'),
        values: popularTv.map((it) => this._mapTvToItem(it)),
      }),
      new Category({
        name: this._getTranslation('Popular Anime'),
        values: anime.map((it) => this._mapMultiToItem(it)).filter(Boolean),
      }),
      ...providerCategories,
      new Category({
        name: this._getTranslation('Popular on HBO'),
        values: (hboRes.results || [])
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .map((it) => this._mapTvToItem(it)),
      }),
    ].filter((category) => category.values && category.values.length);

    return { categories };
  }

  /* --------------------------------------------------------------------- */
  /* Dettagli                                                              */
  /* --------------------------------------------------------------------- */

  static async getMovieDetails(id) {
    const res = await this._tmdbGet(`/movie/${id}`, {
      append_to_response: 'recommendations',
    });

    const target = new Movie({
      id: res.id,
      title: res.title,
      poster: this._buildImage(res.poster_path),
      banner: getImageLink(this._buildImage(res.backdrop_path, 'original')),
      rating: res.vote_average,
      slug: this._makeSlug(res.title || res.original_title),
      isUpdated: false,
      type: 'movie',
      quality: '',
      overview: res.overview,
      genres: (res.genres || []).map((genre) => ({ id: genre.id, name: genre.name })),
      released: res.release_date,
      tmdb_id: res.id,
      runtime: res.runtime,
      status: res.status,
    });

    (res.recommendations?.results || []).forEach((it) => {
      target.addToRecommendations(
        new Movie({
          id: it.id,
          title: it.title || it.name,
          poster: this._buildImage(it.poster_path),
          banner: getImageLink(this._buildImage(it.backdrop_path, 'original')),
          rating: it.vote_average,
          slug: this._makeSlug(it.title || it.original_title || it.name),
          isUpdated: false,
          type: 'movie',
        }),
      );
    });

    if (res.belongs_to_collection) {
      const collectionRes = await this._tmdbGet(
        `/collection/${res.belongs_to_collection.id}`,
      );

      (collectionRes.parts || [])
        .sort((a, b) =>
          (a.release_date || '9999-99-99').localeCompare(b.release_date || '9999-99-99'),
        )
        .forEach((part) => target.addToCollection(this._mapMovieToItem(part)));
    }

    return target;
  }

  static async getTvShowDetails(id) {
    const res = await this._tmdbGet(`/tv/${id}`, {
      append_to_response: 'recommendations,external_ids',
    });

    const target = new TvShow({
      id: res.id,
      title: res.name,
      poster: this._buildImage(res.poster_path),
      banner: getImageLink(this._buildImage(res.backdrop_path, 'original')),
      rating: res.vote_average,
      slug: this._makeSlug(res.name || res.original_name),
      isUpdated: false,
      type: 'tv',
      quality: '',
      overview: res.overview,
      genres: (res.genres || []).map((genre) => ({ id: genre.id, name: genre.name })),
      released: res.first_air_date,
      tmdb_id: res.id,
      runtime:
        res.episode_run_time && res.episode_run_time.length
          ? res.episode_run_time[0]
          : 0,
      status: res.status,
    });

    (res.seasons || []).forEach((season) => {
      if (!season.season_number || season.season_number === 0) return;

      target.addToSeasons(
        new Season({
          id: season.id,
          poster: this._buildImage(season.poster_path),
          number: season.season_number,
          title: season.name,
          plot: season.overview,
          release_date: season.air_date,
          episodes_count: season.episode_count,
          isUpdated: false,
        }),
      );
    });

    (res.recommendations?.results || []).forEach((it) => {
      target.addToRecommendations(
        new TvShow({
          id: it.id,
          title: it.name || it.title,
          poster: this._buildImage(it.poster_path),
          banner: getImageLink(this._buildImage(it.backdrop_path, 'original')),
          rating: it.vote_average,
          slug: this._makeSlug(it.name || it.original_name || it.title),
          isUpdated: false,
          type: 'tv',
        }),
      );
    });

    return target;
  }

  /**
   * Popola gli episodi di una stagione del TvShow dato (come nell'app tvOS).
   */
  static async getSeasonDetails(seasonNumber, tvShow) {
    if (!tvShow) return null;

    const tvId = tvShow.tmdb_id || tvShow.sid || tvShow.id;
    const res = await this._tmdbGet(`/tv/${tvId}/season/${seasonNumber}`);

    const season = tvShow.getSeasonById
      ? tvShow.getSeasonById(seasonNumber)
      : null;

    if (!season) return null;

    if ((!season.episodes || !season.episodes.length) && season.episodes_count > 0) {
      (res.episodes || []).forEach((ep) => {
        season.addEpisode(
          new Episode({
            id: ep.id || ep.episode_number,
            number: ep.episode_number,
            title: ep.name,
            overview: ep.overview,
            poster: this._buildImage(ep.still_path),
            runtime: ep.runtime || 0,
          }),
        );
      });
    }

    return season;
  }

  /* --------------------------------------------------------------------- */
  /* Ricerca e generi                                                      */
  /* --------------------------------------------------------------------- */

  static async searchMovieAndTvShow(query, page = 1) {
    if (!query || query.trim() === '') {
      return { searchResults: { moviesFounded: [], tvshowFounded: [] } };
    }

    const res = await this._tmdbGet('/search/multi', { query, page });

    const moviesFounded = [];
    const tvshowFounded = [];

    (res.results || []).forEach((it) => {
      if (it.media_type === 'movie') {
        moviesFounded.push(
          new Movie({
            id: it.id,
            title: it.title || it.original_title,
            poster: this._buildImage(it.poster_path),
            banner: getImageLink(this._buildImage(it.backdrop_path, 'original')),
            isSubIta: false,
            slug: this._makeSlug(it.title || it.original_title || it.name),
            isUpdated: false,
            type: 'movie',
          }),
        );
      } else if (it.media_type === 'tv') {
        tvshowFounded.push(
          new TvShow({
            id: it.id,
            title: it.name || it.original_name,
            poster: this._buildImage(it.poster_path),
            banner: getImageLink(this._buildImage(it.backdrop_path, 'original')),
            isSubIta: false,
            slug: this._makeSlug(it.name || it.original_name || it.title),
            isUpdated: false,
            type: 'tv',
          }),
        );
      }
    });

    return { searchResults: { moviesFounded, tvshowFounded } };
  }

  static async getGenreMovies(offset = 0, genreService, genreId) {
    const page = Math.floor(offset / 20) + 1;
    const watchRegion = LANGUAGE === 'en' ? 'US' : LANGUAGE.toUpperCase();

    const requestParams = { page };
    if (genreService) {
      requestParams.with_watch_providers = genreService;
      requestParams.watch_region = watchRegion;
    }
    if (genreId) {
      requestParams.with_genres = genreId;
    }

    const res = await this._tmdbGet('/discover/movie', requestParams);

    return {
      movies: (res.results || []).map((it) =>
        new Movie({
          id: it.id,
          title: it.title,
          poster: this._buildImage(it.poster_path),
          banner: getImageLink(this._buildImage(it.backdrop_path, 'original')),
          rating: it.vote_average,
          slug: this._makeSlug(it.title || it.original_title),
          isUpdated: false,
          type: 'movie',
        }),
      ),
      total: res.total_results || 0,
    };
  }

  static async getGenreTvShow(offset = 0, genreService, genreId) {
    const page = Math.floor(offset / 20) + 1;
    const watchRegion = LANGUAGE === 'en' ? 'US' : LANGUAGE.toUpperCase();

    const requestParams = { page };
    if (genreService) {
      requestParams.with_watch_providers = genreService;
      requestParams.watch_region = watchRegion;
    }
    if (genreId) {
      requestParams.with_genres = genreId;
    }

    const res = await this._tmdbGet('/discover/tv', requestParams);

    return {
      tvshows: (res.results || []).map((it) => this._mapTvToItem(it)),
      total: res.total_results || 0,
    };
  }

  static async getGenres() {
    await this._fetchAndMapGenres();
    return {
      movie: this.getAllGenres('movie'),
      tv: this.getAllGenres('tv'),
    };
  }

  /* --------------------------------------------------------------------- */
  /* Autenticazione e preferiti (port di routes/tmdb-login.js e my.js)      */
  /* --------------------------------------------------------------------- */

  static async _tmdbPost(path, data = {}, params = {}) {
    if (!API_KEY) {
      throw new Error('TMDB API key mancante: imposta VITE_TMDB_API in .env.local');
    }

    const query = Object.keys(params)
      .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    const url = `${API_BASE}${path}?api_key=${API_KEY}${query ? `&${query}` : ''}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      body: JSON.stringify(data),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.status_message || `TMDB HTTP ${response.status} su ${path}`);
    }

    return payload;
  }

  static async createRequestToken() {
    const data = await this._tmdbPost('/authentication/token/new');
    if (!data.success || !data.request_token) {
      throw new Error('Impossibile creare il request token TMDB');
    }
    return data.request_token;
  }

  static async createSessionWithCredentials(username, password, requestToken) {
    await this._tmdbPost('/authentication/token/validate_with_login', {
      username,
      password,
      request_token: requestToken,
    });

    const session = await this._tmdbPost('/authentication/session/new', {
      request_token: requestToken,
    });

    if (!session.session_id) throw new Error('Sessione TMDB non creata');
    return session;
  }

  static async getAccountDetails(sessionId) {
    return this._tmdbGet('/account', { session_id: sessionId });
  }

  static async deleteSession(sessionId) {
    try {
      return await this._tmdbPost('/authentication/session', { session_id: sessionId });
    } catch (error) {
      return null;
    }
  }

  static async getAccountStates(id, type, sessionId) {
    if (!sessionId) return { favorite: false };
    return this._tmdbGet(`/${type}/${id}/account_states`, { session_id: sessionId });
  }

  static async toggleFavorite(sessionId, accountId, mediaType, mediaId, status) {
    const data = await this._tmdbPost(
      `/account/${accountId}/favorite`,
      {
        media_type: mediaType,
        media_id: Number(mediaId),
        favorite: Boolean(status),
      },
      { session_id: sessionId },
    );

    return Boolean(data.success);
  }

  static async getFavoriteMovies(sessionId, accountId, page = 1) {
    const res = await this._tmdbGet(`/account/${accountId}/favorite/movies`, {
      session_id: sessionId,
      page,
      sort_by: 'created_at.desc',
    });

    return {
      movies: (res.results || []).map((it) => this._mapMovieToItem(it)),
      total: res.total_results || 0,
    };
  }

  static async getFavoriteTv(sessionId, accountId, page = 1) {
    const res = await this._tmdbGet(`/account/${accountId}/favorite/tv`, {
      session_id: sessionId,
      page,
      sort_by: 'created_at.desc',
    });

    return {
      tvshows: (res.results || []).map((it) => this._mapTvToItem(it)),
      total: res.total_results || 0,
    };
  }
}

export default TMDB;
export { LANGUAGE };
