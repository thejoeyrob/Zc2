import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://xdsrnnkuxfaycnlngjbq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_AicVoQAwV-KnlOs1Fc2RuQ_T81In0MC';
const FOUNDERS_ID = '5adc5ebc-d73e-4226-bf18-c303c038b294';
const BUILD = '5.4-ground-texture-zombie-png';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const esc = (s='') => String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fmtDate = v => v ? new Date(v).toLocaleString([], {dateStyle:'medium',timeStyle:'short'}) : 'TBC';
const baseUrl = () => location.href.split(/[?#]/)[0].replace(/index\.html$/,'');
const icon = (name, extra='') => `<span class="material-symbols-rounded ${extra}">${name}</span>`;

const state = {
  session:null, profile:null, admin:false, tournaments:[], entries:[], profiles:[], league:[], arcadeLeague:[], gallery:[],
  notifications:[], privateEvents:[], page:'home', selectedTournament:null, board:[], portal:null,
  chatRoom:'general', chat:[], chatChannel:null, dmTarget:null, dmThread:null, dmMessages:[], dmChannel:null,
  notificationsChannel:null, communityFeedChannel:null, callSignalChannel:null, callSignalPoll:null, callSeenSignals:new Set(), installPrompt:null, toast:'', modal:null, ocrProgress:0, adminData:null,
  featuredPortal:null, communitySearch:'', authRecovery:false, oauthProviders:{google:false,apple:false,twitter:false,discord:false},
  dmThreads:[], chatView:'room:general', showIntro:false, avatarDraftFile:null, avatarDraftUrl:'',
  voice:{joined:false,roomId:null,channel:null,stream:null,peers:new Map(),audios:new Map(),candidates:new Map()},
  call:{id:null,peerId:null,peerName:'',direction:null,status:'idle',pc:null,stream:null,audio:null,muted:false,pendingCandidates:[],startedAt:null,timeout:null,disconnectTimer:null},
  groupCall:{id:null,title:'',hostId:null,hostName:'',direction:null,status:'idle',invitedIds:[],acceptedIds:[],declinedIds:[],startedAt:null,timeout:null,muted:false},
  handledCallIds:new Set()
};

const roomNames = [
  ['general','General'],['looking-for-game','Looking for game'],['tournaments','Tournaments'],
  ['quest-players','Quest players'],['pcvr-players','PCVR players'],['artwork','Artwork']
];
const formats = ['Founders League','Deathmatch','Team Deathmatch','Knockout','Round Robin','Kill Race','Head Hunter','Marksman'];
const formatHelp = {
  'Founders League':'3–4 player groups. Top two advance. Different map type each round, rematches split where possible, four-player Cargo final.',
  'Deathmatch':'Free-for-all deathmatch structure with screenshot-backed kills and organiser/admin approval.',
  'Team Deathmatch':'Team-versus-team structure with configurable team size, best-of rounds, score limit and match duration.',
  'Knockout':'Single-elimination bracket. Organiser records each winner and advances the bracket.',
  'Round Robin':'Everyone plays everyone. Standings accumulate across the event.',
  'Kill Race':'Highest aggregate kills across the defined matches wins.',
  'Head Hunter':'Headshot-focused competition. Use screenshot evidence and organiser verification.',
  'Marksman':'Accuracy-focused competition. Use end-screen evidence and organiser verification.'
};

function setToast(msg){ state.toast=msg; renderToast(); clearTimeout(setToast.t); setToast.t=setTimeout(()=>{state.toast='';renderToast();},4200); }
function renderToast(){ let t=$('.toast'); if(!state.toast){t?.remove();return;} if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t);} t.innerHTML=`${icon('info')}<span>${esc(state.toast)}</span>`; }

function publicAvatar(profile){
  if(!profile?.avatar_path) return '';
  return supabase.storage.from('avatars').getPublicUrl(profile.avatar_path).data.publicUrl;
}
function galleryUrl(path){ return supabase.storage.from('gallery-public').getPublicUrl(path).data.publicUrl; }
function playerById(id){ return state.profiles.find(p=>p.id===id); }
function statById(id){ return state.league.find(s=>s.user_id===id); }
function entryCount(id){ return state.entries.filter(e=>e.tournament_id===id).length; }
function isJoined(id){ return !!state.session && state.entries.some(e=>e.tournament_id===id && e.user_id===state.session.user.id); }

function isStandalone(){return window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;}
function previewMode(){return new URLSearchParams(location.search).get('preview')==='1';}
function installInstructions(){
  const ua=navigator.userAgent||'';
  if(/iPhone|iPad|iPod/i.test(ua))return ['Open this page in Safari','Tap Share','Choose Add to Home Screen','Open Community Arena from the new icon'];
  if(/OculusBrowser|Quest/i.test(ua))return ['Open the browser menu (⋮)','Choose Install app or Add to Home','Confirm the Community Arena icon','Launch it from Apps / browser shortcuts'];
  if(/Android/i.test(ua))return ['Open the browser menu (⋮)','Choose Install app or Add to Home screen','Confirm Install','Launch Community Arena from your app screen'];
  return ['Use Chrome or Edge','Click the install icon in the address bar or browser menu','Choose Install','Launch Community Arena as an app'];
}
function installGateHtml(){
  const steps=installInstructions();
  return `<div class="install-gate"><div class="install-gate-bg"></div><div class="install-card"><img class="install-emblem" src="./community-arena-emblem.png?v=4" alt=""><span class="kicker">COMMUNITY ARENA PWA</span><h1>INSTALL TO ENTER</h1><p>Community Arena is designed to run as an installed app on phone, tablet, desktop and supported VR browsers. Browser access to the community workspace is intentionally blocked.</p><ol>${steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><button class="btn primary big" id="gateInstallBtn" ${state.installPrompt?'':'disabled'}>${icon('download')} ${state.installPrompt?'Install Community Arena':'Use your browser menu to install'}</button><small>Already installed? Open Community Arena from its app icon. Developers can add <b>?preview=1</b> to this URL for a browser preview.</small><img class="install-jw" src="./jw-eds-yellow.png?v=4" alt="Design and Production by JW"></div></div>`;
}
function renderInstallGate(){const app=$('#app');if(app){app.className='';app.innerHTML=installGateHtml();$('#gateInstallBtn')?.addEventListener('click',async()=>{if(!state.installPrompt)return;state.installPrompt.prompt();await state.installPrompt.userChoice;});}}
function introHtml(){if(!state.showIntro)return '';return `<div class="arena-intro" id="arenaIntro"><div class="intro-bg"></div><div class="intro-grid"></div><div class="intro-core"><div class="intro-halo"></div><img class="intro-emblem" src="./community-arena-emblem.png?v=4" alt=""><div class="intro-wordmark"><span>ZERO CALIBER <b>2</b></span><em>COMMUNITY ARENA</em></div><div class="intro-strike"></div><img class="intro-jw" src="./jw-eds-yellow.png?v=4" alt="Design and Production by JW"></div><button id="skipIntroBtn" class="intro-skip">SKIP</button></div>`;}
function replayIntro(){localStorage.removeItem('zc2-intro-v4');state.showIntro=true;state.modal=null;render();scheduleIntroClose();}
function scheduleIntroClose(){clearTimeout(scheduleIntroClose.t);scheduleIntroClose.t=setTimeout(()=>{if(state.showIntro){state.showIntro=false;localStorage.setItem('zc2-intro-v4','1');render();}},3800);}
function foundersFallback(){return {id:FOUNDERS_ID,title:'Season Zero: Founders League',subtitle:'The tournament that begins the permanent ZC2 Community league table.',visibility:'public',status:'registration',official:true,featured:true,unlimited_entries:true,max_players:null,current_round:0,format:'Founders League',rules:{bots:false,qualifiers:2,final_map:'Cargo'}};}


async function init(){
  if('serviceWorker' in navigator&&location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.installPrompt=e;if(!isStandalone()&&!previewMode())renderInstallGate();});
  window.addEventListener('appinstalled',()=>{state.installPrompt=null;setTimeout(()=>location.reload(),350);});
  const incoming=new URLSearchParams(location.search);if(incoming.get('tournament')&&incoming.get('invite'))localStorage.setItem('zc2-pending-invite',location.search);
  window.addEventListener('focus',()=>recoverRecentCallSignals());document.addEventListener('visibilitychange',()=>{if(!document.hidden)recoverRecentCallSignals();});
  if(!isStandalone()&&!previewMode()){renderInstallGate();return;}
  const requestedPage=incoming.get('page');if(['home','tournaments','arcade','league','chat','profile','community','gallery'].includes(requestedPage))state.page=requestedPage;
  await loadOAuthProviderStatus();
  const {data:{session}}=await supabase.auth.getSession();state.session=session;window.ZC2Arcade?.init({supabase,getState:()=>state,icon,esc,setToast,refreshAll});
  state.showIntro=localStorage.getItem('zc2-intro-v4')!=='1';
  supabase.auth.onAuthStateChange(async(event,session)=>{state.session=session;if(event==='SIGNED_OUT')state.admin=false;if(event==='PASSWORD_RECOVERY'){state.authRecovery=true;state.modal={type:'auth',mode:'recovery'};}await refreshAll();subscribeCommunityFeed();await handlePendingInvite();render();});
  await refreshAll();subscribeCommunityFeed();await handlePendingInvite();render();if(state.showIntro)scheduleIntroClose();
}

async function loadOAuthProviderStatus(){
  try{
    const r=await fetch(SUPABASE_URL+'/auth/v1/settings',{headers:{apikey:SUPABASE_KEY}});
    if(!r.ok)return;
    const data=await r.json();
    const ext=data?.external||{};
    state.oauthProviders={
      google:!!ext.google,
      apple:!!ext.apple,
      twitter:!!ext.twitter,
      discord:!!ext.discord
    };
  }catch{}
}

function oauthReturnUrl(){
  return baseUrl();
}

async function refreshAll(){
  await loadPublic();
  if(state.session) await loadPrivate(); else clearPrivate();
}

function clearPrivate(){
  state.profile=null;state.admin=false;state.notifications=[];state.privateEvents=[];state.featuredPortal=null;state.dmThreads=[];state.dmTarget=null;state.dmThread=null;state.dmMessages=[];
  state.notificationsChannel?.unsubscribe();state.notificationsChannel=null;
  state.callSignalChannel?.unsubscribe();state.callSignalChannel=null;clearInterval(state.callSignalPoll);state.callSignalPoll=null;state.callSeenSignals.clear();
  if(state.call.status!=='idle') endCallLocal('signed-out',true);
  if(state.groupCall.status!=='idle') endGroupCallLocal('signed-out',true);
}

async function loadPublic(){
  const [t,p,l,e,g,a]=await Promise.all([
    supabase.from('tournaments').select('*').eq('visibility','public').order('featured',{ascending:false}).order('created_at',{ascending:false}),
    supabase.from('profiles').select('*').order('gamertag'),
    supabase.from('league_stats').select('*').order('adjusted_kills',{ascending:false}).order('raw_kills',{ascending:false}),
    supabase.from('tournament_entries').select('tournament_id,user_id,status,joined_at'),
    supabase.from('gallery_items').select('*').order('created_at',{ascending:false}).limit(60),
    supabase.rpc('get_arcade_leaderboard',{p_limit:250})
  ]);
  let tournaments=t.data||[];if(!tournaments.some(x=>x.id===FOUNDERS_ID))tournaments=[foundersFallback(),...tournaments];
  state.tournaments=tournaments;state.profiles=p.data||[];state.league=l.data||[];state.entries=e.data||[];state.gallery=g.data||[];state.arcadeLeague=a.error?[]:(a.data||[]);
  if(a.error){const fallback=await supabase.from('arcade_profiles').select('user_id,high_score,selected_skin');if(!fallback.error)state.arcadeLeague=(fallback.data||[]).map(r=>({user_id:r.user_id,high_score:r.high_score||0,selected_skin:r.selected_skin||'gunmetal'}));}
  if(t.error)console.warn('Tournament feed:',t.error.message);if(p.error)console.warn('Profiles:',p.error.message);if(l.error)console.warn('League:',l.error.message);if(e.error)console.warn('Tournament registrations:',e.error.message);if(g.error)console.warn('Gallery:',g.error.message);
}

async function loadPrivate(){
  const uid=state.session.user.id;
  let p=await supabase.from('profiles').select('*').eq('id',uid).maybeSingle();
  if(!p.data){
    const meta=state.session.user.user_metadata||{};const raw=(meta.gamertag||state.session.user.email?.split('@')[0]||'Player').replace(/[^A-Za-z0-9_. -]/g,'').slice(0,24)||'Player';
    const gamertag=raw+'-'+uid.slice(0,4).toUpperCase();
    await supabase.from('profiles').upsert({id:uid,gamertag,platform:meta.platform||'Quest'},{onConflict:'id'});p=await supabase.from('profiles').select('*').eq('id',uid).maybeSingle();
  }
  const [a,n,priv,threads]=await Promise.all([
    supabase.from('admins').select('user_id').eq('user_id',uid).maybeSingle(),
    supabase.from('user_notifications').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(80),
    supabase.from('tournaments').select('*').eq('visibility','private').order('created_at',{ascending:false}),
    supabase.from('dm_threads').select('*').order('created_at',{ascending:false}).limit(60)
  ]);
  const keepAdminSession=state.admin===true;
  state.profile=p.data||null;state.admin=keepAdminSession;state.notifications=n.data||[];state.privateEvents=priv.data||[];state.dmThreads=threads.data||[];
  await loadFeaturedPortal();subscribeNotifications();subscribeCallSignals();
}

async function loadFeaturedPortal(){
  const featured=state.tournaments.find(t=>t.featured);
  state.featuredPortal=null;
  if(!featured||!state.session||!isJoined(featured.id))return;
  const {data}=await supabase.rpc('my_match_portal',{p_tournament:featured.id});
  state.featuredPortal=data?.[0]||null;
}

function subscribeNotifications(){
  state.notificationsChannel?.unsubscribe(); if(!state.session)return;
  state.notificationsChannel=supabase.channel('my-notifications')
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'user_notifications',filter:`user_id=eq.${state.session.user.id}`},payload=>{
      state.notifications.unshift(payload.new);
      if(Notification.permission==='granted') new Notification(payload.new.title,{body:payload.new.body,icon:'./icon-192.png'});
      setToast(payload.new.title); renderTopbar();
    }).subscribe();
}


function subscribeCommunityFeed(){
  state.communityFeedChannel?.unsubscribe();
  state.communityFeedChannel=supabase.channel('zc2-live-registration')
    .on('postgres_changes',{event:'*',schema:'public',table:'tournament_entries'},async()=>{
      await loadPublic();
      if(state.selectedTournament){
        const {data}=await supabase.rpc('get_tournament_board',{p_tournament:state.selectedTournament.id});
        state.board=data||[];
      }
      render();
    })
    .on('postgres_changes',{event:'*',schema:'public',table:'tournaments'},async()=>{
      await loadPublic();render();
    })
    .on('postgres_changes',{event:'*',schema:'public',table:'matches'},async()=>{
      if(state.selectedTournament){
        const {data}=await supabase.rpc('get_tournament_board',{p_tournament:state.selectedTournament.id});
        state.board=data||[];render();
      }
    })
    .subscribe();
}

