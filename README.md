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

## Advertising

The movie and TV player pages (`player-movie.html`, `player-tv.html`) include a single ad placement powered by **EffectiveGateCPM**.

| Detail | Value |
|---|---|
| Network | EffectiveGateCPM |
| Publisher ID | `92d4392296fa5e19466bef5378e5a980` |
| Script host | `pl28353113.effectivegatecpm.com` |
| Container ID | `container-92d4392296fa5e19466bef5378e5a980` |

These ads belong to the site owner. To verify or update the placement, log in to your EffectiveGateCPM publisher dashboard and confirm the publisher ID above matches your account.

> **Note:** The embedded video streams are served by third-party hosts and may display their own ads independently of the site owner's ad placement.

## Setup

No build step is required. Open `index.html` in a browser, or serve the directory with any static web server.

A TMDB API key is read from `localStorage` key `tmdb_api_key`. Set it in the browser console:

```js
localStorage.setItem('tmdb_api_key', 'YOUR_KEY_HERE');
```

## Data & Attribution

- Movie/TV metadata: [The Movie Database (TMDB)](https://www.themoviedb.org/)
- Live TV playlists: third-party M3U sources