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

  // ── OpenWeatherMap condition ID → FA icon class ───────────────────────────
  function owmIcon(id) {
    if (id >= 200 && id < 300) return 'fa-bolt';               // Thunderstorm
    if (id >= 300 && id < 400) return 'fa-cloud-drizzle';      // Drizzle
    if (id >= 500 && id < 600) return 'fa-cloud-rain';         // Rain
    if (id >= 600 && id < 700) return 'fa-snowflake';          // Snow
    if (id >= 700 && id < 800) return 'fa-smog';               // Atmosphere
    if (id === 800)             return 'fa-sun';                // Clear
    if (id === 801 || id === 802) return 'fa-cloud-sun';        // Few/scattered clouds
    return 'fa-cloud';                                          // Broken/overcast
  }

  // ── Weather: fetch + display ────────────────────────────────────────────────
  // Try One Call 3.0 first (requires subscription on OWM dashboard even for
  // free tier); automatically fall back to the always-available 2.5/weather.
  const OWM_KEY = '9407335bebaf281d340fcab86365439f';

  function applyWeather(lat, lon, city, cc) {
    if (city) {
      const locEl = document.getElementById('navLocationVal');
      if (locEl) locEl.textContent = cc ? `${city}, ${cc}` : city;
    }
    const url3  = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily,alerts&appid=${OWM_KEY}&units=metric`;
    const url25 = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`;
    fetch(url3)
      .then(r => r.ok ? r.json() : null)
      .then(wx => {
        // One Call 3.0 succeeded
        if (wx && wx.current) return wx.current;
        // Not subscribed or unavailable — fall back to Current Weather 2.5
        return fetch(url25)
          .then(r => r.ok ? r.json() : null)
          .then(wx2 => {
            if (!wx2 || !wx2.main) return null;
            return { temp: wx2.main.temp, weather: wx2.weather };
          });
      })
      .then(current => {
        if (!current) return;
        const temp = current.temp;
        const id   = current.weather && current.weather[0] && current.weather[0].id;
        const iconEl = document.getElementById('navWeatherIcon');
        const valEl  = document.getElementById('navWeatherVal');
        if (iconEl && id)       { iconEl.className = `fa-solid ${owmIcon(id)}`; }
        if (valEl && temp != null) { valEl.textContent = `${Math.round(temp)}°C`; }
      })
      .catch(() => {});
  }

  // Geo: browser geolocation (no rate limits) with ipapi.co as fallback
  // ipapi.co is HTTPS-native (ip-api.com free tier is HTTP-only, blocked on
  // GitHub Pages).
  function geoFallback() {
    fetch('https://ipapi.co/json/')
      .then(r => r.ok ? r.json() : null)
      .then(geo => {
        if (!geo || geo.error || geo.latitude == null) return;
        applyWeather(geo.latitude, geo.longitude, geo.city, geo.country_code);
      })
      .catch(() => {});
  }

  // Reverse-geocode lat/lon → city name using OWM Geocoding API (free tier)
  function resolveCity(lat, lon) {
    const geoUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OWM_KEY}`;
    return fetch(geoUrl)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data[0]) {
          return { city: data[0].name, cc: data[0].country };
        }
        return { city: null, cc: null };
      })
      .catch(() => ({ city: null, cc: null }));
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        resolveCity(lat, lon).then(({ city, cc }) => applyWeather(lat, lon, city, cc));
      },
      geoFallback,
      { timeout: 5000, maximumAge: 600000 }
    );
  } else {
    geoFallback();
  }
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