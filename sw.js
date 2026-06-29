// Alliance Française San Cristóbal · Service Worker
// Cache app shell + assets para experiencia offline.
const CACHE = 'af-sclc-v1';
const SHELL = [
  '/af-chiapas-web/',
  '/af-chiapas-web/index.html',
  '/af-chiapas-web/manifest.webmanifest',
  '/af-chiapas-web/src/assets/brand/logo-af-sancristobal.png',
  '/af-chiapas-web/src/assets/img/posters/curso-en-linea.webp',
  '/af-chiapas-web/src/assets/img/posters/curso-ninos.webp',
  '/af-chiapas-web/src/assets/img/posters/cursos-particulares.webp',
  '/af-chiapas-web/src/assets/img/posters/promo-clase-gratis.webp',
  '/af-chiapas-web/src/assets/img/posters/club-conversacion.webp',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => null))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Solo gestionamos mismo origen para evitar problemas con CDNs/APIs
  if (url.origin !== self.location.origin) return;

  // No cachear endpoints dinámicos
  if (url.pathname.includes('/rest/v1/') || url.pathname.includes('/auth/v1/')) return;

  // HTML: network-first
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('/af-chiapas-web/')))
    );
    return;
  }

  // Assets: cache-first
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
