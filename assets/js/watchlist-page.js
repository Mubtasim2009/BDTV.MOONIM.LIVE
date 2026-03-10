// Watchlist page controller

function renderGrid(containerId, items, emptyIcon, emptyMsg, onRemove) {
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

    // Plot overlay: shown on hover
    const plotOverlay = document.createElement('div');
    plotOverlay.className = 'media-card-plot';

    const plotTitle = document.createElement('div');
    plotTitle.className = 'media-card-plot-title';
    plotTitle.textContent = entry.title || 'Untitled';
    plotOverlay.appendChild(plotTitle);

    if (entry.overview) {
      const plotText = document.createElement('p');
      plotText.className = 'media-card-plot-text';
      plotText.textContent = entry.overview;
      plotOverlay.appendChild(plotText);
    }

    // Remove button (always visible on this page)
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.setAttribute('aria-label', 'Remove');
    removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (onRemove) {
        onRemove(entry);
      }
    });

    a.appendChild(img);
    a.appendChild(overlay);
    a.appendChild(plotOverlay);
    a.appendChild(removeBtn);
    container.appendChild(a);
  });
}

function renderWatchlist() {
  renderGrid(
    'watchlistGrid',
    watchlistGet(),
    '<i class="fa-solid fa-bookmark" style="font-size:2.5rem;color:var(--accent);"></i>',
    'Nothing saved yet.<br>Hit the <strong><i class="fa-solid fa-check"></i></strong> button on any movie or TV card to save it here.',
    (entry) => {
      watchlistRemove(entry.id, entry.type);
      showToast('Removed from My List', true);
      renderWatchlist();
    }
  );
}

function renderHistory() {
  renderGrid(
    'historyGrid',
    historyGet(),
    '<i class="fa-solid fa-clock-rotate-left" style="font-size:2.5rem;color:var(--accent);"></i>',
    'You haven\'t watched anything yet.<br>Movies and TV shows you play will appear here.',
    (entry) => {
      historyRemove(entry.id, entry.type);
      showToast('Removed from history', true);
      renderHistory();
    }
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