async function handlePendingInvite(){
  const stored=localStorage.getItem('zc2-pending-invite')||'';const q=new URLSearchParams(location.search||stored);const tid=q.get('tournament');const invite=q.get('invite');
  if(!tid||!invite)return;
  if(!state.session){state.modal={type:'auth',pendingInvite:{tid,invite}};return;}
  try{
    const {error}=await supabase.rpc('join_tournament',{p_tournament:tid,p_invite:invite});if(error)throw error;
    localStorage.removeItem('zc2-pending-invite');history.replaceState({},'',baseUrl());setToast('Private tournament joined.');await refreshAll();
  }catch(e){setToast(e.message||'Invite could not be joined.');}
}

function render(){
  if(!isStandalone()&&!previewMode()){renderInstallGate();return;}
  const app=$('#app');app.className='';
  app.innerHTML=`<div class="shell">${topbarHtml()}<div class="layout">${sidebarHtml()}<main class="main" id="main">${pageHtml()}</main></div></div>${drawerHtml()}${modalHtml()}${introHtml()}${callOverlayHtml()}`;
  bindCommon();bindPage();bindCallControls();renderToast();
}

function topbarHtml(){
  const unread=state.notifications.filter(n=>!n.read).length;const avatar=state.profile?publicAvatar(state.profile):'';
  return `<header class="topbar"><button class="brand" data-page="home" aria-label="Zero Caliber 2 Community Arena home"><span class="brand-mark"><img src="./community-arena-emblem.png?v=4" alt=""></span><span class="brand-copy"><span class="brand-title"><strong>ZERO</strong><strong>CALIBER</strong><em>2</em></span><span class="brand-rule"></span><small>COMMUNITY ARENA</small></span></button><div class="top-actions"><button class="icon-btn" id="inviteAppBtn" title="Invite players">${icon('send')}</button>${state.session?`<button class="icon-btn" id="bellBtn" title="Notifications" style="position:relative">${icon('notifications')}${unread?`<span class="badge">${unread>9?'9+':unread}</span>`:''}</button><button class="user-chip" data-page="profile">${avatar?`<img src="${avatar}" alt="">`:`<span class="avatar">${esc((state.profile?.gamertag||'ZC').slice(0,2).toUpperCase())}</span>`}<span>${esc(state.profile?.gamertag||'Profile')}</span></button>`:`<button class="btn primary" id="signInBtn">${icon('login')}<span>Sign in</span></button>`}<button class="icon-btn menu-trigger" id="moreMenuBtn" title="Menu">${icon('menu')}</button></div></header>`;
}

function renderTopbar(){ const top=$('.topbar'); if(top){top.outerHTML=topbarHtml();bindCommon();} }
function sidebarHtml(){
  const nav=[['home','home','Home'],['tournaments','emoji_events','Tournaments'],['arcade','sports_esports','ZC2 Arena'],['league','leaderboard','League'],['chat','forum','Messages'],['profile','person','Profile']];
  return `<aside class="sidebar">${nav.map(([id,ic,label])=>`<button class="nav-btn ${state.page===id?'active':''}" data-page="${id}">${icon(ic)}<span>${label}</span></button>`).join('')}</aside>`;
}

function pageHtml(){
  switch(state.page){case'tournaments':return tournamentsHtml();case'arcade':return window.ZC2Arcade?.pageHtml?.()||'<section><div class="empty">Arcade loading…</div></section>';case'league':return leagueHtml();case'community':return communityHtml();case'chat':return chatHtml();case'gallery':return galleryHtml();case'profile':return profileHtml();case'admin':return adminHtml();default:return homeHtml();}
}

function sectionTitle(k,t,p=''){return `<div class="section-title"><span class="kicker">${k}</span><h2>${t}</h2>${p?`<p>${p}</p>`:''}</div>`;}
function empty(msg){return `<div class="empty"><div>${icon('radar')}<div>${esc(msg)}</div></div></div>`;}

function homeHtml(){
  const f=state.tournaments.find(t=>t.featured)||foundersFallback();const totalPlayers=state.profiles.length;const active=state.tournaments.filter(t=>t.status!=='completed').length;
  const liveLabel=f.status==='registration'?'LIVE REGISTRATION':f.status==='active'?`ROUND ${f.current_round} LIVE`:'COMPLETED';
  return `<div class="home-stack"><section class="premium-hero"><img class="premium-hero-art" src="./community-arena-main.webp?v=4" alt="Zero Caliber 2 Community Arena"><div class="premium-hero-vignette"></div><div class="premium-hero-content"><span class="live-pill"><i></i>${liveLabel}</span><span class="kicker">SEASON ZERO</span><h1>FOUNDERS<br><em>LEAGUE</em></h1><p>${esc(f.subtitle)}</p><div class="hero-stats"><span><b>${entryCount(f.id)}</b> registered</span><span><b>TOP 2</b> advance</span><span><b>CARGO</b> final</span></div><div class="action-row">${isJoined(f.id)?`<button class="btn registered big" disabled>${icon('verified')}Registered</button>`:`<button class="btn primary big" data-join="${f.id}">${icon('emoji_events')}Join now</button>`}<button class="btn glass big" data-open-tournament="${f.id}">${icon('account_tree')}Tournament map</button></div><div class="hero-produced"><span>Design & production</span><img src="./jw-eds-yellow.png?v=4" alt="JW EDS"></div></div></section>
    <section class="quick-strip"><article class="quick-card">${icon('groups')}<b>${totalPlayers}</b><span>COMMUNITY PLAYERS</span></article><article class="quick-card">${icon('emoji_events')}<b>${active}</b><span>OPEN / ACTIVE EVENTS</span></article><article class="quick-card">${icon('leaderboard')}<b>${state.league.length}</b><span>RANKED PLAYERS</span></article><article class="quick-card">${icon('verified_user')}<b>VERIFIED</b><span>RESULT APPROVAL</span></article></section>
    ${state.session?`<section class="panel premium-panel"><div class="panel-head"><div><span class="kicker">YOUR COMPETITION</span><h2>Founders League</h2></div><button data-open-tournament="${f.id}">Open tournament map ›</button></div>${state.featuredPortal?`<div class="rank-row"><span class="place">R${state.featuredPortal.round_number}</span><span class="name">Match ${state.featuredPortal.match_number} · ${esc(state.featuredPortal.map_name)}</span><span class="metric">${esc(state.featuredPortal.private_code)}</span><small>private code</small></div>`:isJoined(f.id)?`<div class="empty">You are registered. Your match slot and private code will appear here when Round 1 is generated.</div>`:`<div class="empty">Join the live registration to appear on the tournament board.</div>`}</section>`:''}
    <section class="dashboard-grid"><div class="panel premium-panel"><div class="panel-head"><div><span class="kicker">LIVE TABLE</span><h2>Community league</h2></div><button data-page="league">Full table ›</button></div>${state.league.slice(0,7).map((s,i)=>rankMini(s,i)).join('')||empty('The permanent league table begins with the first approved result.')}</div><div class="panel premium-panel"><div class="panel-head"><div><span class="kicker">YOUR FEED</span><h2>Activity</h2></div></div>${state.session?(state.notifications.slice(0,7).map(activityHtml).join('')||empty('Tournament and message updates will appear here.')):empty('Sign in to keep your competition record and messages across devices.')}</div></section><div class="legal-note">Unofficial community application. Zero Caliber 2 and related game trademarks belong to their respective rights holders.</div></div>`;
}

function rankMini(s,i){const p=playerById(s.user_id);return `<div class="rank-row"><span class="place">${i+1}</span><span class="name">${esc(p?.gamertag||'Player')}</span><span class="metric">${Number(s.adjusted_kills||0).toFixed(1)}</span><small>adj. kills</small></div>`;}
function activityHtml(n){return `<div class="activity-row">${icon(n.kind==='dm'?'mail':n.kind==='admin'?'shield':'notifications')}<div><b>${esc(n.title)}</b><span>${esc(n.body)}</span></div></div>`;}

function tournamentsHtml(){
  return `<section>${sectionTitle('COMPETE','Tournament centre','Official public tournaments are published by admins. Players can also create private invitation-only tournaments for their own groups.')}
    <div class="templates">${formats.slice(0,4).map((f,i)=>`<article class="template">${icon(['military_tech','target','groups','account_tree'][i]||'emoji_events')}<h3>${f}</h3><p>${formatHelp[f]}</p></article>`).join('')}</div>
    <div class="event-grid">${state.tournaments.map(t=>eventCard(t)).join('')||empty('No public tournaments are currently available.')}</div>
    ${state.session?`<div class="private-builder">${sectionTitle('PRIVATE EVENTS','Create your own tournament','Private tournaments do not appear on the public community board. Share the generated invitation link directly with your players.')}
      <div class="form-grid"><div class="field"><label>Tournament name</label><input id="privateTitle" placeholder="Friday Night Firefight"></div><div class="field"><label>Template</label><select id="privateFormat">${formats.map(f=>`<option>${f}</option>`).join('')}</select></div><div class="field wide"><label>Description</label><input id="privateSubtitle" value="Private community tournament"></div><div class="field"><label>Maximum players</label><input id="privateMax" type="number" min="3" max="128" value="16"></div><div class="field"><label>&nbsp;</label><button class="btn primary" id="createPrivateBtn">${icon('add')}Create private tournament</button></div></div>
      <div class="private-list">${state.privateEvents.map(t=>`<article><div><b>${esc(t.title)}</b><span>${esc(t.format)} · ${entryCount(t.id)}/${t.max_players||'∞'} players · ${t.status}</span></div><button class="btn secondary" data-open-tournament="${t.id}">Open</button>${t.created_by===state.session?.user.id?`<button class="btn secondary" data-share-event="${t.id}">Invite</button>${['Founders League','Deathmatch'].includes(t.format)&&t.status==='registration'?`<button class="btn primary" data-start-event="${t.id}">Start draw</button>`:''}`:''}</article>`).join('')||'<div class="muted">No private tournaments yet.</div>'}</div>
    </div>`:`<div class="panel" style="margin-top:24px">${empty('Sign in to enter competitions or create a private tournament.')}</div>`}
  </section>`;
}
function eventCard(t){return `<article class="event-card ${t.featured?'featured':''}"><span class="tag">${t.featured?'FEATURED · ':''}${esc(t.format||'Tournament').toUpperCase()}</span><h3>${esc(t.title)}</h3><p>${esc(t.subtitle)}</p><div class="event-meta"><span><b>${entryCount(t.id)}</b> entrants</span><span><b>${t.unlimited_entries?'∞':t.max_players||'—'}</b> cap</span><span><b>${esc(t.status)}</b></span></div><div class="action-row">${isJoined(t.id)?`<button class="btn registered" disabled>${icon('verified')}Registered</button>`:`<button class="btn primary" data-join="${t.id}">Join</button>`}<button class="btn secondary" data-open-tournament="${t.id}">Details</button></div></article>`;}

function leagueHtml(){
  const arcadeById=new Map((state.arcadeLeague||[]).map(r=>[r.user_id||r.id,r]));
  const leagueById=new Map((state.league||[]).map(r=>[r.user_id,r]));
  const ids=[...new Set([...(state.league||[]).map(r=>r.user_id),...(state.arcadeLeague||[]).map(r=>r.user_id||r.id).filter(Boolean)])];
  const rows=ids.map(id=>({id,league:leagueById.get(id)||{},arcade:arcadeById.get(id)||{}})).sort((a,b)=>Number(b.league.adjusted_kills||0)-Number(a.league.adjusted_kills||0)||Number(b.arcade.high_score||0)-Number(a.arcade.high_score||0));
  return `<section>${sectionTitle('LEAGUE','Community league','Approved competition results plus each signed-in player’s best Zombie Smash score.')}
    <div class="table-wrap"><table><thead><tr><th>#</th><th>Player</th><th>Matches</th><th>Raw kills</th><th>Adjusted kills</th><th>Zombie Smash</th><th>Qualifiers</th><th>Wins</th><th>DQ</th></tr></thead><tbody>${rows.map((r,i)=>{const s=r.league,p=playerById(r.id);const av=p?publicAvatar(p):'';return `<tr><td>${i+1}</td><td><button class="player-cell" data-player="${r.id}" style="border:0;background:none;color:inherit;padding:0">${av?`<img src="${av}" alt="">`:`<span class="tiny-avatar"></span>`}<span>${esc(p?.gamertag||r.arcade.gamertag||'Player')}</span></button></td><td>${s.matches||0}</td><td>${s.raw_kills||0}</td><td><b>${Number(s.adjusted_kills||0).toFixed(1)}</b></td><td><b>${Number(r.arcade.high_score||0).toLocaleString()}</b></td><td>${s.qualifiers||0}</td><td>${s.wins||0}</td><td>${s.disqualifications||0}</td></tr>`}).join('')||`<tr><td colspan="9">No recorded scores yet.</td></tr>`}</tbody></table></div>
  </section>`;
}
function communityHtml(){
  const q=state.communitySearch.toLowerCase();const list=state.profiles.filter(p=>!q||p.gamertag.toLowerCase().includes(q)||p.region.toLowerCase().includes(q));
  return `<section>${sectionTitle('COMMUNITY','Players','Open a profile to view competitive history or send a direct message.')}
    <div class="community-toolbar"><input class="search-input" id="communitySearch" value="${esc(state.communitySearch)}" placeholder="Search gamer tag or region…"><button class="btn secondary" id="inviteCommunityBtn">${icon('person_add')}Invite players</button></div>
    <div class="community-grid">${list.map(playerCard).join('')||empty('No matching players.')}</div></section>`;
}
function playerCard(p){const s=statById(p.id);const av=publicAvatar(p);return `<button class="player-card" data-player="${p.id}">${av?`<img src="${av}" alt="">`:`<span class="avatar-fallback">${esc(p.gamertag.slice(0,2).toUpperCase())}</span>`}<span class="pcopy"><b>${esc(p.gamertag)}</b><span>${esc(p.platform)} · ${esc(p.region||'Region not set')}</span><small>${s?Number(s.adjusted_kills).toFixed(1)+' league kills':'Unranked'}</small></span>${icon('chevron_right')}</button>`;}

