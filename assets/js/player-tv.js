function getTvIdFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get("id");
}

function getTvSeasonFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get("season") || "1";
}

function getTvEpisodeFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get("episode") || "1";
}

function openActor(personId) {
  window.location.href = `actor.html?id=${encodeURIComponent(personId)}`;
}

const TV_SOURCES = {
  vidking: (id, season, episode) =>
    `https://www.vidking.net/embed/tv/${encodeURIComponent(id)}/${encodeURIComponent(season)}/${encodeURIComponent(episode)}?color=e50914&autoPlay=true&nextEpisode=true&episodeSelector=true`,
  videasy: (id, season, episode) =>
    `https://player.videasy.net/tv/${encodeURIComponent(id)}/${encodeURIComponent(season)}/${encodeURIComponent(episode)}`,
  vidfast: (id, season, episode) =>
    `https://vidfast.pro/embed/tv/${encodeURIComponent(id)}/${encodeURIComponent(season)}/${encodeURIComponent(episode)}`,
  vidify: (id, season, episode) =>
    `https://vidify.top/embed/tv/${encodeURIComponent(id)}/${encodeURIComponent(season)}/${encodeURIComponent(episode)}`,
};

let currentTvSource = "vidking";
let currentTvId = null;
let currentTvSeason = "1";
let currentTvEpisode = "1";

function setTvSource(source) {
  if (!TV_SOURCES[source] || !currentTvId) return;
  currentTvSource = source;
  const frame = document.getElementById("tvFrame");
  if (frame) frame.src = TV_SOURCES[source](currentTvId, currentTvSeason, currentTvEpisode);

  document.querySelectorAll("#tvSourceSwitcher .source-btn").forEach(btn => {
    btn.classList.toggle("source-btn--active", btn.dataset.source === source);
  });
}

