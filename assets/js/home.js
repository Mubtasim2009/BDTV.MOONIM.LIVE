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