function chatHtml(){
  if(!state.session)return `<section>${sectionTitle('COMMS','Messages','Community channels, mentions, private conversations and player calls in one place.')}${empty('Sign in to use messages.')}<div style="margin-top:12px"><button class="btn primary" id="signInInline">Sign in</button></div></section>`;
  if(!state.profile)return `<section>${empty('Your player profile is being prepared. Re-open Messages in a moment.')}</section>`;
  const direct=state.dmTarget;const uid=state.session.user.id;const value=direct?`dm:${direct.id}`:`room:${state.chatRoom}`;
  const dmOptions=state.dmThreads.map(t=>{const other=t.user_a===uid?t.user_b:t.user_a;const p=playerById(other);return p?`<option value="dm:${p.id}" ${value===`dm:${p.id}`?'selected':''}>Private · ${esc(p.gamertag)}</option>`:''}).join('');
  const roomOptions=roomNames.map(([id,name])=>`<option value="room:${id}" ${value===`room:${id}`?'selected':''}>Community · ${esc(name)}</option>`).join('');
  const mentions=state.chatRoom==='mentions'&&!direct;
  const busy=state.call.status!=='idle'||state.groupCall.status!=='idle';
  const directCall=direct?`<button class="comms-action" id="callPlayerBtn" ${busy?'disabled':''} title="Call ${esc(direct.gamertag)}">${icon('call')}<span>Call</span></button>`:'';
  const groupCall=`<button class="comms-action" id="groupCallBtn" ${busy?'disabled':''} title="Start a group call">${icon('groups')}<span>Group</span></button>`;
  return `<section>${sectionTitle('COMMS',direct?'Private message':mentions?'Mentions':'Messages','Live calls sit inside Messages. Calls ring first; the microphone only starts after Answer or Join.')}
    <div class="conversation-toolbar"><label><span>Conversation</span><select id="conversationSelect">${roomOptions}<option value="room:mentions" ${mentions?'selected':''}>Tagged · Mentions</option>${dmOptions?`<optgroup label="Private chats">${dmOptions}</optgroup>`:''}</select></label><button class="btn secondary" id="newDmBtn">${icon('add_comment')}New private chat</button></div>
    <div class="message-surface"><div class="chat-header"><div class="chat-header-copy"><b>${direct?'@ '+esc(direct.gamertag):mentions?'@ Mentions':esc(roomNames.find(r=>r[0]===state.chatRoom)?.[1]||state.chatRoom)}</b><span>${mentions?'Messages where your gamer tag was mentioned':direct?'Private conversation':'Community channel'}</span></div><div class="chat-header-actions">${directCall}${groupCall}</div></div>
    <div class="feed" id="chatFeed">${(direct?state.dmMessages:state.chat).map(messageHtml).join('')||'<div class="empty">No messages here yet.</div>'}</div>${mentions?'':`<div class="compose"><div id="mentionMenu" class="mention-menu hidden"></div><input id="chatInput" autocomplete="off" maxlength="700" placeholder="${direct?'Message '+esc(direct.gamertag):'Message community — use @ to tag a player'}"><button class="btn primary" id="sendMessageBtn">${icon('send')}</button></div>`}<div class="voice-note">${icon('lock')} Live calls only. Community Arena does not create an audio recording.</div></div></section>`;
}

function messageHtml(m){const mine=m.user_id===state.session?.user.id;const p=playerById(m.user_id);const body=esc(m.body).replace(/(@[A-Za-z0-9_.-]+)/g,'<mark>$1</mark>');return `<div class="bubble ${mine?'mine':''}"><small>${esc(p?.gamertag||'Player')} · ${new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</small><p>${body}</p></div>`;}

function galleryHtml(){
  return `<section>${sectionTitle('GALLERY','Community artwork','Your artwork, match screenshots and community creations in one shared gallery.')}
    ${state.session?`<div class="gallery-toolbar"><label class="btn secondary file-btn">${icon('add_photo_alternate')}Choose artwork<input id="galleryFile" type="file" accept="image/*"></label><input id="galleryCaption" class="search-input" placeholder="Caption"><button class="btn primary" id="publishGalleryBtn" disabled>Publish</button></div>`:''}
    <div class="gallery-grid">${state.gallery.map(g=>{const p=playerById(g.user_id);return `<figure class="gallery-card"><img src="${galleryUrl(g.image_path)}" alt="${esc(g.caption)}"><figcaption><b>${esc(g.caption||'Untitled')}</b><span>${esc(p?.gamertag||'Player')}</span></figcaption></figure>`}).join('')||empty('The gallery is ready for the first upload.')}</div></section>`;
}

