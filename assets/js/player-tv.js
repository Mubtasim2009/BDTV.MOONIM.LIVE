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
    const rating = data.vote_average ? `⭐ ${data.vote_average.toFixed(1)}` : "";

    document.getElementById("tvTitle").textContent = name;
    document.getElementById("tvMeta").textContent =
      [year, rating].filter(Boolean).join(" • ");

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