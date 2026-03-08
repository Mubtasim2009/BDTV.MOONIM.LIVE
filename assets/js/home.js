document.addEventListener("DOMContentLoaded", () => {
  // Hero search suggestions
  const heroInput = document.getElementById("heroSearchInput");
  if (heroInput) {
    const searchTypeConfig = { value: "multi" };
    heroInput.setAttribute("autocomplete", "off");
    heroInput.setAttribute("aria-autocomplete", "list");
    heroInput.setAttribute("aria-controls", "searchSuggestionsDropdown");

    heroInput.addEventListener("input", () => {
      const query = heroInput.value.trim();
      clearTimeout(suggestDebounceTimer);
      if (!query) { closeSuggestions(); return; }
      suggestDebounceTimer = setTimeout(() => {
        fetchSuggestions(query, searchTypeConfig, heroInput);
      }, 220);
    });

    heroInput.addEventListener("keydown", (e) => {
      const dropdown = document.getElementById("searchSuggestionsDropdown");
      if (!dropdown) return;
      const rows = dropdown.querySelectorAll(".suggestion-item");
      if (!rows.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeSuggestionIndex = Math.min(activeSuggestionIndex + 1, rows.length - 1);
        rows.forEach((r, i) => r.classList.toggle("suggestion-item--active", i === activeSuggestionIndex));
        if (rows[activeSuggestionIndex]) heroInput.value = rows[activeSuggestionIndex].querySelector(".suggestion-title").textContent;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeSuggestionIndex = Math.max(activeSuggestionIndex - 1, -1);
        rows.forEach((r, i) => r.classList.toggle("suggestion-item--active", i === activeSuggestionIndex));
      } else if (e.key === "Enter" && activeSuggestionIndex >= 0) {
        e.preventDefault();
        rows[activeSuggestionIndex].click();
      } else if (e.key === "Escape") {
        closeSuggestions();
      }
    });

    heroInput.addEventListener("blur", () => {
      setTimeout(closeSuggestions, 150);
    });
  }

  // Animated hero banner
  loadHeroBanner();

  // 0. Your Next Watch (trending all — landscape only)
  showSkeletons("nextWatchLandscape", 5, "landscape");
  loadNextWatchSection();

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

  // 3. Now Playing in Cinemas (Movies)
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

// ===========================
// Animated Hero Banner
// ===========================
async function loadHeroBanner() {
  const HERO_CYCLE_INTERVAL_MS = 8000;
  const FADE_TRANSITION_DELAY_MS = 400;
  const heroBanner = document.getElementById("heroBanner");
  const heroBg = document.getElementById("heroBg");
  const heroContent = heroBanner ? heroBanner.querySelector(".hero-content") : null;
  const heroTypeLabel = document.getElementById("heroTypeLabel");
  const heroTitle = document.getElementById("heroTitle");
  const heroMeta = document.getElementById("heroMeta");
  const heroPlayBtn = document.getElementById("heroPlayBtn");
  const heroDots = document.getElementById("heroDots");
  const heroPrev = document.getElementById("heroPrev");
  const heroNext = document.getElementById("heroNext");

  if (!heroBanner || !heroBg || !heroContent) return;

  let items = [];
  let currentIndex = 0;
  let cycleTimer = null;

  try {
    const data = await fetchJson(`${TMDB_BASE}/trending/all/day?api_key=${TMDB_API_KEY}`);
    items = (data.results || [])
      .filter((i) => i.backdrop_path)
      .slice(0, 5);
  } catch (_) {
    return;
  }

  if (!items.length) return;

  // Create dot buttons
  items.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "hero-dot" + (i === 0 ? " active" : "");
    dot.setAttribute("aria-label", "Go to slide " + (i + 1));
    dot.addEventListener("click", () => {
      clearCycle();
      showHeroItem(i);
      startCycle();
    });
    heroDots.appendChild(dot);
  });

  function updateDots(index) {
    heroDots.querySelectorAll(".hero-dot").forEach((d, i) => {
      d.classList.toggle("active", i === index);
    });
  }

  function showHeroItem(index) {
    const item = items[index];
    currentIndex = index;

    // Fade out bg
    heroBg.classList.add("fade-out");
    heroContent.classList.add("text-fade");

    setTimeout(() => {
      // Update background
      heroBg.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${item.backdrop_path})`;
      heroBg.classList.remove("fade-out");

      // Update text
      const mediaType = item.media_type === "tv" ? "tv" : "movie";
      const title = item.title || item.name || "Untitled";
      const year =
        (item.release_date && item.release_date.slice(0, 4)) ||
        (item.first_air_date && item.first_air_date.slice(0, 4)) ||
        "";
      const rating = item.vote_average ? item.vote_average.toFixed(1) : "";

      if (heroTypeLabel) heroTypeLabel.textContent = mediaType === "tv" ? "TV Series" : "Movie";
      if (heroTitle) heroTitle.textContent = title;
      if (heroMeta) {
        heroMeta.textContent = [year, rating ? rating + " ★" : ""].filter(Boolean).join("  ·  ");
      }
      if (heroPlayBtn) {
        const playerPage = mediaType === "tv" ? "player-tv.html" : "player-movie.html";
        heroPlayBtn.href = `${playerPage}?id=${encodeURIComponent(item.id)}`;
      }

      updateDots(index);

      // Fade in text
      setTimeout(() => {
        heroContent.classList.remove("text-fade");
      }, 60);
    }, FADE_TRANSITION_DELAY_MS);
  }

  function startCycle() {
    cycleTimer = setInterval(() => {
      showHeroItem((currentIndex + 1) % items.length);
    }, HERO_CYCLE_INTERVAL_MS);
  }

  function clearCycle() {
    if (cycleTimer) clearInterval(cycleTimer);
    cycleTimer = null;
  }

  // Arrow controls
  if (heroPrev) {
    heroPrev.addEventListener("click", () => {
      clearCycle();
      showHeroItem((currentIndex - 1 + items.length) % items.length);
      startCycle();
    });
  }

  if (heroNext) {
    heroNext.addEventListener("click", () => {
      clearCycle();
      showHeroItem((currentIndex + 1) % items.length);
      startCycle();
    });
  }

  // Pause on hover
  heroBanner.addEventListener("mouseenter", clearCycle);
  heroBanner.addEventListener("mouseleave", startCycle);

  // Show first item and start cycle
  showHeroItem(0);
  startCycle();
}

// ===========================
// Your Next Watch section
// ===========================
async function loadNextWatchSection() {
  const container = document.getElementById("nextWatchLandscape");
  const statusEl = document.getElementById("nextWatchStatus");
  if (!container || !statusEl) return;

  try {
    const data = await fetchJson(`${TMDB_BASE}/trending/all/day?api_key=${TMDB_API_KEY}`);
    container.innerHTML = "";
    const items = (data.results || []).filter((i) => i.backdrop_path).slice(0, 8);
    items.forEach((item) => {
      const mediaType = item.media_type === "tv" ? "tv" : "movie";
      container.appendChild(createLandscapeTile(item, mediaType));
    });
    statusEl.textContent = "";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Failed to load.";
  }
}

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