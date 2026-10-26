/**
 * Internazionalizzazione — port di itaflix-tvos/src/localization/it.js
 * (solo le chiavi usate dalla web app, con le stesse stringhe).
 */

const translations = {
  it: {
    'app-name': 'ITAFlix',

    'menu-home': 'Home',
    'menu-search': 'Cerca',
    'menu-movies': 'Film',
    'menu-tvshows': 'Serie TV',
    'menu-settings': 'Impostazioni',

    'movie-type': 'Film',
    'tv-type': 'Serie TV',
    season: 'Stagione',

    loading: 'Caricamento...',
    error: 'Errore',
    'generic-error': 'Errore generico',
    'no-content': 'Contenuto non disponibile',
    retry: 'Riprova',
    back: 'Torna indietro',

    'home-hero-title': 'Benvenuto su ITAFlix',
    'home-hero-subtitle': 'Film e serie TV in italiano, senza registrazione',
    'home-play': 'Riproduci',
    'home-more': 'Dettagli',

    'search-placeholder': 'Cerca film e serie TV...',
    'search-result-movie': 'Film trovati',
    'search-result-tvshow': 'Serie TV trovate',
    'search-empty': 'Nessun risultato trovato',
    'search-hint': 'Scrivi il titolo di un film o di una serie TV',

    'movie-play': 'Riproduci',
    'movie-resume': 'Riprendi da {time}',
    'movie-runtime': '{minutes} min',
    'movie-collection': 'Collezione',
    'movie-recommendations': 'Ti potrebbe piacere',
    'movie-status': 'Stato',
    'movie-genres': 'Generi',

    'tvshow-seasons': 'Stagioni',
    'tvshow-season': 'Stagione {number}',
    'tvshow-episodes': '{count} episodi',
    'tvshow-recommendations': 'Ti potrebbe piacere',

    'season-episodes': 'Episodi',
    'episode-number': 'Episodio {number}',
    'episode-play': 'Riproduci episodio',
    'no-description': 'Nessuna descrizione disponibile.',
    'tvshow-new': 'NUOVO',

    'player-loading': 'Preparazione dello streaming...',
    'player-error': 'Impossibile avviare la riproduzione',
    'player-quality': 'Qualità',
    'player-auto': 'Auto',
    'player-next-episode': 'Prossimo episodio',
    'player-close': 'Chiudi',
    'player-subtitles': 'Sottotitoli',

    'settings-title': 'Impostazioni',
    'settings-video-quality': 'Qualità video preferita',
    'settings-language': 'Lingua',
    'settings-autoplay': 'Riproduci automaticamente il prossimo episodio',
    'settings-about': 'Info',
    'settings-version': 'Versione',
    'settings-saved': 'Impostazioni salvate',
    'settings-quality-sd': 'SD (480p)',
    'settings-quality-hd': 'HD (720p)',
    'settings-quality-fullhd': 'Full HD (1080p)',
    'settings-quality-uhd': '4K (2160p)',
  },
};

let currentLanguage = 'it';

export function setLanguage(language) {
  currentLanguage = translations[language] ? language : 'it';
}

export function getLanguage() {
  return currentLanguage;
}

/**
 * Traduce una chiave; supporta interpolazione `{token}`.
 */
export function t(name, params = {}) {
  const table = translations[currentLanguage] || translations.it;
  const value = table[name] ?? translations.it[name];
  const template = typeof value === 'function' ? value(params) : value;

  if (typeof template !== 'string') return name;

  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] === undefined ? `{${key}}` : String(params[key]),
  );
}

export default t;