function profileHtml(){
  if(!state.session)return `<section>${sectionTitle('IDENTITY','My profile','One simple account for your player identity, tournament history and messages.')}${empty('Sign in or create an account to build your player identity.')}<div style="margin-top:12px"><button class="btn primary" id="signInInline">Sign in / create account</button></div></section>`;
  const p=state.profile||{};const av=state.avatarDraftUrl||publicAvatar(p);const s=statById(state.session.user.id)||{};
  return `<section>${sectionTitle('IDENTITY','My player profile','Upload a normal profile photo or turn it into an on-device cel-shaded Anime Power portrait before saving.')}<div class="profile-editor premium-profile"><div class="profile-photo avatar-workbench">${av?`<img id="avatarPreviewImg" src="${av}" alt="Profile preview">`:`<span id="avatarPreviewFallback" class="avatar-fallback">${esc((p.gamertag||'ZC').slice(0,2).toUpperCase())}</span>`}<label class="btn secondary file-btn">${icon('photo_camera')}Choose photo<input id="avatarFile" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif"></label><div class="avatar-actions"><button class="btn primary" id="saveAvatarBtn" ${state.avatarDraftFile?'':'disabled'}>${icon('person')}Use photo</button><button class="btn power" id="animeAvatarBtn" ${state.avatarDraftFile?'':'disabled'}>${icon('auto_awesome')}Anime Power</button></div><small>Anime Power is an instant on-device cel-shading effect. Your original photo is not uploaded until you choose a result.</small></div><div><div class="form-grid"><div class="field"><label>Gamer tag</label><input id="profileGamertag" value="${esc(p.gamertag||'')}"></div><div class="field"><label>Platform</label><select id="profilePlatform">${['Quest','PCVR','Both'].map(v=>`<option ${p.platform===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label>Region</label><input id="profileRegion" value="${esc(p.region||'')}"></div><div class="field wide"><label>Bio</label><textarea id="profileBio" placeholder="Play style, preferred modes, availability…">${esc(p.bio||'')}</textarea></div></div><button class="btn primary" id="saveProfileBtn">${icon('save')}Save profile</button></div></div><div class="profile-summary"><div><b>${Number(s.adjusted_kills||0).toFixed(1)}</b><span>League kills</span></div><div><b>${s.matches||0}</b><span>Matches</span></div><div><b>${s.qualifiers||0}</b><span>Qualifications</span></div><div><b>${s.wins||0}</b><span>Wins</span></div></div></section>`;
}

function adminHtml(){
  if(!state.session)return `<section>${sectionTitle('CONTROL','Tournament administration')}${empty('Sign in first.')}</section>`;
  if(!state.admin)return `<section>${sectionTitle('CONTROL','Tournament administration','Admin requires the separate 4-digit code every time the app is reopened. Normal user sign-in never unlocks administration. The admin unlock lasts only for this running app session and every admin action is stored in the audit trail.')}<div class="admin-activate">${icon('admin_panel_settings')}<h3>Activate admin access</h3><p>Enter the tournament administration code.</p><div class="field"><input id="adminCode" type="password" inputmode="numeric" placeholder="Admin code"></div><br><button class="btn primary" id="activateAdminBtn">Activate admin</button></div></section>`;
  return `<section>${sectionTitle('CONTROL','Tournament administration','Approve submitted match results, validate cheating reports and publish official public competitions.')}
    <div class="admin-grid"><div class="admin-stack"><div class="admin-card"><h3>Official tournament rollout</h3><div class="form-grid"><div class="field"><label>Name</label><input id="publicTitle" placeholder="Community Championship"></div><div class="field"><label>Template</label><select id="publicFormat">${formats.map(f=>`<option>${f}</option>`).join('')}</select></div><div class="field wide"><label>Description</label><input id="publicSubtitle" placeholder="Official community event"></div><div class="field"><label>Player cap</label><input id="publicMax" type="number" min="3" max="256" value="16"></div><div class="field"><label><input id="publicUnlimited" type="checkbox"> Unlimited entries</label></div></div><button class="btn primary" id="createPublicBtn">${icon('publish')}Publish official event</button></div>
      <div class="admin-card"><h3>Registration / draws</h3>${state.tournaments.filter(t=>t.status==='registration').map(t=>`<div class="submission-row"><b>${esc(t.title)}</b><span class="muted">${esc(t.format)} · ${entryCount(t.id)} entrants</span>${['Founders League','Deathmatch'].includes(t.format)?`<button class="btn primary" data-start-event="${t.id}">Generate Round 1 draw</button>`:`<span class="muted">Organiser-managed bracket template</span>`}</div>`).join('')||'<span class="muted">No registration-stage events.</span>'}</div>
      <div class="admin-card"><h3>Result approval queue</h3><div id="adminSubmissions">${state.adminData?.submissions?.length?state.adminData.submissions.map(adminSubmissionHtml).join(''):'<span class="muted">No results waiting for approval.</span>'}</div></div>
      <div class="admin-card"><h3>Cheating reports</h3><div id="adminReports">${state.adminData?.reports?.length?state.adminData.reports.map(adminReportHtml).join(''):'<span class="muted">No reports waiting for review.</span>'}</div></div></div>
      <aside class="admin-card"><h3>Audit trail</h3>${state.adminData?.audit?.slice(0,40).map(a=>`<div class="audit-row"><span>${esc(playerById(a.actor_id)?.gamertag||a.actor_id||'System')}</span><b>${esc(a.action)}</b><small>${fmtDate(a.created_at)}</small></div>`).join('')||'<span class="muted">No audit entries.</span>'}</aside></div>
  </section>`;
}
function adminSubmissionHtml(s){const m=state.adminData.matches.find(x=>x.id===s.match_id);const scores=(s.scores||[]).map(x=>`${esc(x.player||playerById(x.player_id)?.gamertag||'Player')} ${Number(x.kills||0)}`).join(' · ');return `<div class="submission-row"><b>${m?`Round ${m.round_number} · Match ${m.match_number} · ${esc(m.map_name)}`:'Match result'}</b><span class="scoreline">${scores}</span><small>Submitted ${fmtDate(s.created_at)} · ${esc(s.source)}</small><div class="action-row">${s.screenshot_path?`<button class="btn secondary" data-proof="${esc(s.screenshot_path)}">View proof</button>`:''}<button class="btn primary" data-approve-submission="${s.id}">Approve result</button></div></div>`;}
function adminReportHtml(r){const reporter=playerById(r.reporter_id)?.gamertag||'Player';const target=playerById(r.target_id)?.gamertag||'Player';return `<div class="report-row"><b>${esc(target)}</b><span class="muted">Reported by ${esc(reporter)}</span><p>${r.dual_wield?'Dual-wield automatic weapons · ':''}${r.fast_run?'Fast-run glitch · ':''}${r.other_cheat?'Other cheating · ':''}${esc(r.details)}</p><div class="report-actions"><button class="btn secondary" data-resolve-report="${r.id}" data-decision="penalty">Validate penalty</button><button class="btn danger" data-resolve-report="${r.id}" data-decision="disqualified">Disqualify</button><button class="btn secondary" data-resolve-report="${r.id}" data-decision="dismissed">Dismiss</button></div></div>`;}

function drawerHtml(){
  if(state.modal?.type!=='notifications')return '';
  return `<aside class="notifications-drawer"><div class="drawer-head"><h3>Notifications</h3><button class="icon-btn" id="closeDrawer">${icon('close')}</button></div><button class="btn secondary" id="enableBrowserNotifications" style="width:100%;margin-bottom:10px">${icon('notifications_active')}Enable device notifications</button>${state.notifications.map(n=>`<div class="notice-item ${n.read?'':'unread'}" data-notice="${n.id}"><b>${esc(n.title)}</b><p>${esc(n.body)}</p><small>${fmtDate(n.created_at)}</small></div>`).join('')||empty('No notifications yet.')}</aside>`;
}

function modalHtml(){
  if(!state.modal)return '';if(state.modal.type==='notifications')return '';
  if(state.modal.type==='menu')return menuModalHtml();if(state.modal.type==='newDm')return newDmModalHtml();if(state.modal.type==='groupCallSetup')return groupCallSetupModalHtml();if(state.modal.type==='auth')return authModalHtml();if(state.modal.type==='invite')return inviteModalHtml();if(state.modal.type==='player')return playerModalHtml();if(state.modal.type==='tournament')return tournamentModalHtml();if(state.modal.type==='result')return resultModalHtml();if(state.modal.type==='report')return reportModalHtml();if(state.modal.type==='proof')return proofModalHtml();return '';
}

function modalWrap(body,narrow=false){return `<div class="modal-wrap" id="modalWrap"><div class="modal ${narrow?'narrow':''}"><div class="modal-body">${body}</div></div></div>`;}

function menuModalHtml(){return modalWrap(`<div class="modal-head"><div><span class="kicker">ARENA MENU</span><h2>Community Arena</h2></div><button class="icon-btn" data-close-modal>${icon('close')}</button></div><div class="premium-menu"><button data-menu-page="community">${icon('groups')}<span><b>Community</b><small>Players and profiles</small></span></button><button data-menu-page="gallery">${icon('photo_library')}<span><b>Gallery</b><small>Artwork and screenshots</small></span></button>${state.session?`<button data-menu-page="admin">${icon('shield')}<span><b>${state.admin?'Administration':'Admin access'}</b><small>${state.admin?'Results, reports and events':'Enter the admin code for this app session'}</small></span></button>`:''}<button id="menuInvite">${icon('person_add')}<span><b>Invite a player</b><small>Share Community Arena</small></span></button><button id="replayIntroBtn">${icon('movie')}<span><b>Replay intro</b><small>Community Arena opening</small></span></button>${state.session?`<button id="menuSignOut">${icon('logout')}<span><b>Sign out</b><small>${esc(state.profile?.gamertag||'Current account')}</small></span></button>`:''}</div><div class="menu-brand"><img src="./jw-eds-yellow.png?v=4" alt="JW EDS"><span>Build ${BUILD}</span></div>`,true);}
function newDmModalHtml(){const players=state.profiles.filter(p=>p.id!==state.session?.user.id);return modalWrap(`<div class="modal-head"><div><span class="kicker">PRIVATE CHAT</span><h2>Start a conversation</h2><p>Select a Community Arena player.</p></div><button class="icon-btn" data-close-modal>${icon('close')}</button></div><div class="field"><label>Player</label><select id="newDmPlayer"><option value="">Choose player…</option>${players.map(p=>`<option value="${p.id}">${esc(p.gamertag)}</option>`).join('')}</select></div><br><button class="btn primary big" id="startDmBtn">${icon('chat')}Open private chat</button>`,true);}
function groupCallSetupModalHtml(){
  const players=state.profiles.filter(p=>p.id!==state.session?.user.id);const pre=state.modal.preselect||'';
  return modalWrap(`<div class="modal-head"><div><span class="kicker">GROUP CALL</span><h2>Build your squad call</h2><p>Invite 2–5 players. Up to six people can join including you.</p></div><button class="icon-btn" data-close-modal>${icon('close')}</button></div><div class="field"><label>Call name</label><input id="groupCallTitle" maxlength="36" value="Squad call" placeholder="Squad call"></div><div class="group-call-picker">${players.map(p=>{const av=publicAvatar(p);return `<label class="group-player-pick"><input class="group-call-check" type="checkbox" value="${p.id}" ${p.id===pre?'checked':''}><span class="group-pick-avatar">${av?`<img src="${av}" alt="">`:esc(p.gamertag.slice(0,2).toUpperCase())}</span><span><b>${esc(p.gamertag)}</b><small>${esc(p.platform||'Player')}</small></span><i>${icon('check')}</i></label>`}).join('')||empty('No other players are available yet.')}</div><div class="group-call-limit"><span id="groupCallCount">${pre?'1':'0'} selected</span><span>Maximum 5 invitees</span></div><button class="btn primary big" id="startGroupCallBtn">${icon('groups')}Start group call</button>`,true);
}


function authModalHtml(){
  const p=state.oauthProviders;const socials=[p.google&&['google','Google','G'],p.apple&&['apple','Apple','●'],p.discord&&['discord','Discord','D'],p.twitter&&['twitter','X','X']].filter(Boolean);
  const socialHtml=socials.length?`<div class="social-login-grid">${socials.map(([provider,label,mark])=>`<button class="social-login ${provider}" data-oauth="${provider}"><span class="social-mark">${mark}</span><span>Continue with ${label}</span></button>`).join('')}</div><div class="auth-divider"><span>or use email</span></div>`:'';
  return modalWrap(`<div class="modal-head"><div><span class="kicker">ACCOUNT</span><h2>Join Community Arena</h2><p>Create the essentials now. You can add a photo, bio and other profile details later.</p></div><button class="icon-btn" data-close-modal>${icon('close')}</button></div>${socialHtml}<div class="auth-tabs"><button class="btn primary" id="authSignInTab">Sign in</button><button class="btn secondary" id="authSignUpTab">Create account</button></div><div class="form-grid"><div class="field wide"><label>Email</label><input id="authEmail" type="email" autocomplete="email" placeholder="you@example.com"></div><div class="field wide"><label>Password</label><input id="authPassword" type="password" autocomplete="current-password" minlength="8" placeholder="Minimum 8 characters"></div><div id="signupExtras" class="signup-extras hidden"><div class="field"><label>Gamer tag</label><input id="authGamertag" maxlength="24" placeholder="Your ZC2 name"></div><div class="field"><label>Platform</label><select id="authPlatform"><option>Quest</option><option>PCVR</option><option>Both</option></select></div></div></div><div class="auth-action-row"><button class="btn primary big" id="authSubmit">Sign in</button><button class="btn ghost" id="forgotPasswordBtn">Forgot password</button></div><p class="auth-note">Unavailable social providers are hidden automatically. Your Community Arena account and tournament record stay linked across devices.</p>`,true);
}

function inviteModalHtml(){const link=state.modal.link||baseUrl();return modalWrap(`<div class="modal-head"><div><span class="kicker">INVITE</span><h2>${state.modal.title||'Join the community'}</h2><p>Share this link by email, text, copy/paste or the device share sheet used by Quest and other apps.</p></div><button class="icon-btn" data-close-modal>${icon('close')}</button></div><div class="invite-actions"><button id="inviteEmail">${icon('mail')}Email</button><button id="inviteSms">${icon('sms')}Phone / SMS</button><button id="inviteCopy">${icon('content_copy')}Copy link</button><button id="inviteNative">${icon('share')}Quest / apps</button></div><div class="invite-link">${esc(link)}</div><img class="invite-artwork" src="./community-arena-join.webp?v=4" alt="Join ZC2 Community Arena">`,true);}
function playerModalHtml(){const p=state.modal.player;const s=statById(p.id)||{};const av=publicAvatar(p);return modalWrap(`<div class="modal-head"><div class="profile-modal-hero">${av?`<img src="${av}" alt="">`:`<span class="avatar-fallback">${esc(p.gamertag.slice(0,2).toUpperCase())}</span>`}<div><span class="kicker">PLAYER PROFILE</span><h2>${esc(p.gamertag)}</h2><p>${esc(p.platform)} · ${esc(p.region||'Region not set')}</p></div></div><button class="icon-btn" data-close-modal>${icon('close')}</button></div><p class="muted">${esc(p.bio||'No bio yet.')}</p><div class="profile-summary"><div><b>${Number(s.adjusted_kills||0).toFixed(1)}</b><span>League kills</span></div><div><b>${s.matches||0}</b><span>Matches</span></div><div><b>${s.qualifiers||0}</b><span>Qualifications</span></div><div><b>${s.wins||0}</b><span>Wins</span></div></div>${state.session?.user.id!==p.id?`<div class="profile-contact-actions"><button class="btn primary" data-dm-from-profile="${p.id}">${icon('chat')}Direct message</button><button class="btn secondary profile-call-btn" data-call-player="${p.id}" data-call-name="${esc(p.gamertag)}" ${(state.call.status!=='idle'||state.groupCall.status!=='idle')?'disabled':''}>${icon('call')}Call</button></div>`:''}`);}
function tournamentModalHtml(){
  const t=state.selectedTournament;if(!t)return '';const current=state.portal;const canStart=(state.admin||(t.visibility==='private'&&t.created_by===state.session?.user.id))&&t.status==='registration'&&['Founders League','Deathmatch'].includes(t.format);
  const live=t.status==='registration'?'LIVE REGISTRATION':t.status==='active'?`ROUND ${t.current_round} LIVE`:'COMPLETE';
  return modalWrap(`<div class="modal-head"><div><span class="live-pill compact"><i></i>${live}</span><h2>${esc(t.title)}</h2><p>${esc(t.subtitle)} · ${esc(t.format)}</p></div><button class="icon-btn" data-close-modal>${icon('close')}</button></div><div class="rules-strip"><div><b>3–4</b><span>players per group</span></div><div><b>TOP 2</b><span>advance</span></div><div><b>CARGO</b><span>four-player final</span></div><div><b>NO BOTS</b><span>real players</span></div></div>${current?`<div class="current-match"><div><span class="kicker">YOUR MATCH</span><h3>${current.is_final?'CARGO FINAL':'Round '+current.round_number+' · Match '+current.match_number}</h3><span class="muted">${esc(current.map_name)}</span></div><div class="server-code"><span>PRIVATE SERVER CODE</span><b>${esc(current.private_code)}</b><button class="btn secondary" data-copy="${esc(current.private_code)}">${icon('content_copy')}Copy</button></div><div class="participant-list">${(current.players||[]).map(p=>`<div class="participant"><span>${esc(p.gamertag)}</span>${p.user_id!==state.session?.user.id?`<button data-report-player="${p.user_id}" data-report-name="${esc(p.gamertag)}">${icon('flag')}Report</button>`:''}</div>`).join('')}</div><button class="btn primary big" id="submitResultBtn">${icon('upload')}Submit result</button></div>`:isJoined(t.id)?`<div class="joined-banner">${icon('verified')}<span><b>You are registered.</b>Your name is on the live registration board. Match details appear after the draw.</span></div>`:''}<div class="action-row" style="margin:13px 0">${t.status==='registration'&&!isJoined(t.id)?`<button class="btn primary" data-join="${t.id}">Join tournament</button>`:''}${canStart?`<button class="btn primary" data-start-event="${t.id}">${icon('shuffle')}Generate Round 1 draw</button>`:''}${t.visibility==='private'&&t.created_by===state.session?.user.id?`<button class="btn secondary" data-share-event="${t.id}">${icon('share')}Invite players</button>`:''}</div>${tournamentMapHtml(t)}<div class="anti-cheat">${icon('gpp_bad')}<div><b>Competition rules</b><span>Dual-wield automatic weapons −30% kills · Fast-run glitch −20% kills · Other validated cheating can disqualify a player.</span></div></div>`);
}

function bracketSlotHtml(name,index,stateClass=''){
  return `<div class="bracket-slot ${stateClass}"><span class="slot-no">${String(index).padStart(2,'0')}</span><b>${esc(name)}</b></div>`;
}
function boardMatchHtml(m){
  const players=(m.players||[]);
  const slots=players.length
    ? players.map((p,i)=>bracketSlotHtml(p.gamertag,i+1,m.status==='approved'?'qualified-slot':'')).join('')
    : [1,2,3,4].map(i=>bracketSlotHtml('Open slot',i,'open-slot')).join('');
  const scoreRows=m.status==='approved'?(m.scores||[]).map(s=>`<div class="result-line"><b>${esc(s.gamertag)}</b><span>${Number(s.adjusted_kills).toFixed(1)} kills${s.penalty_pct?' · −'+s.penalty_pct+'%':''}${s.disqualified?' · DQ':''}</span></div>`).join(''):'';
  return `<article class="arena-match-node ${m.status==='approved'?'approved':''}">
    <div class="node-top"><span class="map-badge">${esc(m.map_name)}</span><span class="match-status">${esc(m.status.replaceAll('_',' '))}</span></div>
    <h4>${m.is_final?'CARGO FINAL':'MATCH '+m.match_number}</h4>
    <div class="bracket-slots">${slots}</div>
    ${scoreRows?`<div class="result-stack">${scoreRows}</div>`:''}
    ${m.is_final?`<div class="node-footer champion-footer">${icon('military_tech')} Winner becomes tournament champion</div>`:`<div class="node-footer">Top two advance</div>`}
  </article>`;
}

function seedPlayerHtml(p,index){
  const av=publicAvatar(p);
  return `<div class="registered-player">
    ${av?`<img src="${av}" alt="">`:`<span class="registered-avatar">${esc((p.gamertag||'?').slice(0,2).toUpperCase())}</span>`}
    <div><b>${esc(p.gamertag)}</b><small>${esc(p.platform||'Player')} · registered</small></div>
    <span class="registration-seed">${String(index).padStart(2,'0')}</span>
  </div>`;
}
function registeredPlayersFor(tid){return state.entries.filter(e=>e.tournament_id===tid&&e.status==='active').map(e=>playerById(e.user_id)).filter(Boolean);}
function projectedStages(count){
  let n=Math.max(count,6),stages=[],round=1;
  while(n>4&&round<7){
    const groups=Math.ceil(n/4);
    stages.push({round,groups,players:n});
    n=groups*2;round++;
  }
  stages.push({round,groups:1,players:4,final:true});
  return stages;
}
function projectedGroupNode(stage,groupIndex){
  const base=Math.floor(stage.players/stage.groups);
  const extra=stage.players%stage.groups;
  const size=Math.max(3,Math.min(4,base+(groupIndex>=stage.groups-extra?1:0)));
  return `<article class="arena-match-node projected">
    <div class="node-top"><span class="map-badge">ROUND ${stage.round}</span><span class="match-status">draw pending</span></div>
    <h4>GROUP ${groupIndex+1}</h4>
    <div class="bracket-slots">${Array.from({length:size},(_,i)=>bracketSlotHtml('Draw slot',i+1,'open-slot')).join('')}</div>
    <div class="node-footer">Top two advance</div>
  </article>`;
}
function stageConnectorHtml(label='ADVANCE'){
  return `<div class="stage-link"><span>${label}</span></div>`;
}
function tournamentMapHtml(t){
  const registered=registeredPlayersFor(t.id);
  const rounds=[...new Set(state.board.map(m=>m.round_number))].sort((a,b)=>a-b);
  const minimum=Math.max(0,6-registered.length);
  const regNames=registered.length
    ? registered.map((p,i)=>seedPlayerHtml(p,i+1)).join('')
    : `<div class="registration-empty">${icon('groups')}<b>Waiting for the first players</b><span>Registered gamer tags will appear here live.</span></div>`;

  let cols=`<section class="stage-column registration-stage">
    <div class="stage-number">START</div>
    <div class="stage-head"><span>REGISTRATION</span><b>${registered.length} PLAYER${registered.length===1?'':'S'}</b><small>${minimum?minimum+' more needed before the first draw can start':'Minimum reached · draw can be generated'}</small></div>
    <div class="seed-pool">${regNames}</div>
  </section>`;

  if(rounds.length){
    cols+=rounds.map(r=>{
      const matches=state.board.filter(m=>m.round_number===r);
      const final=matches.some(m=>m.is_final);
      return `${stageConnectorHtml(final?'FINALISTS':'TOP 2')}<section class="stage-column ${final?'final-stage':''}">
        <div class="stage-number">${final?icon('military_tech'):String(r).padStart(2,'0')}</div>
        <div class="stage-head"><span>${final?'CHAMPIONSHIP':'STAGE '+r}</span><b>${final?'CARGO FINAL':'ROUND '+r}</b><small>${final?'Four players · one champion':matches.length+' live group'+(matches.length===1?'':'s')}</small></div>
        <div class="stage-match-grid">${matches.map(boardMatchHtml).join('')}</div>
      </section>`;
    }).join('');
    if(t.status==='active')cols+=`${stageConnectorHtml('NEXT')}<section class="stage-column locked-stage"><div class="stage-number">${icon('lock')}</div><div class="stage-head"><span>NEXT STAGE</span><b>LOCKED</b><small>Opens when current results are approved</small></div><div class="map-placeholder">${icon('lock')}Waiting for all current matches.</div></section>`;
  }else{
    const stages=projectedStages(registered.length);
    cols+=stages.map(s=>`${stageConnectorHtml(s.final?'FINALISTS':'TOP 2')}<section class="stage-column ${s.final?'final-stage':''}">
      <div class="stage-number">${s.final?icon('military_tech'):String(s.round).padStart(2,'0')}</div>
      <div class="stage-head"><span>${s.final?'CHAMPIONSHIP':'PROJECTED STAGE'}</span><b>${s.final?'CARGO FINAL':'ROUND '+s.round}</b><small>${s.final?'Four finalists · one champion':s.groups+' group'+(s.groups===1?'':'s')+' projected'}</small></div>
      <div class="stage-match-grid">${s.final?`<article class="arena-match-node projected final-card"><div class="node-top"><span class="map-badge">CARGO</span><span class="match-status">championship</span></div><h4>4 FINALISTS</h4><div class="bracket-slots">${[1,2,3,4].map(i=>bracketSlotHtml('Finalist '+i,i,'open-slot')).join('')}</div><div class="node-footer champion-footer">${icon('military_tech')} One champion</div></article>`:Array.from({length:s.groups},(_,i)=>projectedGroupNode(s,i)).join('')}</div>
    </section>`).join('');
  }

  return `<section class="tournament-map premium-tournament-map">
    <div class="tournament-map-art" aria-hidden="true"></div>
    <div class="tournament-map-head">
      <div><span class="kicker">LIVE TOURNAMENT MAP</span><h3>Road to Cargo</h3><p>Every registration, group, qualifier and final is shown on one live competition route.</p></div>
      <div class="map-live-key"><span><i></i>${state.board.length?'LIVE DRAW':'LIVE REGISTRATION'}</span><small>${registered.length} registered</small></div>
    </div>
    <div class="tournament-map-scroll"><div class="tournament-map-track">${cols}</div></div>
    <div class="map-legend"><span><i class="legend-open"></i>Open / projected</span><span><i class="legend-live"></i>Registered / live</span><span><i class="legend-final"></i>Cargo championship</span></div>
  </section>`;
}
function resultModalHtml(){const m=state.modal.match;return modalWrap(`<div class="modal-head"><div><span class="kicker">RESULT SUBMISSION</span><h2>Round ${m.round_number} · Match ${m.match_number}</h2><p>Upload the in-game result screen or enter the kills manually. Screenshot reading is a beta helper; always check the extracted scores before submitting.</p></div><button class="icon-btn" data-close-modal>${icon('close')}</button></div><label class="btn secondary file-btn">${icon('photo_camera')}Upload result screenshot<input id="resultScreenshot" type="file" accept="image/*"></label><div class="progress"><span id="ocrProgress"></span></div><div id="ocrStatus" class="muted" style="font-size:10px"></div><div class="score-grid">${(m.players||[]).map(p=>`<label class="score-field"><span>${esc(p.gamertag)}</span><input class="scoreInput" data-player-id="${p.user_id}" data-player-name="${esc(p.gamertag)}" type="number" min="0" value="0"><small>kills</small></label>`).join('')}</div><button class="btn primary big" id="confirmResultBtn">Submit for admin approval</button>`,true);}
function reportModalHtml(){const p=state.modal.target;return modalWrap(`<div class="modal-head"><div><span class="kicker">REPORT PLAYER</span><h2>${esc(p.gamertag)}</h2><p>Reports are tied to your app profile and highlighted to tournament admins.</p></div><button class="icon-btn" data-close-modal>${icon('close')}</button></div><div class="report-options"><label class="check-line"><input id="reportDual" type="checkbox"><span><b>Dual-wield automatic weapons</b><small>Validated rule breach: 30% kill deduction</small></span></label><label class="check-line"><input id="reportFast" type="checkbox"><span><b>Fast-run glitch</b><small>Validated rule breach: 20% kill deduction</small></span></label><label class="check-line"><input id="reportOther" type="checkbox"><span><b>Other cheating</b><small>Admin may disqualify the player</small></span></label><div class="field"><label>What happened?</label><textarea id="reportDetails" maxlength="600" placeholder="Describe what you observed…"></textarea></div></div><button class="btn danger" id="submitReportBtn">${icon('flag')}Submit report</button>`,true);}
function proofModalHtml(){return modalWrap(`<div class="modal-head"><div><span class="kicker">RESULT EVIDENCE</span><h2>Submitted screenshot</h2></div><button class="icon-btn" data-close-modal>${icon('close')}</button></div><img src="${state.modal.url}" style="width:100%;display:block" alt="Result evidence">`);}

function bindCommon(){
  $$('[data-page]').forEach(b=>b.onclick=()=>{state.page=b.dataset.page;state.modal=null;if(state.page==='chat')loadChat();if(state.page==='admin')loadAdminData();render();});
  $('#signInBtn')?.addEventListener('click',()=>openAuth());$('#signInInline')?.addEventListener('click',()=>openAuth());
  $('#inviteAppBtn')?.addEventListener('click',()=>openInvite(baseUrl(),'Join ZC2 Community Arena'));$('#bellBtn')?.addEventListener('click',async()=>{state.modal={type:'notifications'};render();await markNotificationsRead();});$('#moreMenuBtn')?.addEventListener('click',()=>{state.modal={type:'menu'};render();});
  $('#closeDrawer')?.addEventListener('click',()=>{state.modal=null;render();});$('#enableBrowserNotifications')?.addEventListener('click',requestBrowserNotifications);
  $$('[data-close-modal]').forEach(b=>b.onclick=()=>{state.modal=null;render();});$('#modalWrap')?.addEventListener('mousedown',e=>{if(e.target.id==='modalWrap'){state.modal=null;render();}});
  $$('[data-copy]').forEach(b=>b.onclick=()=>copyText(b.dataset.copy));$$('[data-join]').forEach(b=>b.onclick=()=>joinTournament(b.dataset.join));$$('[data-open-tournament]').forEach(b=>b.onclick=()=>openTournament(b.dataset.openTournament));$$('[data-player]').forEach(b=>b.onclick=()=>openPlayer(b.dataset.player));$$('[data-share-event]').forEach(b=>b.onclick=()=>shareTournament(b.dataset.shareEvent));$$('[data-start-event]').forEach(b=>b.onclick=()=>startTournament(b.dataset.startEvent));
  $('#skipIntroBtn')?.addEventListener('click',()=>{state.showIntro=false;localStorage.setItem('zc2-intro-v4','1');render();});
}

function bindPage(){
  if(state.page==='tournaments')bindTournaments();if(state.page==='arcade')window.ZC2Arcade?.bindPage?.();if(state.page==='community')bindCommunity();if(state.page==='chat')bindChat();if(state.page==='gallery')bindGallery();if(state.page==='profile')bindProfile();if(state.page==='admin')bindAdmin();
  bindModal();
}

function bindTournaments(){ $('#createPrivateBtn')?.addEventListener('click',createPrivateTournament); }
function bindCommunity(){ $('#communitySearch')?.addEventListener('input',e=>{state.communitySearch=e.target.value;render();setTimeout(()=>$('#communitySearch')?.focus(),0);});$('#inviteCommunityBtn')?.addEventListener('click',()=>openInvite(baseUrl(),'Join ZC2 Community Arena')); }
function bindChat(){
  $('#conversationSelect')?.addEventListener('change',async e=>{const value=e.target.value;if(value.startsWith('dm:')){await openDm(value.slice(3));return;}state.dmTarget=null;state.dmThread=null;state.dmMessages=[];state.chatRoom=value.slice(5);await loadChat();render();});
  $('#newDmBtn')?.addEventListener('click',()=>{state.modal={type:'newDm'};render();});$('#sendMessageBtn')?.addEventListener('click',sendCurrentMessage);$('#chatInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendCurrentMessage();}});$('#chatInput')?.addEventListener('input',mentionSuggest);$('#callPlayerBtn')?.addEventListener('click',()=>state.dmTarget&&startDirectCall(state.dmTarget.id,state.dmTarget.gamertag));$('#groupCallBtn')?.addEventListener('click',()=>{state.modal={type:'groupCallSetup',preselect:state.dmTarget?.id||''};render();});setTimeout(()=>{const f=$('#chatFeed');if(f)f.scrollTop=f.scrollHeight;},0);
}

function bindGallery(){ let chosen=null;$('#galleryFile')?.addEventListener('change',e=>{chosen=e.target.files?.[0]||null;$('#publishGalleryBtn').disabled=!chosen;});$('#publishGalleryBtn')?.addEventListener('click',()=>publishGallery(chosen)); }
function bindProfile(){
  $('#avatarFile')?.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)handleAvatarSelection(f);});$('#saveAvatarBtn')?.addEventListener('click',()=>state.avatarDraftFile&&uploadAvatar(state.avatarDraftFile));$('#animeAvatarBtn')?.addEventListener('click',()=>state.avatarDraftFile&&createAnimePowerAvatar(state.avatarDraftFile));$('#saveProfileBtn')?.addEventListener('click',saveProfile);
}

function bindAdmin(){ $('#activateAdminBtn')?.addEventListener('click',activateAdmin);$('#createPublicBtn')?.addEventListener('click',createPublicTournament);$$('[data-approve-submission]').forEach(b=>b.onclick=()=>approveSubmission(b.dataset.approveSubmission));$$('[data-resolve-report]').forEach(b=>b.onclick=()=>resolveReport(b.dataset.resolveReport,b.dataset.decision));$$('[data-proof]').forEach(b=>b.onclick=()=>openProof(b.dataset.proof)); }
function bindModal(){
  if(!state.modal)return;
  if(state.modal.type==='menu'){$$('[data-menu-page]').forEach(b=>b.onclick=()=>{state.page=b.dataset.menuPage;state.modal=null;if(state.page==='admin')loadAdminData();render();});$('#menuInvite')?.addEventListener('click',()=>openInvite(baseUrl(),'Join ZC2 Community Arena'));$('#replayIntroBtn')?.addEventListener('click',replayIntro);$('#menuSignOut')?.addEventListener('click',async()=>{state.modal=null;if(state.call.status!=='idle')hangupCall();if(state.groupCall.status!=='idle')leaveGroupCall();await leaveVoice();await supabase.auth.signOut();setToast('Signed out.');});}
  if(state.modal.type==='newDm')$('#startDmBtn')?.addEventListener('click',async()=>{const id=$('#newDmPlayer').value;if(!id)return setToast('Choose a player.');state.modal=null;state.page='chat';await openDm(id);});
  if(state.modal.type==='groupCallSetup'){
    const updateCount=()=>{const checked=$$('.group-call-check:checked');if(checked.length>5){checked.at(-1).checked=false;setToast('Group calls support up to 6 people including you.');}const n=$$('.group-call-check:checked').length;const c=$('#groupCallCount');if(c)c.textContent=n+' selected';};
    $$('.group-call-check').forEach(c=>c.addEventListener('change',updateCount));
    $('#startGroupCallBtn')?.addEventListener('click',startGroupCallFromModal);
  }
  if(state.modal.type==='auth')bindAuthModal();if(state.modal.type==='invite')bindInviteModal();if(state.modal.type==='player'){$('[data-dm-from-profile]')?.addEventListener('click',e=>{const id=e.currentTarget.dataset.dmFromProfile;state.modal=null;state.page='chat';openDm(id);});$('[data-call-player]')?.addEventListener('click',e=>startDirectCall(e.currentTarget.dataset.callPlayer,e.currentTarget.dataset.callName));}
  if(state.modal.type==='tournament'){$('#submitResultBtn')?.addEventListener('click',()=>{if(state.portal)state.modal={type:'result',match:{...state.portal,players:state.portal.players||[]}};render();});$$('[data-report-player]').forEach(b=>b.onclick=()=>{state.modal={type:'report',target:{id:b.dataset.reportPlayer,gamertag:b.dataset.reportName},matchId:state.portal.match_id};render();});}
  if(state.modal.type==='result')bindResultModal();if(state.modal.type==='report')$('#submitReportBtn')?.addEventListener('click',submitReport);
}

function openAuth(){state.modal={type:'auth',mode:'signin'};render();}
function bindAuthModal(){
  const extras=$('#signupExtras');const forgot=$('#forgotPasswordBtn');const setMode=mode=>{state.modal.mode=mode;$('#authSignInTab').className='btn '+(mode==='signin'?'primary':'secondary');$('#authSignUpTab').className='btn '+(mode==='signup'?'primary':'secondary');$('#authSubmit').textContent=mode==='signup'?'Create my account':'Sign in';extras?.classList.toggle('hidden',mode!=='signup');if(forgot)forgot.style.display=mode==='signup'?'none':'';};
  if(state.modal.mode==='recovery'){$('#authSignInTab').style.display='none';$('#authSignUpTab').style.display='none';$('#authEmail').closest('.field').style.display='none';extras?.classList.add('hidden');$('#authSubmit').textContent='Set new password';$('#authPassword').placeholder='Enter a new password';if(forgot)forgot.style.display='none';}else setMode(state.modal.mode||'signin');
  $('#authSignInTab').onclick=()=>setMode('signin');$('#authSignUpTab').onclick=()=>setMode('signup');$('#authSubmit').onclick=submitAuth;if(forgot)forgot.onclick=requestPasswordReset;$$('[data-oauth]').forEach(button=>button.onclick=()=>signInWithOAuthProvider(button.dataset.oauth));
}

async function signInWithOAuthProvider(provider){
  if(!state.oauthProviders[provider]){
    setToast(provider==='twitter'?'X login is wired but still needs its provider credentials enabled in Supabase.':provider.charAt(0).toUpperCase()+provider.slice(1)+' login is wired but still needs its provider credentials enabled in Supabase.');
    return;
  }
  const {error}=await supabase.auth.signInWithOAuth({
    provider,
    options:{redirectTo:oauthReturnUrl(),skipBrowserRedirect:false}
  });
  if(error)setToast(error.message);
}
async function submitAuth(){
  const email=$('#authEmail')?.value.trim()||'';const password=$('#authPassword')?.value||'';const mode=state.modal.mode||'signin';
  if(mode==='recovery'){if(password.length<8)return setToast('Use a new password of at least 8 characters.');const {error}=await supabase.auth.updateUser({password});if(error)return setToast(error.message);state.authRecovery=false;state.modal=null;setToast('Password updated.');return render();}
  if(!email||password.length<8)return setToast('Enter your email and a password of at least 8 characters.');let res;
  if(mode==='signup'){
    const gamertag=$('#authGamertag')?.value.trim()||'';const platform=$('#authPlatform')?.value||'Quest';if(gamertag.length<2)return setToast('Choose a gamer tag.');
    res=await supabase.auth.signUp({email,password,options:{emailRedirectTo:baseUrl(),data:{gamertag,platform}}});
  }else res=await supabase.auth.signInWithPassword({email,password});
  if(res.error)return setToast(res.error.message);if(mode==='signup'&&!res.data.session){state.modal=null;setToast('Account created. Check your email once, then open Community Arena and sign in.');render();}else{state.modal=null;setToast(mode==='signup'?'Account ready.':'Signed in.');await refreshAll();await handlePendingInvite();render();}
}

async function requestPasswordReset(){const email=$('#authEmail')?.value.trim();if(!email)return setToast('Enter your email address first.');const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:baseUrl()});if(error)return setToast(error.message);state.modal=null;setToast('Password reset email sent.');render();}

async function joinTournament(id,invite=null){
  if(!state.session){state.modal={type:'auth',mode:'signin'};return render();}
  try{const {error}=await supabase.rpc('join_tournament',{p_tournament:id,p_invite:invite});if(error)throw error;setToast('Tournament entry confirmed.');await refreshAll();if(state.selectedTournament?.id===id)await openTournament(id);}catch(e){setToast(e.message||'Could not join tournament.');}
}

async function openTournament(id){
  const t=[...state.tournaments,...state.privateEvents].find(x=>x.id===id);if(!t)return;
  state.selectedTournament=t;const {data,error}=await supabase.rpc('get_tournament_board',{p_tournament:id});if(error)console.warn(error);state.board=data||[];state.portal=null;
  if(state.session&&isJoined(id)){const p=await supabase.rpc('my_match_portal',{p_tournament:id});state.portal=p.data?.[0]||null;}
  state.modal={type:'tournament'};render();
}

async function startTournament(id){
  try{const {data,error}=await supabase.rpc('start_tournament',{p_tournament:id});if(error)throw error;setToast(`Round 1 draw generated: ${data} matches.`);await refreshAll();if(state.selectedTournament?.id===id)await openTournament(id);else render();}catch(e){setToast(e.message||'Tournament could not start.');}
}

async function createPrivateTournament(){
  if(!state.session)return openAuth();const title=$('#privateTitle').value.trim(),subtitle=$('#privateSubtitle').value.trim(),max=Number($('#privateMax').value||16),format=$('#privateFormat').value;if(!title)return setToast('Enter a tournament name.');
  const {data,error}=await supabase.rpc('create_private_tournament_v2',{p_title:title,p_subtitle:subtitle,p_max_players:max,p_format:format});if(error)return setToast(error.message);await refreshAll();setToast('Private tournament created.');const t=state.privateEvents.find(x=>x.id===data);if(t)shareTournament(t.id);else render();
}
async function createPublicTournament(){
  const title=$('#publicTitle').value.trim(),subtitle=$('#publicSubtitle').value.trim(),max=Number($('#publicMax').value||16),format=$('#publicFormat').value,unlimited=$('#publicUnlimited').checked;if(!title)return setToast('Enter a tournament name.');const {error}=await supabase.rpc('admin_create_public_tournament',{p_title:title,p_subtitle:subtitle,p_max_players:max,p_format:format,p_unlimited:unlimited});if(error)return setToast(error.message);setToast('Official public tournament published.');await refreshAll();await loadAdminData();render();
}

function shareTournament(id){const t=[...state.tournaments,...state.privateEvents].find(x=>x.id===id);if(!t)return;const link=t.visibility==='private'?`${baseUrl()}?tournament=${encodeURIComponent(t.id)}&invite=${encodeURIComponent(t.invite_code)}`:`${baseUrl()}?tournament=${encodeURIComponent(t.id)}`;openInvite(link,`Join ${t.title}`);}
function openInvite(link,title){state.modal={type:'invite',link,title};render();}
function bindInviteModal(){const link=state.modal.link;$('#inviteEmail').onclick=()=>location.href=`mailto:?subject=${encodeURIComponent(state.modal.title)}&body=${encodeURIComponent(link)}`;$('#inviteSms').onclick=()=>location.href=`sms:?&body=${encodeURIComponent(state.modal.title+' '+link)}`;$('#inviteCopy').onclick=()=>copyText(link);$('#inviteNative').onclick=()=>nativeShare(state.modal.title,link);}
async function nativeShare(title,url){try{if(navigator.share)await navigator.share({title,text:'Join me in Zero Caliber 2 Community Arena',url});else await copyText(url);}catch{}}
async function copyText(text){try{await navigator.clipboard.writeText(text);setToast('Copied.');}catch{setToast(text);}}

function openPlayer(id){const p=playerById(id);if(!p)return;state.modal={type:'player',player:p};render();}

async function loadChat(){
  if(!state.session||state.dmTarget)return;state.chatChannel?.unsubscribe();
  if(state.chatRoom==='mentions'){
    const tag=(state.profile?.gamertag||'').replace(/ /g,'_').toLowerCase();const {data}=await supabase.from('chat_messages').select('*').order('created_at',{ascending:false}).limit(300);state.chat=(data||[]).filter(m=>(m.body||'').toLowerCase().includes('@'+tag)).reverse();state.chatChannel=supabase.channel('chat-mentions').on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages'},payload=>{if((payload.new.body||'').toLowerCase().includes('@'+tag)){state.chat.push(payload.new);if(state.page==='chat'&&!state.dmTarget&&state.chatRoom==='mentions')render();}}).subscribe();return;
  }
  const {data}=await supabase.from('chat_messages').select('*').eq('room_slug',state.chatRoom).order('created_at').limit(120);state.chat=data||[];state.chatChannel=supabase.channel('chat-'+state.chatRoom).on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages',filter:`room_slug=eq.${state.chatRoom}`},payload=>{state.chat.push(payload.new);if(state.page==='chat'&&!state.dmTarget)render();}).subscribe();
}

async function openDm(id){
  if(!state.session)return openAuth();const p=playerById(id);if(!p)return;state.dmTarget=p;state.chatRoom='general';state.dmChannel?.unsubscribe();const {data,error}=await supabase.rpc('get_or_create_dm_thread',{p_other:id});if(error)return setToast(error.message);state.dmThread=data;const msgs=await supabase.from('dm_messages').select('*').eq('thread_id',data).order('created_at').limit(120);state.dmMessages=msgs.data||[];if(!state.dmThreads.some(t=>t.id===data)){const th=await supabase.from('dm_threads').select('*').eq('id',data).maybeSingle();if(th.data)state.dmThreads.unshift(th.data);}state.dmChannel=supabase.channel('dm-'+data).on('postgres_changes',{event:'INSERT',schema:'public',table:'dm_messages',filter:`thread_id=eq.${data}`},payload=>{state.dmMessages.push(payload.new);if(state.page==='chat'&&state.dmTarget)render();}).subscribe();render();
}

async function sendCurrentMessage(){const input=$('#chatInput');if(!input)return;const text=input.value.trim();if(!text)return;if(state.dmTarget){const {error}=await supabase.rpc('send_dm_message',{p_other:state.dmTarget.id,p_body:text});if(error)return setToast(error.message);}else{if(state.chatRoom==='mentions')return setToast('Choose a community channel to send a message.');const {error}=await supabase.rpc('send_chat_message',{p_room:state.chatRoom,p_body:text});if(error)return setToast(error.message);}input.value='';}

function mentionSuggest(e){if(state.dmTarget)return;const val=e.target.value;const m=val.match(/@([A-Za-z0-9_.-]*)$/);const box=$('#mentionMenu');if(!m){box.classList.add('hidden');return;}const q=m[1].toLowerCase();const list=state.profiles.filter(p=>p.gamertag.toLowerCase().replace(/ /g,'_').startsWith(q)).slice(0,6);if(!list.length){box.classList.add('hidden');return;}box.innerHTML=list.map(p=>`<button data-mention="${p.id}">@${esc(p.gamertag.replace(/ /g,'_'))}</button>`).join('');box.classList.remove('hidden');$$('[data-mention]',box).forEach(b=>b.onclick=()=>{const p=playerById(b.dataset.mention);e.target.value=val.replace(/@([A-Za-z0-9_.-]*)$/,'@'+p.gamertag.replace(/ /g,'_')+' ');box.classList.add('hidden');e.target.focus();});}


function callPeer(){
  return playerById(state.call.peerId)||{id:state.call.peerId,gamertag:state.call.peerName||'Player'};
}
function callOverlayHtml(){
  if(state.groupCall.status!=='idle')return groupCallOverlayHtml();
  const c=state.call;if(!c||c.status==='idle')return '';
  const p=callPeer();const av=publicAvatar(p);const initials=(p.gamertag||c.peerName||'ZC').slice(0,2).toUpperCase();
  const incoming=c.status==='incoming',active=c.status==='active',connecting=c.status==='connecting',outgoing=c.status==='ringing';
  const title=incoming?'Incoming call':outgoing?'Calling…':connecting?'Connecting…':'Voice call';
  const status=incoming?`${esc(c.peerName||p.gamertag)} is calling you`:outgoing?`Ringing ${esc(c.peerName||p.gamertag)}`:connecting?'Establishing live audio…':`Connected with ${esc(c.peerName||p.gamertag)}`;
  return `<div class="call-layer ${incoming?'incoming':''}" role="dialog" aria-modal="true" aria-label="${title}"><div class="call-card compact-call-card">
    ${!incoming?`<button class="call-close" data-end-direct aria-label="End call">${icon('close')}</button>`:''}
    <div class="call-signal"><i></i><span>${incoming?'INCOMING CALL':'COMMUNITY ARENA CALL'}</span></div>
    <div class="call-avatar">${av?`<img src="${av}" alt="">`:`<span>${esc(initials)}</span>`}<b class="call-ring"></b></div>
    <h2>${title}</h2><h3>${esc(c.peerName||p.gamertag||'Player')}</h3><p>${status}</p>
    ${(outgoing||connecting)?`<div class="call-privacy">${icon('mic_off')}Microphone is off until the call is answered.</div>`:''}
    ${incoming?`<div class="call-actions"><button class="call-action decline" id="declineCallBtn">${icon('call_end')}<span>Decline</span></button><button class="call-action answer" id="answerCallBtn">${icon('call')}<span>Answer</span></button></div>`:''}
    ${(outgoing||connecting)?`<div class="call-actions single"><button class="call-action decline" data-end-direct>${icon('call_end')}<span>Cancel</span></button></div>`:''}
    ${active?`<div class="call-actions"><button class="call-action mute ${c.muted?'active':''}" id="muteCallBtn">${icon(c.muted?'mic_off':'mic')}<span>${c.muted?'Unmute':'Mute'}</span></button><button class="call-action decline" data-end-direct>${icon('call_end')}<span>Hang up</span></button></div><div class="call-live"><i></i>LIVE AUDIO · <span id="callTimer">00:00</span></div>`:''}
    <small class="call-foot">Live audio only · no recording is created.</small>
  </div></div>`;
}
function groupCallOverlayHtml(){
  const g=state.groupCall;if(!g||g.status==='idle')return '';
  const incoming=g.status==='incoming',waiting=g.status==='waiting',connecting=g.status==='connecting',active=g.status==='active';
  const members=groupParticipantNames();const invited=g.invitedIds.map(id=>playerById(id)?.gamertag||'Player');
  const display=active?(members.length?members:['Connecting…']):invited;
  const title=incoming?'Incoming group call':waiting?'Group call started':connecting?'Joining group call…':g.title||'Group call';
  const subtitle=incoming?`${esc(g.hostName||'A player')} invited you`:waiting?'Waiting for players to join':connecting?'Connecting live audio':`${members.length||1} in call`;
  return `<div class="call-layer group-layer ${incoming?'incoming':''}" role="dialog" aria-modal="true" aria-label="${title}"><div class="call-card group-call-card">
    ${!incoming?`<button class="call-close" data-end-group aria-label="Leave group call">${icon('close')}</button>`:''}
    <div class="call-signal"><i></i><span>GROUP CALL</span></div>
    <div class="group-call-icon">${icon('groups')}</div><h2>${title}</h2><h3>${esc(g.title||'Squad call')}</h3><p>${subtitle}</p>
    <div class="group-call-members">${display.map((name,i)=>`<span><i>${esc(name.slice(0,2).toUpperCase())}</i><b>${esc(name)}</b><small>${active?'connected':g.acceptedIds.includes(g.invitedIds[i])?'joined':g.declinedIds.includes(g.invitedIds[i])?'declined':'invited'}</small></span>`).join('')||'<em>Waiting for players…</em>'}</div>
    ${(waiting||connecting)?`<div class="call-privacy">${icon('mic_off')}Your microphone stays off until someone joins.</div>`:''}
    ${incoming?`<div class="call-actions"><button class="call-action decline" id="declineGroupCallBtn">${icon('close')}<span>Decline</span></button><button class="call-action answer" id="answerGroupCallBtn">${icon('groups')}<span>Join</span></button></div>`:''}
    ${active?`<div class="call-actions"><button class="call-action mute ${g.muted?'active':''}" id="muteGroupCallBtn">${icon(g.muted?'mic_off':'mic')}<span>${g.muted?'Unmute':'Mute'}</span></button><button class="call-action decline" data-end-group>${icon(g.hostId===state.session?.user.id?'call_end':'logout')}<span>${g.hostId===state.session?.user.id?'End call':'Leave'}</span></button></div><div class="call-live"><i></i>GROUP AUDIO · <span id="callTimer">00:00</span></div>`:''}
    ${waiting?`<div class="call-actions single"><button class="call-action decline" data-end-group>${icon('call_end')}<span>Cancel</span></button></div>`:''}
    <small class="call-foot">Invite-only live audio · up to 6 people · no recording.</small>
  </div></div>`;
}
function bindCallControls(){
  $('#answerCallBtn')?.addEventListener('click',answerIncomingCall);$('#declineCallBtn')?.addEventListener('click',declineIncomingCall);$$('[data-end-direct]').forEach(b=>b.addEventListener('click',hangupCall));$('#muteCallBtn')?.addEventListener('click',toggleCallMute);
  $('#answerGroupCallBtn')?.addEventListener('click',answerGroupCall);$('#declineGroupCallBtn')?.addEventListener('click',declineGroupCall);$$('[data-end-group]').forEach(b=>b.addEventListener('click',leaveGroupCall));$('#muteGroupCallBtn')?.addEventListener('click',toggleGroupMute);updateCallTimer();
}
function callId(){return globalThis.crypto?.randomUUID?.()||`call-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;}
function markCallHandled(id){if(!id)return;state.handledCallIds.add(id);try{const raw=JSON.parse(localStorage.getItem('zc2-handled-calls')||'{}');raw[id]=Date.now();for(const [k,v] of Object.entries(raw))if(Date.now()-v>120000)delete raw[k];localStorage.setItem('zc2-handled-calls',JSON.stringify(raw));}catch{}}
function wasCallHandled(id){if(state.handledCallIds.has(id))return true;try{const raw=JSON.parse(localStorage.getItem('zc2-handled-calls')||'{}');return !!raw[id]&&Date.now()-raw[id]<120000;}catch{return false;}}
function resetCallState(){
  clearTimeout(state.call.timeout);clearTimeout(state.call.disconnectTimer);clearInterval(updateCallTimer.interval);try{state.call.pc?.close();}catch{}try{state.call.stream?.getTracks().forEach(t=>t.stop());}catch{}try{state.call.audio?.pause();state.call.audio?.remove();}catch{}
  state.call={id:null,peerId:null,peerName:'',direction:null,status:'idle',pc:null,stream:null,audio:null,muted:false,pendingCandidates:[],startedAt:null,timeout:null,disconnectTimer:null};
}
async function sendCallSignal(to,type,payload={}){
  if(!state.session||!to)return false;const id=payload.call_id||state.call.id||state.groupCall.id;
  const {error}=await supabase.from('voice_signals').insert({room_slug:`call:${id}`,from_user:state.session.user.id,to_user:to,signal:{type,call_id:id,from_name:state.profile?.gamertag||'Player',...payload}});
  if(error){console.error('Call signal:',error);return false;}return true;
}
function subscribeCallSignals(){
  state.callSignalChannel?.unsubscribe();clearInterval(state.callSignalPoll);state.callSignalPoll=null;if(!state.session)return;const uid=state.session.user.id;
  state.callSignalChannel=supabase.channel('calls-'+uid).on('postgres_changes',{event:'INSERT',schema:'public',table:'voice_signals',filter:`to_user=eq.${uid}`},payload=>{const row=payload.new;if(row?.id)state.callSeenSignals.add(row.id);handleCallSignalRow(row);}).subscribe(status=>{if(status==='SUBSCRIBED')recoverRecentCallSignals();});
  state.callSignalPoll=setInterval(()=>pollCallSignals(uid),1200);pollCallSignals(uid);
}
async function pollCallSignals(uid){if(!state.session||state.session.user.id!==uid)return;const since=new Date(Date.now()-120000).toISOString();const {data,error}=await supabase.from('voice_signals').select('id,room_slug,from_user,to_user,signal,created_at').eq('to_user',uid).gte('created_at',since).order('created_at',{ascending:true}).limit(80);if(error||!data)return;for(const row of data){if(state.callSeenSignals.has(row.id))continue;state.callSeenSignals.add(row.id);await handleCallSignalRow(row);}if(state.callSeenSignals.size>400)state.callSeenSignals=new Set([...state.callSeenSignals].slice(-200));}
async function recoverRecentCallSignals(){
  if(!state.session||state.call.status!=='idle'||state.groupCall.status!=='idle')return;const since=new Date(Date.now()-45000).toISOString();
  const {data,error}=await supabase.from('voice_signals').select('id,room_slug,from_user,to_user,signal,created_at').eq('to_user',state.session.user.id).gte('created_at',since).order('created_at',{ascending:false}).limit(30);if(error||!data)return;
  for(const row of data){if(row.id)state.callSeenSignals.add(row.id);const sig=row.signal||{},id=sig.call_id;if(!id||wasCallHandled(id)||!['ring','group-ring'].includes(sig.type))continue;const ended=data.some(x=>x.signal?.call_id===id&&['hangup','group-end'].includes(x.signal?.type)&&new Date(x.created_at)>new Date(row.created_at));if(!ended){await handleCallSignalRow(row);break;}}
}
async function startDirectCall(peerId,peerName='Player'){
  if(!state.session)return openAuth();if(!peerId||peerId===state.session.user.id)return setToast('Choose another player to call.');if(state.call.status!=='idle'||state.groupCall.status!=='idle')return setToast('Finish the current call first.');
  const id=callId();state.call={id,peerId,peerName,direction:'outgoing',status:'ringing',pc:null,stream:null,audio:null,muted:false,pendingCandidates:[],startedAt:null,timeout:null,disconnectTimer:null};state.modal=null;render();
  const sent=await sendCallSignal(peerId,'ring',{call_id:id});if(!sent){endCallLocal('signal-failed',true);return setToast('Could not start the call.');}
  state.call.timeout=setTimeout(()=>{if(state.call.id===id&&state.call.status==='ringing'){const peer=state.call.peerId;endCallLocal('no-answer',true);sendCallSignal(peer,'hangup',{call_id:id,reason:'no-answer'});setToast('No answer.');}},32000);
}
async function handleCallSignalRow(row){
  const sig=row?.signal||{},id=sig.call_id;if(!id||!state.session)return;const from=row.from_user;
  if(String(sig.type||'').startsWith('group-'))return handleGroupCallSignal(row);
  if(sig.type==='ring'){
    if(wasCallHandled(id))return;if((state.call.status!=='idle'&&state.call.id!==id)||state.groupCall.status!=='idle'){sendCallSignal(from,'busy',{call_id:id});return;}if(state.call.status!=='idle')return;
    const p=playerById(from);state.call={id,peerId:from,peerName:sig.from_name||p?.gamertag||'Player',direction:'incoming',status:'incoming',pc:null,stream:null,audio:null,muted:false,pendingCandidates:[],startedAt:null,timeout:null,disconnectTimer:null};
    state.call.timeout=setTimeout(()=>{if(state.call.id===id&&state.call.status==='incoming'){const peer=state.call.peerId;markCallHandled(id);endCallLocal('missed',true);sendCallSignal(peer,'decline',{call_id:id,reason:'missed'});}},32000);try{navigator.vibrate?.([180,100,180,100,250]);}catch{}if(document.hidden&&Notification.permission==='granted')new Notification('Incoming Community Arena call',{body:`${state.call.peerName} is calling`,icon:'./icon-192.png'});render();return;
  }
  if(state.call.id!==id)return;
  if(sig.type==='accept'&&state.call.direction==='outgoing'){clearTimeout(state.call.timeout);state.call.status='connecting';render();try{await ensureCallMedia();const pc=makeDirectCallPc();const offer=await pc.createOffer();await pc.setLocalDescription(offer);await sendCallSignal(from,'offer',{call_id:id,description:pc.localDescription});clearTimeout(state.call.disconnectTimer);state.call.disconnectTimer=setTimeout(()=>{if(state.call.id===id&&state.call.status==='connecting'){const peer=state.call.peerId;endCallLocal('connect-timeout',true);sendCallSignal(peer,'hangup',{call_id:id,reason:'connect-timeout'});setToast('Call could not establish audio. Try again.');}},15000);}catch(e){const peer=state.call.peerId;endCallLocal('microphone',true);sendCallSignal(peer,'hangup',{call_id:id,reason:'microphone'});setToast(e?.message||'Microphone access is required for a call.');}return;}
  if(sig.type==='decline'||sig.type==='busy'){const name=state.call.peerName;markCallHandled(id);endCallLocal(sig.type,true);setToast(sig.type==='busy'?`${name||'Player'} is busy.`:'Call declined.');return;}
  if(sig.type==='hangup'){markCallHandled(id);endCallLocal(sig.reason||'ended',true);setToast('Call ended.');return;}
  if(sig.type==='offer'){try{await ensureCallMedia();const pc=makeDirectCallPc();await pc.setRemoteDescription(sig.description);await flushCallCandidates();const answer=await pc.createAnswer();await pc.setLocalDescription(answer);await sendCallSignal(from,'answer',{call_id:id,description:pc.localDescription});}catch(e){console.error(e);const peer=state.call.peerId;endCallLocal('connection-failed',true);sendCallSignal(peer,'hangup',{call_id:id,reason:'connection-failed'});setToast('Could not connect the call.');}return;}
  if(sig.type==='answer'){try{const pc=makeDirectCallPc();await pc.setRemoteDescription(sig.description);await flushCallCandidates();}catch(e){console.error(e);}return;}
  if(sig.type==='ice'&&sig.candidate){const pc=state.call.pc;if(pc?.remoteDescription){try{await pc.addIceCandidate(sig.candidate);}catch(e){console.warn('ICE candidate:',e);}}else state.call.pendingCandidates.push(sig.candidate);}
}
async function answerIncomingCall(){
  if(state.call.status!=='incoming')return;const id=state.call.id;markCallHandled(id);clearTimeout(state.call.timeout);state.call.status='connecting';render();try{await ensureCallMedia();makeDirectCallPc();const ok=await sendCallSignal(state.call.peerId,'accept',{call_id:id});if(!ok)throw new Error('Could not reach the other player.');}catch(e){const peer=state.call.peerId;endCallLocal('microphone',true);sendCallSignal(peer,'decline',{call_id:id,reason:'microphone'});setToast(e?.message||'Microphone permission is required to answer.');}
}
function declineIncomingCall(){
  if(state.call.status!=='incoming')return;const peer=state.call.peerId,id=state.call.id;markCallHandled(id);endCallLocal('declined',true);sendCallSignal(peer,'decline',{call_id:id});
}
function hangupCall(){
  if(state.call.status==='idle')return;const peer=state.call.peerId,id=state.call.id;markCallHandled(id);endCallLocal('ended',true);if(peer&&id)sendCallSignal(peer,'hangup',{call_id:id,reason:'ended'});
}
function endCallLocal(reason='ended',rerender=true){resetCallState();if(rerender)render();}
async function ensureCallMedia(){if(state.call.stream)return state.call.stream;if(!navigator.mediaDevices?.getUserMedia)throw new Error('Voice calls are not supported by this browser.');state.call.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});return state.call.stream;}
function rtcConfig(){return {iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']},{urls:'turn:openrelay.metered.ca:80',username:'openrelayproject',credential:'openrelayproject'},{urls:'turn:openrelay.metered.ca:443',username:'openrelayproject',credential:'openrelayproject'},{urls:'turn:openrelay.metered.ca:443?transport=tcp',username:'openrelayproject',credential:'openrelayproject'}],iceCandidatePoolSize:6};}
function makeDirectCallPc(){
  if(state.call.pc)return state.call.pc;const pc=new RTCPeerConnection(rtcConfig());state.call.stream?.getTracks().forEach(track=>pc.addTrack(track,state.call.stream));pc.onicecandidate=e=>{if(e.candidate)sendCallSignal(state.call.peerId,'ice',{call_id:state.call.id,candidate:e.candidate.toJSON?.()||e.candidate});};pc.ontrack=e=>{let a=state.call.audio;if(!a){a=document.createElement('audio');a.autoplay=true;a.playsInline=true;a.className='remote-call-audio';document.body.appendChild(a);state.call.audio=a;}a.srcObject=e.streams[0];a.play?.().catch(()=>{});};pc.onconnectionstatechange=()=>{if(pc.connectionState==='connected'){clearTimeout(state.call.disconnectTimer);state.call.status='active';if(!state.call.startedAt)state.call.startedAt=Date.now();render();startCallTimer();}else if(pc.connectionState==='failed'){endCallLocal('failed',true);setToast('Call connection failed.');}else if(pc.connectionState==='disconnected'){clearTimeout(state.call.disconnectTimer);state.call.disconnectTimer=setTimeout(()=>{if(state.call.pc===pc&&pc.connectionState==='disconnected'){endCallLocal('disconnected',true);setToast('Call disconnected.');}},5000);}};state.call.pc=pc;return pc;
}
async function flushCallCandidates(){const pc=state.call.pc;if(!pc?.remoteDescription)return;const queued=[...state.call.pendingCandidates];state.call.pendingCandidates=[];for(const candidate of queued){try{await pc.addIceCandidate(candidate);}catch(e){console.warn('Queued ICE:',e);}}}
function toggleCallMute(){if(!state.call.stream)return;state.call.muted=!state.call.muted;state.call.stream.getAudioTracks().forEach(t=>t.enabled=!state.call.muted);render();}

function emptyGroupCall(){return {id:null,title:'',hostId:null,hostName:'',direction:null,status:'idle',invitedIds:[],acceptedIds:[],declinedIds:[],startedAt:null,timeout:null,muted:false};}
async function startGroupCallFromModal(){
  const ids=$$('.group-call-check:checked').map(c=>c.value).slice(0,5);if(ids.length<2)return setToast('Choose at least two players for a group call.');const title=$('#groupCallTitle')?.value.trim().slice(0,36)||'Squad call';state.modal=null;await startGroupCall(ids,title);
}
async function startGroupCall(ids,title='Squad call'){
  if(!state.session)return openAuth();if(state.call.status!=='idle'||state.groupCall.status!=='idle')return setToast('Finish the current call first.');const unique=[...new Set(ids)].filter(id=>id&&id!==state.session.user.id).slice(0,5);if(unique.length<2)return setToast('Choose at least two players.');const id=callId();state.groupCall={id,title,hostId:state.session.user.id,hostName:state.profile?.gamertag||'Player',direction:'outgoing',status:'waiting',invitedIds:unique,acceptedIds:[],declinedIds:[],startedAt:null,timeout:null,muted:false};render();
  const members=[state.session.user.id,...unique];const results=await Promise.all(unique.map(to=>sendCallSignal(to,'group-ring',{call_id:id,title,host_id:state.session.user.id,member_ids:members})));if(!results.some(Boolean)){endGroupCallLocal('signal-failed',true);return setToast('Could not invite the group.');}
  state.groupCall.timeout=setTimeout(()=>{if(state.groupCall.id===id&&state.groupCall.status==='waiting'&&!state.groupCall.acceptedIds.length){const targets=[...state.groupCall.invitedIds];endGroupCallLocal('no-answer',true);targets.forEach(to=>sendCallSignal(to,'group-end',{call_id:id,reason:'no-answer'}));setToast('No one joined the group call.');}},45000);
}
async function handleGroupCallSignal(row){
  const sig=row?.signal||{},id=sig.call_id,from=row.from_user;if(!id)return;
  if(sig.type==='group-ring'){
    if(wasCallHandled(id))return;if(state.call.status!=='idle'||(state.groupCall.status!=='idle'&&state.groupCall.id!==id)){sendCallSignal(from,'group-busy',{call_id:id});return;}if(state.groupCall.status!=='idle')return;const p=playerById(from);state.groupCall={id,title:sig.title||'Squad call',hostId:sig.host_id||from,hostName:sig.from_name||p?.gamertag||'Player',direction:'incoming',status:'incoming',invitedIds:(sig.member_ids||[]).filter(x=>x!==state.session.user.id),acceptedIds:[],declinedIds:[],startedAt:null,timeout:null,muted:false};state.groupCall.timeout=setTimeout(()=>{if(state.groupCall.id===id&&state.groupCall.status==='incoming'){markCallHandled(id);const host=state.groupCall.hostId;endGroupCallLocal('missed',true);sendCallSignal(host,'group-decline',{call_id:id,reason:'missed'});}},45000);try{navigator.vibrate?.([150,80,150,80,250]);}catch{}if(document.hidden&&Notification.permission==='granted')new Notification('Incoming group call',{body:`${state.groupCall.hostName}: ${state.groupCall.title}`,icon:'./icon-192.png'});render();return;
  }
  if(state.groupCall.id!==id)return;
  if(sig.type==='group-accept'&&state.groupCall.hostId===state.session.user.id){if(!state.groupCall.acceptedIds.includes(from))state.groupCall.acceptedIds.push(from);clearTimeout(state.groupCall.timeout);if(state.groupCall.status==='waiting'){state.groupCall.status='connecting';render();try{await joinGroupVoiceRoom(id);state.groupCall.status='active';state.groupCall.startedAt=Date.now();render();startCallTimer();}catch(e){const targets=[...state.groupCall.invitedIds];endGroupCallLocal('microphone',true);targets.forEach(to=>sendCallSignal(to,'group-end',{call_id:id,reason:'microphone'}));setToast(e?.message||'Microphone permission is required.');}}else render();return;}
  if(sig.type==='group-decline'||sig.type==='group-busy'){if(!state.groupCall.declinedIds.includes(from))state.groupCall.declinedIds.push(from);render();return;}
  if(sig.type==='group-end'){markCallHandled(id);endGroupCallLocal(sig.reason||'ended',true);setToast('Group call ended.');return;}
  if(sig.type==='group-left'){render();return;}
}
async function answerGroupCall(){
  if(state.groupCall.status!=='incoming')return;const id=state.groupCall.id,host=state.groupCall.hostId;markCallHandled(id);clearTimeout(state.groupCall.timeout);state.groupCall.status='connecting';render();try{await joinGroupVoiceRoom(id);const ok=await sendCallSignal(host,'group-accept',{call_id:id});if(!ok)throw new Error('Could not reach the group host.');state.groupCall.status='active';state.groupCall.startedAt=Date.now();render();startCallTimer();}catch(e){endGroupCallLocal('microphone',true);sendCallSignal(host,'group-decline',{call_id:id,reason:'microphone'});setToast(e?.message||'Microphone permission is required to join.');}
}
function declineGroupCall(){if(state.groupCall.status!=='incoming')return;const host=state.groupCall.hostId,id=state.groupCall.id;markCallHandled(id);endGroupCallLocal('declined',true);sendCallSignal(host,'group-decline',{call_id:id});}
function leaveGroupCall(){
  if(state.groupCall.status==='idle')return;const g={...state.groupCall,invitedIds:[...state.groupCall.invitedIds]};const isHost=g.hostId===state.session?.user.id;markCallHandled(g.id);endGroupCallLocal('ended',true);if(isHost)g.invitedIds.forEach(to=>sendCallSignal(to,'group-end',{call_id:g.id,reason:'ended'}));else if(g.hostId)sendCallSignal(g.hostId,'group-left',{call_id:g.id});
}
function endGroupCallLocal(reason='ended',rerender=true){clearTimeout(state.groupCall.timeout);clearInterval(updateCallTimer.interval);cleanupVoiceLocal();state.groupCall=emptyGroupCall();if(rerender)render();}
function toggleGroupMute(){if(!state.voice.stream)return;state.groupCall.muted=!state.groupCall.muted;state.voice.stream.getAudioTracks().forEach(t=>t.enabled=!state.groupCall.muted);render();}
function groupParticipantNames(){
  if(!state.voice.channel)return state.groupCall.acceptedIds.map(id=>playerById(id)?.gamertag||'Player');const presence=state.voice.channel.presenceState?.()||{};return Object.entries(presence).map(([id,metas])=>metas?.[0]?.gamertag||playerById(id)?.gamertag||'Player');
}
async function joinGroupVoiceRoom(id){
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Group calls are not supported by this browser.');if(state.voice.channel&&state.voice.roomId===id)return;cleanupVoiceLocal();state.voice.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});state.voice.roomId=id;const uid=state.session.user.id;const ch=supabase.channel('group-call:'+id,{config:{presence:{key:uid}}});state.voice.channel=ch;
  ch.on('broadcast',{event:'signal'},async({payload})=>{if(payload.to!==uid)return;await handleVoiceSignal(payload);});ch.on('presence',{event:'sync'},async()=>{await syncVoicePeers();if(state.groupCall.status!=='idle')render();});
  await new Promise((resolve,reject)=>{let settled=false;const timer=setTimeout(()=>{if(!settled){settled=true;reject(new Error('Group call connection timed out.'));}},9000);ch.subscribe(async status=>{if(status==='SUBSCRIBED'&&!settled){settled=true;clearTimeout(timer);await ch.track({gamertag:state.profile?.gamertag||'Player'});state.voice.joined=true;resolve();}else if(status==='CHANNEL_ERROR'&&!settled){settled=true;clearTimeout(timer);reject(new Error('Could not join the group call.'));}});});
}
function cleanupVoiceLocal(){
  for(const pc of state.voice.peers.values())try{pc.close();}catch{}state.voice.peers.clear();for(const a of state.voice.audios.values())try{a.pause();a.remove();}catch{}state.voice.audios.clear();state.voice.candidates.clear();try{state.voice.stream?.getTracks().forEach(t=>t.stop());}catch{}state.voice.stream=null;if(state.voice.channel){try{state.voice.channel.unsubscribe();}catch{}}state.voice.channel=null;state.voice.roomId=null;state.voice.joined=false;
}
async function leaveVoice(){cleanupVoiceLocal();if(state.page==='chat')render();}
function voicePc(peer){
  if(state.voice.peers.has(peer))return state.voice.peers.get(peer);const pc=new RTCPeerConnection(rtcConfig());state.voice.stream?.getTracks().forEach(t=>pc.addTrack(t,state.voice.stream));pc.onicecandidate=e=>{if(e.candidate)voiceSend(peer,{candidate:e.candidate.toJSON?.()||e.candidate});};pc.ontrack=e=>{let a=state.voice.audios.get(peer);if(!a){a=document.createElement('audio');a.autoplay=true;a.playsInline=true;a.className='remote-audio';document.body.appendChild(a);state.voice.audios.set(peer,a);}a.srcObject=e.streams[0];a.play?.().catch(()=>{});};pc.onconnectionstatechange=()=>{if(['failed','closed'].includes(pc.connectionState)){pc.close();state.voice.peers.delete(peer);state.voice.audios.get(peer)?.remove();state.voice.audios.delete(peer);}};state.voice.peers.set(peer,pc);return pc;
}
async function voiceSend(to,data){await state.voice.channel?.send({type:'broadcast',event:'signal',payload:{from:state.session.user.id,to,...data}});}
async function syncVoicePeers(){
  if(!state.voice.channel||!state.session)return;const uid=state.session.user.id,present=Object.keys(state.voice.channel.presenceState()).filter(id=>id!==uid);for(const peer of [...state.voice.peers.keys()])if(!present.includes(peer)){state.voice.peers.get(peer)?.close();state.voice.peers.delete(peer);state.voice.audios.get(peer)?.remove();state.voice.audios.delete(peer);}for(const peer of present){if(uid<peer&&!state.voice.peers.has(peer)){const pc=voicePc(peer);const offer=await pc.createOffer();await pc.setLocalDescription(offer);await voiceSend(peer,{description:pc.localDescription});}}
}
async function handleVoiceSignal(payload){
  const pc=voicePc(payload.from);if(payload.description){await pc.setRemoteDescription(payload.description);const queued=state.voice.candidates.get(payload.from)||[];state.voice.candidates.delete(payload.from);for(const c of queued){try{await pc.addIceCandidate(c);}catch{}}if(payload.description.type==='offer'){const ans=await pc.createAnswer();await pc.setLocalDescription(ans);await voiceSend(payload.from,{description:pc.localDescription});}}else if(payload.candidate){if(pc.remoteDescription){try{await pc.addIceCandidate(payload.candidate);}catch{}}else{const q=state.voice.candidates.get(payload.from)||[];q.push(payload.candidate);state.voice.candidates.set(payload.from,q);}}
}
function startCallTimer(){clearInterval(updateCallTimer.interval);updateCallTimer();updateCallTimer.interval=setInterval(updateCallTimer,1000);}
function updateCallTimer(){const el=$('#callTimer');const started=state.call.startedAt||state.groupCall.startedAt;if(!el||!started)return;const total=Math.max(0,Math.floor((Date.now()-started)/1000)),m=Math.floor(total/60),s=total%60;el.textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}

async function uploadAvatar(file){if(!state.session||!file)return;try{const blob=await resizeImage(file,1000,.88);await saveAvatarBlob(blob,'photo');}catch(e){setToast(e.message||'Profile picture upload failed.');}}

async function saveProfile(){const gamertag=$('#profileGamertag').value.trim(),platform=$('#profilePlatform').value,region=$('#profileRegion').value.trim(),bio=$('#profileBio').value.trim();if(gamertag.length<2)return setToast('Gamer tag is too short.');const {error}=await supabase.from('profiles').update({gamertag,platform,region,bio,updated_at:new Date().toISOString()}).eq('id',state.session.user.id);if(error)return setToast(error.message);setToast('Profile saved.');await refreshAll();render();}
async function resizeImage(file,max=1400,quality=.84){
  if(!file)throw new Error('Choose an image first.');if(file.size>18*1024*1024)throw new Error('Choose an image under 18 MB.');
  const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('Could not read that photo.'));r.readAsDataURL(file);});
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('That photo format could not be decoded. Try JPEG, PNG or WEBP.'));i.src=dataUrl;});
  const scale=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));const ctx=c.getContext('2d',{alpha:false});ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,c.width,c.height);return await new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('Image conversion failed.')),'image/jpeg',quality));
}



