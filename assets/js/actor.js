function getActorIdFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get("id");
}

document.addEventListener("DOMContentLoaded", async () => {
  const personId = getActorIdFromUrl();
  if (!personId) {
    document.getElementById("actorName").textContent = "Missing actor ID.";
    return;
  }

  const nameEl = document.getElementById("actorName");
  const metaEl = document.getElementById("actorMeta");
  const bioEl = document.getElementById("actorBio");
  const imgEl = document.getElementById("actorImg");
  const knownForGrid = document.getElementById("knownForGrid");
  const knownForStatus = document.getElementById("knownForStatus");

  try {
    const detailUrl = `${TMDB_BASE}/person/${encodeURIComponent(personId)}?api_key=${TMDB_API_KEY}&language=en-US`;
    const creditsUrl = `${TMDB_BASE}/person/${encodeURIComponent(personId)}/combined_credits?api_key=${TMDB_API_KEY}&language=en-US`;

    const [detail, credits] = await Promise.all([fetchJson(detailUrl), fetchJson(creditsUrl)]);

    nameEl.textContent = detail.name || "Unknown Actor";

    const birthday = detail.birthday || "";
    const place = detail.place_of_birth || "";
    const knownFor = detail.known_for_department || "";

    metaEl.textContent = [birthday, place, knownFor].filter(Boolean).join(" • ");

    bioEl.textContent = detail.biography || "No biography available.";

    if (detail.profile_path) {
      imgEl.src = buildImageUrl(detail.profile_path);
    } else {
      imgEl.src = "https://via.placeholder.com/300x450?text=No+Photo";
    }
    imgEl.alt = detail.name || "Actor";

    const allCredits = credits.cast || [];
    const topCredits = allCredits
      .slice()
      .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
      .slice(0, 20);

    knownForGrid.innerHTML = "";
    if (!topCredits.length) {
      knownForStatus.textContent = "No credits.";
      return;
    }

    topCredits.forEach((item) => {
      const type = item.media_type === "tv" ? "tv" : "movie";
      const card = createMediaCard(item, type);
      knownForGrid.appendChild(card);
    });

    knownForStatus.textContent = "";
  } catch (err) {
    console.error(err);
    nameEl.textContent = "Failed to load actor.";
    metaEl.textContent = "";
    bioEl.textContent = "";
    knownForStatus.textContent = "Failed to load.";
  }
});