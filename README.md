# MOONSTREAM.MOONIM.LIVE

A web-based movie and TV streaming platform powered by the [TMDB API](https://www.themoviedb.org/).

## Features

- Browse and search movies & TV shows via TMDB
- Per-title player pages with multiple source options (VidKing & Vidify)
- Live TV support with M3U/HLS playlists
- Watchlist and recently-viewed history (localStorage)
- Actor/crew profile pages
- Genre filtering
- Service Worker for anti-redirect protection
- Responsive, mobile-friendly layout

## Setup

No build step is required. Open `index.html` in a browser, or serve the directory with any static web server.

A TMDB API key is read from `localStorage` key `tmdb_api_key`. Set it in the browser console:

```js
localStorage.setItem('tmdb_api_key', 'YOUR_KEY_HERE');
```

## Data & Attribution

- Movie/TV metadata: [The Movie Database (TMDB)](https://www.themoviedb.org/)
- Live TV playlists: third-party M3U sources