function handleAvatarSelection(file){if(state.avatarDraftUrl)URL.revokeObjectURL(state.avatarDraftUrl);state.avatarDraftFile=file;state.avatarDraftUrl=URL.createObjectURL(file);const img=$('#avatarPreviewImg');const fallback=$('#avatarPreviewFallback');if(img)img.src=state.avatarDraftUrl;else if(fallback){const n=document.createElement('img');n.id='avatarPreviewImg';n.src=state.avatarDraftUrl;n.alt='Profile preview';fallback.replaceWith(n);}$('#saveAvatarBtn')?.removeAttribute('disabled');$('#animeAvatarBtn')?.removeAttribute('disabled');setToast('Photo ready. Use it normally or create an Anime Power version.');}
async function saveAvatarBlob(blob,label='photo'){const uid=state.session.user.id;const path=`${uid}/avatar-${Date.now()}.jpg`;const up=await supabase.storage.from('avatars').upload(path,blob,{contentType:'image/jpeg',upsert:false});if(up.error)throw up.error;let result=await supabase.from('profiles').update({avatar_path:path,updated_at:new Date().toISOString()}).eq('id',uid).select('id').maybeSingle();if(result.error)throw result.error;if(!result.data){const meta=state.session.user.user_metadata||{};const gamertag=(meta.gamertag||state.session.user.email?.split('@')[0]||'Player')+'-'+uid.slice(0,4).toUpperCase();const ins=await supabase.from('profiles').insert({id:uid,gamertag,platform:meta.platform||'Quest',avatar_path:path});if(ins.error)throw ins.error;}if(state.avatarDraftUrl)URL.revokeObjectURL(state.avatarDraftUrl);state.avatarDraftUrl='';state.avatarDraftFile=null;setToast(label==='anime'?'Anime Power portrait saved.':'Profile picture updated.');await refreshAll();render();}
async function createAnimePowerAvatar(file){try{setToast('Creating Anime Power portrait on this device…');const blob=await animePowerBlob(file);await saveAvatarBlob(blob,'anime');}catch(e){setToast(e.message||'Could not create the portrait.');}}
async function animePowerBlob(file){
  const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Use JPEG, PNG or WEBP for Anime Power.'));i.src=dataUrl;});
  const size=900,c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d',{alpha:false});const scale=Math.max(size/img.width,size/img.height),w=img.width*scale,h=img.height*scale,x=(size-w)/2,y=(size-h)/2;ctx.fillStyle='#080a0b';ctx.fillRect(0,0,size,size);ctx.drawImage(img,x,y,w,h);let im=ctx.getImageData(0,0,size,size),d=im.data,lum=new Uint8Array(size*size);
  for(let i=0,p=0;i<d.length;i+=4,p++){let r=d[i],g=d[i+1],b=d[i+2],avg=(r+g+b)/3;r=avg+(r-avg)*1.42;g=avg+(g-avg)*1.42;b=avg+(b-avg)*1.42;r=(r-128)*1.18+128;g=(g-128)*1.18+128;b=(b-128)*1.18+128;const step=32;r=Math.round(Math.max(0,Math.min(255,r))/step)*step;g=Math.round(Math.max(0,Math.min(255,g))/step)*step;b=Math.round(Math.max(0,Math.min(255,b))/step)*step;d[i]=r;d[i+1]=g;d[i+2]=b;lum[p]=(r*3+g*6+b)/10;}
  const copy=new Uint8ClampedArray(d);for(let yy=1;yy<size-1;yy++){for(let xx=1;xx<size-1;xx++){const p=yy*size+xx,gx=-lum[p-size-1]-2*lum[p-1]-lum[p+size-1]+lum[p-size+1]+2*lum[p+1]+lum[p+size+1],gy=-lum[p-size-1]-2*lum[p-size]-lum[p-size+1]+lum[p+size-1]+2*lum[p+size]+lum[p+size+1],edge=Math.sqrt(gx*gx+gy*gy),i=p*4;if(edge>92){d[i]=copy[i]*.26;d[i+1]=copy[i+1]*.22;d[i+2]=copy[i+2]*.16;}else if(edge>48){d[i]=copy[i]*.58;d[i+1]=copy[i+1]*.54;d[i+2]=copy[i+2]*.48;}}}
  ctx.putImageData(im,0,0);const grad=ctx.createRadialGradient(size*.5,size*.42,size*.18,size*.5,size*.5,size*.72);grad.addColorStop(0,'rgba(255,214,50,0)');grad.addColorStop(.72,'rgba(255,177,0,.05)');grad.addColorStop(1,'rgba(0,0,0,.48)');ctx.fillStyle=grad;ctx.fillRect(0,0,size,size);ctx.strokeStyle='rgba(245,215,29,.88)';ctx.lineWidth=10;ctx.strokeRect(5,5,size-10,size-10);return await new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('Portrait conversion failed.')),'image/jpeg',.9));
}
async function publishGallery(file){if(!file||!state.session)return;try{const blob=await resizeImage(file,1600,.84);const path=`${state.session.user.id}/gallery-${Date.now()}.jpg`;const up=await supabase.storage.from('gallery-public').upload(path,blob,{contentType:'image/jpeg'});if(up.error)throw up.error;const cap=$('#galleryCaption').value.trim();const ins=await supabase.from('gallery_items').insert({user_id:state.session.user.id,image_path:path,caption:cap});if(ins.error)throw ins.error;setToast('Artwork published.');await refreshAll();render();}catch(e){setToast(e.message||'Gallery upload failed.');}}

