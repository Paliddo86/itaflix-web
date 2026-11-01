# 🎬 ITAFlix Web (`app/`)

Porting web dell'app **itaflix-tvos**: stessa logica dati (TMDB) e stessa UI in
stile TVML, con la riproduzione affidata all'**embed ufficiale di VixSrc**.

> ⚠️ Progetto dimostrativo/educativo. Non ospita alcun contenuto: si limita a
> richiamare servizi di terze parti. Verifica sempre le leggi del tuo Paese.

---

## Architettura: solo client-side

L'app è **un sito statico**. Non ci sono funzioni serverless, né backend.

| Cosa | Dove |
|---|---|
| Catalogo, ricerca, dettagli, preferiti | browser → **TMDB API** |
| Riproduzione | browser → **embed VixSrc** in un iframe |

### Perché l'iframe e non un player custom

VixSrc espone il proprio player su `https://vixsrc.to/movie/{id}` e
`https://vixsrc.to/tv/{id}/{season}/{episode}`. Questo player, caricato dal
browser dell'utente:

- richiede `playlist`, chiave AES e segmenti **direttamente alla CDN** (tutti
  con `Access-Control-Allow-Origin: *`)
- funziona con l'IP residenziale dell'utente, senza proxy

Un estrattore server-side (la versione precedente di questo progetto) invece
**non funziona su Vercel o Netlify**: VixSrc risponde `403` — pagina Cloudflare
"Sorry, you have been blocked" — alle chiamate provenienti da IP datacenter
(AWS `AS14618`/`AS16509`). Provato in `us-east-1` e `eu-central-1`: stesso esito.
Da IP residenziale gli stessi header danno `200`.

### Vincoli dell'embed

| Regola | Dettaglio |
|---|---|
| `referrerpolicy` | deve essere **`origin`**. Con `no-referrer` il player mostra "THIS PLAYER CANNOT BE EMBEDDED WITH REFERRERPOLICY=no-referrer" |
| `allow` | `autoplay; fullscreen; encrypted-media; picture-in-picture` |
| qualità video | decisa dal player (720p), nessun controllo esposto → rimosso dalle impostazioni |
| ripresa posizione | parametro **`startAt=<secondi>`**: il player esegue `seek(startAt)` all'evento `ready` |

### Ripresa e prossimo episodio

Il player comunica col documento padre via `postMessage`:

```js
{ type: 'PLAYER_EVENT', data: { event, currentTime?, duration?, video_id? } }
// event: play | pause | seeked | complete
```

`Player.jsx` ascolta questi messaggi per salvare la posizione in `localStorage`
(`itaflix-resume`) e per passare all'episodio successivo su `complete`.

---

## Avvio in locale

Prerequisiti: **Node.js 22+** e npm.

```bash
cd app
cp .env.example .env.local     # solo VITE_TMDB_API
npm install
npm run dev                    # http://localhost:5173
```

Build di produzione:

```bash
npm run build     # → dist/
npm run preview   # http://localhost:4173
```

### Variabili d'ambiente

| Variabile | Dove | Uso |
|---|---|---|
| `VITE_TMDB_API` | build (client) | chiave TMDB usata dal browser |

`.env.local` è in `.gitignore`: non committarlo. Essendo una variabile di build,
cambiarla richiede un nuovo build/deploy.

---

## Deploy

### Vercel

1. Import del repo `itaflix-web`
2. **Root Directory**: `app`
3. Framework preset: **Vite** · Build `npm run build` · Output `dist`
4. Node.js: **22.x**
5. Env: `VITE_TMDB_API`
6. Deploy

`app/vercel.json` gestisce solo il rewrite SPA per react-router.

Nessuna funzione, nessuna regione da configurare: è un sito statico su CDN.

### Qualsiasi altro host statico

`npm run build` e pubblica `dist/`. GitHub Pages, Netlify, Cloudflare Pages
funzionano ugualmente (l'iframe non dipende dall'host).

---

## Struttura

```
app/
├── public/                icone PWA, manifest, service worker, logo
├── src/
│   ├── lib/
│   │   ├── embed.js       URL embed VixSrc (movie / tv) + startAt
│   │   ├── models.js      normalizzazione dati TMDB
│   │   ├── tmdb.js        client TMDB con cache
│   │   ├── i18n.js        stringhe italiane
│   │   ├── settings.js    impostazioni (autoplay)
│   │   ├── storage.js     preferiti e posizione di riproduzione
│   │   └── user.js        sessione TMDB in localStorage
│   ├── components/        NavBar, Row, Tile, Player (iframe), TmdbLogin, …
│   └── pages/             Home, Search, Catalog, Movie, TvShow, Season, My, Settings
└── vercel.json            rewrite SPA
```

### Mappa di porting (tvOS → web)

| tvOS | web |
|---|---|
| `helpers/models.js` | `src/lib/models.js` |
| `request/tmdb.js` | `src/lib/tmdb.js` |
| `extractors/vixsrc.js` | **rimosso** → iframe `vixsrc.to/movie/{id}` |
| `localization/it.js` | `src/lib/i18n.js` |
| `settings.js` | `src/lib/settings.js` |
| `user.js` | `src/lib/user.js` |
| `routes/home.js` | `src/pages/Home.jsx` |
| `routes/search.js` | `src/pages/Search.jsx` |
| `routes/moviesGenres.js` · `tvShowsGenres.js` | `src/pages/Catalog.jsx` |
| `routes/movie.js` | `src/pages/Movie.jsx` + `components/Player.jsx` |
| `routes/tvshow.js` + `season.js` | `src/pages/TvShow.jsx` + `Season.jsx` |
| `routes/my.js` | `src/pages/My.jsx` |
| `routes/tmdb-login.js` | `src/components/TmdbLogin.jsx` |
| `components/tile.js` | `src/components/Tile.jsx` |
| `common/styles.js` + `assets/img/logo*.png` | `src/theme.css` + `public/logo*.png` |

> **Grafica**: logo originale dell'app tvOS (nulla navbar, `logo-big.png` come
> splash) e menu in stile `menuItem` TVML: voce neutra che si accende di rosso
> `rgba(185, 5, 5, 1)` quando è a fuoco/attiva.

---

## Funzionalità

- Home con 8 shelf TMDB (film, serie, anime, Netflix, Prime, Disney+, Now, Apple, HBO)
- Ricerca con debounce su film e serie
- Cataloghi Film/Serie con filtri per **piattaforma** e **genere** + "carica altri"
- Dettaglio film con collezione e raccomandati
- Dettaglio serie con stagioni, elenco episodi e "prossimo episodio"
- Player VixSrc con ripresa della posizione (`startAt`) e avanzamento automatico
  all'episodio successivo
- **Preferiti**: locali in `localStorage` e, dopo il login TMDB, sincronizzati
  sull'account (con stato letto da `account_states`)
- Impostazioni: riproduzione automatica del prossimo episodio
- Layout **responsive** (desktop, tablet, smartphone), installabile come **PWA**