async function loadTvShow() {
  const tvId = getTvIdFromUrl() || "119051";
  const season = getTvSeasonFromUrl();
  const episode = getTvEpisodeFromUrl();

  currentTvId = tvId;
  currentTvSeason = season;
  currentTvEpisode = episode;

  // Load default source
  document.getElementById("tvFrame").src = TV_SOURCES[currentTvSource](tvId, season, episode);

  // Wire up source switcher
  document.querySelectorAll("#tvSourceSwitcher .source-btn").forEach(btn => {
    btn.addEventListener("click", () => setTvSource(btn.dataset.source));
  });

  try {
    const url = `${TMDB_BASE}/tv/${encodeURIComponent(tvId)}?api_key=${TMDB_API_KEY}&language=en-US`;
    const creditsUrl = `${TMDB_BASE}/tv/${encodeURIComponent(tvId)}/credits?api_key=${TMDB_API_KEY}&language=en-US`;

    const [data, credits] = await Promise.all([fetchJson(url), fetchJson(creditsUrl)]);

    const name = data.name || "Untitled";
    const year = data.first_air_date ? data.first_air_date.slice(0, 4) : "";
    const rating = data.vote_average ? data.vote_average.toFixed(1) : "";
    const lang = data.original_language ? data.original_language.toUpperCase() : "";
    const status = data.status || "";
    const seasons = data.number_of_seasons != null ? data.number_of_seasons : "";
    const episodes = data.number_of_episodes != null ? data.number_of_episodes : "";
    const network = (data.networks || []).map((n) => n.name).slice(0, 2).join(", ");

    document.getElementById("tvTitle").textContent = name;

    // Track in watch history
    historyAdd({
      id: Number(tvId),
      type: "tv",
      title: name,
      posterPath: data.poster_path || null,
      backdropPath: data.backdrop_path || null,
      overview: data.overview || "",
      year
    });

    // Watchlist button
    const watchlistBtnContainer = document.getElementById('tvWatchlistBtnContainer');
    if (watchlistBtnContainer) {
      const wlBtn = document.createElement('button');
      wlBtn.className = 'player-wl-btn' + (watchlistHas(Number(tvId), 'tv') ? ' player-wl-btn--active' : '');
      wlBtn.innerHTML = watchlistHas(Number(tvId), 'tv')
        ? '<i class="fa-solid fa-check"></i> In My List'
        : '<i class="fa-solid fa-plus"></i> My List';
      wlBtn.addEventListener('click', () => {
        if (watchlistHas(Number(tvId), 'tv')) {
          watchlistRemove(Number(tvId), 'tv');
          wlBtn.classList.remove('player-wl-btn--active');
          wlBtn.innerHTML = '<i class="fa-solid fa-plus"></i> My List';
          showToast('Removed from My List', true);
        } else {
          watchlistAdd({ id: Number(tvId), type: 'tv', title: name, posterPath: data.poster_path || null, year });
          wlBtn.classList.add('player-wl-btn--active');
          wlBtn.innerHTML = '<i class="fa-solid fa-check"></i> In My List';
          showToast('<i class="fa-solid fa-check"></i> Added to My List');
        }
      });
      watchlistBtnContainer.appendChild(wlBtn);

      // Download button
      watchlistBtnContainer.appendChild(
        createDownloadBtn(`https://dl.vidsrc.vip/tv/${encodeURIComponent(tvId)}/${encodeURIComponent(season)}/${encodeURIComponent(episode)}`)
      );
    }

    // Tagline: use network name if available
    const taglineEl = document.getElementById("tvTagline");
    if (network) taglineEl.textContent = `\uD83D\uDCFA\u00A0${network}`;
    if (network) taglineEl.setAttribute("aria-label", `Network: ${network}`);

    // Meta (year, seasons count, language)
    const seasonsLabel = seasons ? `${seasons} Season${seasons > 1 ? "s" : ""}` : "";
    document.getElementById("tvMeta").textContent =
      [year, seasonsLabel, lang].filter(Boolean).join(" \u2022 ");

    // Rating badge
    const ratingEl = document.getElementById("tvRating");
    if (rating) {
      ratingEl.textContent = `\u2B50 ${rating} / 10`;
      ratingEl.style.display = "";
    }

    // Backdrop
    const backdropEl = document.getElementById("playerBackdrop");
    if (data.backdrop_path) {
      backdropEl.style.backgroundImage = `url(${buildBackdropUrl(data.backdrop_path)})`;
    }

    // Logo overlay
    try {
      const imagesUrl = `${TMDB_BASE}/tv/${encodeURIComponent(tvId)}/images?api_key=${TMDB_API_KEY}&include_image_language=en,null`;
      const imagesData = await fetchJson(imagesUrl);
      const logos = (imagesData.logos || []).filter(l => l.file_path);
      if (logos.length) {
        const logoEl = document.getElementById('playerLogo');
        if (logoEl) {
          logoEl.src = buildImageUrl(logos[0].file_path);
          logoEl.alt = (data.name || '') + ' logo';
          logoEl.style.display = '';
        }
      }
    } catch (_) {}

    const tagContainer = document.getElementById("tvTags");
    tagContainer.innerHTML = "";
    (data.genres || []).forEach((g) => {
      const span = document.createElement("span");
      span.className = "tag-chip";
      span.textContent = g.name;
      tagContainer.appendChild(span);
    });

    document.getElementById("tvOverview").textContent =
      data.overview || "No overview available.";

    const posterImg = document.getElementById("posterImg");
    if (data.poster_path) posterImg.src = TMDB_IMG_BASE + data.poster_path;
    else posterImg.src = "https://via.placeholder.com/300x450?text=No+Image";
    posterImg.alt = name + " poster";

    // Stats grid
    const statsGrid = document.getElementById("tvStatsGrid");
    statsGrid.innerHTML = "";
    const stats = [
      { label: "Year", value: year || "\u2014" },
      { label: "Seasons", value: seasons !== "" ? String(seasons) : "\u2014" },
      { label: "Episodes", value: episodes !== "" ? String(episodes) : "\u2014" },
      { label: "Rating", value: rating ? `\u2B50 ${rating}` : "\u2014" },
      { label: "Language", value: lang || "\u2014" },
      { label: "Status", value: status || "\u2014" },
    ];
    stats.forEach((s) => {
      const item = document.createElement("div");
      item.className = "stat-item";
      item.innerHTML = `<div class="stat-label">${s.label}</div><div class="stat-value" title="${s.value}">${s.value}</div>`;
      statsGrid.appendChild(item);
    });

    // Crew row (creators + networks)
    const crewRow = document.getElementById("crewRow");
    crewRow.innerHTML = "";
    const creators = (data.created_by || []).slice(0, 2);
    const networks = (data.networks || []).slice(0, 2);
    const crewEntries = [
      ...creators.map((c) => ({ role: "Creator", name: c.name })),
      ...networks.map((n) => ({ role: "Network", name: n.name })),
    ];
    if (crewEntries.length) {
      crewRow.style.display = "";
      crewEntries.forEach(({ role, name: crewName }) => {
        const div = document.createElement("div");
        div.className = "crew-item";
        div.innerHTML = `<span class="crew-role">${role}</span><span class="crew-name">${crewName}</span>`;
        crewRow.appendChild(div);
      });
    }

    const castList = (credits.cast || []).slice(0, 12);
    const castContainer = document.getElementById("castList");
    castContainer.innerHTML = "";
    if (castList.length) {
      document.getElementById("castSection").style.display = "";
      for (const c of castList) {
        const item = document.createElement("div");
        item.className = "cast-item";

        const img = document.createElement("img");
        if (c.profile_path) img.src = "https://image.tmdb.org/t/p/w185" + c.profile_path;
        else img.src = "https://via.placeholder.com/185x185?text=No+Photo";
        img.alt = c.name || "Actor";

        const nameEl = document.createElement("div");
        nameEl.className = "cast-name";
        nameEl.textContent = c.name;

        const char = document.createElement("div");
        char.className = "cast-character";
        char.textContent = c.character || "";

        item.appendChild(img);
        item.appendChild(nameEl);
        item.appendChild(char);

        item.addEventListener("click", () => {
          if (c.id) openActor(c.id);
        });

        castContainer.appendChild(item);
      }
    } else {
      document.getElementById("castSection").style.display = "none";
    }

    // Recommendations
    try {
      const recUrl = `${TMDB_BASE}/tv/${encodeURIComponent(tvId)}/recommendations?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
      const simUrl = `${TMDB_BASE}/tv/${encodeURIComponent(tvId)}/similar?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
      const [recData, simData] = await Promise.all([fetchJson(recUrl), fetchJson(simUrl)]);
      const seen = new Set();
      const recItems = [];
      for (const item of [...(recData.results || []), ...(simData.results || [])]) {
        if (!seen.has(item.id) && item.media_type !== "person" && (item.poster_path || item.backdrop_path)) {
          seen.add(item.id);
          recItems.push(item);
          if (recItems.length >= 16) break;
        }
      }
      const recSection = document.getElementById("tvRecommendationsSection");
      const recGrid = document.getElementById("tvRecommendations");
      if (recSection && recGrid) {
        recSection.style.display = "";
        if (recItems.length) {
          recItems.forEach((item) => {
            const itemType = item.media_type === "tv" ? "tv" : "movie";
            recGrid.appendChild(createMediaCard(item, itemType));
          });
        } else {
          const msg = document.createElement("p");
          msg.className = "empty-state";
          msg.textContent = "No match found.";
          recGrid.appendChild(msg);
        }
      }
    } catch (_) {}

    // Episode selector
    const seasonList = (data.seasons || []).filter(s => s.season_number > 0);
    if (seasonList.length) {
      buildEpisodeSelector(tvId, seasonList, Number(season), Number(episode));
    }
  } catch (err) {
    console.error(err);
    document.getElementById("tvTitle").textContent = "Failed to load TV details.";
  }
}

