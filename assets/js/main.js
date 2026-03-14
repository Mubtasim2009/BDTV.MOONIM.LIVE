// Shared TMDB config
const TMDB_API_KEY = "b14194d00ce48c36318eefa745bcdeec";
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w300";
const TMDB_IMG_BACKDROP = "https://image.tmdb.org/t/p/w780";

// ─── Watchlist & History (localStorage) ─────────────────────────────────────

const WL_KEY = 'bdtv_watchlist';
const HIST_KEY = 'bdtv_history';

function watchlistGet() {
  try { return JSON.parse(localStorage.getItem(WL_KEY) || '[]'); } catch (_) { return []; }
}

function watchlistHas(id, type) {
  return watchlistGet().some(x => String(x.id) === String(id) && x.type === type);
}

function watchlistAdd(entry) {
  const list = watchlistGet();
  if (!list.some(x => String(x.id) === String(entry.id) && x.type === entry.type)) {
    list.unshift(entry);
    localStorage.setItem(WL_KEY, JSON.stringify(list));
  }
}

function watchlistRemove(id, type) {
  const list = watchlistGet().filter(x => !(String(x.id) === String(id) && x.type === type));
  localStorage.setItem(WL_KEY, JSON.stringify(list));
}

function historyGet() {
  try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch (_) { return []; }
}

function historyAdd(entry) {
  let list = historyGet().filter(x => !(String(x.id) === String(entry.id) && x.type === entry.type));
  list.unshift({ ...entry, watchedAt: Date.now() });
  if (list.length > 20) list = list.slice(0, 20);
  localStorage.setItem(HIST_KEY, JSON.stringify(list));
}

function historyRemove(id, type) {
  const list = historyGet().filter(x => !(String(x.id) === String(id) && x.type === type));
  localStorage.setItem(HIST_KEY, JSON.stringify(list));
}

// ─── Toast Notifications ──────────────────────────────────────────────────────

function showToast(message, isRemove) {
  let container = document.getElementById('bdtvToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'bdtvToastContainer';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'bdtv-toast' + (isRemove ? ' bdtv-toast--remove' : '');
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('bdtv-toast--show'));
  setTimeout(() => {
    toast.classList.remove('bdtv-toast--show');
    setTimeout(() => toast.remove(), 350);
  }, 2500);
}

// OMDb config – set your free key from https://www.omdbapi.com/apikey.aspx
// Leave empty to skip IMDb/Rotten Tomatoes ratings (TMDB score still shows)
const OMDB_API_KEY = "";

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

function buildImageUrl(path) {
  if (!path) return "";
  return `${TMDB_IMG_BASE}${path}`;
}

function buildBackdropUrl(path) {
  if (!path) return "";
  return `${TMDB_IMG_BACKDROP}${path}`;
}

function createDownloadBtn(downloadUrl) {
  const btn = document.createElement('a');
  btn.className = 'player-dl-btn';
  btn.href = downloadUrl;
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';
  btn.innerHTML = '<i class="fa-solid fa-download"></i> Download';
  return btn;
}

// Portrait card (posters) — info shown as overlay; plot revealed on hover
function createMediaCard(item, type) {
  const linkTarget = type === "tv" ? "player-tv.html" : "player-movie.html";
  const title = item.title || item.name || "Untitled";
  const year =
    (item.release_date && item.release_date.slice(0, 4)) ||
    (item.first_air_date && item.first_air_date.slice(0, 4)) ||
    "";
  const rating = item.vote_average ? item.vote_average.toFixed(1) : "–";
  const overview = item.overview || "No plot available.";

  const a = document.createElement("a");
  a.href = `${linkTarget}?id=${encodeURIComponent(item.id)}`;
  a.className = "media-card";

  const img = document.createElement("img");
  img.src = buildImageUrl(item.poster_path || item.backdrop_path);
  img.alt = title;
  img.loading = "lazy";

  // Bottom gradient: always-visible title + meta
  const overlay = document.createElement("div");
  overlay.className = "media-card-overlay";

  const titleEl = document.createElement("div");
  titleEl.className = "media-card-overlay-title";
  titleEl.textContent = title;

  const meta = document.createElement("div");
  meta.className = "media-meta";

  const yearSpan = document.createElement("span");
  yearSpan.textContent = year || "";

  const ratingSpan = document.createElement("span");
  ratingSpan.textContent = rating !== "–" ? `${rating} ★` : "";

  const typePill = document.createElement("span");
  typePill.className = "tile-type-pill";
  typePill.textContent = type === "tv" ? "TV" : "MOVIE";

  if (yearSpan.textContent) meta.appendChild(yearSpan);
  if (ratingSpan.textContent) meta.appendChild(ratingSpan);
  meta.appendChild(typePill);

  overlay.appendChild(titleEl);
  overlay.appendChild(meta);

  // Plot overlay: shown on hover (blurs image, displays overview)
  const plotOverlay = document.createElement("div");
  plotOverlay.className = "media-card-plot";

  const plotTitle = document.createElement("div");
  plotTitle.className = "media-card-plot-title";
  plotTitle.textContent = title;

  const plotText = document.createElement("p");
  plotText.className = "media-card-plot-text";
  plotText.textContent = overview;

  plotOverlay.appendChild(plotTitle);
  plotOverlay.appendChild(plotText);

  // Watchlist toggle button
  const wlBtn = document.createElement('button');
  wlBtn.className = 'wl-btn' + (watchlistHas(item.id, type) ? ' wl-btn--active' : '');
  wlBtn.setAttribute('aria-label', watchlistHas(item.id, type) ? 'Remove from My List' : 'Add to My List');
  wlBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
  wlBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (watchlistHas(item.id, type)) {
      watchlistRemove(item.id, type);
      wlBtn.classList.remove('wl-btn--active');
      wlBtn.setAttribute('aria-label', 'Add to My List');
      showToast('Removed from My List', true);
    } else {
      watchlistAdd({ id: item.id, type, title, posterPath: item.poster_path || null, year });
      wlBtn.classList.add('wl-btn--active');
      wlBtn.setAttribute('aria-label', 'Remove from My List');
      showToast('<i class="fa-solid fa-check"></i> Added to My List');
    }
  });

  a.appendChild(img);
  a.appendChild(overlay);
  a.appendChild(plotOverlay);
  a.appendChild(wlBtn);

  return a;
}

