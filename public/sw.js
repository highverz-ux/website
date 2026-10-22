// Highverz High-Performance Media & Asset Service Worker
const CACHE_NAME = 'highverz-cache-v2';
const MEDIA_CACHE_NAME = 'highverz-media-v2';

const STATIC_EXTENSIONS = /\.(?:png|jpg|jpeg|webp|avif|svg|woff2?|css|js|json)$/i;
const VIDEO_EXTENSIONS = /\.(?:mp4|webm|mov)$/i;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== MEDIA_CACHE_NAME)
          .map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: Handle Byte Range requests from Cache Storage for HTML5 video
async function handleRangeRequest(request, cache) {
  const url = request.url;
  let cachedResponse = await cache.match(url);

  if (!cachedResponse) {
    try {
      const networkResponse = await fetch(request);
      // Cache valid full or partial responses
      if (networkResponse.ok || networkResponse.status === 206) {
        // Clone and store full resource when available
        if (networkResponse.status === 200) {
          cache.put(url, networkResponse.clone());
        }
      }
      return networkResponse;
    } catch (err) {
      return new Response('Network error loading video', { status: 503 });
    }
  }

  // Handle Range Header if present
  const rangeHeader = request.headers.get('range');
  if (!rangeHeader) {
    return cachedResponse;
  }

  const arrayBuffer = await cachedResponse.arrayBuffer();
  const totalLength = arrayBuffer.byteLength;
  const parts = rangeHeader.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10) || 0;
  const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;

  if (start >= totalLength || end >= totalLength) {
    return new Response('Requested range not satisfiable', {
      status: 416,
      headers: { 'Content-Range': `bytes */${totalLength}` }
    });
  }

  const slicedBuffer = arrayBuffer.slice(start, end + 1);
  return new Response(slicedBuffer, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': cachedResponse.headers.get('Content-Type') || 'video/mp4',
      'Content-Length': String(slicedBuffer.byteLength),
      'Content-Range': `bytes ${start}-${end}/${totalLength}`,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests and API calls
  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }

  // 1. Video files (MP4 / WebM / MOV): Range-aware cache
  if (VIDEO_EXTENSIONS.test(url.pathname)) {
    event.respondWith(
      caches.open(MEDIA_CACHE_NAME).then((cache) => handleRangeRequest(request, cache))
    );
    return;
  }

  // 2. Static Assets (Images, WebP, Fonts, CSS): Cache-First
  if (STATIC_EXTENSIONS.test(url.pathname) || url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }
});
