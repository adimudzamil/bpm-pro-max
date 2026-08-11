const CACHE_NAME = 'roster-parser-v1';
const SHARE_URL = '/share-target';

// Files to cache on install (the app shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // External libraries – you can add them if you want offline support, but they are large.
  // If you include them, uncomment the lines below:
  // 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  // 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  // 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  // 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap'
];

// Install event – cache the shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(cache => cache.addAll(STATIC_ASSETS))
    .then(() => self.skipWaiting())
  );
});

// Activate event – clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event – serve from cache, but also handle share POST
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // === Handle the share target POST ===
  if (event.request.method === 'POST' && url.pathname === SHARE_URL) {
    event.respondWith(handleShare(event.request));
    return;
  }
  
  // Normal request – try cache, fallback to network
  event.respondWith(
    caches.match(event.request)
    .then(response => response || fetch(event.request))
    .catch(() => new Response('Offline', { status: 503 }))
  );
});

// Process a shared file
async function handleShare(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file'); // 'file' matches the name in manifest.json
    
    if (!file) {
      return new Response('No file received', { status: 400 });
    }
    
    // Store the file in the cache so the main page can pick it up
    const cache = await caches.open('shared-v1');
    const headers = new Headers({
      'Content-Type': file.type,
      'X-Filename': file.name,
    });
    const response = new Response(file, { headers });
    await cache.put('/shared-file', response);
    
    // Redirect to the main page with a query param (optional)
    const redirectUrl = new URL('/', self.location.origin);
    redirectUrl.searchParams.set('shared', '1');
    return Response.redirect(redirectUrl.toString(), 303);
    
  } catch (error) {
    console.error('Share handling error:', error);
    return new Response('Share processing failed', { status: 500 });
  }
}