// Landscape tile (backdrop style)
function createLandscapeTile(item, type) {
  const linkTarget = type === "tv" ? "player-tv.html" : "player-movie.html";
  const title = item.title || item.name || "Untitled";
  const year =
    (item.release_date && item.release_date.slice(0, 4)) ||
    (item.first_air_date && item.first_air_date.slice(0, 4)) ||
    "";
  const rating = item.vote_average ? item.vote_average.toFixed(1) : "–";
  const overview = item.overview || "No plot available.";

  const a = document.createElement("a");
  a.href = `${linkTarget}?id=${encodeURIComponent(item.id)}`;
  a.className = "landscape-tile";

  const img = document.createElement("img");
  img.src = buildBackdropUrl(item.backdrop_path || item.poster_path);
  img.alt = title;
  img.loading = "lazy";

  // Bottom gradient: always-visible title + meta
  const body = document.createElement("div");
  body.className = "landscape-body";

  const titleEl = document.createElement("div");
  titleEl.className = "landscape-title";
  titleEl.textContent = title;

  const meta = document.createElement("div");
  meta.className = "landscape-meta";

  const yearSpan = document.createElement("span");
  yearSpan.textContent = year || "";

  const ratingSpan = document.createElement("span");
  ratingSpan.textContent = rating !== "–" ? `${rating} ★` : "";

  const typePill = document.createElement("span");
  typePill.className = "tile-type-pill";
  typePill.textContent = type === "tv" ? "TV" : "MOVIE";

  if (yearSpan.textContent) meta.appendChild(yearSpan);
  if (ratingSpan.textContent) meta.appendChild(ratingSpan);
  meta.appendChild(typePill);

  body.appendChild(titleEl);
  body.appendChild(meta);

  // Plot overlay: shown on hover (blurs image, displays overview)
  const plotOverlay = document.createElement("div");
  plotOverlay.className = "landscape-tile-plot";

  const plotTitle = document.createElement("div");
  plotTitle.className = "landscape-tile-plot-title";
  plotTitle.textContent = title;

  const plotText = document.createElement("p");
  plotText.className = "landscape-tile-plot-text";
  plotText.textContent = overview;

  plotOverlay.appendChild(plotTitle);
  plotOverlay.appendChild(plotText);

  a.appendChild(img);
  a.appendChild(body);
  a.appendChild(plotOverlay);

  return a;
}

// Show skeleton placeholder items in a container
function showSkeletons(containerId, count, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = type === "landscape"
      ? "skeleton skeleton-landscape"
      : "skeleton skeleton-portrait";
    container.appendChild(el);
  }
}

// Mobile nav toggle
(function () {
  const toggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
    // Close menu when a link is clicked (event delegation)
    navLinks.addEventListener('click', (e) => {
      if (e.target.classList.contains('nav-link')) {
        navLinks.classList.remove('open');
      }
    });
  }
})();

// Scroll-aware navbar
(function () {
  const nav = document.querySelector('.top-nav');
  if (!nav) return;
  const hero = document.getElementById('heroCarousel');
  const onScroll = () => {
    // On pages without a hero carousel, keep the navbar opaque at all times
    if (!hero || window.scrollY > 80) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
})();

// ─── Back-to-Top button ───────────────────────────────────────────────────────

(function () {
  const btn = document.createElement('button');
  btn.id = 'backToTop';
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('back-to-top--visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// ─── Keyboard shortcuts ────────────────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
  // Press '/' anywhere to focus the search input (skip if already typing)
  const tag = document.activeElement ? document.activeElement.tagName : '';
  if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
    e.preventDefault();
    const input = document.getElementById('heroSearchInput') || document.getElementById('searchInput');
    if (input) { input.focus(); input.select(); }
  }
});

// ─── Player sandbox helper ───────────────────────────────────────────────────
// Apply a permissive sandbox to every source.  The value intentionally omits
// allow-top-navigation (and allow-top-navigation-by-user-activation) so that
// embedded scripts can never navigate the parent page away (the primary ad/
// redirect mechanism), while keeping everything else a player legitimately
// needs — including allow-popups, allow-modals, allow-pointer-lock, etc. —
// so that sandbox-detection heuristics used by player providers do not trigger.
//
// Security note: allow-same-origin is included so each player can access its
// own cookies/storage on its own domain.  Because ALL player sources are
// cross-origin to this host, the same-origin policy continues to protect our
// page — the iframes cannot reach our DOM, cookies, or localStorage.
const SANDBOXED_PLAYER_SOURCES = new Set(["vidking", "vidify", "videasy", "vidfast"]);
const PLAYER_SANDBOX_VALUE =
  "allow-scripts allow-same-origin allow-forms allow-presentation " +
  "allow-popups allow-modals allow-pointer-lock allow-downloads";

function applyPlayerSandbox(frame, source) {
  if (SANDBOXED_PLAYER_SOURCES.has(source)) {
    frame.setAttribute("sandbox", PLAYER_SANDBOX_VALUE);
  } else {
    frame.removeAttribute("sandbox");
  }
}
