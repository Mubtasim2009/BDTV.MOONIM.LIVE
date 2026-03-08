// ─── Hero Carousel ──────────────────────────────────────────────────────────

const CAROUSEL_COUNT = 5;
const CAROUSEL_INTERVAL = 7000; // ms between auto-advance

let carouselItems = [];    // { item, type, logoPath }
let carouselIndex = 0;
let carouselTimer = null;

async function initHeroCarousel() {
  const carousel = document.getElementById("heroCarousel");
  if (carousel) carousel.classList.add("hero-carousel--loading");

  try {
    // Fetch top trending movies and TV combined (interleaved: movie, tv, movie, tv, movie)
    const [moviesData, tvData] = await Promise.all([
      fetchJson(`${TMDB_BASE}/trending/movie/day?api_key=${TMDB_API_KEY}`),
      fetchJson(`${TMDB_BASE}/trending/tv/day?api_key=${TMDB_API_KEY}`)
    ]);

    const movies = (moviesData.results || []).slice(0, 3);
    const tvShows = (tvData.results || []).slice(0, 2);

    // Interleave: m, tv, m, tv, m
    const mixed = [];
    const maxLen = Math.max(movies.length, tvShows.length);
    for (let i = 0; i < maxLen; i++) {
      if (movies[i]) mixed.push({ item: movies[i], type: "movie" });
      if (tvShows[i]) mixed.push({ item: tvShows[i], type: "tv" });
    }
    const picks = mixed.slice(0, CAROUSEL_COUNT);

    // Fetch logo images for each item
    carouselItems = await Promise.all(picks.map(async ({ item, type }) => {
      let logoPath = null;
      try {
        const imgData = await fetchJson(
          `${TMDB_BASE}/${type === "tv" ? "tv" : "movie"}/${item.id}/images?api_key=${TMDB_API_KEY}`
        );
        const logos = (imgData.logos || []).filter(l => l.iso_639_1 === "en" || l.iso_639_1 === null);
        if (logos.length) logoPath = logos[0].file_path;
      } catch (_) { /* logo fetch is best-effort; fall back to text title */ }
      return { item, type, logoPath };
    }));

    if (carousel) carousel.classList.remove("hero-carousel--loading");
    buildCarousel();
    startCarouselTimer();
  } catch (err) {
    console.error("Hero carousel failed:", err);
    // Hide carousel gracefully
    const el = document.getElementById("heroCarousel");
    if (el) el.style.display = "none";
  }
}

function buildCarousel() {
  const track = document.getElementById("heroCarouselTrack");
  const dotsWrap = document.getElementById("heroCarouselDots");
  if (!track || !dotsWrap) return;

  track.innerHTML = "";
  dotsWrap.innerHTML = "";

  carouselItems.forEach((entry, i) => {
    // Slide backdrop
    const slide = document.createElement("div");
    slide.className = "hero-carousel-slide" + (i === 0 ? " active" : "");
    if (entry.item.backdrop_path) {
      slide.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${entry.item.backdrop_path})`;
    }
    track.appendChild(slide);

    // Dot
    const dot = document.createElement("button");
    dot.className = "hero-carousel-dot" + (i === 0 ? " active" : "");
    dot.setAttribute("aria-label", `Slide ${i + 1}`);
    dot.addEventListener("click", () => goToSlide(i));
    dotsWrap.appendChild(dot);
  });

  renderCarouselInfo(0);

  // Arrow buttons
  const prev = document.getElementById("heroCarouselPrev");
  const next = document.getElementById("heroCarouselNext");
  if (prev) prev.addEventListener("click", () => goToSlide((carouselIndex - 1 + carouselItems.length) % carouselItems.length));
  if (next) next.addEventListener("click", () => goToSlide((carouselIndex + 1) % carouselItems.length));

  // Pause on hover
  const carousel = document.getElementById("heroCarousel");
  if (carousel) {
    carousel.addEventListener("mouseenter", stopCarouselTimer);
    carousel.addEventListener("mouseleave", startCarouselTimer);
    carousel.addEventListener("focusin", stopCarouselTimer);
    carousel.addEventListener("focusout", startCarouselTimer);
  }
}

function goToSlide(index) {
  const slides = document.querySelectorAll(".hero-carousel-slide");
  const dots = document.querySelectorAll(".hero-carousel-dot");

  if (slides[carouselIndex]) slides[carouselIndex].classList.remove("active");
  if (dots[carouselIndex]) dots[carouselIndex].classList.remove("active");

  carouselIndex = index;

  if (slides[carouselIndex]) slides[carouselIndex].classList.add("active");
  if (dots[carouselIndex]) dots[carouselIndex].classList.add("active");

  renderCarouselInfo(carouselIndex);
  resetCarouselTimer();
}

function renderCarouselInfo(index) {
  const entry = carouselItems[index];
  if (!entry) return;

  const { item, type, logoPath } = entry;
  const title = item.title || item.name || "Untitled";
  const plot = item.overview || "";
  const linkTarget = type === "tv" ? "player-tv.html" : "player-movie.html";
  const href = `${linkTarget}?id=${encodeURIComponent(item.id)}`;

  const logoWrap = document.getElementById("heroCarouselLogoWrap");
  const plotEl = document.getElementById("heroCarouselPlot");
  const watchBtn = document.getElementById("heroWatchBtn");

  if (logoWrap) {
    logoWrap.innerHTML = "";
    if (logoPath) {
      const img = document.createElement("img");
      img.src = `https://image.tmdb.org/t/p/w500${logoPath}`;
      img.alt = title;
      img.className = "hero-carousel-logo";
      logoWrap.appendChild(img);
    } else {
      const h = document.createElement("h2");
      h.className = "hero-carousel-title";
      h.textContent = title;
      logoWrap.appendChild(h);
    }
  }

  if (plotEl) plotEl.textContent = plot;
  if (watchBtn) watchBtn.href = href;

  // Trigger re-animation
  const info = document.getElementById("heroCarouselInfo");
  if (info) {
    info.style.animation = "none";
    // Force reflow
    void info.offsetWidth;
    info.style.animation = "";
  }
}

function startCarouselTimer() {
  stopCarouselTimer();
  carouselTimer = setInterval(() => {
    goToSlide((carouselIndex + 1) % carouselItems.length);
  }, CAROUSEL_INTERVAL);
}

function stopCarouselTimer() {
  if (carouselTimer) { clearInterval(carouselTimer); carouselTimer = null; }
}

function resetCarouselTimer() {
  if (carouselTimer) startCarouselTimer();
}

// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Init hero carousel
  initHeroCarousel();
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