function getTvIdFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get("id");
}

function openActor(personId) {
  window.location.href = `actor.html?id=${encodeURIComponent(personId)}`;
}

// ─── Streaming sources ──────────────────────────────────────────────────────
const TV_SOURCES = [
  {
    id: "vidking",
    label: "VidKing",
    hasEpisodeControls: false,
    url: (id, s, e) => {
      const p = new URLSearchParams({ color: "e50914", autoPlay: "true", nextEpisode: "true", episodeSelector: "true" });
      return `https://www.vidking.net/embed/tv/${encodeURIComponent(id)}/${s}/${e}?${p.toString()}`;
    },
  },
  {
    id: "vidsrc",
    label: "VidSrc",
    hasEpisodeControls: true,
    url: (id, s, e) => `https://vidsrc.to/embed/tv/${encodeURIComponent(id)}/${s}/${e}`,
  },
  {
    id: "2embed",
    label: "2Embed",
    hasEpisodeControls: true,
    url: (id, s, e) => `https://www.2embed.cc/embedtv/${encodeURIComponent(id)}?s=${s}&e=${e}`,
  },
  {
    id: "multiembed",
    label: "MultiEmbed",
    hasEpisodeControls: true,
    url: (id, s, e) => `https://multiembed.mov/?video_id=${encodeURIComponent(id)}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    id: "vidlink",
    label: "VidLink",
    hasEpisodeControls: true,
    url: (id, s, e) => `https://vidlink.pro/tv/${encodeURIComponent(id)}/${s}/${e}`,
  },
];

let _tvId = null;
let _activeTvSource = "vidking";

function getCurrentEpisode() {
  const s = parseInt(document.getElementById("tvSeason")?.value, 10) || 1;
  const e = parseInt(document.getElementById("tvEpisode")?.value, 10) || 1;
  return { s, e };
}

function applyTvSource(id, sourceId, s, e) {
  const src = TV_SOURCES.find((x) => x.id === sourceId) || TV_SOURCES[0];
  document.getElementById("tvFrame").src = src.url(id, s, e);

  const episodeControls = document.getElementById("tvEpisodeControls");
  if (episodeControls) {
    episodeControls.style.display = src.hasEpisodeControls ? "" : "none";
  }

  const container = document.getElementById("tvSourceSwitcher");
  if (container) {
    container.querySelectorAll(".source-btn").forEach((b) => {
      b.classList.toggle("source-btn--active", b.dataset.sourceId === sourceId);
    });
  }
}

function buildTvSourceSwitcher(id) {
  const container = document.getElementById("tvSourceSwitcher");
  if (!container) return;
  const label = container.querySelector(".source-switcher-label");
  container.innerHTML = "";
  if (label) container.appendChild(label);

  TV_SOURCES.forEach((src) => {
    const btn = document.createElement("button");
    btn.className = "source-btn" + (src.id === _activeTvSource ? " source-btn--active" : "");
    btn.textContent = src.label;
    btn.dataset.sourceId = src.id;
    btn.addEventListener("click", () => {
      _activeTvSource = src.id;
      const { s, e } = getCurrentEpisode();
      applyTvSource(id, src.id, s, e);
    });
    container.appendChild(btn);
  });

  // Wire up the Go button for episode navigation
  const goBtn = document.getElementById("tvGoEpisode");
  if (goBtn) {
    goBtn.addEventListener("click", () => {
      const { s, e } = getCurrentEpisode();
      applyTvSource(id, _activeTvSource, s, e);
    });
  }
}

async function loadTvShow() {
  const tvId = getTvIdFromUrl() || "119051";
  _tvId = tvId;

  // Default source embed (S1E1)
  applyTvSource(tvId, _activeTvSource, 1, 1);

  // Build source switcher
  buildTvSourceSwitcher(tvId);

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
  } catch (err) {
    console.error(err);
    document.getElementById("tvTitle").textContent = "Failed to load TV details.";
  }
}

document.addEventListener("DOMContentLoaded", loadTvShow);