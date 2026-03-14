/**
 * Service Worker para MedControl PWA
 * ----------------------------------
 * Estrategia: Network-First con Cache Fallback.
 * Los recursos estáticos se pre-cachean en la instalación para acceso offline.
 * Las llamadas a Firebase pasan siempre por red (no se cachean).
 */

const CACHE_NAME = 'medcontrol-v1';

/** Recursos estáticos a pre-cachear durante la instalación */
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/firebase-config.js',
  '/js/ui.js',
  '/js/patients.js',
  '/js/records.js',
  '/js/pdf-export.js',
  '/js/app.js',
  '/manifest.json'
];

/** URLs externas de CDN que se cachean tras la primera carga */
const CDN_URLS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap',
  'https://unpkg.com/lucide@latest',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js'
];

// ─── Instalación: Pre-cachear recursos estáticos ───
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activación: Limpiar caches anteriores ───
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch: Network-First para app, Cache-First para CDN ───
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // No cachear llamadas a Firebase/Firestore
  if (url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('gstatic.com')) {
    return; // Dejar que pase directo a la red
  }

  // CDN resources: Cache-First (se actualizan poco)
  if (CDN_URLS.some(cdn => event.request.url.startsWith(cdn))) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // App resources: Network-First con fallback a cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
