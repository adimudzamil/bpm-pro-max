const CACHE_NAME = 'roster-parser-v4';
const SHARE_TARGET = '/bpm-pro-max/roster-parser/share-target'; // must match manifest.action

const STATIC_ASSETS = [
  '/bpm-pro-max/roster-parser/',
  '/bpm-pro-max/roster-parser/index.html',
  '/bpm-pro-max/roster-parser/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(cache => cache.addAll(STATIC_ASSETS))
    .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // === Handle share POST ===
  if (event.request.method === 'POST' && url.pathname === SHARE_TARGET) {
    event.respondWith(handleShare(event.request));
    return;
  }
  
  // === Normal fetch: cache then network ===
  event.respondWith(
    caches.match(event.request)
    .then(response => response || fetch(event.request))
    .catch(() => new Response('Offline', { status: 503 }))
  );
});

async function handleShare(request) {
  console.log('[SW] Share POST received');
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) {
      console.error('[SW] No file in form data');
      return new Response('No file received', { status: 400 });
    }
    
    console.log('[SW] File:', file.name, file.type, file.size);
    
    // Store file in a special cache
    const cache = await caches.open('shared-v1');
    const headers = new Headers({
      'Content-Type': file.type,
      'X-Filename': file.name,
    });
    const response = new Response(file, { headers });
    await cache.put('/shared-file', response);
    
    // Redirect to the main page
    const redirectUrl = new URL('/bpm-pro-max/roster-parser/', self.location.origin);
    redirectUrl.searchParams.set('shared', '1');
    return Response.redirect(redirectUrl.toString(), 303);
  } catch (error) {
    console.error('[SW] Share error:', error);
    return new Response('Share processing failed', { status: 500 });
  }
}