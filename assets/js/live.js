const PLAYLISTS = {
  mrgify: {
    name: "Merge BDIX",
    url: "https://raw.githubusercontent.com/abusaeeidx/Mrgify-BDIX-IPTV/main/playlist.m3u",
  },
  falcon: {
    name: "Falcon Cast",
    url: "https://raw.githubusercontent.com/FunctionError/PiratesTv/refs/heads/main/combined_playlist.m3u",
  },
};

function parseM3U(text) {
  const lines = text.split(/\r?\n/);
  const channels = [];
  let currentExtInf = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith("#EXTINF:")) {
      currentExtInf = line;
    } else if (!line.startsWith("#") && currentExtInf) {
      const url = line;
      const info = currentExtInf;

      const nameMatch = info.match(/tvg-name="([^"]+)"/) || info.match(/,(.+)$/);
      const logoMatch = info.match(/tvg-logo="([^"]+)"/);
      const groupMatch = info.match(/group-title="([^"]+)"/);

      const name = nameMatch ? nameMatch[1].trim() : "Channel";
      const logo = logoMatch ? logoMatch[1].trim() : "";
      const group = groupMatch ? groupMatch[1].trim() : "General";

      channels.push({ name, logo, group, url });
      currentExtInf = null;
    }
  }

  return channels;
}

let hlsInstance = null;

function playChannel(url, videoEl) {
  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }
  if (typeof Hls !== "undefined" && Hls.isSupported()) {
    hlsInstance = new Hls();
    hlsInstance.loadSource(url);
    hlsInstance.attachMedia(videoEl);
    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => videoEl.play().catch(() => {}));
  } else if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
    videoEl.src = url;
    videoEl.play().catch(() => {});
  } else {
    videoEl.src = url;
    videoEl.play().catch(() => {});
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("playlistSelect");
  const refresh = document.getElementById("refreshPlaylistBtn");
  const statusEl = document.getElementById("liveStatus");
  const listEl = document.getElementById("channelList");
  const video = document.getElementById("liveVideo");
  const searchEl = document.getElementById("channelSearchInput");

  let currentChannels = [];

  function renderChannelList(filterText) {
    const q = (filterText || "").trim().toLowerCase();
    listEl.innerHTML = "";

    const filtered = q
      ? currentChannels.filter((ch) => {
          return (
            ch.name.toLowerCase().includes(q) ||
            (ch.group || "").toLowerCase().includes(q)
          );
        })
      : currentChannels.slice();

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "live-status";
      empty.style.margin = "0.25rem 0.35rem";
      empty.textContent = "No channels match your search.";
      listEl.appendChild(empty);
      return;
    }

    filtered.forEach((ch, idx) => {
      const item = document.createElement("div");
      item.className = "channel-item";
      item.dataset.url = ch.url;

      const logo = document.createElement("div");
      logo.className = "channel-logo";
      if (ch.logo) {
        const img = document.createElement("img");
        img.src = ch.logo;
        img.alt = ch.name;
        logo.appendChild(img);
      } else {
        logo.textContent = ch.name
          .split(" ")
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase() || "")
          .join("");
      }

      const main = document.createElement("div");
      main.className = "channel-main";

      const nameEl = document.createElement("div");
      nameEl.className = "channel-name";
      nameEl.textContent = ch.name;

      const metaEl = document.createElement("div");
      metaEl.className = "channel-meta";
      metaEl.textContent = ch.group || "";

      const badge = document.createElement("span");
      badge.className = "channel-tag";
      badge.textContent = ch.url.toLowerCase().includes("hd") ? "HD" : "SD";
      metaEl.appendChild(badge);

      main.appendChild(nameEl);
      main.appendChild(metaEl);

      const index = document.createElement("div");
      index.className = "channel-index";
      index.textContent = `#${String(idx + 1).padStart(3, "0")}`;

      item.appendChild(logo);
      item.appendChild(main);
      item.appendChild(index);

      item.addEventListener("click", () => {
        document
          .querySelectorAll(".channel-item.active")
          .forEach((el) => el.classList.remove("active"));
        item.classList.add("active");
        playChannel(ch.url, video);
      });

      listEl.appendChild(item);
    });

    // Auto-select first visible channel if none active
    const active = listEl.querySelector(".channel-item.active");
    if (!active) {
      const first = listEl.querySelector(".channel-item");
      if (first) {
        first.classList.add("active");
        playChannel(first.dataset.url, video);
      }
    }
  }

  async function loadPlaylist(key) {
    const cfg = PLAYLISTS[key];
    if (!cfg) return;

    statusEl.textContent = `Loading ${cfg.name}…`;
    currentChannels = [];
    listEl.innerHTML = "";
    if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; }
    video.removeAttribute("src");
    video.load();
    if (searchEl) searchEl.value = "";

    try {
      const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(cfg.url)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      currentChannels = parseM3U(text);

      if (!currentChannels.length) {
        statusEl.textContent = "No channels found in this playlist.";
        return;
      }

      statusEl.textContent = `${currentChannels.length} channels`;
      renderChannelList("");
    } catch (err) {
      console.error(err);
      statusEl.textContent = "Failed to load playlist.";
      listEl.innerHTML = `<div class="live-status" style="margin:1rem;color:#fca5a5;">⚠️ Could not load channels. The playlist URL may be down or blocked by CORS.</div>`;
    }
  }

  select.addEventListener("change", () => loadPlaylist(select.value));

  if (refresh) {
    refresh.addEventListener("click", () => loadPlaylist(select.value));
  }

  if (searchEl) {
    searchEl.addEventListener("input", () => renderChannelList(searchEl.value));
  }

  loadPlaylist(select.value);
});
