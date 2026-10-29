// Offline-first after the initial network load, but always fetch fresh HTML when online.
const CACHE = 'sunlit-secrets-v4-image-fix-20261028';
const SHELL = ['./index.html?release=v4-imagefix-20261028', './manifest.webmanifest', './assets/icon-192.png', './assets/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method!=='GET') return;
  const url = new URL(event.request.url);
  if(url.origin!==location.origin) return;
  if(event.request.mode==='navigate') {
    event.respondWith(fetch(event.request).then(resp=>{
      if(resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}
      return resp;
    }).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html?release=v4-imagefix-20261028'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(r=>r||fetch(event.request).then(resp=>{
    if(resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}
    return resp;
  })));
});
