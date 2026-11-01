
# 🎬 VixFlix / ITAFlix

La web app vive interamente in `app/`:

| Percorso | Cosa è | Come si usa |
|---|---|---|
| `app/` | **web app React** (port dell'app tvOS `itaflix-tvos`): home con shelf, ricerca, catalogo con filtri, dettaglio film/serie, episodi, preferiti (anche TMDB) e player HLS nativo; logo e stile dei menu ripresi dall'app tvOS | vedi [`app/README.md`](app/README.md) |
| branch `Old` | la vecchia pagina statica ITAFlix (HTML + iframe VixSrc) servita su GitHub Pages: su questo branch è stata rimossa | `git switch Old` |

La web app in `app/` richiede un piccolo backend (funzioni serverless) per
l'estrazione dello stream: VixSrc risponde `403` alle richieste browser con
`Referer` di terze parti e a quelle dentro un iframe, mentre le chiamate
server-side passano. Tutto il resto (manifest HLS, chiave AES, segmenti) viene
caricato direttamente dal browser.

---

## 🚀 Avvio rapido della web app

```bash
cd app
cp .env.example .env.local
npm install
npm run dev:api   # terminale 1 → API su :3001
npm run dev       # terminale 2 → UI su :5173
```

**Deploy Vercel**: importa <https://github.com/Paliddo86/itaflix-web> (Root Directory `app`, branch `itaflix-app`) — la UI React + le funzioni `/api` vivono lì.

**Deploy GitHub Pages** (solo sito statico in `site/`, senza backend):
`.github/workflows/pages.yml` pubblica `site/` su ogni push verso `main` o `itaflix-app`.

---

## 🛠️ Tecnologie utilizzate

- **React 18 + Vite** (web app), **hls.js** per la riproduzione HLS
- **Vercel Functions** (Node 22) per l'estrazione lato server
- [TMDb API](https://www.themoviedb.org/documentation/api) per informazioni su film/serie
- [VixSrc.to](https://vixsrc.to) per lo streaming
- La vecchia pagina statica (`index.html`) resta disponibile sul branch `Old`

---

## ⚠️ Disclaimer

> Questo progetto è solo a scopo dimostrativo ed educativo. **Non ospita alcun
> contenuto**, ma rimanda ai link di servizi di terze parti. L'utilizzo di
> servizi di terze parti per la visione di contenuti protetti da copyright può
> violare le leggi sul diritto d'autore.

---

