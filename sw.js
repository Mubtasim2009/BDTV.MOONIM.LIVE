"use strict";

// ─── MoonStream Navigation-Guard Service Worker ─────────────────────────────
//
// WHY: The iframe sandbox attribute (which strips allow-top-navigation) is the
// primary defence against ad-redirect attacks.  This SW is a belt-and-
// suspenders second layer that works at the browser fetch level, *before* the
// page even sees the request.  It catches:
//   • Any future source added without sandbox applied
//   • Race conditions where the sandbox is set a moment after src changes
//   • Redirect chains (the first hop is same-origin, the second is external)
//
// WHAT IT BLOCKS: top-level page navigations that originate from a player page
// and target an external origin.  All other requests (assets, API calls, user-
// initiated external links) pass through untouched.
// ─────────────────────────────────────────────────────────────────────────────

const SITE_ORIGIN = self.location.origin;
const PLAYER_PAGE_PATHS = ["/player-movie.html", "/player-tv.html"];

// Install & activate immediately so protection is in place without a reload.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only care about full-page navigate requests (not sub-resource fetches).
  if (req.mode !== "navigate") return;

  const destUrl = new URL(req.url);

  // Allow navigation to any same-origin page (internal links work normally).
  if (destUrl.origin === SITE_ORIGIN) return;

  // For external destinations, check whether the referrer is a player page.
  let refUrl = null;
  try { refUrl = req.referrer ? new URL(req.referrer) : null; } catch (_) {}

  const fromPlayerPage =
    refUrl !== null &&
    refUrl.origin === SITE_ORIGIN &&
    PLAYER_PAGE_PATHS.some((p) => refUrl.pathname.endsWith(p));

  if (fromPlayerPage) {
    // Bounce the user back to the player page they came from.
    event.respondWith(Response.redirect(req.referrer, 302));
  }
  // External navigations from non-player pages (e.g. user clicked an external
  // link on the home page) are allowed through normally.
});
