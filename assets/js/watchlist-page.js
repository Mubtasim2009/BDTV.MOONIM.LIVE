// Watchlist page controller

function renderGrid(containerId, items, emptyIcon, emptyMsg) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (!items.length) {
    container.innerHTML = `
      <div class="watchlist-empty">
        <span>${emptyIcon}</span>
        ${emptyMsg}
      </div>`;
    return;
  }

  items.forEach((entry) => {
    const linkTarget = entry.type === 'tv' ? 'player-tv.html' : 'player-movie.html';

    const a = document.createElement('a');
    a.href = `${linkTarget}?id=${encodeURIComponent(entry.id)}`;
    a.className = 'media-card';

    const img = document.createElement('img');
    img.src = entry.posterPath
      ? `${TMDB_IMG_BASE}${entry.posterPath}`
      : 'https://via.placeholder.com/300x450?text=No+Image';
    img.alt = entry.title || 'Untitled';
    img.loading = 'lazy';

    const overlay = document.createElement('div');
    overlay.className = 'media-card-overlay';

    const titleEl = document.createElement('div');
    titleEl.className = 'media-card-overlay-title';
    titleEl.textContent = entry.title || 'Untitled';

    const meta = document.createElement('div');
    meta.className = 'media-meta';

    if (entry.year) {
      const yearSpan = document.createElement('span');
      yearSpan.textContent = entry.year;
      meta.appendChild(yearSpan);
    }

    const typePill = document.createElement('span');
    typePill.className = 'tile-type-pill';
    typePill.textContent = entry.type === 'tv' ? 'TV' : 'MOVIE';
    meta.appendChild(typePill);

    overlay.appendChild(titleEl);
    overlay.appendChild(meta);

    // Watchlist remove button (always visible on this page)
    const wlBtn = document.createElement('button');
    wlBtn.className = 'wl-btn wl-btn--active';
    wlBtn.setAttribute('aria-label', 'Remove from My List');
    wlBtn.innerHTML = '&#10003;';
    wlBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      watchlistRemove(entry.id, entry.type);
      showToast('Removed from My List', true);
      // Re-render
      renderWatchlist();
    });

    a.appendChild(img);
    a.appendChild(overlay);
    a.appendChild(wlBtn);
    container.appendChild(a);
  });
}

function renderWatchlist() {
  renderGrid(
    'watchlistGrid',
    watchlistGet(),
    '🔖',
    'Nothing saved yet.<br>Hit the <strong>&#10003;</strong> button on any movie or TV card to save it here.'
  );
}

function renderHistory() {
  renderGrid(
    'historyGrid',
    historyGet(),
    '🕐',
    'You haven\'t watched anything yet.<br>Movies and TV shows you play will appear here.'
  );
}

document.addEventListener('DOMContentLoaded', () => {
  renderWatchlist();

  const tabWatchlist = document.getElementById('tabWatchlist');
  const tabHistory = document.getElementById('tabHistory');
  const watchlistPanel = document.getElementById('watchlistPanel');
  const historyPanel = document.getElementById('historyPanel');

  tabWatchlist.addEventListener('click', () => {
    tabWatchlist.classList.add('watchlist-tab--active');
    tabHistory.classList.remove('watchlist-tab--active');
    watchlistPanel.style.display = '';
    historyPanel.style.display = 'none';
    renderWatchlist();
  });

  tabHistory.addEventListener('click', () => {
    tabHistory.classList.add('watchlist-tab--active');
    tabWatchlist.classList.remove('watchlist-tab--active');
    historyPanel.style.display = '';
    watchlistPanel.style.display = 'none';
    renderHistory();
  });
});
