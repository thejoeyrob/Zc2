const CACHE='zc2-community-v5120-grenades-loadout';
const ASSETS=["./404.html","./app.js","./apple-touch-icon.png","./arcade.css","./arcade.js","./boss-debo-stage1.png","./boss-debo-stage2.png","./boss-drmantis-stage1.png","./boss-drmantis-stage2.png","./boss-drmantis-stage3.png","./boss-fatamy-stage1.png","./boss-fatamy-stage2.png","./boss-fatamy-stage3.png","./boss-glowinghumanity-stage1.png","./boss-glowinghumanity-stage2.png","./boss-jordan-stage1.png","./boss-jordan-stage2.png","./bullet-dmr.png","./bullet-pistol.png","./bullet-smg.png","./boss-caffeinatedsloth-stage1.png","./boss-caffeinatedsloth-stage2.png","./player-right.png","./player-right-fire.png","./player-right-hit.png","./community-arena-emblem.png","./community-arena-join.webp","./community-arena-main.webp","./community-battlefield.webp","./config.json","./control-dpad.png","./control-fire.png","./control-left.png","./control-right.png","./font-barlow-condensed-600.woff2","./font-barlow-condensed-700.woff2","./font-barlow-condensed-800.woff2","./font-barlow-condensed-900.woff2","./font-bebas-neue-400.woff2","./font-inter.woff2","./font-material-symbols-rounded.woff2","./font-nosifer-400.woff2","./fx-muzzle.png","./hero.webp","./icon-192.png","./icon-512.png","./index.html","./invite-square.webp","./jw-eds-yellow.png","./manifest.webmanifest","./map-concrete.jpg","./map-desert.jpg","./map-hangar.jpg","./map-north.jpg","./map-wasteland.jpg","./pickup-bomb.png","./pickup-clock.png","./pickup-dmr.png","./pickup-heart.png","./pickup-shield.png","./pickup-smg.png","./pickup-speed.png","./player-dmr.png","./player-fire.png","./player-hit.png","./player-portrait.png","./player-rapid.png","./player-reaction.png","./player-shield.png","./player-transparent.png","./player-victory.png","./player-wounded.png","./share-preview.jpg","./skin-arcade.jpg","./skin-blood.jpg","./skin-founders.jpg","./skin-gold.jpg","./skin-gunmetal.jpg","./skin-hazard.jpg","./skin-jacko.jpg","./skin-milspec.jpg","./skin-neon.jpg","./skin-phantom.jpg","./skin-toxic.jpg","./styles.css","./sw.js","./vercel.json","./war-stain-1.png","./war-stain-2.png","./war-stain-3.png","./war-stain-4.png","./zc2-reference.webp","./zc2-zombie-smash-promo.png","./zombie-armored.png","./zombie-berserker.png","./zombie-brute.png","./zombie-helmet.png","./zombie-normal.png","./zombie-runner.png","./zombie-titan.png","./zombie-toxic.png"];
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