async function bindResultModal(){
  let screenshotFile=null,screenshotPath='',ocrText='';
  $('#resultScreenshot').onchange=async e=>{screenshotFile=e.target.files?.[0]||null;if(!screenshotFile)return;$('#ocrStatus').textContent='Preparing screenshot…';const blob=await resizeImage(screenshotFile,1600,.86);screenshotFile=blob;try{const path=`${state.session.user.id}/${state.selectedTournament.id}/${state.portal.match_id}/${Date.now()}.jpg`;const up=await supabase.storage.from('result-screenshots').upload(path,blob,{contentType:'image/jpeg'});if(up.error)throw up.error;screenshotPath=path;$('#ocrStatus').textContent='Reading scoreboard…';if(window.Tesseract){const res=await window.Tesseract.recognize(blob,'eng',{logger:m=>{if(m.status==='recognizing text'){state.ocrProgress=Math.round((m.progress||0)*100);const bar=$('#ocrProgress');if(bar)bar.style.width=state.ocrProgress+'%';}}});ocrText=res.data.text||'';autoFillScores(ocrText,state.portal.players||[]);$('#ocrStatus').textContent='Screenshot read. Check every score before submitting.';}else{$('#ocrStatus').textContent='Screenshot uploaded. Automatic reading is unavailable; enter scores manually.';}}catch(err){$('#ocrStatus').textContent='Screenshot reading failed. Enter scores manually.';setToast(err.message||'Screenshot processing failed.');}};
  $('#confirmResultBtn').onclick=async()=>{const scores=$$('.scoreInput').map(i=>({player_id:i.dataset.playerId,player:i.dataset.playerName,kills:Number(i.value||0)}));const {error}=await supabase.rpc('submit_match_result',{p_match:state.portal.match_id,p_scores:scores,p_screenshot_path:screenshotPath||null,p_extracted:ocrText?{ocr_text:ocrText}:null,p_source:screenshotPath?'mixed':'manual'});if(error)return setToast(error.message);state.modal=null;setToast('Result submitted for admin approval.');await refreshAll();await openTournament(state.selectedTournament.id);};
}
function autoFillScores(text,players){const lines=text.split(/\n+/).map(x=>x.trim()).filter(Boolean);for(const p of players){const norm=p.gamertag.toLowerCase().replace(/[^a-z0-9]/g,'');let best='';for(const line of lines){const lnorm=line.toLowerCase().replace(/[^a-z0-9]/g,'');if(lnorm.includes(norm)||norm.includes(lnorm.slice(0,Math.min(norm.length,lnorm.length)))){best=line;break;}}if(best){const nums=best.match(/\b\d{1,3}\b/g)||[];if(nums.length){const input=$(`.scoreInput[data-player-id="${CSS.escape(p.user_id)}"]`);if(input)input.value=nums[0];}}}}

