const CACHE='sunlit-secrets-v5-approved-layout-20261029';
const APP='./index.html?release=v5-approved-layout-20261029';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll([APP,'./manifest.webmanifest','./assets/icon-192.png','./assets/icon-512.png'])).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;let u=new URL(e.request.url);if(u.origin!==location.origin)return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>{if(r.ok){let clone=r.clone();caches.open(CACHE).then(c=>c.put(e.request,clone));}return r;}).catch(()=>caches.match(e.request).then(r=>r||caches.match(APP))));return;}e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
