const PLAYLISTS = {
  ayna: {
    name: "Mirror BDIX Server",
    url: "https://raw.githubusercontent.com/abusaeeidx/Ayna-BDIX-IPTV-Playlist/refs/heads/main/ayna-playlist.m3u",
  },
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

document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("playlistSelect");
  const statusEl = document.getElementById("liveStatus");
  const listEl = document.getElementById("channelList");
  const video = document.getElementById("liveVideo");

  async function loadPlaylist(key) {
    const cfg = PLAYLISTS[key];
    if (!cfg) return;

    statusEl.textContent = `Loading ${cfg.name}…`;
    listEl.innerHTML = "";
    video.removeAttribute("src");
    video.load();

    try {
      const res = await fetch(cfg.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const channels = parseM3U(text);

      if (!channels.length) {
        statusEl.textContent = "No channels found in this playlist.";
        return;
      }

      channels.forEach((ch, idx) => {
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
        index.style.fontSize = "0.7rem";
        index.style.color = "#a7b0c5";
        index.textContent = `#${String(idx + 1).padStart(3, "0")}`;

        item.appendChild(logo);
        item.appendChild(main);
        item.appendChild(index);

        item.addEventListener("click", () => {
          document
            .querySelectorAll(".channel-item.active")
            .forEach((el) => el.classList.remove("active"));
          item.classList.add("active");
          playChannel(ch.url);
        });

        listEl.appendChild(item);
      });

      statusEl.textContent = `${channels.length} channels`;
      const first = listEl.querySelector(".channel-item");
      if (first) {
        first.classList.add("active");
        playChannel(first.dataset.url);
      }
    } catch (err) {
      console.error(err);
      statusEl.textContent = "Failed to load playlist.";
    }
  }

  function playChannel(url) {
    video.src = url;
    video.play().catch(() => {});
  }

  select.addEventListener("change", () => loadPlaylist(select.value));
  loadPlaylist(select.value);
});