# 🎬 ITAFlix

Web app in stile tvOS per esplorare film e serie TV: home con shelf tematiche,
ricerca, catalogo con filtri, dettaglio con cast e raccomandati, episodi,
preferiti sincronizzati con TMDb e player HLS con ripresa della posizione.

![Home di ITAFlix](docs/screenshots/home.jpg)

## Screenshot

| Catalogo con filtri | Dettaglio film |
|---|---|
| ![Catalogo](docs/screenshots/catalog.jpg) | ![Dettaglio film](docs/screenshots/movie.jpg) |

## Funzionalità

- Home con 8 shelf TMDb (film, serie, anime, Netflix, Prime, Disney+, Now, Apple, HBO)
- Ricerca con debounce su film e serie
- Cataloghi Film/Serie con filtri per **piattaforma** e **genere** e "carica altri"
- Dettaglio film con collezione e raccomandati; dettaglio serie con stagioni,
  elenco episodi e "prossimo episodio"
- Player HLS con scelta qualità, ripresa della posizione e salvataggio ogni 5 secondi
- **Preferiti** locali in `localStorage` e, dopo il login TMDb, sincronizzati
  sull'account
- Layout **responsive** (desktop, tablet, smartphone) e installabile come PWA
- Scorciatoie player: `spazio` play/pausa · `←`/`→` ±10s · `M` muto · `F` schermo intero · `Esc` chiudi

## Come è fatto

La web app vive interamente in `app/` ed è un port dell'app tvOS `itaflix-tvos`:
stessa logica dati (TMDb) e stesso estrattore **VixSrc**, con UI React in stile TVML
(logo originale, voci di menu che si accendono di rosso quando sono a fuoco).

| Percorso | Cosa è |
|---|---|
| `app/src/lib/` | modelli, client TMDb, i18n, impostazioni, storage, preferiti |
| `app/src/components/` | NavBar, Row, Tile, Player (hls.js), TmdbLogin, InstallPrompt |
| `app/src/pages/` | Home, Search, Catalog, Movie, TvShow, Season, My, Settings |
| `app/api/` | funzioni serverless: `/api/stream`, `/api/playlist`, `/api/health` |
| `app/server/` | estrattore VixSrc, proxy playlist, fetch senza Referer |
| branch `Old` | la vecchia pagina statica ITAFlix (HTML + iframe VixSrc) |

Serve un piccolo backend perché VixSrc risponde `403` alle richieste browser con
`Referer` di terze parti e a quelle dentro un iframe, mentre le chiamate
server-side passano: l'estrazione gira lato server e restituisce solo l'URL
m3u8 finale. Manifest HLS, chiave AES e segmenti vengono poi caricati
direttamente dal browser.

## Tecnologie

- **React 18 + Vite**, **hls.js** per la riproduzione HLS
- **Vercel Functions** (Node 22) per l'estrazione lato server
- [TMDb API](https://www.themoviedb.org/documentation/api) per informazioni su film e serie
- [VixSrc.to](https://vixsrc.to) per lo streaming

Dettagli di sviluppo e architettura in [`app/README.md`](app/README.md).

## ⚠️ Disclaimer

> Questo progetto è solo a scopo dimostrativo ed educativo. **Non ospita alcun
> contenuto**, ma rimanda ai link di servizi di terze parti. L'utilizzo di
> servizi di terze parti per la visione di contenuti protetti da copyright può
> violare le leggi sul diritto d'autore.
