/* Original locally bundled loops; playback begins inside a user gesture. */
(()=>{
 let current='classic',playing=false,fadeTimer;
 const tracks=Object.fromEntries(['classic','adventure','boss'].map(k=>{const a=new Audio('./music-'+k+'.mp3');a.loop=true;a.preload='none';a.volume=0;return[k,a]}));
 const cue=new Audio('./music-boss-entry.mp3');cue.preload='none';cue.volume=.32;
 const resume=a=>a.play().catch(()=>{});
 function crossfade(){clearInterval(fadeTimer);if(!playing)return;resume(tracks[current]);let n=0;fadeTimer=setInterval(()=>{n++;for(const [k,a] of Object.entries(tracks)){const target=k===current?.32:0;a.volume=Math.max(0,Math.min(1,a.volume+(target-a.volume)*.25));if(n>=18){a.volume=target;if(k!==current)a.pause()}}if(n>=18)clearInterval(fadeTimer)},40)}
 window.ZSSoundtrack={setMood(k){if(!tracks[k]||k===current)return;current=k;crossfade()},play(){playing=true;crossfade()},pause(){playing=false;clearInterval(fadeTimer);Object.values(tracks).forEach(a=>a.pause());cue.pause()},sting(){if(!playing)return;cue.currentTime=0;resume(cue)}};
})();
