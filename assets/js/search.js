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

/* ─── Suggestions ─────────────────────────────────────────── */

let suggestDebounceTimer = null;
let activeSuggestionIndex = -1;

function buildSuggestionsDropdown(input) {
  let dropdown = document.getElementById("searchSuggestionsDropdown");
  if (!dropdown) {
    dropdown = document.createElement("div");
    dropdown.id = "searchSuggestionsDropdown";
    dropdown.className = "suggestions-dropdown";
    dropdown.setAttribute("role", "listbox");
    input.parentNode.insertBefore(dropdown, input.nextSibling);
  }
  return dropdown;
}

function closeSuggestions() {
  const dropdown = document.getElementById("searchSuggestionsDropdown");
  if (dropdown) dropdown.innerHTML = "";
  activeSuggestionIndex = -1;
}

function renderSuggestions(items, input, select) {
  const dropdown = buildSuggestionsDropdown(input);
  dropdown.innerHTML = "";
  activeSuggestionIndex = -1;

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "suggestion-empty";
    empty.textContent = "No match found.";
    dropdown.appendChild(empty);
    return;
  }

  items.forEach((item, idx) => {
    const title = item.title || item.name || "Untitled";
    const year =
      (item.release_date && item.release_date.slice(0, 4)) ||
      (item.first_air_date && item.first_air_date.slice(0, 4)) ||
      "";
    const mediaType = item.media_type || select.value || "movie";
    const finalType = mediaType === "tv" ? "tv" : "movie";
    const linkTarget = finalType === "tv" ? "player-tv.html" : "player-movie.html";
    const thumb = item.poster_path
      ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
      : "";

    const row = document.createElement("a");
    row.href = `${linkTarget}?id=${encodeURIComponent(item.id)}`;
    row.className = "suggestion-item";
    row.setAttribute("role", "option");
    row.setAttribute("data-index", idx);

    if (thumb) {
      const img = document.createElement("img");
      img.src = thumb;
      img.alt = "";
      img.className = "suggestion-thumb";
      row.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "suggestion-thumb suggestion-thumb--empty";
      row.appendChild(placeholder);
    }

    const info = document.createElement("div");
    info.className = "suggestion-info";

    const titleEl = document.createElement("span");
    titleEl.className = "suggestion-title";
    titleEl.textContent = title;

    const meta = document.createElement("span");
    meta.className = "suggestion-meta";
    meta.textContent = [year, finalType === "tv" ? "TV" : "Movie"].filter(Boolean).join(" · ");

    info.appendChild(titleEl);
    info.appendChild(meta);
    row.appendChild(info);

    row.addEventListener("mousedown", (e) => {
      e.preventDefault();
    });
    row.addEventListener("click", () => {
      closeSuggestions();
    });

    dropdown.appendChild(row);
  });
}

async function fetchSuggestions(query, select, input) {
  if (query.length < 2) {
    closeSuggestions();
    return;
  }
  const endpoint = `${TMDB_BASE}/search/multi?api_key=${TMDB_API_KEY}&language=en-US&include_adult=false&page=1&query=${encodeURIComponent(query)}`;
  try {
    const data = await fetchJson(endpoint);
    const items = (data.results || [])
      .filter((x) => x.media_type !== "person" && (x.poster_path || x.backdrop_path))
      .slice(0, 6);
    renderSuggestions(items, input, select);
  } catch (_) {
    closeSuggestions();
  }
}

/* ─── Main DOMContentLoaded ───────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
  const { q, type } = getSearchParams();
  const input = document.getElementById("searchInput");
  const select = document.getElementById("searchType");
  const form = document.getElementById("searchForm");
  const resultsInfo = document.getElementById("resultsInfo");
  const resultsGrid = document.getElementById("resultsGrid");
  const emptyState = document.getElementById("emptyState");
  const errorState = document.getElementById("errorState");

  if (!input || !select || !form) return;

  const els = { resultsGrid, resultsInfo, emptyState, errorState };

  input.value = q;
  select.value = type;

  input.setAttribute("autocomplete", "off");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", "searchSuggestionsDropdown");

  input.addEventListener("input", () => {
    const query = input.value.trim();
    clearTimeout(suggestDebounceTimer);
    if (!query) {
      closeSuggestions();
      return;
    }
    suggestDebounceTimer = setTimeout(() => {
      fetchSuggestions(query, select, input);
    }, 220);
  });

  input.addEventListener("keydown", (e) => {
    const dropdown = document.getElementById("searchSuggestionsDropdown");
    if (!dropdown) return;
    const rows = dropdown.querySelectorAll(".suggestion-item");
    if (!rows.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeSuggestionIndex = Math.min(activeSuggestionIndex + 1, rows.length - 1);
      rows.forEach((r, i) => r.classList.toggle("suggestion-item--active", i === activeSuggestionIndex));
      if (rows[activeSuggestionIndex]) input.value = rows[activeSuggestionIndex].querySelector(".suggestion-title").textContent;
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

  input.addEventListener("blur", () => {
    setTimeout(closeSuggestions, 150);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    closeSuggestions();
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
    runSearch(query, t, els);
  });

  if (q) {
    runSearch(q, type, els);
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
    endpoint = `${TMDB_BASE}/search/movie?api_key=${TMDB_API_KEY}&language=en-US&include_adult=false&query=${encodeURIComponent(query)}`;
  } else if (type === "tv") {
    endpoint = `${TMDB_BASE}/search/tv?api_key=${TMDB_API_KEY}&language=en-US&include_adult=false&query=${encodeURIComponent(query)}`;
  } else {
    endpoint = `${TMDB_BASE}/search/multi?api_key=${TMDB_API_KEY}&language=en-US&include_adult=false&query=${encodeURIComponent(query)}`;
  }

  try {
    const data = await fetchJson(endpoint);
    const items = (data.results || []).filter(
      (x) => x.media_type !== "person" && (x.poster_path || x.backdrop_path)
    );
    if (!items.length) {
      resultsInfo.textContent = "";
      emptyState.textContent = "No match found.";
      emptyState.style.display = "block";
      return;
    }

    items.slice(0, 40).forEach((item) => {
      const mediaType = item.media_type || type || "movie";
      const finalType = mediaType === "tv" ? "tv" : "movie";
      const card = createMediaCard(item, finalType);
      resultsGrid.appendChild(card);
    });

    resultsInfo.textContent = `${items.length} result(s)`;
  } catch (err) {
    console.error(err);
    resultsInfo.textContent = "";
    errorState.style.display = "block";
  }
}