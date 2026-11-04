const V='suroway-v2';
const SHELL=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(V).then(async c=>{
      await Promise.all(SHELL.map(u=>
        c.add(u).catch(err=>console.warn('SW: gagal cache',u,err))
      ));
      await self.skipWaiting();
    })
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  if(/openstreetmap\.org|overpass|nominatim/.test(u.hostname))return;
  if(u.origin===location.origin&&u.pathname.endsWith('data.json')){
    e.respondWith(fetch(r).then(x=>{const c=x.clone();caches.open(V).then(ch=>ch.put(r,c));return x}).catch(()=>caches.match(r)));return;
  }
  const cdn=/cdn\.tailwindcss\.com|cdnjs\.cloudflare\.com/.test(u.hostname);
  if(u.origin===location.origin||cdn){
    e.respondWith(caches.match(r).then(hit=>{
      const net=fetch(r).then(x=>{if(x&&(x.ok||x.type==='opaque')){const c=x.clone();caches.open(V).then(ch=>ch.put(r,c))}return x}).catch(()=>hit);
      return hit||net;
    }));
  }
});
