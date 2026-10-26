# 🎬 ITAFlix Web (`app/`)

Porting web dell'app **itaflix-tvos**: stessa logica dati (TMDB) e stesso
estrattore **VixSrc** dell'app tvOS, con UI React in stile TVML.

> ⚠️ Progetto dimostrativo/educativo. Non ospita alcun contenuto: si limita a
> richiamare servizi di terze parti. Verifica sempre le leggi del tuo Paese.

---

## Perché serve un backend (anche minimo)

L'app tvOS funziona perché il suo `XMLHttpRequest` nativo **non invia `Referer`**
e non applica la CORS policy. In un browser questo non è possibile:

| Richiesta | Browser (diretta) | Server (questa app) |
|---|---|---|
| `vixsrc.to/api/movie/{id}` | ❌ 403 WAF / CORS | ✅ 200 |
| `vixsrc.to/embed/...` | ❌ 403 WAF / CORS | ✅ 200 |
| `vixsrc.to/playlist/...` (m3u8) | ✅ 200 + `ACAO: *` | ✅ 200 |
| `vixsrc.to/storage/enc.key` | ✅ 200 + `ACAO: *` | ✅ 200 |
| segmenti CDN | ✅ 200/206 + `ACAO: *` | ✅ 200/206 |

Per questo l'estrazione (`api/stream.js` + `server/vixsrc.js`) gira **lato
server** e restituisce solo l'URL m3u8 finale. Il player (`hls.js`) carica
manifest, chiave AES e segmenti **direttamente dalla CDN** senza consumare banda
delle funzioni.

Due dettagli indispensabili già implementati:

1. `app/index.html` contiene `<meta name="referrer" content="no-referrer">`:
   senza Referer la playlist risponde 200 (con Referer terzo risponde 403).
2. `hls.js` viene preferito al player nativo: Chrome dichiara `maybe` per
   `application/vnd.apple.mpegurl` ma non supporta HLS nativamente.

---

## Avvio in locale

Prerequisiti: **Node.js 20+** e npm.

```bash
cd app
cp .env.example .env.local     # TMDB API key + VIX_BASE_URL
npm install

# terminale 1 — API (porta 3001)
npm run dev:api

# terminale 2 — UI (porta 5173, proxy /api → 3001)
npm run dev
```

Apri <http://localhost:5173>.

Verifica rapida delle API:

```bash
curl -s "http://localhost:3001/api/health" | jq
curl -s "http://localhost:3001/api/stream?type=movie&id=27205" | jq
curl -s "http://localhost:3001/api/stream?type=tv&id=1396&season=1&episode=1" | jq
# la seconda chiamata allo stesso contenuto risponde con "cached": true
```

Build di produzione e test del bundle reale:

```bash
npm run build
npm run preview      # http://localhost:4173 (proxy /api → 3001)
```

Chi vuole usare la CLI di Vercel può lanciare `npx vercel dev` (sostituisce
entrambi i comandi sopra).

### Variabili d'ambiente

| Variabile | Dove | Uso |
|---|---|---|
| `VITE_TMDB_API` | build (client) | chiave TMDB usata dal browser |
| `TMDB_API` | runtime (server) | chiave TMDB per eventuali funzioni server |
| `VIX_BASE_URL` | runtime (server) | base URL del servizio streaming (default `https://vixsrc.to`) |

`.env.local` è in `.gitignore`: non committarlo.

---

## Deploy su Vercel (free)

1. **New Project** → import del repo `VixFlix` → branch `itaflix-app`.
2. **Root Directory**: `app`
3. Framework preset: **Vite** · Build: `npm run build` · Output: `dist`
4. Node.js: **20.x**
5. Environment Variables: `VITE_TMDB_API`, `TMDB_API`, `VIX_BASE_URL`
6. Deploy.

`app/vercel.json` gestisce il rewrite SPA (react-router) e `maxDuration` delle
funzioni. Le funzioni sono in `app/api/`, i moduli condivisi in `app/server/`.

---

## Struttura

```
app/
├── api/stream.js          GET /api/stream?type=movie|tv&id=&season=&episode=
├── api/health.js          diagnostica
├── server/vixsrc.js       port 1:1 di itaflix-tvos/src/extractors/vixsrc.js
├── server/http.js         fetch con timeout, senza Referer
├── server/dev-server.mjs  emulazione Vercel per lo sviluppo locale
└── src/
    ├── lib/               models, tmdb, i18n, settings, storage, api, utils
    ├── components/        NavBar, Row, Tile, Hero, Player (hls.js), …
    └── pages/             Home, Search, Catalog, Movie, TvShow, Season, Settings
```

### Mappa di porting (tvOS → web)

| tvOS | web |
|---|---|
| `helpers/models.js` | `src/lib/models.js` (copia) |
| `request/tmdb.js` | `src/lib/tmdb.js` (`fetch` + cache) |
| `extractors/vixsrc.js` | `server/vixsrc.js` (senza `eval`) |
| `localization/it.js` | `src/lib/i18n.js` |
| `settings.js` | `src/lib/settings.js` (stessa chiave `itaflix-settings`) |
| `routes/home.js` | `src/pages/Home.jsx` |
| `routes/search.js` | `src/pages/Search.jsx` |
| `routes/movie.js` | `src/pages/Movie.jsx` + `components/Player.jsx` |
| `routes/tvshow.js` + `season.js` | `src/pages/TvShow.jsx` + `Season.jsx` |
| `routes/settings.js` | `src/pages/Settings.jsx` |
| `components/tile.js` | `src/components/Tile.jsx` |
| `common/styles.js` | `src/theme.css` (nero + `#b90505`) |

---

## Scorciatoie del player

`spazio` play/pausa · `←`/`→` ±10s · `M` muto · `F` schermo intero · `Esc` chiudi

## Funzionalità

- Home con 8 shelf TMDB (film, serie, anime, Netflix, Prime, Disney+, Now, Apple, HBO)
- Ricerca con debounce su film e serie
- Dettaglio film con collezione e raccomandati
- Dettaglio serie con stagioni, elenco episodi e "prossimo episodio"
- Player HLS con scelta qualità (in base alle impostazioni), ripresa della
  posizione e salvataggio ogni 5 secondi
- Preferiti locali e impostazioni persistite in `localStorage`
