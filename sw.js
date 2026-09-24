const CACHE='zc2-arena-v5-5-console-difficulty-score-resume';
const ASSETS=["./","./index.html","./styles.css","./arcade.css","./app.js","./arcade.js","./manifest.webmanifest","./icon-192.png","./icon-512.png","./apple-touch-icon.png","./community-arena-main.webp","./community-arena-emblem.png","./community-arena-join.webp","./community-battlefield.webp","./share-preview.jpg","./jw-eds-yellow.png","./zc2-zombie-smash-promo.png","./player-transparent.png","./zombie-normal.png","./zombie-helmet.png","./zombie-fast.png","./zombie-brute-3.png","./zombie-brute-2.png","./zombie-brute-1.png","./console-shell-premium.jpg","./console-shell-elite.jpg","./map-concrete.jpg","./map-desert.jpg","./map-north.jpg","./map-hangar.jpg","./map-wasteland.jpg","./skin-gunmetal.jpg","./skin-hazard.jpg","./skin-neon.jpg","./skin-jacko.jpg","./skin-milspec.jpg","./skin-arcade.jpg","./skin-blood.jpg","./skin-toxic.jpg","./skin-gold.jpg","./skin-founders.jpg","./skin-phantom.jpg"];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const req=event.request; const url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==self.location.origin)return;
  if(url.pathname.includes('/auth/v1/')||url.pathname.includes('/rest/v1/')||url.pathname.includes('/realtime/v1/')||url.pathname.includes('/storage/v1/')||url.pathname.includes('/functions/v1/'))return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return res;}).catch(()=>caches.match('./index.html')));
    return;
  }
  const shellFile=/\/(app\.js|arcade\.js|styles\.css|arcade\.css|manifest\.webmanifest)$/.test(url.pathname);
  if(shellFile){
    event.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return res;}).catch(()=>caches.match(req)));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return res;})));
});
