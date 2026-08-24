const CACHE='banheiro-apto-101-v4-2-ui';
const ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.json','./assets/capa-v4.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request))));