async function submitReport(){const dual=$('#reportDual').checked,fast=$('#reportFast').checked,other=$('#reportOther').checked,details=$('#reportDetails').value.trim();const target=state.modal.target,match=state.modal.matchId;const {error}=await supabase.rpc('submit_cheat_report',{p_match:match,p_target:target.id,p_dual_wield:dual,p_fast_run:fast,p_other_cheat:other,p_details:details});if(error)return setToast(error.message);state.modal=null;setToast('Cheating report sent to the admin review queue.');render();}

async function activateAdmin(){
  const code=$('#adminCode').value.trim();
  if(!code)return setToast('Enter the admin code.');
  const {data,error}=await supabase.rpc('activate_admin',{p_code:code});
  if(error){console.error('Admin activation:',error);return setToast('Admin activation failed. Refresh the app and try again.');}
  if(!data)return setToast('Incorrect admin code.');
  setToast('Admin unlocked on this account.');
  await refreshAll();await loadAdminData();state.page='admin';render();
}
async function loadAdminData(){if(!state.admin){state.adminData=null;return;}const [subs,reports,audit,matches]=await Promise.all([supabase.from('result_submissions').select('*').eq('status','pending').order('created_at'),supabase.from('cheat_reports').select('*').eq('status','pending').order('created_at'),supabase.from('admin_audit').select('*').order('created_at',{ascending:false}).limit(80),supabase.from('matches').select('*').order('created_at',{ascending:false}).limit(300)]);state.adminData={submissions:subs.data||[],reports:reports.data||[],audit:audit.data||[],matches:matches.data||[]};if(state.page==='admin')render();}
async function approveSubmission(id){const {error}=await supabase.rpc('approve_submission',{p_submission:id});if(error)return setToast(error.message);setToast('Result approved. Advancement and league standings recalculated.');await refreshAll();await loadAdminData();render();}
async function resolveReport(id,decision){const {error}=await supabase.rpc('resolve_cheat_report',{p_report:id,p_decision:decision});if(error)return setToast(error.message);setToast('Report decision saved to the audit trail.');await loadAdminData();render();}
async function openProof(path){const {data,error}=await supabase.storage.from('result-screenshots').createSignedUrl(path,300);if(error)return setToast(error.message);state.modal={type:'proof',url:data.signedUrl};render();}

async function markNotificationsRead(){if(!state.session)return;const unread=state.notifications.filter(n=>!n.read).map(n=>n.id);if(!unread.length)return;await supabase.from('user_notifications').update({read:true}).in('id',unread);state.notifications.forEach(n=>n.read=true);}

async function requestBrowserNotifications(){if(!('Notification'in window))return setToast('Browser notifications are not supported here.');const p=await Notification.requestPermission();setToast(p==='granted'?'Browser notifications enabled.':'Notification permission was not enabled.');}

init().catch(err=>{console.error(err);$('#app').innerHTML=`<div class="boot"><img src="./icon-192.png"><div class="boot-title"><span>COMMUNITY ARENA</span><b>COULD NOT START</b></div><p style="max-width:420px;text-align:center;color:#9aa4a8">${esc(err.message||'Unknown error')}</p></div>`;});
