/**
 * Cloudflare Pages Function — same-origin CORS proxy for HLS stream requests.
 *
 * Route: GET /proxy?url=<percent-encoded-url>
 *
 * Why same-origin matters:
 *   The browser never performs a CORS check on same-origin requests, so we
 *   don't need the upstream stream server to send Access-Control-Allow-Origin.
 *   The Cloudflare Worker fetches the content server-side and returns it under
 *   the site's own origin, completely bypassing the browser's CORS restriction.
 *
 *   Additionally, Cloudflare has a PoP in Dhaka (Bangladesh) that can reach
 *   BDIX-peered stream servers — something a generic public proxy (e.g.
 *   corsproxy.io) hosted in the US/EU cannot do.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Range",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
};

export async function onRequest(context) {
  const { request } = context;

  // Handle CORS preflight (just in case the client sends one)
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const reqUrl = new URL(request.url);
  const targetUrl = reqUrl.searchParams.get("url");

  if (!targetUrl) {
    return new Response("Missing ?url= parameter", {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
    });
  }

  // Validate: only allow http / https schemes
  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return new Response("Invalid url parameter", {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
    });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return new Response("Only http/https URLs are allowed", {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
    });
  }

  // Build upstream request headers
  const upstreamHeaders = {
    "User-Agent": "Mozilla/5.0 (compatible; MoonStream/1.0)",
  };
  const range = request.headers.get("Range");
  if (range) upstreamHeaders["Range"] = range;

  try {
    const upstream = await fetch(parsed.toString(), {
      method: "GET",
      headers: upstreamHeaders,
    });

    // Forward the relevant response headers
    const outHeaders = new Headers(CORS_HEADERS);
    for (const h of [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
    ]) {
      const v = upstream.headers.get(h);
      if (v) outHeaders.set(h, v);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: outHeaders,
    });
  } catch (err) {
    return new Response(`Proxy error: ${err.message}`, {
      status: 502,
      headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
    });
  }
}
