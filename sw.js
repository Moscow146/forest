// Service worker: кладёт игру в кэш при первой загрузке,
// дальше она открывается мгновенно и работает без интернета.
// Интернет нужен только для кооператива (связь через сервер комнат).
const CACHE = 'grandpas-forest-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Запросы к брокеру и всё стороннее пропускаем мимо кэша
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Сначала кэш (игра тяжёлая, ~1 МБ), сеть — фоном для обновлений
  e.respondWith(
    caches.match(e.request).then(hit => {
      const fromNet = fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || fromNet;
    })
  );
});
