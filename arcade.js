(()=>{
'use strict';
const SKINS=[
 ['gunmetal','Gun Metal',0,'skin-gunmetal.jpg',false],['hazard','Hazard Tape',8000,'skin-hazard.jpg',false],['neon','Neon Rogue',18000,'skin-neon.jpg',false],['jacko','Jack-o-Gun',35000,'skin-jacko.jpg',false],['milspec','MilSpec',60000,'skin-milspec.jpg',false],['arcade','Arcade Blast',95000,'skin-arcade.jpg',false],['blood','Blood Steel',140000,'skin-blood.jpg',false],['toxic','Toxic Slime',195000,'skin-toxic.jpg',false],['gold','Gold Ops',260000,'skin-gold.jpg',false],['founders','Founder Black',350000,'skin-founders.jpg',false],['phantom','PHANTOM ELITE',2000000000,'skin-phantom.jpg',true]
].map(([id,name,unlock,img,codeOnly])=>({id,name,unlock,img,codeOnly}));
const WEAPONS={pistol:{name:'PISTOL',ammo:Infinity,damage:1,delay:.30,speed:720},smg:{name:'SMG',ammo:48,damage:1,delay:.105,speed:800},dmr:{name:'DMR-82',ammo:8,damage:99,delay:.48,speed:940}};
const MAPS=[
 {id:'concrete',name:'THE GROUND',img:'map-concrete.jpg'},
 {id:'desert',name:'DESERT DUST',img:'map-desert.jpg'},
 {id:'north',name:'NORTH ASSAULT',img:'map-north.jpg'},
 {id:'hangar',name:'HANGAR',img:'map-hangar.jpg'},
 {id:'wasteland',name:'WASTELAND',img:'map-wasteland.jpg'}
];
const SPRITES={
 player:'player-transparent.png',playerFire:'player-fire.png',playerHit:'player-hit.png',playerRapid:'player-rapid.png',playerDmr:'player-dmr.png',playerShield:'player-shield.png',
 playerReaction:'player-reaction.png',playerVictory:'player-victory.png',playerPortrait:'player-portrait.png',playerWounded:'player-wounded.png',
 normal:'zombie-normal.png',runner:'zombie-runner.png',helmet:'zombie-helmet.png',armored:'zombie-armored.png',toxic:'zombie-toxic.png',brute:'zombie-brute.png',berserker:'zombie-berserker.png',titan:'zombie-titan.png'
};
const PICKUP_SPRITES={heart:'pickup-heart.png',clock:'pickup-clock.png',speed:'pickup-speed.png',shield:'pickup-shield.png',bomb:'pickup-bomb.png',smg:'pickup-smg.png',dmr:'pickup-dmr.png',rapid:'fx-muzzle.png'};
const BULLET_SPRITES={pistol:'bullet-pistol.png',smg:'bullet-smg.png',dmr:'bullet-dmr.png'};
const UI_SPRITES={dialog:'frame-dialog.png',screenFrame:'frame-screen.png',statusFrame:'frame-statusbar.png',weaponFrame:'frame-weapons.png',bossWarning:'hud-boss-warning.png',energyFrame:'hud-energy-frame.png',energyFill:'hud-energy-fill.png',lifeEmblem:'hud-life-emblem.png',helmet:'item-helmet.png'};
const STAIN_SPRITES={1:'war-stain-1.png',2:'war-stain-2.png',3:'war-stain-3.png',4:'war-stain-4.png'};
const BOSS_DEFS=[
 {id:'fatamy',name:'FAT AMY',title:'BRAINWASHED BRUISER',threshold:8000,type:'brute',hp:44,speed:13,points:5000,scale:1.28,stages:3,sprites:['boss-fatamy-stage1.png','boss-fatamy-stage2.png','boss-fatamy-stage3.png'],announce:'OMG... is that FAT AMY?!',react:'Mantis has turned Amy into a tank.',stageLines:['Amy is changing...','She is getting bigger. Keep firing!','Final form. Do not let her through!'],finalLine:'Amy: "Enough... I remember who I am."',victory:'Joey Rob: "That is one of Mantis\'s experiments stopped."'},
 {id:'glowinghumanity',name:'GLOWING HUMANITY',title:'RADIANT TEST SUBJECT',threshold:20000,type:'toxic',hp:52,speed:14,points:6500,scale:1.30,stages:2,sprites:['boss-glowinghumanity-stage1.png','boss-glowinghumanity-stage2.png'],announce:'GLOWING HUMANITY?!',react:'That glow is getting stronger.',stageLines:['The radiation is spiking!','Full neon mutation. Finish it!'],finalLine:'Glowing Humanity: "The glow... is fading."',victory:'Joey Rob: "Mantis does not get another test subject."'},
 {id:'debo',name:'DEBO',title:'IRON ENFORCER',threshold:36000,type:'armored',hp:64,speed:15,points:8000,scale:1.34,stages:2,sprites:['boss-debo-stage1.png','boss-debo-stage2.png'],announce:'DEBO?! This just got serious.',react:'That armour is not decorative.',stageLines:['Debo is still coming!','Armour cracked. Keep the pressure on!'],finalLine:'Debo: "Armour cracked... finally."',victory:'Joey Rob: "Big man is down. Keep moving."'},
 {id:'jordan',name:'JORDAN',title:'FALLEN FIREFIGHTER',threshold:55000,type:'berserker',hp:78,speed:16,points:10000,scale:1.38,stages:2,sprites:['boss-jordan-stage1.png','boss-jordan-stage2.png'],announce:'JORDAN?! Mantis got to him too.',react:'He is burning through the line.',stageLines:['The fire is spreading!','Jordan is fully ignited!'],finalLine:'Jordan: "Tell them... I held the line."',victory:'Joey Rob: "You did. Mantis is next."'},
 {id:'drmantis',name:'DR MANTIS',title:'HARVEST MASTER',threshold:null,type:'titan',hp:165,speed:14,points:18000,scale:1.58,stages:3,sprites:['boss-drmantis-stage1.png','boss-drmantis-stage2.png','boss-drmantis-stage3.png'],announce:'DR MANTIS... this ends NOW.',react:'King robes, crown and all. Time to end this.',stageLines:['His crown is down — something is happening!','Half human. Half mantis. Keep shooting!','FULL MANTIS FORM!'],finalLine:'Dr Mantis: "The harvest... cannot end here..."',victory:'Joey Rob: "Mantis is down. Infinite survival starts now."'}
];
let deps={};
let A={prefs:null,open:false,menu:false,tab:'menu',paused:false,engine:null,board:[],loading:false,images:{},audio:null,cheat:null,joystick:{active:false,pointer:null,x:0,y:0},adminAtOpen:false};
const $=(q,r=document)=>r.querySelector(q), $$=(q,r=document)=>[...r.querySelectorAll(q)];
const state=()=>deps.getState?.()||{}; const icon=n=>deps.icon?deps.icon(n):n; const esc=v=>deps.esc?deps.esc(v):String(v||''); const toast=m=>deps.setToast?.(m);
const skin=id=>SKINS.find(s=>s.id===id)||SKINS[0];
function init(d){deps=d;loadPrefs();preload();resetCheat();window.addEventListener('resize',()=>{if(A.open){resizeCanvas();draw();}});document.addEventListener('dblclick',blockZoom,{passive:false});document.addEventListener('gesturestart',blockZoom,{passive:false});document.addEventListener('touchmove',blockGameMove,{passive:false});document.addEventListener('visibilitychange',()=>{if(A.open&&document.hidden){A.paused=true;stopLoop();pauseAndStore('Paused while away.');submitScore(true).catch?.(()=>{});}});window.addEventListener('pagehide',()=>{if(A.open){A.paused=true;stopLoop();pauseAndStore('Paused while away.');submitScore(true).catch?.(()=>{});}});}function blockGameMove(e){if(A.open&&e.target.closest?.('#zs52Root'))e.preventDefault();}
function blockZoom(e){if(A.open){e.preventDefault();e.stopPropagation();}}
function loadPrefs(){const keys=['zc2-zs-prefs','zc2-zs-v56','zc2-zs-v55','zc2-zs-v54','zc2-zs-v53'];let merged={skin:'gunmetal',high:0,last:0,music:true,flip:false,codeSkins:[]};for(const key of keys){try{const p=JSON.parse(localStorage.getItem(key)||'{}');if(Number(p.high||0)>=merged.high){merged.high=Number(p.high||0);if(p.skin)merged.skin=p.skin;}merged.last=Math.max(merged.last,Number(p.last||0));if(p.music===false)merged.music=false;if(p.flip)merged.flip=true;if(Array.isArray(p.codeSkins))merged.codeSkins=[...new Set([...merged.codeSkins,...p.codeSkins])];}catch{}}A.prefs={skin:merged.skin||'gunmetal',high:merged.high,last:merged.last,music:merged.music!==false,flip:!!merged.flip,control:'buttons',codeSkins:merged.codeSkins};if(!isUnlocked(A.prefs.skin))A.prefs.skin='gunmetal';savePrefs();}
function savePrefs(){localStorage.setItem('zc2-zs-prefs',JSON.stringify(A.prefs));}
function adminUnlocked(){return !!state().admin;}
function isUnlocked(id){const s=skin(id);return id==='gunmetal'||adminUnlocked()||A.prefs.high>=s.unlock||A.prefs.codeSkins.includes(id);}function refreshSkinCards(){const best=$('#zs52PersonalBest');if(best)best.textContent=A.prefs.high.toLocaleString();$$('[data-zs-skin]').forEach(b=>{const id=b.dataset.zsSkin,s=skin(id),unlocked=isUnlocked(id),selected=A.prefs.skin===id;b.disabled=!unlocked;b.classList.toggle('locked',!unlocked);b.classList.toggle('unlocked',unlocked);b.classList.toggle('selected',selected);const sm=b.querySelector('small');if(sm)sm.textContent=selected?'EQUIPPED':unlocked?'TAP TO EQUIP':s.codeOnly?'SPECIAL CODE ONLY':'UNLOCK '+s.unlock.toLocaleString();const st=b.querySelector('.zs52-skin-state');if(st)st.innerHTML=selected?icon('check_circle'):unlocked?icon('lock_open'):icon('lock');});}
function ensureImage(key,src){
 if(!A.images[key]){const im=new Image();im.decoding='async';im.src='./'+src;A.images[key]=im}return A.images[key];
}
function preload(){
 Object.entries(SPRITES).forEach(([k,src])=>ensureImage(k,src));
 Object.entries(PICKUP_SPRITES).forEach(([k,src])=>ensureImage('pickup_'+k,src));
 Object.entries(BULLET_SPRITES).forEach(([k,src])=>ensureImage('bullet_'+k,src));
 ensureImage('ui_dialog',UI_SPRITES.dialog);
 ensureImage('map_'+MAPS[0].id,MAPS[0].img);
}
function resetCheat(){A.cheat={dmrPhase:0,musicCount:0,dmrArmed:false,lifeFlipCount:0,lifeSawInstructions:false,lifeArmed:false};}
const RUN_KEY='zc2-zs-run';
function pauseAndStore(msg='Run paused.'){
 const e=A.engine;if(!e||e.over||!e.started)return;
 try{localStorage.setItem(RUN_KEY,JSON.stringify({savedAt:Date.now(),engine:{
  started:e.started,over:e.over,elapsed:e.elapsed,wave:e.wave,mapIndex:e.mapIndex,mapBanner:0,between:e.between,waveTarget:e.waveTarget,waveSpawned:e.waveSpawned,waveResolved:e.waveResolved,
  spawnTimer:e.spawnTimer,pickupTimer:e.pickupTimer,formationTimer:e.formationTimer,scoreSyncTimer:e.scoreSyncTimer,lastFormation:e.lastFormation,breaches:e.breaches,breachLimit:e.breachLimit,
  score:e.score,kills:e.kills,slowUntil:e.slowUntil,speedUntil:e.speedUntil,rapidUntil:e.rapidUntil,shieldUntil:e.shieldUntil,ticker:msg||e.ticker,bullets:e.bullets,zombies:e.zombies,pickups:e.pickups,
  player:e.player,fireHeld:false,cheated:e.cheated,cheats:e.cheats,infinite:!!e.infinite,bossesSeen:e.bossesSeen,bossIntro:e.bossIntro,bossSpeech:e.bossSpeech,bossSubtitle:e.bossSubtitle,
  bossName:e.bossName,bossDefeated:e.bossDefeated,bossVictory:e.bossVictory,bossCooldown:e.bossCooldown,bossMusicUntil:e.bossMusicUntil
 }}));}catch(err){console.warn('pause save failed',err)}
}
function clearStoredRun(){try{localStorage.removeItem(RUN_KEY)}catch{}}
function getStoredRun(){try{return JSON.parse(localStorage.getItem(RUN_KEY)||'null')}catch{return null}}
function restoreRun(){
 const data=getStoredRun();if(!data?.engine)return false;newRun(false);Object.assign(A.engine,data.engine,{canvas:null,ctx:null,last:0,raf:0,fireHeld:false});
 A.engine.formationTimer=Number.isFinite(A.engine.formationTimer)?A.engine.formationTimer:18;
 A.engine.scoreSyncTimer=Number.isFinite(A.engine.scoreSyncTimer)?A.engine.scoreSyncTimer:25;
 A.engine.lastFormation=A.engine.lastFormation||'';A.engine.ticker=data.engine.ticker||'Run resumed';
 A.engine.bossesSeen=A.engine.bossesSeen||{};A.engine.bossIntro=A.engine.bossIntro||0;A.engine.bossSpeech=A.engine.bossSpeech||'';A.engine.bossSubtitle=A.engine.bossSubtitle||'';
 A.engine.bossName=A.engine.bossName||'';A.engine.bossDefeated=!!A.engine.bossDefeated;A.engine.bossVictory=A.engine.bossVictory||'';A.engine.bossCooldown=A.engine.bossCooldown||0;A.engine.bossMusicUntil=A.engine.bossMusicUntil||0;
 A.engine.player.fireFxUntil=A.engine.player.fireFxUntil||0;A.engine.player.victoryUntil=A.engine.player.victoryUntil||0;
 return true;
}
function checkSkinUnlocks(before,after){const fresh=SKINS.filter(s=>!s.codeOnly&&s.unlock>before&&s.unlock<=after);if(fresh.length)toast(`Console skin unlocked: ${fresh.map(s=>s.name).join(', ')}`);refreshSkinCards();}
async function syncProfile(){if(!state().session)return;try{const {data}=await deps.supabase.from('arcade_profiles').select('high_score,selected_skin,unlocked_skins').eq('user_id',state().session.user.id).maybeSingle();if(!data)return;A.prefs.high=Math.max(A.prefs.high,Number(data.high_score||0));A.prefs.codeSkins=[...new Set([...(A.prefs.codeSkins||[]),...(data.unlocked_skins||[])])];if(data.selected_skin&&isUnlocked(data.selected_skin))A.prefs.skin=data.selected_skin;savePrefs();}catch(e){console.warn(e)}}
function pageHtml(){const top=A.board.slice(0,10);const cards=SKINS.map(s=>{const unlocked=isUnlocked(s.id),selected=A.prefs.skin===s.id;return `<button class="zs52-skin ${unlocked?'unlocked':'locked'} ${selected?'selected':''} ${s.codeOnly?'elite':''}" data-zs-skin="${s.id}" ${unlocked?'':'disabled'}><span class="zs52-skin-preview"><img src="./${s.img}" alt="${esc(s.name)}"></span><span class="zs52-skin-copy"><b>${esc(s.name)}</b><small>${selected?'EQUIPPED':unlocked?'TAP TO EQUIP':s.codeOnly?'SPECIAL CODE ONLY':'UNLOCK '+s.unlock.toLocaleString()}</small></span><span class="zs52-skin-state">${selected?icon('check_circle'):unlocked?icon('lock_open'):icon('lock')}</span></button>`}).join('');return `<section class="zs52-hub"><div class="section-title"><span class="kicker">ARCADE</span><h2>Joey Rob vs Dr Mantis</h2><p>Three-button vertical horde defence. Joey Rob faces north and fires up-screen while Dr Mantis experiments descend toward the defence line.</p></div><div class="zs52-hero"><img src="./zc2-zombie-smash-promo.png" alt="Zombie Smash"><div><span class="live-pill"><i></i>HORDE DEFENCE</span><h1>DEFEND THE BASE.<br><em>BEAT THE BOARD.</em></h1><p>The original straight-fire gameplay stays intact. Score-threshold bosses interrupt the horde, damage states visibly mutate them, and Dr Mantis arrives when the infinite wave begins.</p><div class="hero-stats"><span><b id="zs52PersonalBest">${A.prefs.high.toLocaleString()}</b> personal best</span><span><b>10</b> breach limit</span><span><b>5</b> boss encounters</span></div><div class="action-row"><button class="btn primary big" id="zs52Play">${icon('sports_esports')}Play Zombie Smash</button><button class="btn glass big" id="zs52BoardJump">${icon('leaderboard')}Leaderboard</button></div></div></div><div class="zs52-grid"><article class="panel premium-panel"><div class="panel-head"><div><span class="kicker">HORDE RULES</span><h2>Survival system</h2></div></div><div class="zs52-rules"><div>${icon('south')}<span><b>Three speed stages</b>Standard walkers accelerate at mid-game and again when the infinite wave starts.</span></div><div>${icon('shield')}<span><b>Armoured specials</b>Helmet, armoured, toxic, brute, berserker and titan zombies take progressively more fire.</span></div><div>${icon('groups')}<span><b>Formation attacks</b>Rare line rushes, wedges, heavy pushes and mixed assault groups appear as the run develops.</span></div><div>${icon('ads_click')}<span><b>Straight fire</b>LEFT / RIGHT to line up. FIRE always shoots forward. No auto-aim.</span></div><div>${icon('bolt')}<span><b>Rare pickups</b>Pickups stay on your movement line and become more varied later in the run.</span></div></div></article><article class="panel premium-panel zs52-skins-panel"><div class="panel-head"><div><span class="kicker">CONSOLE SKINS</span><h2>Choose your shell</h2><p>Unlocked skins can be equipped here before you start.</p></div></div><div class="zs52-skin-grid">${cards}</div></article><article class="panel premium-panel" id="zs52BoardPanel"><div class="panel-head"><div><span class="kicker">ALL-TIME</span><h2>Community high scores</h2></div><button id="zs52Refresh">Refresh ›</button></div><div id="zs52Board">${boardRows(top)}</div></article></div></section>`}
function boardRows(rows){return rows?.length?rows.map((r,i)=>`<div class="rank-row"><span class="place">${r.rank||i+1}</span><span class="name">${esc(r.gamertag||'Player')}</span><span class="metric">${Number(r.high_score||0).toLocaleString()}</span><small>${esc(skin(r.selected_skin||'gunmetal').name)}</small></div>`).join(''):`<div class="empty"><div>${icon('leaderboard')}<div>No score posted yet.</div></div></div>`}
async function loadBoard(){if(A.loading)return;A.loading=true;try{let rows=[];const rpc=await deps.supabase.rpc('get_arcade_leaderboard',{p_limit:100});if(!rpc.error&&Array.isArray(rpc.data))rows=rpc.data;if(!rows.length){const {data,error}=await deps.supabase.from('arcade_profiles').select('user_id,high_score,selected_skin');if(error)throw error;const ps=state().profiles||[];rows=(data||[]).map(r=>({user_id:r.user_id,gamertag:ps.find(p=>p.id===r.user_id)?.gamertag||'Player',high_score:r.high_score||0,selected_skin:r.selected_skin||'gunmetal'})).sort((a,b)=>Number(b.high_score)-Number(a.high_score));}A.board=rows.map((r,i)=>({...r,rank:i+1}));}catch(e){console.warn('Arcade leaderboard:',e)}finally{A.loading=false;const el=$('#zs52Board');if(el)el.innerHTML=boardRows(A.board.slice(0,20));}}
function bindPage(){$('#zs52Play')?.addEventListener('click',open);$('#zs52Refresh')?.addEventListener('click',loadBoard);$('#zs52BoardJump')?.addEventListener('click',()=>$('#zs52BoardPanel')?.scrollIntoView({behavior:'smooth',block:'start'}));$$('[data-zs-skin]').forEach(b=>b.addEventListener('click',()=>selectSkin(b.dataset.zsSkin)));syncProfile().then(refreshSkinCards);loadBoard();}
async function open(){await syncProfile();A.adminAtOpen=adminUnlocked();A.open=true;A.menu=false;A.paused=false;document.documentElement.classList.add('zs52-locked');document.body.classList.add('zs52-playing');try{await screen.orientation?.lock?.('portrait')}catch{}try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen()}catch{}if(!restoreRun())newRun();renderOverlay();if(A.engine?.started)startLoop();}
function close(saveProgress=true){if(saveProgress&&A.engine&&!A.engine.over&&A.engine.started){pauseAndStore('Run paused - tap Play to resume.');submitScore(true).catch?.(()=>{});}else if(!saveProgress)clearStoredRun();stop();A.open=false;A.menu=false;document.documentElement.classList.remove('zs52-locked');document.body.classList.remove('zs52-playing');try{screen.orientation?.unlock?.()}catch{}try{if(document.fullscreenElement)document.exitFullscreen?.()}catch{}$('#zs52Root')?.remove();refreshSkinCards();}
function newRun(clear=true){
 if(clear)clearStoredRun();resetCheat();
 A.engine={canvas:null,ctx:null,w:0,h:0,last:0,raf:0,started:false,over:false,elapsed:0,wave:1,mapIndex:0,mapBanner:2.2,between:0,waveTarget:16,waveSpawned:0,waveResolved:0,
 spawnTimer:.32,pickupTimer:24,formationTimer:18,scoreSyncTimer:25,lastFormation:'',breaches:0,breachLimit:10,score:0,kills:0,slowUntil:0,speedUntil:0,rapidUntil:0,shieldUntil:0,
 ticker:'Press LEFT, RIGHT or FIRE to start',bullets:[],zombies:[],pickups:[],player:{x:0,y:0,r:21,lives:5,maxLives:5,inv:0,move:{x:0,y:0},gun:'pistol',ammo:Infinity,cool:0,fireFxUntil:0,victoryUntil:0},
 fireHeld:false,cheated:false,cheats:{dmr:false,tenLives:false},infinite:false,bossesSeen:{},bossIntro:0,bossSpeech:'',bossSubtitle:'',bossName:'',bossDefeated:false,bossVictory:'',bossCooldown:0,bossMusicUntil:0};
}
function renderOverlay(){let r=$('#zs52Root');if(!r){r=document.createElement('div');r.id='zs52Root';document.body.appendChild(r)}if(innerWidth>innerHeight){r.innerHTML=`<div class="zs52-overlay"><div class="zs52-portrait-warning"><img src="./community-arena-emblem.png" alt=""><span class="kicker">ZC2 ARENA</span><h2>Keep it portrait</h2><p>Zombie Smash is built as a tall handheld console. Rotate your device upright to play.</p><button class="btn primary big" id="zs52PortraitExit">Exit game</button></div></div>`;$('#zs52PortraitExit').onclick=close;return}r.innerHTML=consoleHtml();bindOverlay();resizeCanvas();draw();hud();}
function consoleHtml(){const s=skin(A.prefs.skin);return `<div class="zs52-overlay"><div class="zs52-shell skin-${s.id}" style="--skin-art:url('./${s.img}')"><div class="zs52-skinwash"></div><div class="zs52-screen"><div class="zs52-hudtop"><span><small>WAVE</small><b id="zs52Wave">1</b></span><span><small>ZOMBIES</small><b id="zs52Remaining">10</b></span><span><small>SCORE</small><b id="zs52Score">0</b></span><span><small>BASE</small><b id="zs52Base">0/10</b></span></div><canvas id="zs52Canvas"></canvas><div class="zs52-hudbottom"><div id="zs52Lives" class="zs52-lives"></div><div><small>WEAPON</small><b id="zs52Gun">PISTOL</b><span id="zs52Ammo">∞</span></div><div><small>GROUND</small><b id="zs52Map">CONCRETE</b></div></div><div id="zs52WaveBanner" class="zs52-wave-banner"></div></div><button class="zs52-topbtn menu" id="zs52Menu">${icon('menu')}<span>MENU</span></button><button class="zs52-topbtn pause" id="zs52Pause">${icon('pause')}<span>PAUSE</span></button><div class="zs52-move-zone ${A.prefs.flip?'flipped':''}"><span>MOVE</span><div class="zs52-lr"><button data-dir="left" class="left" aria-label="Move left"><b>◀</b><small>LEFT</small></button><button data-dir="right" class="right" aria-label="Move right"><b>▶</b><small>RIGHT</small></button></div></div><button class="zs52-fire ${A.prefs.flip?'flipped':''}" id="zs52Fire"><span class="zs52-fire-glow"></span>${icon('local_fire_department')}<b>FIRE</b><small>TAP / HOLD</small></button><button class="zs52-exit" id="zs52Exit" aria-label="Exit game">${icon('close')}</button><div class="zs52-ticker" id="zs52Ticker">${esc(A.engine?.ticker||'')}</div>${A.menu?menuHtml():''}</div></div>`}
function dpadHtml(){return ''}
function joystickHtml(){return ''}
function menuHtml(){const skins=SKINS.map(s=>`<button class="zs52-menu-skin ${isUnlocked(s.id)?'':'locked'} ${A.prefs.skin===s.id?'active':''} ${s.codeOnly?'elite':''}" data-skin="${s.id}" ${isUnlocked(s.id)?'':'disabled'}><img src="./${s.img}" alt=""><span><b>${esc(s.name)}</b><small>${A.prefs.skin===s.id?'EQUIPPED':isUnlocked(s.id)?(adminUnlocked()&&A.prefs.high<s.unlock&&!A.prefs.codeSkins.includes(s.id)?'ADMIN ACCESS':'UNLOCKED'):s.codeOnly?'SPECIAL CODE ONLY':'Unlock '+s.unlock.toLocaleString()}</small></span></button>`).join('');let body='';if(A.tab==='instructions')body=`<div class="zs52-instructions"><article><b>Defend the camp</b><span>Ten breaches ends the run. Four bosses unlock by score; Dr Mantis enters with the infinite wave.</span></article><article><b>Movement</b><span>Hold LEFT or RIGHT. Joey Rob stays on the bottom defence line, facing north.</span></article><article><b>Fire</b><span>Tap or hold FIRE. Every shot travels straight up-screen; zombies advance downward.</span></article><article><b>Zombie armour</b><span>Walkers are one shot. Helmet 3 · Toxic 4 · Armoured 5 · Berserker 6 · Brute 8 · Titan 14.</span></article><article><b>Special attacks</b><span>Rare line rushes, wedges, fast swarms and heavy mixed formations begin as the run develops.</span></article><article><b>Power-ups</b><span>Pick-ups are deliberately rare and appear directly on your movement line.</span></article></div>`;else if(A.tab==='leaderboard')body=`<div class="zs52-menu-board">${boardRows(A.board.slice(0,25))}</div>`;else if(A.tab==='skins')body=`<div class="zs52-code"><input id="zs52SkinCode" maxlength="4" inputmode="numeric" placeholder="4-digit skin code"><button class="btn primary" id="zs52Redeem">Unlock</button><small>Score skins unlock automatically. Enter a code only for special editions.</small></div><div class="zs52-menu-skins">${skins}</div>`;else body=`<div class="zs52-menu-actions"><button class="btn primary big" id="zs52Resume">${icon('play_arrow')}Resume</button><button class="btn secondary big" id="zs52Flip">${icon('swap_horiz')}Swap sides: ${A.prefs.flip?'ON':'OFF'}</button><button class="btn secondary big" id="zs52Music">${icon(A.prefs.music?'volume_up':'volume_off')}Sound: ${A.prefs.music?'ON':'OFF'}</button><button class="btn danger big" id="zs52Quit">${icon('logout')}Exit to app</button></div>`;return `<div class="zs52-menu-layer"><div class="zs52-menu-box"><header><div><span class="kicker">ZC2 ARENA</span><h2>Zombie Smash</h2></div><button id="zs52MenuClose">${icon('close')}</button></header><nav>${['menu','instructions','leaderboard','skins'].map(t=>`<button data-tab="${t}" class="${A.tab===t?'active':''}">${t}</button>`).join('')}</nav>${body}</div></div>`}
function bindOverlay(){$('#zs52Exit')?.addEventListener('click',()=>close(true));$('#zs52Menu')?.addEventListener('click',openMenu);$('#zs52Pause')?.addEventListener('click',togglePause);$('#zs52MenuClose')?.addEventListener('click',closeMenu);$('#zs52Resume')?.addEventListener('click',closeMenu);$('#zs52Quit')?.addEventListener('click',()=>close(true));$('#zs52Flip')?.addEventListener('click',toggleFlip);$('#zs52Music')?.addEventListener('click',toggleMusic);$('#zs52Redeem')?.addEventListener('click',redeemCode);$$('[data-tab]').forEach(b=>b.onclick=()=>{A.tab=b.dataset.tab;if(A.tab==='instructions'&&!A.engine.started)A.cheat.lifeSawInstructions=true;renderOverlay()});$$('[data-skin]').forEach(b=>b.onclick=()=>selectSkin(b.dataset.skin));bindMovement();const f=$('#zs52Fire');if(f){const on=e=>{e.preventDefault();startGameIfNeeded();A.engine.fireHeld=true;shoot(true);f.classList.add('pressed')};const off=e=>{e?.preventDefault?.();if(A.engine)A.engine.fireHeld=false;f.classList.remove('pressed')};f.addEventListener('pointerdown',on);f.addEventListener('pointerup',off);f.addEventListener('pointercancel',off);f.addEventListener('pointerleave',off)} }
function bindMovement(){
  $$('[data-dir]').forEach(b=>{const d=b.dataset.dir;const on=e=>{e.preventDefault();startGameIfNeeded();A.engine.player.move={x:d==='left'?-1:1,y:0};b.classList.add('pressed');try{b.setPointerCapture?.(e.pointerId)}catch{}};const off=e=>{e?.preventDefault?.();if(A.engine)A.engine.player.move={x:0,y:0};b.classList.remove('pressed')};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('lostpointercapture',off)});
}
function openMenu(){A.menu=true;A.paused=true;stopLoop();renderOverlay()}
function closeMenu(){if(!A.engine.started&&A.cheat.dmrPhase===1&&A.cheat.musicCount>=6){A.cheat.dmrPhase=2;A.cheat.musicCount=0}if(!A.engine.started&&A.cheat.lifeFlipCount>=5&&A.cheat.lifeSawInstructions)A.cheat.lifeArmed=true;A.menu=false;A.paused=false;renderOverlay();startLoop()}
function togglePause(){A.paused=!A.paused;if(A.paused)stopLoop();else startLoop();hud()}
function toggleFlip(){A.prefs.flip=!A.prefs.flip;savePrefs();if(!A.engine.started)A.cheat.lifeFlipCount++;renderOverlay()}
function toggleMusic(){A.prefs.music=!A.prefs.music;savePrefs();if(!A.engine.started){A.cheat.musicCount++;if(A.cheat.dmrPhase===0&&A.cheat.musicCount>=6){A.cheat.dmrPhase=1;A.cheat.musicCount=6}else if(A.cheat.dmrPhase===2&&A.cheat.musicCount>=6)A.cheat.dmrArmed=true}A.prefs.music?startMusic():stopMusic();renderOverlay()}
async function redeemCode(){const code=$('#zs52SkinCode')?.value.trim();if(!/^\d{4}$/.test(code||''))return toast('Enter a 4-digit skin code.');try{const {data,error}=await deps.supabase.rpc('redeem_arcade_skin_code',{p_code:code});if(error)throw error;if(!data)return toast('Code not recognised.');A.prefs.codeSkins=[...new Set([...(A.prefs.codeSkins||[]),data])];A.prefs.skin=data;savePrefs();toast(`${skin(data).name} unlocked.`);renderOverlay()}catch(e){toast(state().session?'Code could not be redeemed.':'Sign in to redeem skin codes.')}}
async function selectSkin(id){if(!isUnlocked(id))return toast('Reach the required high score to unlock this skin.');A.prefs.skin=id;savePrefs();if(state().session){try{const r=await deps.supabase.rpc('set_arcade_skin',{p_skin:id});if(r?.error)await deps.supabase.from('arcade_profiles').upsert({user_id:state().session.user.id,selected_skin:id,high_score:A.prefs.high,unlocked_skins:A.prefs.codeSkins||[]},{onConflict:'user_id'});}catch{}}if(A.open)renderOverlay();else{refreshSkinCards();toast(`${skin(id).name} equipped.`);}}
function startGameIfNeeded(){if(!A.engine||A.engine.started)return;applyCheats();A.engine.started=true;A.engine.ticker=A.engine.cheated?'CHEAT RUN · LEADERBOARD DISABLED':'Wave 1 incoming';startLoop()}
function applyCheats(){const e=A.engine;if(A.cheat.dmrArmed){e.cheated=true;e.cheats.dmr=true;e.player.gun='dmr';e.player.ammo=Infinity}if(A.cheat.lifeArmed){e.cheated=true;e.cheats.tenLives=true;e.player.maxLives=10;e.player.lives=10}hud()}
function resizeCanvas(){const c=$('#zs52Canvas'),e=A.engine;if(!c||!e)return;const r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);c.width=Math.max(1,Math.round(r.width*d));c.height=Math.max(1,Math.round(r.height*d));e.ctx=c.getContext('2d');e.w=r.width;e.h=r.height;if(!e.player.x){e.player.x=e.w*.5;e.player.y=e.h*.84}else{e.player.y=e.h*.84}e.canvas=c}
function startLoop(){if(!A.open||A.paused||A.menu||!A.engine)return;stopLoop();const loop=ts=>{const e=A.engine;if(!A.open||A.paused||A.menu||e.over)return;if(!e.last)e.last=ts;const dt=Math.min(.033,(ts-e.last)/1000||.016);e.last=ts;update(dt);draw();hud();e.raf=requestAnimationFrame(loop)};A.engine.raf=requestAnimationFrame(loop);if(A.prefs.music)startMusic()}
function stopLoop(){if(A.engine?.raf)cancelAnimationFrame(A.engine.raf);if(A.engine)A.engine.raf=0}
function stop(){stopLoop();stopMusic()}
function waveCount(w){if(w>=10)return 999999;return 13+w*5+Math.floor(w/2)*3}
function startNextWave(){
 const e=A.engine;setMusicMood('moody');e.wave++;e.mapIndex=Math.floor((e.wave-1)/2)%MAPS.length;
 Object.keys(A.images).filter(k=>k.startsWith('map_')&&k!=='map_'+MAPS[e.mapIndex].id).forEach(k=>delete A.images[k]);
 ensureImage('map_'+MAPS[e.mapIndex].id,MAPS[e.mapIndex].img);e.infinite=e.wave>=10;e.waveTarget=waveCount(e.wave);e.waveSpawned=0;e.waveResolved=0;e.spawnTimer=.42;
 e.formationTimer=e.infinite?10:Math.max(12,22-e.wave*.9);e.between=0;e.mapBanner=2.1;e.ticker=e.infinite?'FINAL WAVE · DR MANTIS INBOUND':`Wave ${e.wave} · ${MAPS[e.mapIndex].name}`;
 if(e.infinite&&!e.bossesSeen.drmantis&&!activeBoss(e))spawnBoss(BOSS_DEFS.find(b=>b.id==='drmantis'));
}
function update(dt){
 const e=A.engine;if(!e||e.over||!e.started)return;e.elapsed+=dt;
 const p=e.player,pSpeed=92*(e.elapsed<e.speedUntil?1.82:1);p.x+=p.move.x*pSpeed*dt;p.x=Math.max(30,Math.min(e.w-30,p.x));p.y=e.h*.84;p.inv=Math.max(0,p.inv-dt);p.cool=Math.max(0,p.cool-dt);
 e.bossIntro=Math.max(0,(e.bossIntro||0)-dt);e.bossCooldown=Math.max(0,(e.bossCooldown||0)-dt);if(e.bossMusicUntil&&e.elapsed>=e.bossMusicUntil){e.bossMusicUntil=0;setMusicMood('moody');}
 if(e.fireHeld)shoot(false);if(e.mapBanner>0)e.mapBanner-=dt;if(e.between>0){e.between-=dt;if(e.between<=0)startNextWave();return}
 maybeSpawnScoreBoss();
 e.spawnTimer-=dt;e.formationTimer-=dt;const liveCap=e.infinite?42:Math.min(38,10+Math.floor(e.wave*1.8));
 if(e.wave>=3&&e.formationTimer<=0&&e.zombies.length<=liveCap-7){spawnFormation();e.formationTimer=(e.infinite?11+Math.random()*5:Math.max(14,27-e.wave*1.15)+Math.random()*7);}
 if((e.infinite||e.waveSpawned<e.waveTarget)&&e.spawnTimer<=0&&e.zombies.length<liveCap){spawnZombie();e.waveSpawned++;e.spawnTimer=(e.infinite?Math.max(.17,.39-Math.min(.16,e.elapsed*.0015)):Math.max(.24,.88-e.wave*.066))+Math.random()*.07}
 e.pickupTimer-=dt;if(e.pickupTimer<=0){if(e.wave>=4&&Math.random()<(e.infinite?.65:e.wave>=7?.55:.42)&&e.pickups.length<1)spawnPickup(false);e.pickupTimer=(e.infinite?20:24)+Math.random()*12;}
 e.scoreSyncTimer-=dt;if(e.scoreSyncTimer<=0){e.scoreSyncTimer=25;if(state().session&&e.score>0&&!e.cheated)submitScore(true).catch?.(()=>{});}
 for(const b of e.bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt}e.bullets=e.bullets.filter(b=>b.life>0&&b.x>-20&&b.x<e.w+20&&b.y>-20&&b.y<e.h+20);
 const slowZ=e.elapsed<e.slowUntil?.45:1;
 for(const z of e.zombies){
  z.flash=Math.max(0,z.flash-dt);if(z.dead){z.death=(z.death||0)-dt;continue}
  if(z.type==='brute'||z.type==='titan'){const dx=p.x-z.x,dy=p.y-z.y,l=Math.hypot(dx,dy)||1;z.x+=dx/l*z.speed*.28*slowZ*dt;z.y+=z.speed*slowZ*dt}
  else if(z.type==='berserker'){z.zig=(z.zig||0)+dt*5;z.x+=Math.sin(z.zig)*34*dt;z.y+=z.speed*slowZ*dt}else z.y+=z.speed*slowZ*dt;
  z.x=Math.max(z.r,Math.min(e.w-z.r,z.x));
  if(Math.hypot(z.x-p.x,z.y-p.y)<z.r+p.r&&p.inv<=0&&e.elapsed>=e.shieldUntil){p.lives--;p.inv=1.35;e.ticker=z.boss?`${z.bossName} HIT JOEY ROB!`:'Hit! Keep defending.';fx(110,.10);if(p.lives<=0)return gameOver('Joey Rob went down.')}
  if(z.y>e.h+34){z.dead=true;e.breaches++;e.waveResolved++;e.ticker=z.boss?`${z.bossName} breached the line!`:`Base breach ${e.breaches}/${e.breachLimit}`;if(z.boss)e.bossCooldown=4;if(e.breaches>=e.breachLimit)return gameOver('The camp was overrun.')}
 }
 for(const b of e.bullets){
  for(const z of e.zombies){
   if(z.dead)continue;
   if(Math.hypot(b.x-z.x,b.y-z.y)<z.r+5){
    const beforeStage=z.boss?bossStage(z):0;const dealt=z.boss?Math.min(b.damage,z.bossId==='drmantis'?12:10):b.damage;z.hp-=dealt;b.life=0;z.flash=.10;
    if(z.boss){const afterStage=bossStage(z);if(afterStage!==beforeStage&&z.hp>0)bossMutation(z,afterStage);}
    if(z.hp<=0){z.dead=true;z.death=.12;z.flash=.08;e.kills++;e.waveResolved++;e.score+=z.points;if(z.boss)bossDefeated(z);
     if(e.score>A.prefs.high){const before=A.prefs.high;A.prefs.high=e.score;savePrefs();checkSkinUnlocks(before,A.prefs.high)}
     if(!z.boss&&Math.random()<(e.infinite?.012:e.wave>=8?.009:.005)&&e.pickups.length<1)spawnPickup(true);fx(z.boss?760:520,z.boss?.08:.03)}
    break;
   }
  }
 }
 e.zombies=e.zombies.filter(z=>!z.dead||(z.death||0)>0);
 for(const x of e.pickups){x.life-=dt;x.blink=x.life<2.0&&Math.floor(x.life*7)%2===0;if(Math.hypot(x.x-p.x,x.y-p.y)<x.r+p.r){applyPickup(x);x.life=0}}e.pickups=e.pickups.filter(x=>x.life>0);
 if(!e.infinite&&e.waveSpawned>=e.waveTarget&&e.zombies.length===0&&e.waveResolved>=e.waveTarget){e.between=2.0;e.ticker=`Wave ${e.wave} cleared`;e.mapBanner=2.0;e.bossMusicUntil=e.elapsed+2;setMusicMood('triumphant')}
}
function zombieStage(e){return e.wave>=10?3:e.wave>=5?2:1}
function chooseZombieType(e){const r=Math.random(),w=e.wave;if(w<2)return r<.72?'normal':'helmet';if(w<4)return r<.56?'normal':r<.77?'helmet':r<.93?'runner':'toxic';if(w<6)return r<.38?'normal':r<.60?'helmet':r<.73?'runner':r<.84?'toxic':r<.94?'armored':r<.98?'brute':'berserker';if(w<9)return r<.24?'normal':r<.43?'helmet':r<.58?'runner':r<.70?'toxic':r<.82?'armored':r<.91?'brute':r<.97?'berserker':'titan';return r<.18?'normal':r<.34?'helmet':r<.50?'runner':r<.62?'toxic':r<.76?'armored':r<.86?'brute':r<.95?'berserker':'titan'}
function zombieSpec(type,e){const stage=zombieStage(e),normal=stage===1?27:stage===2?36:46;const specs={normal:[1,120,normal,16],runner:[1,245,normal*1.62,15],helmet:[3,230,normal*.88,18],toxic:[4,340,normal*.82,19],armored:[5,430,normal*.72,21],berserker:[6,620,normal*1.06,25],brute:[8,820,stage===1?18:stage===2?20:22,31],titan:[14,1450,stage===1?13:stage===2?15:17,38]};return specs[type]||specs.normal}
function addZombie(type,x,y=-42){const e=A.engine,[hp,points,speed,r]=zombieSpec(type,e);e.zombies.push({x,y,type,hp,maxHp:hp,points,speed,r,flash:0,dead:false,zig:Math.random()*6.28});}
function spawnZombie(forceType=null,forcedX=null,forcedY=-42){const e=A.engine,type=forceType||chooseZombieType(e),x=forcedX??(32+Math.random()*(e.w-64));addZombie(type,x,forcedY)}
function spawnFormation(){const e=A.engine;if(!e?.w)return;const choices=e.wave>=8?['line','wedge','fast','heavy','mixed','toxic']:e.wave>=5?['line','wedge','fast','heavy','toxic']:['line','wedge','fast'];let kind=choices[Math.floor(Math.random()*choices.length)];if(kind===e.lastFormation)kind=choices[(choices.indexOf(kind)+1)%choices.length];e.lastFormation=kind;const xs=n=>Array.from({length:n},(_,i)=>(e.w/(n+1))*(i+1));if(kind==='line'){xs(7).forEach((x,i)=>addZombie(i%3===1?'helmet':'normal',x,-36-Math.abs(3-i)*7));e.waveSpawned+=7;e.ticker='SPECIAL ATTACK · WALL'}else if(kind==='wedge'){const mid=e.w/2;[[-110,-74],[-72,-55],[-36,-36],[0,-18],[36,-36],[72,-55],[110,-74]].forEach(([dx,y],i)=>addZombie(i===3?'armored':i%2?'helmet':'normal',Math.max(34,Math.min(e.w-34,mid+dx)),y));e.waveSpawned+=7;e.ticker='SPECIAL ATTACK · WEDGE'}else if(kind==='fast'){xs(8).forEach((x,i)=>addZombie(i%4===0?'berserker':'runner',x,-34-i*12));e.waveSpawned+=8;e.ticker='SPECIAL ATTACK · RUSH'}else if(kind==='heavy'){const mid=e.w/2;[['armored',mid-88,-55],['brute',mid,-34],['armored',mid+88,-55],['helmet',mid-140,-82],['helmet',mid+140,-82]].forEach(([t,x,y])=>addZombie(t,Math.max(38,Math.min(e.w-38,x)),y));e.waveSpawned+=5;e.ticker='SPECIAL ATTACK · HEAVY PUSH'}else if(kind==='toxic'){xs(6).forEach((x,i)=>addZombie(i%3===0?'armored':'toxic',x,-38-i*9));e.waveSpawned+=6;e.ticker='SPECIAL ATTACK · TOXIC PACK'}else{const types=['runner','helmet','toxic','armored','brute','berserker','titan'];xs(types.length).forEach((x,i)=>addZombie(types[i],x,-46-Math.abs(3-i)*10));e.waveSpawned+=types.length;e.ticker='SPECIAL ATTACK · MIXED ASSAULT'}e.mapBanner=.8;}
function shoot(force){
 const e=A.engine,p=e?.player;if(!e||!p||(!force&&p.cool>0))return;const w=WEAPONS[p.gun];
 if(p.gun!=='pistol'&&!e.cheats.dmr&&p.ammo<=0){setGun('pistol');return}
 e.bullets.push({x:p.x,y:p.y-25,vx:0,vy:-w.speed,damage:w.damage,life:1.45,gun:p.gun,color:p.gun==='dmr'?'#f6d84a':p.gun==='smg'?'#75e8ff':'#fff4d0'});
 p.fireFxUntil=e.elapsed+.09;p.cool=e.elapsed<e.rapidUntil?Math.max(.055,w.delay*.48):w.delay;
 if(p.gun!=='pistol'&&!e.cheats.dmr){p.ammo--;if(p.ammo<=0)setTimeout(()=>setGun('pistol'),20)}
 fx(p.gun==='dmr'?170:p.gun==='smg'?340:280,p.gun==='dmr'?.07:.025);
}
function spawnPickup(fromKill=false){const e=A.engine;const early=['speed','shield','heart'];const mid=['clock','speed','shield','rapid','smg'];const late=['clock','bomb','smg','dmr','speed','rapid','shield'];const pool=e.infinite?late:(e.wave>=7?late:e.wave>=5?mid:early);const type=pool[Math.floor(Math.random()*pool.length)];const y=e.player.y;e.pickups.push({x:34+Math.random()*(e.w-68),y,type,life:fromKill?4.6:6.2,r:15,blink:false})}
function applyPickup(x){
 const e=A.engine,p=e.player;if(x.type==='heart')p.lives=Math.min(p.maxLives,p.lives+1);if(x.type==='clock')e.slowUntil=e.elapsed+6;if(x.type==='speed')e.speedUntil=e.elapsed+7;if(x.type==='rapid')e.rapidUntil=e.elapsed+7;if(x.type==='shield')e.shieldUntil=e.elapsed+7;
 if(x.type==='bomb'){for(const z of e.zombies){if(!z.dead&&!z.boss){z.dead=true;e.score+=z.points;e.kills++;e.waveResolved++}}e.zombies=e.zombies.filter(z=>z.boss&&!z.dead)}
 if(x.type==='smg'&&!e.cheats.dmr)setGun('smg');if(x.type==='dmr'&&!e.cheats.dmr)setGun('dmr');
 e.ticker={heart:'+1 life',clock:'Slow-time active',bomb:'Bomb cleared the horde — bosses resist it',smg:'SMG collected',dmr:'DMR-82 collected',speed:'FAST MOVE · 7 seconds',rapid:'RAPID FIRE · 7 seconds',shield:'SHIELD · 7 seconds'}[x.type];fx(720,.06)
}
function setGun(g){const e=A.engine,p=e.player;if(e.cheats.dmr){p.gun='dmr';p.ammo=Infinity;return}p.gun=g;p.ammo=WEAPONS[g].ammo}
function currentSprite(z){return ({fast:'runner',runner:'runner',helmet:'helmet',armored:'armored',toxic:'toxic',brute:'brute',berserker:'berserker',titan:'titan'})[z.type]||'normal'}
function bossDef(id){return BOSS_DEFS.find(b=>b.id===id)||null}
function activeBoss(e=A.engine){return e?.zombies?.find(z=>z.boss&&!z.dead)||null}
function bossStage(z){const n=Math.max(1,z.bossStages||1),ratio=Math.max(0,Math.min(1,z.hp/z.maxHp));return Math.min(n,Math.floor((1-ratio)*n)+1)}
function bossImage(z){
 const b=bossDef(z.bossId),stage=bossStage(z);if(!b)return null;return ensureImage(`boss_${b.id}_${stage}`,b.sprites[stage-1]);
}
function maybeSpawnScoreBoss(){
 const e=A.engine;if(!e||e.infinite||e.bossCooldown>0||activeBoss(e))return;
 const b=BOSS_DEFS.slice(0,4).find(x=>!e.bossesSeen[x.id]&&e.score>=x.threshold);if(b)spawnBoss(b);
}
function spawnBoss(b){
 const e=A.engine;if(!e||!b||e.bossesSeen[b.id]||activeBoss(e))return;
 Object.keys(A.images).filter(k=>k.startsWith('boss_')&&!k.startsWith(`boss_${b.id}_`)).forEach(k=>delete A.images[k]);
 b.sprites.forEach((src,i)=>ensureImage(`boss_${b.id}_${i+1}`,src));
 e.bossesSeen[b.id]=true;e.bossIntro=2.75;e.bossSpeech=`${b.announce} ${b.react}`;e.bossSubtitle=b.title;e.bossName=b.name;e.bossDefeated=false;e.bossVictory='';e.ticker=`BOSS DROP · ${b.name}`;e.mapBanner=.9;
 e.zombies.push({x:e.w/2,y:-84,type:b.type,hp:b.hp,maxHp:b.hp,points:b.points,speed:b.speed,r:Math.max(34,Math.round(38*b.scale)),flash:0,dead:false,zig:Math.random()*6.28,boss:true,bossId:b.id,bossName:b.name,bossStages:b.stages,scale:b.scale});
 setMusicMood('moody');fx(92,.22);
}
function bossMutation(z,stage){
 const e=A.engine,b=bossDef(z.bossId);if(!b)return;e.bossIntro=1.25;e.bossSpeech=b.stageLines[Math.max(0,stage-1)]||'Mutation detected.';e.bossSubtitle=`DAMAGE STATE ${stage}/${b.stages}`;e.bossName=b.name;e.bossDefeated=false;e.ticker=`${b.name} · STAGE ${stage}`;e.mapBanner=.55;fx(145,.14);
}
function bossDefeated(z){
 const e=A.engine,b=bossDef(z.bossId);if(!b)return;e.bossIntro=2.8;e.bossSpeech=b.finalLine;e.bossSubtitle='BOSS DEFEATED';e.bossName=b.name;e.bossDefeated=true;e.bossVictory=b.victory;e.bossCooldown=8;e.player.victoryUntil=e.elapsed+1.6;e.bossMusicUntil=e.elapsed+4.2;setMusicMood('triumphant');e.ticker=z.bossId==='drmantis'?'DR MANTIS DOWN · INFINITE SURVIVAL':'BOSS DOWN · '+b.name;
}
function playerImage(e){
 const p=e.player;if(p.inv>0)return A.images.playerHit;
 if(e.elapsed<(p.victoryUntil||0))return A.images.playerVictory;
 if(e.elapsed<e.shieldUntil)return A.images.playerShield;
 if(e.elapsed<(p.fireFxUntil||0)){if(p.gun==='dmr')return A.images.playerDmr;if(e.elapsed<e.rapidUntil)return A.images.playerRapid;return A.images.playerFire}
 return A.images.player;
}
function drawCover(c,img,x,y,w,h){
 if(!img?.complete||!img.naturalWidth)return false;const iw=img.naturalWidth,ih=img.naturalHeight,scale=Math.max(w/iw,h/ih),sw=w/scale,sh=h/scale,sx=(iw-sw)/2,sy=(ih-sh)/2;c.drawImage(img,sx,sy,sw,sh,x,y,w,h);return true;
}
function drawRotatedImage(c,img,x,y,w,h,angle=0){
 if(!img?.complete)return false;c.save();c.translate(x,y);c.rotate(angle);c.drawImage(img,-w/2,-h/2,w,h);c.restore();return true;
}
function wrapText(c,text,x,y,maxW,lh,maxLines=2){const words=(text||'').split(' ');let line='',ny=y,lines=0;for(const word of words){const t=line?line+' '+word:word;if(c.measureText(t).width>maxW&&line){c.fillText(line,x,ny);line=word;ny+=lh;if(++lines>=maxLines){line='';break}}else line=t}if(line)c.fillText(line,x,ny);return ny}
function draw(){
 const e=A.engine,c=e?.ctx;if(!e||!c)return;const d=Math.min(devicePixelRatio||1,2);c.setTransform(d,0,0,d,0,0);drawGround(c,e);
 for(const x of e.pickups)drawPickup(c,x);
 for(const b of e.bullets){
  const bi=A.images['bullet_'+(b.gun||'pistol')];if(!drawRotatedImage(c,bi,b.x,b.y,18,10,-Math.PI/2)){c.fillStyle=b.color;c.shadowColor=b.color;c.shadowBlur=5;c.beginPath();c.arc(b.x,b.y,3.2,0,Math.PI*2);c.fill();c.shadowBlur=0}
 }
 for(const z of e.zombies){
  const im=z.boss?bossImage(z):A.images[currentSprite(z)];c.save();if(z.dead){c.globalAlpha=.62;c.filter='brightness(1.8) saturate(.45)'}else if(z.flash)c.globalAlpha=.72;
  const sizes={normal:[64,78],runner:[62,76],helmet:[68,82],toxic:[70,84],armored:[75,90],berserker:[82,98],brute:[96,116],titan:[116,138]};
  let [sw,sh]=sizes[z.type]||sizes.normal;if(z.boss){sw=Math.round(sw*(z.scale||1.3));sh=Math.round(sh*(z.scale||1.3));c.shadowBlur=18;c.shadowColor=z.bossId==='glowinghumanity'?'rgba(70,255,105,.62)':z.bossId==='drmantis'?'rgba(120,255,55,.45)':'rgba(244,215,41,.34)'}
  if(im?.complete)c.drawImage(im,z.x-sw/2,z.y-sh/2,sw,sh);else{c.fillStyle='#8b2d28';c.beginPath();c.arc(z.x,z.y,z.r,0,Math.PI*2);c.fill()}c.restore();
  const bw=z.boss?Math.min(180,e.w*.52):Math.max(38,Math.min(70,34+z.maxHp*2.5)),bh=z.boss?8:(z.maxHp>1?5:3),x=z.x-bw/2,y=z.y-sh/2-8;
  c.fillStyle='rgba(0,0,0,.78)';c.fillRect(x,y,bw,bh);c.fillStyle=z.hp/z.maxHp>.66?'#81c75c':z.hp/z.maxHp>.33?'#e9b745':'#df5148';c.fillRect(x+1,y+1,(bw-2)*Math.max(0,z.hp/z.maxHp),Math.max(1,bh-2));
  if(z.boss){c.fillStyle='rgba(5,8,10,.82)';c.fillRect(z.x-bw/2,y-17,bw,14);c.fillStyle='#f4d729';c.font='900 12px Barlow Condensed,sans-serif';c.textAlign='center';c.fillText(`${z.bossName} · STAGE ${bossStage(z)}`,z.x,y-6)}
 }
 const p=e.player,pi=playerImage(e);c.save();if(p.inv&&Math.floor(p.inv*10)%2===0)c.globalAlpha=.42;
 if(pi?.complete)c.drawImage(pi,p.x-45,p.y-58,90,112);else{c.fillStyle='#7ed3ff';c.beginPath();c.arc(p.x,p.y,18,0,Math.PI*2);c.fill()}c.restore();
 c.strokeStyle='rgba(245,215,29,.22)';c.lineWidth=1;c.setLineDash([7,8]);c.beginPath();c.moveTo(16,p.y+38);c.lineTo(e.w-16,p.y+38);c.stroke();c.setLineDash([]);
 c.fillStyle='rgba(18,22,24,.72)';c.fillRect(0,e.h-7,e.w,7);c.fillStyle='#8b7d21';c.fillRect(0,e.h-7,e.w*(1-e.breaches/e.breachLimit),7);
 if(!e.started){c.fillStyle='rgba(4,6,7,.52)';c.fillRect(0,0,e.w,e.h);c.fillStyle='#f4d729';c.textAlign='center';c.font='900 28px Barlow Condensed,sans-serif';c.fillText('JOEY ROB VS DR MANTIS',e.w/2,e.h*.39);c.fillStyle='#fff';c.font='11px Inter,sans-serif';c.fillText('Zombies move DOWN · Joey Rob fires UP',e.w/2,e.h*.39+26);c.fillText('LEFT / RIGHT to line up · FIRE shoots north',e.w/2,e.h*.39+44)}
 if(e.mapBanner>0&&e.started){c.fillStyle='rgba(3,5,6,.74)';c.fillRect(0,e.h*.38,e.w,72);c.fillStyle='#f4d729';c.textAlign='center';c.font='900 24px Barlow Condensed,sans-serif';c.fillText(e.ticker.startsWith('SPECIAL ATTACK')||e.ticker.startsWith('BOSS')?e.ticker:MAPS[e.mapIndex].name,e.w/2,e.h*.38+31);c.fillStyle='#fff';c.font='10px Inter,sans-serif';c.fillText(e.infinite?'FINAL WAVE · INFINITE':`WAVE ${e.wave}`,e.w/2,e.h*.38+50)}
 const boss=activeBoss(e);if(boss){const bw=Math.min(e.w-40,280),bx=(e.w-bw)/2,by=48,ratio=Math.max(0,boss.hp/boss.maxHp),ef=ensureImage('ui_energyFrame',UI_SPRITES.energyFrame),fill=ensureImage('ui_energyFill',UI_SPRITES.energyFill);
  c.fillStyle='rgba(6,8,9,.88)';c.fillRect(bx,by,bw,24);
  if(fill?.complete){c.save();c.beginPath();c.rect(bx+4,by+4,(bw-8)*ratio,16);c.clip();c.drawImage(fill,bx+4,by+4,bw-8,16);c.restore()}else{c.fillStyle='#f4d729';c.fillRect(bx+2,by+2,(bw-4)*ratio,20)}
  if(ef?.complete)c.drawImage(ef,bx-4,by-3,bw+8,30);
  c.fillStyle='#111';c.font='900 14px Barlow Condensed,sans-serif';c.textAlign='center';c.fillText(`${boss.bossName} · ${boss.hp}/${boss.maxHp}`,e.w/2,by+17)
 }
 if(e.bossIntro>0){
  const bx=12,by=e.h*.15,bw=e.w-24,bh=e.bossDefeated?126:100;c.fillStyle='rgba(4,6,7,.9)';c.fillRect(bx,by,bw,bh);
  const frame=A.images.ui_dialog;if(frame?.complete)c.drawImage(frame,bx-4,by-4,bw+8,bh+8);else{c.strokeStyle='rgba(244,215,41,.58)';c.strokeRect(bx,by,bw,bh)}
  const playerPortrait=A.images[e.bossDefeated?'playerVictory':'playerReaction'];if(playerPortrait?.complete)c.drawImage(playerPortrait,bx+5,by+9,66,82);
  const bInfo=bossDef(BOSS_DEFS.find(b=>b.name===e.bossName)?.id||'');const portrait=bInfo?A.images[`boss_${bInfo.id}_${e.bossDefeated?bInfo.stages:1}`]:null;if(portrait?.complete)c.drawImage(portrait,bx+bw-69,by+8,62,82);
  const tx=bx+77,tw=bw-154;c.textAlign='left';c.fillStyle='#f4d729';c.font='900 11px Barlow Condensed,sans-serif';c.fillText(e.bossDefeated?'JOEY ROB · BOSS DOWN':'JOEY ROB · CONTACT',tx,by+19);
  c.fillStyle='#fff';c.font='900 14px Barlow Condensed,sans-serif';let ny=wrapText(c,e.bossDefeated?(e.bossVictory||'Boss down.'):(e.bossSpeech||'Boss inbound.'),tx,by+38,tw,15,3);
  c.fillStyle=e.bossDefeated?'#5CFF7A':'#ff8f8f';c.font='900 11px Barlow Condensed,sans-serif';c.fillText(e.bossSubtitle||'BOSS INBOUND',tx,Math.min(by+bh-10,ny+18));
 }
}
function drawGround(c,e){
 const map=MAPS[e.mapIndex],im=ensureImage('map_'+map.id,map.img);if(!drawCover(c,im,0,0,e.w,e.h)){const g=c.createLinearGradient(0,0,0,e.h);g.addColorStop(0,'#4c4b45');g.addColorStop(.5,'#343532');g.addColorStop(1,'#222522');c.fillStyle=g;c.fillRect(0,0,e.w,e.h)}
 c.fillStyle='rgba(2,4,5,.22)';c.fillRect(0,0,e.w,e.h);
 const level=Math.min(4,Math.max(0,e.wave<=1?0:e.wave<=3?1:e.wave<=5?2:e.wave<=8?3:4));
 if(level){if(e._stainLoaded!==level){Object.keys(A.images).filter(k=>k.startsWith('stain_')&&k!=='stain_'+level).forEach(k=>delete A.images[k]);e._stainLoaded=level}
  const stain=ensureImage('stain_'+level,STAIN_SPRITES[level]);c.save();c.globalAlpha=Math.min(.30,.14+level*.04);drawCover(c,stain,0,0,e.w,e.h);c.restore()}else if(e._stainLoaded){Object.keys(A.images).filter(k=>k.startsWith('stain_')).forEach(k=>delete A.images[k]);e._stainLoaded=0}
 const vignette=c.createRadialGradient(e.w/2,e.h*.48,e.w*.15,e.w/2,e.h*.5,Math.max(e.w,e.h)*.72);vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(0,0,0,.42)');c.fillStyle=vignette;c.fillRect(0,0,e.w,e.h);
}
function drawPickup(c,p){
 if(p.blink)return;const im=A.images['pickup_'+p.type];c.save();c.translate(p.x,p.y);const pulse=1+Math.sin((A.engine?.elapsed||0)*7)*.05;c.scale(pulse,pulse);
 c.shadowBlur=14;c.shadowColor=p.type==='dmr'||p.type==='speed'||p.type==='rapid'?'#f4d729':p.type==='clock'||p.type==='shield'?'#4fb9ff':'#ff4d5e';
 if(im?.complete)c.drawImage(im,-21,-21,42,42);else{c.fillStyle='#f4d729';c.beginPath();c.arc(0,0,12,0,Math.PI*2);c.fill()}c.restore();
}
function hud(){const e=A.engine;if(!e)return;$('#zs52Wave')&&($('#zs52Wave').textContent=e.wave);$('#zs52Remaining')&&($('#zs52Remaining').textContent=e.infinite?'∞':Math.max(0,e.waveTarget-e.waveResolved));$('#zs52Score')&&($('#zs52Score').textContent=e.score.toLocaleString());$('#zs52Base')&&($('#zs52Base').textContent=`${e.breaches}/${e.breachLimit}`);$('#zs52Gun')&&($('#zs52Gun').textContent=WEAPONS[e.player.gun].name);$('#zs52Ammo')&&($('#zs52Ammo').textContent=Number.isFinite(e.player.ammo)?e.player.ammo:'∞');$('#zs52Map')&&($('#zs52Map').textContent=MAPS[e.mapIndex].name);$('#zs52Ticker')&&($('#zs52Ticker').textContent=e.ticker);const l=$('#zs52Lives');if(l){const n=e.player.lives,max=e.player.maxLives;l.innerHTML=Array.from({length:max},(_,i)=>{let cls='';if(i<n){cls=max>5&&i<5?'gold':'red'}return `<i class="${cls}">♥</i>`}).join('')}}
async function gameOver(reason){const e=A.engine;if(e.over)return;e.over=true;clearStoredRun();stopLoop();A.prefs.last=e.score;{const before=A.prefs.high;A.prefs.high=Math.max(A.prefs.high,e.score);savePrefs();checkSkinUnlocks(before,A.prefs.high);}e.ticker=reason;await submitScore();A.menu=true;A.tab='menu';renderOverlay();const box=$('.zs52-menu-actions');if(box)box.insertAdjacentHTML('afterbegin',`<div class="zs52-run"><b>RUN COMPLETE</b><span>${e.score.toLocaleString()} points · ${e.kills} kills · Wave ${e.wave}${e.cheated?' · CHEAT RUN':''}</span>${e.cheated?'<small>Cheat runs do not post to the all-time leaderboard.</small>':''}<button class="btn primary" id="zs52Again">Play again</button></div>`);$('#zs52Again')?.addEventListener('click',()=>{A.menu=false;newRun();renderOverlay()})}
async function submitScore(provisional=false){const e=A.engine;if(!e)return;if(e.cheated){if(!provisional)toast('Cheat run complete - leaderboard score not submitted.');return;}const sess=state().session;if(!sess){if(!provisional)toast('Sign in to post your score globally.');return;}let posted=false,firstErr=null;try{const {error}=await deps.supabase.rpc('submit_arcade_run',{p_score:e.score,p_kills:e.kills,p_seconds:Math.max(1,Math.floor(e.elapsed)),p_skin:A.prefs.skin});if(error)throw error;posted=true;}catch(err){firstErr=err;console.warn('submit_arcade_run failed; trying profile fallback',err)}if(!posted){try{const uid=sess.user.id;const best=Math.max(Number(A.prefs.high||0),e.score);const payload={user_id:uid,high_score:best,selected_skin:A.prefs.skin,unlocked_skins:A.prefs.codeSkins||[]};const q=await deps.supabase.from('arcade_profiles').upsert(payload,{onConflict:'user_id'});if(q.error)throw q.error;posted=true;}catch(err){console.warn('Arcade profile fallback failed',err,firstErr)}}if(posted){A.prefs.high=Math.max(A.prefs.high,e.score);savePrefs();if(!provisional){await loadBoard();try{await deps.refreshAll?.()}catch{}toast('Zombie Smash score posted.');}}else if(!provisional)toast('Score saved locally; online league update failed.');}
function audio(){if(A.audio)return A.audio;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;A.audio=new AC();return A.audio}
function fx(f=440,d=.04,gain=.022,type='square'){const a=audio();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f;g.gain.value=gain;o.connect(g);g.connect(a.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+d);o.stop(a.currentTime+d)}
let music=0,musicStep=0,musicMood='moody';
function setMusicMood(mood){musicMood=mood==='triumphant'?'triumphant':'moody'}
function musicTick(){
 if(!A.open||A.paused||A.menu||!A.prefs.music)return;
 const moodyLead=[196,233,247,220,196,174,185,165],moodyBass=[98,98,87,82],winLead=[262,330,392,523,392,330,294,392],winBass=[131,165,196,165];
 const win=musicMood==='triumphant',lead=win?winLead:moodyLead,bass=win?winBass:moodyBass,i=musicStep++;
 fx(lead[i%lead.length],.09,win?.007:.0055,'triangle');if(i%2===0)fx(bass[Math.floor(i/2)%bass.length],.11,win?.0048:.0038,'sine');
}
function startMusic(){if(!A.prefs.music||music)return;music=setInterval(musicTick,360)}
function stopMusic(){clearInterval(music);music=0}
window.ZC2Arcade={init,pageHtml,bindPage,open,close};
})();
