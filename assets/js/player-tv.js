function getTvIdFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get("id");
}

function openActor(personId) {
  window.location.href = `actor.html?id=${encodeURIComponent(personId)}`;
}

async function loadTvShow() {
  const tvId = getTvIdFromUrl() || "119051";

  const params = new URLSearchParams({
    color: "e50914",
    autoPlay: "true",
    nextEpisode: "true",
    episodeSelector: "true",
  });
  document.getElementById("tvFrame").src =
    `https://www.vidking.net/embed/tv/${encodeURIComponent(tvId)}/1/1?${params.toString()}`;

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
  } catch (err) {
    console.error(err);
    document.getElementById("tvTitle").textContent = "Failed to load TV details.";
  }
}

document.addEventListener("DOMContentLoaded", loadTvShow);