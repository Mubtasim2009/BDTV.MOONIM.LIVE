// Genre browse page

// Map genre IDs to friendly icons
const GENRE_ICONS = {
  28:    '💥', // Action
  12:    '🗺️', // Adventure
  16:    '🎨', // Animation
  35:    '😄', // Comedy
  80:    '🔫', // Crime
  99:    '🎬', // Documentary
  18:    '🎭', // Drama
  10751: '👨‍👩‍👧', // Family
  14:    '🧙', // Fantasy
  36:    '🏛️', // History
  27:    '👻', // Horror
  10402: '🎵', // Music
  9648:  '🔍', // Mystery
  10749: '❤️', // Romance
  878:   '🚀', // Science Fiction
  10770: '📺', // TV Movie
  53:    '🎯', // Thriller
  10752: '⚔️', // War
  37:    '🤠', // Western
  // TV-specific
  10759: '💥', // Action & Adventure (TV)
  10762: '👶', // Kids (TV)
  10763: '📰', // News (TV)
  10764: '🎪', // Reality (TV)
  10765: '🔮', // Sci-Fi & Fantasy (TV)
  10766: '🌊', // Soap (TV)
  10767: '🎤', // Talk (TV)
  10768: '⚔️', // War & Politics (TV)
};

let currentType = 'movie';
let currentGenreId = null;
let currentGenreName = '';
let currentPage = 1;
let totalPages = 1;

async function loadGenres(type) {
  const tilesEl = document.getElementById('genreTiles');
  if (!tilesEl) return;
  tilesEl.innerHTML = '<p style="color:var(--text-muted);font-size:0.875rem;">Loading genres…</p>';

  try {
    const data = await fetchJson(`${TMDB_BASE}/genre/${type}/list?api_key=${TMDB_API_KEY}&language=en-US`);
    const genres = data.genres || [];

    tilesEl.innerHTML = '';
    genres.forEach((g) => {
      const tile = document.createElement('button');
      tile.className = 'genre-tile';
      tile.dataset.genreId = g.id;
      tile.dataset.genreName = g.name;

      const icon = document.createElement('span');
      icon.className = 'genre-tile-icon';
      icon.textContent = GENRE_ICONS[g.id] || '🎞️';

      const name = document.createElement('span');
      name.className = 'genre-tile-name';
      name.textContent = g.name;

      tile.appendChild(icon);
      tile.appendChild(name);
      tile.addEventListener('click', () => showGenreResults(g.id, g.name));
      tilesEl.appendChild(tile);
    });
  } catch (err) {
    console.error(err);
    if (tilesEl) tilesEl.innerHTML = '<p style="color:var(--text-muted);">Failed to load genres.</p>';
  }
}

async function showGenreResults(genreId, genreName, page) {
  currentGenreId = genreId;
  currentGenreName = genreName;
  currentPage = page || 1;

  const tilesSection = document.getElementById('genreTilesSection');
  const resultsSection = document.getElementById('genreResultsSection');
  const titleEl = document.getElementById('genreResultsTitle');
  const grid = document.getElementById('genreResultsGrid');
  const loadMoreWrap = document.getElementById('genreLoadMoreWrap');

  if (!grid) return;

  if (tilesSection) tilesSection.style.display = 'none';
  if (resultsSection) resultsSection.style.display = '';
  if (titleEl) titleEl.textContent = genreName;

  if (currentPage === 1) {
    grid.innerHTML = '<p style="color:var(--text-muted);font-size:0.875rem;padding:1rem 0;">Loading…</p>';
  }

  try {
    const endpoint = currentType === 'tv' ? 'discover/tv' : 'discover/movie';
    const data = await fetchJson(
      `${TMDB_BASE}/${endpoint}?api_key=${TMDB_API_KEY}&language=en-US&with_genres=${genreId}&sort_by=popularity.desc&page=${currentPage}`
    );
    totalPages = data.total_pages || 1;

    if (currentPage === 1) grid.innerHTML = '';

    (data.results || []).forEach((item) => {
      grid.appendChild(createMediaCard(item, currentType));
    });

    if (loadMoreWrap) {
      loadMoreWrap.style.display = currentPage < Math.min(totalPages, 10) ? '' : 'none';
    }
  } catch (err) {
    console.error(err);
    if (grid) grid.innerHTML = '<p style="color:var(--text-muted);">Failed to load results.</p>';
  }
}

function showGenreTiles() {
  const tilesSection = document.getElementById('genreTilesSection');
  const resultsSection = document.getElementById('genreResultsSection');
  const grid = document.getElementById('genreResultsGrid');
  if (tilesSection) tilesSection.style.display = '';
  if (resultsSection) resultsSection.style.display = 'none';
  if (grid) grid.innerHTML = '';
  currentGenreId = null;
  currentPage = 1;
}

document.addEventListener('DOMContentLoaded', () => {
  loadGenres('movie');

  // Type tabs
  const typeTabs = document.getElementById('genreTypeTabs');
  if (typeTabs) {
    typeTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.genre-type-btn');
      if (!btn) return;
      typeTabs.querySelectorAll('.genre-type-btn').forEach(b => b.classList.remove('genre-type-btn--active'));
      btn.classList.add('genre-type-btn--active');
      currentType = btn.dataset.type;
      showGenreTiles();
      loadGenres(currentType);
    });
  }

  // Back button
  const backBtn = document.getElementById('genreBackBtn');
  if (backBtn) {
    backBtn.addEventListener('click', showGenreTiles);
  }

  // Load more
  const loadMoreBtn = document.getElementById('genreLoadMore');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      if (currentGenreId) {
        currentPage++;
        showGenreResults(currentGenreId, currentGenreName, currentPage);
      }
    });
  }

  // Pre-select genre from URL ?genre=id&type=movie|tv
  const params = new URLSearchParams(window.location.search);
  const preGenreId = params.get('genre');
  const preType = params.get('type');
  if (preType === 'tv' || preType === 'movie') {
    currentType = preType;
    document.querySelectorAll('.genre-type-btn').forEach(b => {
      b.classList.toggle('genre-type-btn--active', b.dataset.type === currentType);
    });
    loadGenres(currentType);
  }
  if (preGenreId) {
    const preGenreName = params.get('name') || 'Genre';
    showGenreResults(Number(preGenreId), preGenreName, 1);
  }
});