function buildEpisodeSelector(tvId, seasonList, activeSeason, activeEpisode) {
  const container = document.getElementById("episodeSelector");
  if (!container) return;

  container.innerHTML = "";
  container.style.display = "";

  // Header
  const header = document.createElement("div");
  header.className = "ep-selector-header";
  header.innerHTML = '<i class="fa-solid fa-list"></i> Episodes';
  container.appendChild(header);

  // Season tabs
  const tabsRow = document.createElement("div");
  tabsRow.className = "season-tabs";
  seasonList.forEach(s => {
    const btn = document.createElement("button");
    btn.className = "season-tab" + (s.season_number === activeSeason ? " season-tab--active" : "");
    btn.textContent = s.name || `Season ${s.season_number}`;
    btn.dataset.season = s.season_number;
    btn.addEventListener("click", () => {
      container.querySelectorAll(".season-tab").forEach(t => t.classList.remove("season-tab--active"));
      btn.classList.add("season-tab--active");
      loadEpisodes(tvId, s.season_number, activeSeason === s.season_number ? activeEpisode : -1, epList);
    });
    tabsRow.appendChild(btn);
  });
  container.appendChild(tabsRow);

  // Episode list container
  const epList = document.createElement("div");
  epList.className = "ep-list";
  container.appendChild(epList);

  loadEpisodes(tvId, activeSeason, activeEpisode, epList);
}

