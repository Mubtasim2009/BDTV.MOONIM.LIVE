// Shared TMDB config
const TMDB_API_KEY = "b14194d00ce48c36318eefa745bcdeec";
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w300";
const TMDB_IMG_BACKDROP = "https://image.tmdb.org/t/p/w780";

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

  a.appendChild(img);
  a.appendChild(overlay);
  a.appendChild(plotOverlay);

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
  const onScroll = () => {
    if (window.scrollY > 10) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
})();