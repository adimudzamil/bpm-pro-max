// Service Worker for BPM Pro PWA
// Strategy: precache app shell (tolerant of single failures), then
// stale-while-revalidate for same-origin GETs. Bump VERSION on each release.

const VERSION = 'v4.3';
const CACHE_NAME = 'bpm-pro-' + VERSION;

const PRECACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './pwa-register.js',
  './tutorial.html',
  './versions.html',
  './sc-737.html',
  './sc-a332.html',
  './sc-a333.html',
  './sc-a339.html',
  './sc-a350.html',
  './sc-a359.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon-32.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(
        // add one by one so a single missing file can't fail the whole install
        PRECACHE_URLS.map(url => cache.add(url).catch(err => console.warn('[SW] precache skipped', url, err)))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(n => n.startsWith('bpm-pro-') && n !== CACHE_NAME).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // third-party (e.g. counter) goes straight to network

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    // ignoreSearch: sc-xxx.html?tabId=... must still match the cached page
    const cached = await cache.match(req, { ignoreSearch: true });

    const network = fetch(req).then(res => {
      if (res && res.status === 200 && res.type === 'basic') {
        cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    }).catch(() => null);

    if (cached) {
      network.catch(() => {}); // refresh in background
      return cached;
    }
    const res = await network;
    if (res) return res;
    if (req.mode === 'navigate') {
      const fallback = await cache.match('./index.html');
      if (fallback) return fallback;
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
