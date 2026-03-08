document.addEventListener("DOMContentLoaded", () => {
  // Hero banner with TMDB trending + auto-cycle
  loadHeroBanner();

  // Nav search button → go to search page
  const navSearchBtn = document.getElementById("navSearchBtn");
  if (navSearchBtn) {
    navSearchBtn.addEventListener("click", () => {
      window.location.href = "search.html";
    });
  }

  // 1. Trending Movies Today (landscape + portrait)
  showSkeletons("trendingMoviesLandscape", 5, "landscape");
  showSkeletons("trendingMoviesPortrait", 10, "portrait");
  loadDualSection(
    `${TMDB_BASE}/trending/movie/day?api_key=${TMDB_API_KEY}`,
    "trendingMoviesLandscape",
    "trendingMoviesPortrait",
    "trendingMoviesStatus",
    "movie"
  );

  // 2. Trending TV Today (landscape + portrait)
  showSkeletons("trendingTvLandscape", 5, "landscape");
  showSkeletons("trendingTvPortrait", 10, "portrait");
  loadDualSection(
    `${TMDB_BASE}/trending/tv/day?api_key=${TMDB_API_KEY}`,
    "trendingTvLandscape",
    "trendingTvPortrait",
    "trendingTvStatus",
    "tv"
  );

  // 3. Now Playing (Movies)
  showSkeletons("nowPlayingMovies", 10, "portrait");
  loadPortraitSection(
    `${TMDB_BASE}/movie/now_playing?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
    "nowPlayingMovies",
    "nowPlayingMoviesStatus",
    "movie"
  );

  // 4. Popular TV Shows
  showSkeletons("popularTv", 10, "portrait");
  loadPortraitSection(
    `${TMDB_BASE}/tv/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
    "popularTv",
    "popularTvStatus",
    "tv"
  );

  // 5. Popular Movies
  showSkeletons("popularMovies", 10, "portrait");
  loadPortraitSection(
    `${TMDB_BASE}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
    "popularMovies",
    "popularMoviesStatus",
    "movie"
  );

  // 6. Top Rated Movies
  showSkeletons("topRatedMovies", 10, "portrait");
  loadPortraitSection(
    `${TMDB_BASE}/movie/top_rated?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
    "topRatedMovies",
    "topRatedMoviesStatus",
    "movie"
  );

  // 7. Top Rated TV Shows
  showSkeletons("topRatedTv", 10, "portrait");
  loadPortraitSection(
    `${TMDB_BASE}/tv/top_rated?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
    "topRatedTv",
    "topRatedTvStatus",
    "tv"
  );
});

// ─── Hero Banner ──────────────────────────────────────────────────────────────

let heroCycleTimer = null;
let heroCycleItems = [];
let heroCycleIndex = 0;

async function loadHeroBanner() {
  const hero = document.getElementById("heroBanner");
  if (!hero) return;

  try {
    const data = await fetchJson(`${TMDB_BASE}/trending/all/day?api_key=${TMDB_API_KEY}`);
    const items = (data.results || []).filter(item => item.backdrop_path).slice(0, 5);
    if (!items.length) return;

    heroCycleItems = items;
    heroCycleIndex = 0;
    applyHeroItem(hero, items[0]);

    // Auto-cycle every 8 seconds
    heroCycleTimer = setInterval(() => {
      heroCycleIndex = (heroCycleIndex + 1) % heroCycleItems.length;
      fadeHeroItem(hero, heroCycleItems[heroCycleIndex]);
    }, 8000);
  } catch (err) {
    console.error("Hero banner failed:", err);
  }
}

function applyHeroItem(hero, item) {
  const backdropUrl = `https://image.tmdb.org/t/p/original${item.backdrop_path}`;
  hero.style.backgroundImage = `url('${backdropUrl}')`;

  const type = item.media_type === "tv" ? "SERIES" : "MOVIE";
  const title = item.title || item.name || "Untitled";
  const year =
    (item.release_date && item.release_date.slice(0, 4)) ||
    (item.first_air_date && item.first_air_date.slice(0, 4)) ||
    "";
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;

  const typeLabel = document.getElementById("heroTypeLabel");
  const titleEl = document.getElementById("heroTitle");
  const metaEl = document.getElementById("heroMeta");
  const badge = document.getElementById("heroComingBadge");

  if (typeLabel) typeLabel.textContent = type;
  if (titleEl) titleEl.textContent = title;

  if (metaEl) {
    const parts = [
      type === "SERIES" ? "Show" : "Movie",
      year,
      rating ? `${rating} ★` : null,
    ].filter(Boolean);
    metaEl.innerHTML = parts.map((p, i) =>
      i < parts.length - 1
        ? `<span>${p}</span><span class="hero-meta-dot">·</span>`
        : `<span>${p}</span>`
    ).join("");
  }

  if (badge) {
    badge.style.display = "flex";
  }
}

function fadeHeroItem(hero, item) {
  hero.style.transition = "opacity 0.4s ease";
  hero.style.opacity = "0";
  setTimeout(() => {
    applyHeroItem(hero, item);
    hero.style.opacity = "1";
  }, 400);
}

// ─── Sections ─────────────────────────────────────────────────────────────────

// Combined section: landscape row + portrait row from same data
async function loadDualSection(url, landscapeId, portraitId, statusId, type) {
  const landscape = document.getElementById(landscapeId);
  const portrait = document.getElementById(portraitId);
  const statusEl = document.getElementById(statusId);
  if (!landscape || !portrait || !statusEl) return;

  try {
    const data = await fetchJson(url);
    const items = (data.results || []).slice(0, 20);

    landscape.innerHTML = "";
    portrait.innerHTML = "";

    items.forEach((item, index) => {
      if (index < 6) {
        landscape.appendChild(createLandscapeTile(item, type));
      }
      portrait.appendChild(createMediaCard(item, type));
    });

    statusEl.textContent = "";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Failed to load.";
  }
}

// Portrait-only section
async function loadPortraitSection(url, containerId, statusId, type) {
  const container = document.getElementById(containerId);
  const statusEl = document.getElementById(statusId);
  if (!container || !statusEl) return;

  try {
    const data = await fetchJson(url);
    container.innerHTML = "";
    (data.results || []).slice(0, 20).forEach((item) => {
      container.appendChild(createMediaCard(item, type));
    });
    statusEl.textContent = "";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Failed to load.";
  }
}