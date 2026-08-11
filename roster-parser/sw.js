// sw.js – Roster Parser Service Worker
// Handles file sharing from Android (Web Share Target)

// Install: activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: take control of all clients
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Intercept requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Catch POST requests to the main page (coming from share target)
  // The path must exactly match the "action" in your manifest.json
  if (event.request.method === 'POST' && url.pathname === '/roster-parser/index.html') {
    event.respondWith(handleShareTarget(event.request));
    return;
  }
  
  // For everything else, go straight to the network
  event.respondWith(fetch(event.request));
});

/**
 * Processes the shared file, stores it in Cache, then redirects
 * to the main page with a ?shared=true flag.
 */
async function handleShareTarget(request) {
  try {
    // Extract the file from the multipart form data
    const formData = await request.formData();
    const file = formData.get('rosterFile'); // must match "name" in manifest
    
    if (!file) {
      // No file – just redirect normally
      return Response.redirect('/roster-parser/index.html', 303);
    }
    
    // Store the file in Cache Storage under a fixed key
    const cache = await caches.open('roster-shared-files');
    const fileResponse = new Response(file, {
      headers: { 'Content-Type': file.type }
    });
    await cache.put('/shared-file', fileResponse);
    
    // Redirect to the main page with a flag so the page knows to load the file
    const redirectUrl = new URL('/roster-parser/index.html', self.location.origin);
    redirectUrl.searchParams.set('shared', 'true');
    return Response.redirect(redirectUrl.toString(), 303);
  } catch (error) {
    console.error('Share target error:', error);
    // Fallback: redirect to main page without file
    return Response.redirect('/roster-parser/index.html', 303);
  }
}