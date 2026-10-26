/**
 * Modelli dati — port 1:1 di itaflix-tvos/src/helpers/models.js
 */

export class Category {
  constructor({ name, values, shows }) {
    this.name = name;
    this.values = values;
    this.shows = shows;
  }
}

export class Movie {
  recommendations = [];

  constructor({
    id,
    title,
    overview,
    released,
    rating,
    poster,
    genres,
    cast,
    trailer,
    recommendations,
    banner,
    slug,
    isUpdated,
    updateType,
    quality,
    type,
    cover,
    tmdb_id,
    runtime,
    status,
    isSubIta,
  }) {
    this.sid = id;
    this.title = title;
    this.overview = overview;
    this.released = released ? new Date(released).getFullYear().toString() : '';
    this.rating = parseInt(rating, 10) || 10;
    this.poster = poster;
    this.genres = genres || [];
    this.cast = cast;
    this.trailer = trailer;
    this.recommendations = recommendations || [];
    this.banner = banner;
    this.slug = slug;
    this.isUpdated = isUpdated;
    this.updateType = isUpdated ? 'Aggiornato' : updateType;
    this.quality = quality || 'HD';
    this.type = type;
    this.cover = cover;
    this.tmdb_id = tmdb_id || id;
    this.runtime = runtime;
    this.status = status;
    this.isSubIta = isSubIta;
    this.collection = null;
  }

  addToRecommendations(movie) {
    this.recommendations.push(movie);
  }

  addToCollection(movie) {
    if (!this.collection) this.collection = [];
    this.collection.push(movie);
  }
}

export class TvShow {
  recommendations = [];

  seasons = [];

  constructor({
    id,
    title,
    overview,
    released,
    rating,
    poster,
    genres,
    cast,
    trailer,
    recommendations,
    banner,
    slug,
    isUpdated,
    updateType,
    quality,
    type,
    cover,
    tmdb_id,
    runtime,
    status,
    isSubIta,
  }) {
    this.sid = id;
    this.title = title;
    this.overview = overview;
    this.released = released ? new Date(released).getFullYear().toString() : '';
    this.rating = parseInt(rating, 10) || 10;
    this.poster = poster;
    this.genres = genres || [];
    this.cast = cast;
    this.trailer = trailer;
    this.recommendations = recommendations || [];
    this.banner = banner;
    this.slug = slug;
    this.isUpdated = isUpdated;
    this.updateType = isUpdated ? 'Aggiornato' : updateType;
    this.quality = quality || 'HD';
    this.type = type;
    this.cover = cover;
    this.tmdb_id = tmdb_id || id;
    this.runtime = runtime;
    this.status = status;
    this.isSubIta = isSubIta;
  }

  addToRecommendations(tvshow) {
    this.recommendations.push(tvshow);
  }

  addToSeasons(season) {
    this.seasons.push(season);
  }

  getSeasonById(seasonId) {
    return this.seasons.find((s) => s.number === Number(seasonId));
  }
}

export class Genre {
  constructor({ id, name, type }) {
    this.id = id;
    this.name = name;
    this.type = type;
  }
}

export class People {
  constructor({ id, name, image, biography, placeOfBirth, birthday, deathday, filmography }) {
    this.id = id;
    this.name = name;
    this.image = image || '';
    this.biography = biography || '';
    this.placeOfBirth = placeOfBirth || '';
    this.birthday = birthday || '';
    this.deathday = deathday || '';
    this.filmography = filmography || [];
  }
}

export class Service {
  constructor({ id, name }) {
    this.id = id;
    this.name = name;
  }
}

export class Season {
  episodes = [];

  constructor({
    id,
    number,
    title,
    name,
    plot,
    release_date,
    title_id,
    created_at,
    updated_at,
    episodes_count,
    isUpdated,
    episodes,
    poster,
  }) {
    this.id = id;
    this.number = number;
    this.title = title || name || '';
    this.plot = plot || '';
    this.released = release_date || '';
    this.title_id = title_id || null;
    this.created_at = created_at || '';
    this.updated_at = updated_at || '';
    this.episodes_count = episodes_count || (episodes ? episodes.length : 0);
    this.episodes = (episodes || []).map((e) => new Episode(e));
    this.type = 'season';
    this.isUpdated = isUpdated || false;
    this.poster = poster || '';
  }

  addEpisode(episode) {
    this.episodes.push(episode);
    this.episodes_count = this.episodes.length;
  }
}

export class Episode {
  constructor({ id, number, title, overview, poster, runtime, created_at, updated_at }) {
    this.id = id;
    this.number = number;
    this.title = title || '';
    this.overview = overview || '';
    this.poster = poster || '';
    this.runtime = runtime || 0;
    this.created_at = created_at || null;
    this.updated_at = updated_at || null;
  }
}
