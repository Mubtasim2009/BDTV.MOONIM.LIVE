function getMovieIdFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get("id");
}

function openActor(personId) {
  window.location.href = `actor.html?id=${encodeURIComponent(personId)}`;
}

const WRITING_JOBS = ["Screenplay", "Writer", "Story"];

async function loadMovie() {
  const id = getMovieIdFromUrl();
  if (!id) {
    document.getElementById("movieTitle").textContent = "Missing movie ID.";
    return;
  }

  // VidKing embed (movie)
  const params = new URLSearchParams({
    color: "e50914",
    autoPlay: "true",
    nextEpisode: "false",
  });
  document.getElementById("movieFrame").src =
    `https://www.vidking.net/embed/movie/${encodeURIComponent(id)}?${params.toString()}`;

  if (!TMDB_API_KEY) {
    document.getElementById("movieTitle").textContent = "Movie Player";
    return;
  }

  try {
    const movieUrl = `${TMDB_BASE}/movie/${encodeURIComponent(id)}?api_key=${TMDB_API_KEY}&language=en-US`;
    const creditsUrl = `${TMDB_BASE}/movie/${encodeURIComponent(id)}/credits?api_key=${TMDB_API_KEY}&language=en-US`;

    const [data, credits] = await Promise.all([fetchJson(movieUrl), fetchJson(creditsUrl)]);

    const title = data.title || "Untitled";
    const year = data.release_date ? data.release_date.slice(0, 4) : "";
    const runtime = data.runtime ? `${data.runtime} min` : "";
    const rating = data.vote_average ? data.vote_average.toFixed(1) : "";
    const lang = data.original_language ? data.original_language.toUpperCase() : "";
    const status = data.status || "";

    document.getElementById("movieTitle").textContent = title;

    // Tagline
    const taglineEl = document.getElementById("movieTagline");
    if (data.tagline) taglineEl.textContent = `"${data.tagline}"`;

    // Meta (year, runtime, language)
    document.getElementById("movieMeta").textContent =
      [year, runtime, lang].filter(Boolean).join(" \u2022 ");

    // Rating badge
    const ratingEl = document.getElementById("movieRating");
    if (rating) {
      ratingEl.textContent = `\u2B50 ${rating} / 10`;
      ratingEl.style.display = "";
    }

    // Backdrop
    const backdropEl = document.getElementById("playerBackdrop");
    if (data.backdrop_path) {
      backdropEl.style.backgroundImage = `url(${buildBackdropUrl(data.backdrop_path)})`;
    }

    const tagContainer = document.getElementById("movieTags");
    tagContainer.innerHTML = "";
    (data.genres || []).forEach((g) => {
      const span = document.createElement("span");
      span.className = "tag-chip";
      span.textContent = g.name;
      tagContainer.appendChild(span);
    });

    document.getElementById("movieOverview").textContent =
      data.overview || "No overview available.";

    const posterImg = document.getElementById("posterImg");
    if (data.poster_path) posterImg.src = TMDB_IMG_BASE + data.poster_path;
    else posterImg.src = "https://via.placeholder.com/300x450?text=No+Image";
    posterImg.alt = title + " poster";

    // Stats grid
    const statsGrid = document.getElementById("movieStatsGrid");
    statsGrid.innerHTML = "";
    const stats = [
      { label: "Year", value: year || "\u2014" },
      { label: "Runtime", value: runtime || "\u2014" },
      { label: "Rating", value: rating ? `\u2B50 ${rating}` : "\u2014" },
      { label: "Language", value: lang || "\u2014" },
      { label: "Status", value: status || "\u2014" },
      { label: "Votes", value: data.vote_count ? data.vote_count.toLocaleString() : "\u2014" },
    ];
    stats.forEach((s) => {
      const item = document.createElement("div");
      item.className = "stat-item";
      item.innerHTML = `<div class="stat-label">${s.label}</div><div class="stat-value" title="${s.value}">${s.value}</div>`;
      statsGrid.appendChild(item);
    });

    // Crew row (directors + writers)
    const crewRow = document.getElementById("crewRow");
    crewRow.innerHTML = "";
    const directors = (credits.crew || []).filter((c) => c.job === "Director").slice(0, 2);
    const writers = (credits.crew || [])
      .filter((c) => c.department === "Writing" && WRITING_JOBS.includes(c.job))
      .slice(0, 2);
    const crewEntries = [
      ...directors.map((d) => ({ role: "Director", name: d.name })),
      ...writers.map((w) => ({ role: "Writer", name: w.name })),
    ];
    if (crewEntries.length) {
      crewRow.style.display = "";
      crewEntries.forEach(({ role, name }) => {
        const div = document.createElement("div");
        div.className = "crew-item";
        div.innerHTML = `<span class="crew-role">${role}</span><span class="crew-name">${name}</span>`;
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

        const name = document.createElement("div");
        name.className = "cast-name";
        name.textContent = c.name;

        const char = document.createElement("div");
        char.className = "cast-character";
        char.textContent = c.character || "";

        item.appendChild(img);
        item.appendChild(name);
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
    document.getElementById("movieTitle").textContent = "Failed to load movie details.";
  }
}

document.addEventListener("DOMContentLoaded", loadMovie);