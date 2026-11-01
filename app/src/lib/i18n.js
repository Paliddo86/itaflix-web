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
    'menu-my': 'Preferiti',
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

    'filters-all': 'Tutti',
    'filters-provider': 'Piattaforma',
    'filters-genre': 'Genere',

    'my-title': 'Preferiti',
    'my-local': 'Su questo dispositivo',
    'my-tmdb': 'Preferiti TMDB',
    'my-movies': 'Film preferiti',
    'my-tvshows': 'Serie TV preferite',
    'my-empty': 'Non hai ancora aggiunto preferiti: apri un film o una serie e premi ♡.',
    'my-empty-local': 'Nessun preferito salvato su questo dispositivo.',
    'my-login-title': 'Accedi con TMDB',
    'my-login-description':
      'Facoltativo: accedendo con il tuo account TMDB i preferiti restano sincronizzati tra i dispositivi. Le credenziali vengono inviate solo a TMDB.',
    'my-login-username': 'Username TMDB',
    'my-login-password': 'Password',
    'my-login-submit': 'Accedi',
    'my-login-busy': 'Accesso in corso...',
    'my-login-error': 'Accesso non riuscito: controlla le credenziali.',
    'my-logout': 'Esci',
    'my-connected': 'Connesso come {username}',
    'my-open-login': 'Accedi con TMDB',

    'install-title': 'Installa ITAFlix',
    'install-subtitle': "Aggiungi l'app alla schermata Home o al desktop",
    'install-ios-subtitle': 'Su iPhone/iPad: 2 tap per aggiungerla alla Home',
    'install-button': 'Installa',
    'install-dismiss': 'Non ora',
    'install-help-title': 'Aggiungi alla schermata Home',
    'install-help-intro':
      'Apple non consente l’installazione automatica: bastano due tap in Safari e il segnalibro viene creato sulla Home.',
    'install-step-share': "Tocca l'icona Condividi nella barra di Safari",
    'install-step-add': 'Scorri e scegli «Aggiungi a Home»',
    'install-step-confirm':
      "Conferma con «Aggiungi»: l'icona ITAFlix comparirà nella Home e si aprirà a schermo intero.",
    'install-help-other':
      'Dal menu del browser scegli «Installa app» (o «Aggiungi alla schermata Home»). Il browser creerà il collegamento in automatico.',
    'install-close': 'Chiudi',
    'settings-install': 'Installa app',
    'settings-install-hint':
      "Aggiungi ITAFlix alla schermata Home per aprirla a schermo intero, senza barra del browser.",
    'settings-installed': 'ITAFlix è installata su questo dispositivo.',
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
