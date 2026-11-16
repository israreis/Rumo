/* Rumo service worker — app offline-first enough for the middle of a trip.
 *
 * - Pages: network first, falling back to the last copy (any app page boots the SPA).
 * - Build assets, icons, fonts: stale-while-revalidate.
 * - Supabase REST reads (GET /rest/v1): network first, cached copy when offline,
 *   so the trip in progress (itinerary, bookings, documents list) opens without signal.
 * - Supabase signed files (tickets, receipts, documents): cache first — signed URLs never change.
 * - Map tiles: cache first, capped.
 * Writes are never cached; offline expenses are queued by the app (src/lib/offline-queue.ts).
 */
const VERSION = "rumo-v2";
const PAGES = `${VERSION}-pages`;
const STATIC = `${VERSION}-static`;
const DATA = `${VERSION}-data`;
const FILES = `${VERSION}-files`;
const TILES = `${VERSION}-tiles`;
const KEEP = [PAGES, STATIC, DATA, FILES, TILES];

const PRECACHE = ["/trips", "/manifest.webmanifest", "/favicon.svg", "/icons/icon-192.png", "/brand/rumo-simbolo-lente-animado.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  // Sent on sign-out so the next person on this device never sees cached trip data.
  if (event.data === "clear-data") {
    event.waitUntil(Promise.all([caches.delete(DATA), caches.delete(FILES)]));
  }
  if (event.data === "skip-waiting") self.skipWaiting();
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
}

async function networkFirst(request, cacheName, ms) {
  const cache = await caches.open(cacheName);
  try {
    const response = await Promise.race([fetch(request), timeout(ms)]);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const hit = await cache.match(request, { ignoreVary: true });
    if (hit) return hit;
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const update = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === "opaque")) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return hit || (await update) || Response.error();
}

async function cacheFirst(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response && (response.ok || response.type === "opaque")) {
    await cache.put(request, response.clone());
    if (max) trim(cacheName, max);
  }
  return response;
}

const OFFLINE_HTML = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sem conexão — Rumo</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#f3eee4;color:#2a211a;font:16px/1.5 system-ui,sans-serif;text-align:center;padding:24px">
<div><img src="/brand/rumo-simbolo-lente-animado.svg" width="72" height="72" alt=""><h1 style="font:600 24px Georgia,serif;margin:16px 0 8px">Você está sem conexão</h1>
<p style="color:#6b5d4f;margin:0 0 20px">Abra o Rumo uma vez com internet para guardar suas viagens neste aparelho.</p>
<button onclick="location.reload()" style="background:#8a4f2a;color:#fbf8f2;border:0;border-radius:8px;padding:10px 18px;font:600 15px system-ui">Tentar de novo</button></div></body></html>`;

async function handleNavigation(request) {
  try {
    return await networkFirst(request, PAGES, 4000);
  } catch {
    const cache = await caches.open(PAGES);
    const fallback = (await cache.match("/trips")) || (await cache.keys().then((k) => (k[0] ? cache.match(k[0]) : undefined)));
    return fallback || new Response(OFFLINE_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate" && url.origin === self.location.origin) {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (url.origin === self.location.origin) {
    if (/^\/(assets|icons|brand|images|_build)\//.test(url.pathname) || /\.(js|css|woff2?|png|jpe?g|svg|webp|ico|webmanifest)$/.test(url.pathname)) {
      event.respondWith(staleWhileRevalidate(request, STATIC));
    }
    return;
  }

  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(staleWhileRevalidate(request, STATIC));
    return;
  }

  if (url.pathname.includes("/rest/v1/")) {
    event.respondWith(networkFirst(request, DATA, 6000));
    return;
  }

  if (url.pathname.includes("/storage/v1/object/sign/") || url.pathname.includes("/storage/v1/object/public/")) {
    event.respondWith(cacheFirst(request, FILES, 400));
    return;
  }

  if (url.hostname.endsWith("tile.openstreetmap.org")) {
    event.respondWith(cacheFirst(request, TILES, 600));
  }
});