async function loadEpisodes(tvId, seasonNum, activeEpisode, epList) {
  epList.innerHTML = `<div class="ep-loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading episodes…</div>`;
  try {
    const url = `${TMDB_BASE}/tv/${encodeURIComponent(tvId)}/season/${encodeURIComponent(seasonNum)}?api_key=${TMDB_API_KEY}&language=en-US`;
    const seasonData = await fetchJson(url);
    const episodesData = seasonData.episodes || [];

    epList.innerHTML = "";
    if (!episodesData.length) {
      epList.innerHTML = `<div class="ep-loading">No episodes available.</div>`;
      return;
    }

    episodesData.forEach(ep => {
      const card = document.createElement("div");
      card.className = "ep-card" + (ep.episode_number === activeEpisode ? " ep-card--active" : "");

      const still = document.createElement("img");
      still.className = "ep-still";
      still.alt = ep.name || `Episode ${ep.episode_number}`;
      if (ep.still_path) {
        still.src = `https://image.tmdb.org/t/p/w300${ep.still_path}`;
      } else {
        still.src = "https://via.placeholder.com/300x169?text=No+Image";
      }
      still.loading = "lazy";

      const info = document.createElement("div");
      info.className = "ep-info";

      const numEl = document.createElement("div");
      numEl.className = "ep-num";
      numEl.textContent = `S${String(seasonNum).padStart(2, "0")} E${String(ep.episode_number).padStart(2, "0")}`;

      const titleEl = document.createElement("div");
      titleEl.className = "ep-title";
      titleEl.textContent = ep.name || `Episode ${ep.episode_number}`;

      const dateEl = document.createElement("div");
      dateEl.className = "ep-date";
      dateEl.textContent = ep.air_date || "";

      const overviewEl = document.createElement("div");
      overviewEl.className = "ep-overview";
      overviewEl.textContent = ep.overview || "";

      info.appendChild(numEl);
      info.appendChild(titleEl);
      if (ep.air_date) info.appendChild(dateEl);
      if (ep.overview) info.appendChild(overviewEl);

      card.appendChild(still);
      card.appendChild(info);

      card.addEventListener("click", () => {
        // Update active state
        epList.querySelectorAll(".ep-card").forEach(c => c.classList.remove("ep-card--active"));
        card.classList.add("ep-card--active");

        // Track current episode for source switching
        currentTvSeason = String(seasonNum);
        currentTvEpisode = String(ep.episode_number);

        // Update iframe using active source
        const frameEl = document.getElementById("tvFrame");
        if (frameEl) {
          frameEl.src = TV_SOURCES[currentTvSource](tvId, seasonNum, ep.episode_number);
        }

        // Update download button
        const dlBtn = document.querySelector(".player-dl-btn");
        if (dlBtn) {
          dlBtn.href = `https://dl.vidsrc.vip/tv/${encodeURIComponent(tvId)}/${encodeURIComponent(seasonNum)}/${encodeURIComponent(ep.episode_number)}`;
        }

        // Scroll card into view
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });

      epList.appendChild(card);
    });

    // Scroll active episode into view (delay allows the DOM to finish rendering)
    const activeCard = epList.querySelector(".ep-card--active");
    if (activeCard) {
      setTimeout(() => activeCard.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
    }
  } catch (err) {
    console.error(err);
    epList.innerHTML = `<div class="ep-loading">Failed to load episodes.</div>`;
  }
}

document.addEventListener("DOMContentLoaded", loadTvShow);