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

// ─── Navbar info bar: time · location · weather ───────────────────────────────
(function () {
  const nav = document.querySelector('.top-nav');
  if (!nav) return;

  // Build the widget element
  const bar = document.createElement('div');
  bar.id = 'navInfoBar';
  bar.className = 'nav-info-bar';
  bar.setAttribute('aria-label', 'Time, location and weather');
  bar.innerHTML = [
    '<span class="nav-info-item nav-info-time" id="navClock">',
      '<i class="fa-regular fa-clock"></i>',
      '<span id="navClockVal">--:--:--</span>',
    '</span>',
    '<span class="nav-info-sep" aria-hidden="true"></span>',
    '<span class="nav-info-item nav-info-location" id="navLocation">',
      '<i class="fa-solid fa-location-dot"></i>',
      '<span id="navLocationVal">…</span>',
    '</span>',
    '<span class="nav-info-sep" aria-hidden="true"></span>',
    '<span class="nav-info-item nav-info-weather" id="navWeather">',
      '<i class="fa-solid fa-cloud" id="navWeatherIcon"></i>',
      '<span id="navWeatherVal">…</span>',
    '</span>'
  ].join('');

  // Insert after the brand logo (first child of top-nav)
  const brand = nav.querySelector('.top-brand');
  if (brand && brand.nextSibling) {
    nav.insertBefore(bar, brand.nextSibling);
  } else {
    nav.appendChild(bar);
  }

  // ── Live clock ──────────────────────────────────────────────────────────────
  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const el = document.getElementById('navClockVal');
    if (el) el.textContent = `${h}:${m}:${s}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // ── WMO weather code → FA icon class ──────────────────────────────────────
  function wmoIcon(code) {
    if (code === 0)                     return 'fa-sun';
    if (code <= 3)                      return 'fa-cloud-sun';
    if (code <= 48)                     return 'fa-smog';
    if (code <= 57)                     return 'fa-cloud-drizzle';
    if (code <= 67)                     return 'fa-cloud-rain';
    if (code <= 77)                     return 'fa-snowflake';
    if (code <= 82)                     return 'fa-cloud-showers-heavy';
    if (code <= 86)                     return 'fa-snowflake';
    if (code <= 99)                     return 'fa-bolt';
    return 'fa-cloud';
  }

  // ── Fetch IP location then weather ─────────────────────────────────────────
  // ipapi.co is free and HTTPS-native (ip-api.com free tier is HTTP-only and
  // gets blocked as mixed-content on HTTPS pages like GitHub Pages).
  fetch('https://ipapi.co/json/')
    .then(r => r.json())
    .then(geo => {
      if (geo.error) return;

      // Update location display
      const locEl = document.getElementById('navLocationVal');
      if (locEl) locEl.textContent = `${geo.city}, ${geo.country_code}`;

      // Fetch weather from Open-Meteo (no key required)
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current_weather=true&temperature_unit=celsius`;
      return fetch(url);
    })
    .then(r => r && r.json())
    .then(wx => {
      if (!wx || !wx.current_weather) return;
      const { temperature, weathercode } = wx.current_weather;
      const iconEl = document.getElementById('navWeatherIcon');
      const valEl  = document.getElementById('navWeatherVal');
      const icon   = wmoIcon(weathercode);
      if (iconEl) { iconEl.className = `fa-solid ${icon}`; }
      if (valEl)  { valEl.textContent = `${Math.round(temperature)}°C`; }
    })
    .catch(() => {
      // Silently fail — widget shows placeholders
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