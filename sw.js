const CACHE = 'sunlit-secrets-v2-2400';
const ASSETS = ['./','./index.html','./styles.css','./data.js','./expansion.js','./app.js','./manifest.webmanifest', ...['meadow','orchard','coast','lavender','forest','moon'].map(x=>'./assets/'+x+'.svg'),'./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install', e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate', e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,copy));}return r;})));});
