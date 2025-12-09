function getSearchParams() {
  const url = new URL(window.location.href);
  return {
    q: url.searchParams.get("q") || "",
    type: url.searchParams.get("type") || "multi",
  };
}

function updateUrl(q, type) {
  const url = new URL(window.location.href);
  url.searchParams.set("q", q);
  url.searchParams.set("type", type);
  window.history.replaceState({}, "", url.toString());
}

document.addEventListener("DOMContentLoaded", () => {
  const { q, type } = getSearchParams();
  const input = document.getElementById("searchInput");
  const select = document.getElementById("searchType");
  const form = document.getElementById("searchForm");
  const resultsInfo = document.getElementById("resultsInfo");
  const resultsGrid = document.getElementById("resultsGrid");
  const emptyState = document.getElementById("emptyState");
  const errorState = document.getElementById("errorState");

  input.value = q;
  select.value = type;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = input.value.trim();
    const t = select.value;
    updateUrl(query, t);
    if (!query) {
      resultsGrid.innerHTML = "";
      resultsInfo.textContent = "";
      emptyState.textContent = "Type a query above and press Enter.";
      emptyState.style.display = "block";
      errorState.style.display = "none";
      return;
    }
    runSearch(query, t, { resultsGrid, resultsInfo, emptyState, errorState });
  });

  if (q) {
    runSearch(q, type, { resultsGrid, resultsInfo, emptyState, errorState });
  }
});

async function runSearch(query, type, els) {
  const { resultsGrid, resultsInfo, emptyState, errorState } = els;
  emptyState.style.display = "none";
  errorState.style.display = "none";
  resultsInfo.textContent = "Searching…";
  resultsGrid.innerHTML = "";

  let endpoint;
  if (type === "movie") {
    endpoint = `${TMDB_BASE}/search/movie?api_key=${TMDB_API_KEY}&language=en-US&include_adult=false&query=${encodeURIComponent(
      query
    )}`;
  } else if (type === "tv") {
    endpoint = `${TMDB_BASE}/search/tv?api_key=${TMDB_API_KEY}&language=en-US&include_adult=false&query=${encodeURIComponent(
      query
    )}`;
  } else {
    endpoint = `${TMDB_BASE}/search/multi?api_key=${TMDB_API_KEY}&language=en-US&include_adult=false&query=${encodeURIComponent(
      query
    )}`;
  }

  try {
    const data = await fetchJson(endpoint);
    const items = (data.results || []).filter(
      (x) => x.media_type !== "person" && (x.poster_path || x.backdrop_path)
    );
    if (!items.length) {
      resultsInfo.textContent = "No results.";
      emptyState.textContent = "No results found.";
      emptyState.style.display = "block";
      return;
    }

    items.slice(0, 40).forEach((item) => {
      const mediaType = item.media_type || type || "movie";
      const finalType = mediaType === "tv" ? "tv" : "movie";
      const card = createMediaCard(item, finalType);
      card.style.minWidth = "45%";
      card.style.maxWidth = "48%";
      resultsGrid.appendChild(card);
    });

    resultsInfo.textContent = `${items.length} result(s)`;
  } catch (err) {
    console.error(err);
    resultsInfo.textContent = "";
    errorState.style.display = "block";
  }
}