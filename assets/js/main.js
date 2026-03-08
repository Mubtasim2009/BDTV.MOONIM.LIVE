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
  a.dataset.id = item.id;
  a.dataset.type = type;
  a.dataset.title = title;
  a.dataset.overview = overview;
  a.dataset.year = year;
  a.dataset.rating = rating;
  a.dataset.backdrop = item.backdrop_path || item.poster_path || "";

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
  a.dataset.id = item.id;
  a.dataset.type = type;
  a.dataset.title = title;
  a.dataset.overview = overview;
  a.dataset.year = year;
  a.dataset.rating = rating;
  a.dataset.backdrop = item.backdrop_path || item.poster_path || "";

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

// ===========================
// Card Preview Popup
// ===========================
(function () {
  // Skip on touch/mobile devices
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const popup = document.createElement('div');
  popup.className = 'card-preview-popup';
  popup.innerHTML =
    '<img class="card-preview-backdrop" src="" alt="" />' +
    '<div class="card-preview-body">' +
      '<div class="card-preview-title"></div>' +
      '<div class="card-preview-meta"></div>' +
      '<div class="card-preview-overview"></div>' +
      '<a class="card-preview-play" href="#">&#x25B6; Play</a>' +
    '</div>';
  document.body.appendChild(popup);

  let showTimer = null;
  let hideTimer = null;
  let currentCard = null;

  function getCardEl(el) {
    return el.closest('.media-card, .landscape-tile');
  }

  function positionPopup(card) {
    const rect = card.getBoundingClientRect();
    const popupW = 300;
    const popupH = popup.offsetHeight || 320;
    const margin = 8;

    let left = rect.left + rect.width / 2 - popupW / 2;
    let top = rect.top - popupH - margin;

    // If too close to top, show below
    if (top < margin) {
      top = rect.bottom + margin;
    }

    // Clamp horizontally
    const maxLeft = window.innerWidth - popupW - margin;
    left = Math.max(margin, Math.min(left, maxLeft));

    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
  }

  function showPopup(card) {
    currentCard = card;
    const title = card.dataset.title || '';
    const year = card.dataset.year || '';
    const rating = card.dataset.rating || '';
    const overview = card.dataset.overview || '';
    const type = card.dataset.type || 'movie';
    const id = card.dataset.id || '';
    const backdrop = card.dataset.backdrop || '';

    popup.querySelector('.card-preview-backdrop').src = backdrop ? buildBackdropUrl(backdrop) : '';
    popup.querySelector('.card-preview-backdrop').style.display = backdrop ? '' : 'none';
    popup.querySelector('.card-preview-title').textContent = title;

    const meta = popup.querySelector('.card-preview-meta');
    meta.innerHTML = '';
    if (year) {
      const ySpan = document.createElement('span');
      ySpan.textContent = year;
      meta.appendChild(ySpan);
    }
    if (rating && rating !== '–') {
      const rSpan = document.createElement('span');
      rSpan.textContent = rating + ' ★';
      meta.appendChild(rSpan);
    }
    const typePill = document.createElement('span');
    typePill.className = 'tile-type-pill';
    typePill.textContent = type === 'tv' ? 'TV' : 'MOVIE';
    meta.appendChild(typePill);

    popup.querySelector('.card-preview-overview').textContent = overview;

    const playLink = type === 'tv' ? 'player-tv.html' : 'player-movie.html';
    popup.querySelector('.card-preview-play').href = `${playLink}?id=${encodeURIComponent(id)}`;

    positionPopup(card);
    popup.classList.add('visible');
  }

  function hidePopup() {
    popup.classList.remove('visible');
    currentCard = null;
  }

  document.addEventListener('mouseenter', function (e) {
    const card = getCardEl(e.target);
    if (!card) return;
    clearTimeout(hideTimer);
    clearTimeout(showTimer);
    showTimer = setTimeout(() => showPopup(card), 400);
  }, true);

  document.addEventListener('mouseleave', function (e) {
    const card = getCardEl(e.target);
    if (!card) return;
    clearTimeout(showTimer);
    hideTimer = setTimeout(() => {
      if (!popup.matches(':hover')) hidePopup();
    }, 200);
  }, true);

  popup.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  popup.addEventListener('mouseleave', () => {
    hideTimer = setTimeout(hidePopup, 200);
  });
})();

// ===========================
// Row Scroll Arrows + Drag Scroll
// ===========================
function initRowArrows() {
  const SCROLL_TOLERANCE = 4;
  const SCROLL_PERCENTAGE = 0.8;
  function wrapRow(row) {
    // Already wrapped
    if (row.parentElement && row.parentElement.classList.contains('row-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'row-wrapper';
    row.parentNode.insertBefore(wrapper, row);
    wrapper.appendChild(row);

    const leftBtn = document.createElement('button');
    leftBtn.className = 'row-arrow row-arrow--left hidden';
    leftBtn.setAttribute('aria-label', 'Scroll left');
    leftBtn.textContent = '‹';

    const rightBtn = document.createElement('button');
    rightBtn.className = 'row-arrow row-arrow--right';
    rightBtn.setAttribute('aria-label', 'Scroll right');
    rightBtn.textContent = '›';

    wrapper.insertBefore(leftBtn, row);
    wrapper.appendChild(rightBtn);

    function updateArrows() {
      const atStart = row.scrollLeft <= SCROLL_TOLERANCE;
      const atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - SCROLL_TOLERANCE;
      leftBtn.classList.toggle('hidden', atStart);
      rightBtn.classList.toggle('hidden', atEnd);
    }

    leftBtn.addEventListener('click', () => {
      row.scrollBy({ left: -row.clientWidth * SCROLL_PERCENTAGE, behavior: 'smooth' });
    });

    rightBtn.addEventListener('click', () => {
      row.scrollBy({ left: row.clientWidth * SCROLL_PERCENTAGE, behavior: 'smooth' });
    });

    row.addEventListener('scroll', updateArrows, { passive: true });
    updateArrows();

    // Drag to scroll
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;

    row.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX;
      scrollStart = row.scrollLeft;
      row.style.cursor = 'grabbing';
      row.style.userSelect = 'none';
    });

    row.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const delta = e.pageX - startX;
      row.scrollLeft = scrollStart - delta;
    });

    const stopDrag = () => {
      isDown = false;
      row.style.cursor = '';
      row.style.userSelect = '';
    };
    row.addEventListener('mouseup', stopDrag);
    row.addEventListener('mouseleave', stopDrag);
  }

  // Wrap all existing rows
  document.querySelectorAll('.card-row, .landscape-row').forEach(wrapRow);

  // Watch for new rows added dynamically (async content)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.matches('.card-row, .landscape-row')) {
          wrapRow(node);
        }
        node.querySelectorAll && node.querySelectorAll('.card-row, .landscape-row').forEach(wrapRow);
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

document.addEventListener('DOMContentLoaded', initRowArrows);