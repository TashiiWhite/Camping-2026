/* ============================================================
   WildWeekend app — live-synced crew field plan
   Modes:
   - LIVE  : Supabase configured -> one shared trip, realtime
   - LOCAL : placeholders in config.js -> localStorage only
   ============================================================ */
'use strict';

const CFG = window.WW_CONFIG || {};
const TRIP_ID = CFG.TRIP_ID || 'camping-june-2026';
const LS_KEY = 'wildweekend_' + TRIP_ID;
const CLIENT_ID = Math.random().toString(36).slice(2);

let sb = null;           // supabase client
let live = false;        // realtime connected
let user = null;         // signed-in user
let saveTimer = null;
let lastRev = 0;

let state = defaultState();
function defaultState(){
  return { rev:0, by:'', crew:[], gear:null, gearArchive:[], gearClaims:{}, gearPacked:{}, personalItems:{},
    expenses:[], votes:{}, roles:{}, checks:{}, stops:[], chosenSite:'' };
}

/* "Who am I" — per device, never synced. Drives the personal packing list + progress. */
function whoAmI(){ try{ return isSignedIn()?(localStorage.getItem('ww_whoami')||''):''; }catch(e){ return ''; } }
function setWhoAmI(name){ if(!isSignedIn()){toast('🔒 Sign in to use the crew features');return;} try{ localStorage.setItem('ww_whoami',name||''); }catch(e){} renderGear(); renderProgress(); renderMyPacking(); }

/* Build the packing list for a given crew member:
   - every gear item assigned to them specifically
   - every gear item assigned to "All crew" (everyone needs their own)
   - their personal custom items
   Returns [{key, name, note, packed, kind}] where key is unique per person+item. */
function packingListFor(name){
  if(!name) return [];
  const out=[];
  gearData().forEach(cat=>cat.items.forEach(it=>{
    const claims=state.gearClaims[it.id]||[];
    const mine = claims.includes(name) || claims.includes('ALL');
    if(mine){
      const pk = state.gearPacked[it.id];
      const packed = (pk && typeof pk==='object') ? !!pk[name] : (claims.includes('ALL') ? false : !!pk);
      out.push({key:it.id, name:it.n, note:it.note||'', packed, kind:claims.includes('ALL')?'all':'assigned', cat:cat.cat});
    }
  }));
  (state.personalItems[name]||[]).forEach(pi=>{
    out.push({key:'personal:'+pi.id, name:pi.name, note:'personal', packed:!!pi.packed, kind:'personal'});
  });
  return out;
}
function packStatsFor(name){
  const list=packingListFor(name);
  return {total:list.length, packed:list.filter(x=>x.packed).length};
}

/* ---------- utils ---------- */
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const palette=['#9bce6f','#f0b455','#6cb6d4','#e8896b','#b49ad4','#7bb661'];
function colorFor(n){let h=0;for(let i=0;i<n.length;i++)h=n.charCodeAt(i)+((h<<5)-h);return palette[Math.abs(h)%palette.length];}
function initials(n){return n.trim().slice(0,2).toUpperCase();}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function uid(){return 'g'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2600);}

/* ---------- persistence: local + supabase ---------- */
function saveLocal(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){} }
function loadLocal(){ try{ const r=localStorage.getItem(LS_KEY); if(r) state=Object.assign(defaultState(), JSON.parse(r)); }catch(e){} }

function persist(){
  if(!isSignedIn()){ // signed-out is read-only; never save the clean state over cached data
    try{renderProgress();}catch(e){}
    return;
  }
  state.rev=(state.rev||0)+1; state.by=CLIENT_ID; lastRev=state.rev;
  saveLocal();
  try{renderProgress();}catch(e){}
  if(sb&&user&&liveReady){
    clearTimeout(saveTimer);
    saveTimer=setTimeout(async()=>{
      try{
        const {error}=await sb.from('trips').upsert({id:TRIP_ID, data:state, updated_at:new Date().toISOString()});
        if(error){ console.warn('supabase save:',error.message); setSync('local','Local (save failed)'); }
        else setSync('live','Live');
      }catch(e){ setSync('local','Offline — will retry'); }
    },700);
  } else if(sb&&user){
    // signed in but no live channel (offline): keep working locally, will sync on reconnect
    setSync('off','Offline — changes saved locally');
  }
}

const SYNC_TIPS={
  live:'Live — you are signed in. Every change syncs instantly to the whole crew on every device.',
  local:'Local — data saves to this device only. Sign in with Google (top right) to join the live shared trip.',
  off:'Offline — no connection right now. Changes are saved locally and will sync when you reconnect.'
};
function setSync(mode,text,tip){
  const p=$('#sync-pill');p.className='sync-pill sync-'+(mode==='live'?'live':mode==='off'?'off':'local');
  p.setAttribute('data-tip',tip||SYNC_TIPS[mode==='live'?'live':mode==='off'?'off':'local']);
  $('#sync-text').textContent=text;
  const ex=$('#sync-explainer');
  if(!ex)return;
  if(mode==='live') ex.innerHTML='🟢 <b>Live sync is on.</b> You are signed in — every change is shared instantly with everyone signed into the trip, on every device. Everything also caches for offline use.';
  else ex.innerHTML='🟡 <b>Local mode.</b> Data saves to this device only. <b>Sign in with Google</b> (top right) to join the live shared trip, sync with the crew, and unlock all themes. You can still share state manually with Export/Import below.';
}

let liveChannel=null,liveReady=false,onlineCount=0;
let presenceList=[];           // [{name,email,tab,at}] of everyone currently online
let adminConfig={};            // app-wide admin settings (banner, signups)
let adminChannel=null;
const OWNER_EMAIL='tashiiwhite@gmail.com';
function isOwner(){ return !!(user && (user.email||'').toLowerCase()===OWNER_EMAIL); }
function isSignedIn(){ return !!user; }
// Leaders are emails the owner grants full-site access (same as admin, minus the admin panel).
function leaderEmails(){ return (adminConfig.leaders||[]).map(e=>(e||'').toLowerCase()); }
function isLeader(){ return !!(user && leaderEmails().includes((user.email||'').toLowerCase())); }
// Access levels: 'none' (signed out), 'user' (signed in), 'leader', 'admin'(owner)
function accessLevel(){
  if(!user) return 'none';
  if(isOwner()) return 'admin';
  if(isLeader()) return 'leader';
  return 'user';
}
// Anyone signed in can edit/interact. Signed-out = read-only/locked.
function canEdit(){ return isSignedIn(); }
// Only admin or leader can reset the shared trip data.
function canReset(){ return isOwner()||isLeader(); }
function currentTabName(){
  const t=document.querySelector('.tab.active');
  return t?(t.textContent||'').trim():'Basecamp';
}
// Reflect access on <html> so CSS can gate the UI for signed-out users.
function applyGateClasses(){
  const h=document.documentElement;
  h.classList.toggle('signed-out', !isSignedIn());
  h.classList.toggle('signed-in', isSignedIn());
  h.dataset.access=accessLevel();
}

async function initSupabase(){
  const url=CFG.SUPABASE_URL||'', key=CFG.SUPABASE_ANON_KEY||'';
  if(!url||url.includes('YOUR_')||!key||key.includes('YOUR_')){ setSync('local','Local'); renderAuth(); return; }
  if(!window.supabase||typeof window.supabase.createClient!=='function'){ setSync('local','Local'); renderAuth(); return; }
  try{
    sb = supabase.createClient(url,key,{auth:{flowType:'implicit',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true,storage:window.localStorage}});
    await recoverSessionFromUrl();
    sb.auth.onAuthStateChange((_e,session)=>{ user=session?.user||null; applyAccess(); });
    const {data:{session}}=await sb.auth.getSession(); user=session?.user||null;
    await applyAccess();
  }catch(e){ console.warn('supabase init:',e.message||e); setSync('local','Local (no connection)'); renderAuth(); }
}

async function applyAccess(){
  if(user){ try{closeSignin();}catch(e){} }
  applyGateClasses();
  renderAuth();
  enforceThemeAccess();
  enforceDisplayDefaults();
  if(user){ applyMonthlyDefaultOnSignIn(); }
  renderSettingsUI();
  if(user){
    await connectLive();
  } else {
    disconnectLive();
    setSync('local','Local — sign in for live');
    // Signed-out = clean site: show no crew/trip data. Real data loads on sign-in.
    state=defaultState();
    try{ await loadAdminConfig(); }catch(e){}
  }
  renderAll();
}

async function connectLive(){
  if(!sb||!user)return;
  try{
    const {data,error}=await sb.from('trips').select('data').eq('id',TRIP_ID).maybeSingle();
    if(error) throw error;
    if(data && data.data && Object.keys(data.data).length){
      const remote=Object.assign(defaultState(),data.data);
      if((remote.rev||0) >= (state.rev||0)) state=remote;
    } else {
      await sb.from('trips').upsert({id:TRIP_ID,data:state});
    }
    saveLocal();
    if(liveChannel){try{sb.removeChannel(liveChannel);}catch(e){}}
    liveChannel=sb.channel('trip-'+TRIP_ID,{config:{presence:{key:CLIENT_ID}}})
      .on('postgres_changes',{event:'*',schema:'public',table:'trips',filter:'id=eq.'+TRIP_ID},payload=>{
        const d=payload.new?.data; if(!d)return;
        if(d.by===CLIENT_ID && d.rev<=lastRev) return;
        state=Object.assign(defaultState(),d); saveLocal(); renderAll();
      })
      .on('presence',{event:'sync'},()=>{
        try{
          const st=liveChannel.presenceState();
          presenceList=[];
          Object.values(st).forEach(arr=>{ if(arr&&arr[0]) presenceList.push(arr[0]); });
          onlineCount=presenceList.length;
        }catch(e){ onlineCount=1; presenceList=[]; }
        renderPresence(); if(isOwner()) renderAdminPresence();
      })
      .subscribe(async status=>{
        if(status==='SUBSCRIBED'){
          liveReady=true; setSync('live','Live');
          try{await trackPresence();}catch(e){}
        }
      });
    // admin config (banner + signup flag) — load + subscribe for everyone
    await loadAdminConfig();
    subscribeAdminConfig();
    setSync('live','Live');
  }catch(e){ console.warn('connectLive:',e.message||e); liveReady=false; setSync('local','Local (no connection)'); }
}
function disconnectLive(){
  liveReady=false;onlineCount=0;presenceList=[];renderPresence();
  if(liveChannel&&sb){try{sb.removeChannel(liveChannel);}catch(e){} liveChannel=null;}
  if(adminChannel&&sb){try{sb.removeChannel(adminChannel);}catch(e){} adminChannel=null;}
}
async function trackPresence(){
  if(!liveChannel||!liveReady)return;
  try{
    await liveChannel.track({
      name:user?.user_metadata?.full_name||user?.email||'crew',
      email:user?.email||'',
      tab:currentTabName(),
      at:Date.now()
    });
  }catch(e){}
}
async function loadAdminConfig(){
  if(!sb)return;
  try{
    const {data,error}=await sb.from('admin_config').select('data').eq('id','global').maybeSingle();
    if(!error && data && data.data){ adminConfig=data.data; renderDepartureBanner(); }
  }catch(e){ console.warn('loadAdminConfig',e.message||e); }
}
function subscribeAdminConfig(){
  if(!sb||adminChannel)return;
  try{
    adminChannel=sb.channel('admin-'+TRIP_ID)
      .on('postgres_changes',{event:'*',schema:'public',table:'admin_config',filter:'id=eq.global'},payload=>{
        const d=payload.new?.data; if(d){ adminConfig=d; renderDepartureBanner(); if(isOwner())renderAdminConfigUI(); }
      })
      .subscribe();
  }catch(e){ console.warn('subscribeAdminConfig',e.message||e); }
}
async function saveAdminConfig(){
  if(!sb||!isOwner()){toast('Owner only');return;}
  try{
    const {error}=await sb.from('admin_config').upsert({id:'global',data:adminConfig,updated_at:new Date().toISOString()});
    if(error)throw error;
    toast('Admin settings saved');
    renderDepartureBanner();
  }catch(e){ toast('Save failed: '+(e.message||e)); }
}
function renderPresence(){
  const p=$('#presence-pill');if(!p)return;
  if(liveReady&&onlineCount>0){
    p.style.display='flex';
    $('#presence-count').textContent=onlineCount+(onlineCount===1?' online':' online');
  } else p.style.display='none';
}

/* ============================================================
   ADMIN (owner-only: tashiiwhite@gmail.com)
   Not referenced anywhere visible to other users.
   ============================================================ */
function openAdmin(){
  if(!isOwner()){return;}
  renderAdminPresence();
  renderAdminConfigUI();
  renderAdminStats();
  renderAdminUsers();
  adminTab('presence');
  $('#admin-modal').classList.add('open');
}
function closeAdmin(){ $('#admin-modal').classList.remove('open'); }

function adminTab(name){
  ['presence','banner','users','reports','data'].forEach(t=>{
    const sec=$('#admin-sec-'+t), btn=$('#admin-tab-'+t);
    if(sec)sec.style.display=(t===name)?'block':'none';
    if(btn)btn.classList.toggle('on',t===name);
  });
}

/* --- live presence: who's online + what tab they're viewing --- */
function renderAdminPresence(){
  const w=$('#admin-presence');if(!w)return;
  if(!presenceList.length){w.innerHTML='<div class="empty">Nobody else is online right now.</div>';return;}
  const rows=presenceList.slice().sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  w.innerHTML=rows.map(p=>{
    const nm=p.name||p.email||'crew';
    const me=(p.email&&user&&p.email===user.email)?' <span style="color:var(--faint)">(you)</span>':'';
    return `<div class="admin-row"><span class="avatar" style="width:26px;height:26px;font-size:11px;background:${colorFor(nm)}">${initials(nm)}</span>
      <div style="flex:1"><div style="font-size:13px;font-weight:600">${esc(nm)}${me}</div><div style="font-size:11px;color:var(--faint);font-family:var(--mono)">${esc(p.email||'')}</div></div>
      <span class="admin-tab-badge">👁 ${esc(p.tab||'—')}</span></div>`;
  }).join('');
}

/* --- departure banner config (shown to ALL users) --- */
function renderAdminConfigUI(){
  if(!isOwner())return;
  const b=adminConfig.banner||{};
  const set=(id,val)=>{const el=$(id);if(el&&el.value!==val)el.value=val||'';};
  const tog=$('#adm-banner-on'); if(tog)tog.classList.toggle('done',!!b.on);
  set('#adm-banner-title',b.title);
  set('#adm-banner-text',b.text);
  set('#adm-banner-link',b.link);
  set('#adm-banner-linklabel',b.linkLabel);
  const su=$('#adm-signup-on'); if(su)su.classList.toggle('done', adminConfig.signupsOpen!==false);
}
function adminToggleBanner(){ if(!adminConfig.banner)adminConfig.banner={}; adminConfig.banner.on=!adminConfig.banner.on; renderAdminConfigUI(); }
function adminToggleSignups(){ adminConfig.signupsOpen=(adminConfig.signupsOpen===false)?true:false; renderAdminConfigUI(); }
async function adminSaveBanner(){
  if(!adminConfig.banner)adminConfig.banner={};
  adminConfig.banner.title=$('#adm-banner-title').value.trim();
  adminConfig.banner.text=$('#adm-banner-text').value.trim();
  adminConfig.banner.link=$('#adm-banner-link').value.trim();
  adminConfig.banner.linkLabel=$('#adm-banner-linklabel').value.trim();
  await saveAdminConfig();
}

/* --- the departure banner shown to everyone (top of Basecamp) --- */
function renderDepartureBanner(){
  const host=$('#departure-banner');if(!host)return;
  const b=adminConfig.banner||{};
  if(!b.on||(!b.title&&!b.text)){ host.style.display='none'; host.innerHTML=''; return; }
  const link=b.link?`<a href="${esc(b.link)}" target="_blank" rel="noopener" class="dep-link">${esc(b.linkLabel||'Open link')} ↗</a>`:'';
  host.style.display='block';
  host.innerHTML=`<div class="dep-inner"><div class="dep-ico">📣</div><div class="dep-body">
    ${b.title?`<div class="dep-title">${esc(b.title)}</div>`:''}
    ${b.text?`<div class="dep-text">${esc(b.text).replace(/\n/g,'<br>')}</div>`:''}
    ${link}</div></div>`;
}

/* --- reports / stats dashboard --- */
function renderAdminStats(){
  const w=$('#admin-reports');if(!w)return;
  const crew=state.crew.length;
  // gear stats
  let gearTotal=0,claimed=0;
  gearData().forEach(c=>c.items.forEach(it=>{gearTotal++;if((state.gearClaims[it.id]||[]).length)claimed++;}));
  // packing per person
  const packRows=state.crew.map(n=>{const s=packStatsFor(n);return {n,...s};});
  // costs
  const total=state.expenses.reduce((s,e)=>s+e.amt,0);
  // votes
  const votes={};Object.values(state.votes).forEach(v=>votes[v]=(votes[v]||0)+1);
  const stat=(v,k)=>`<div class="stat"><div class="v">${v}</div><div class="k">${k}</div></div>`;
  let html=`<div class="dash-stats" style="grid-template-columns:repeat(3,1fr)">
    ${stat(crew,'crew')}
    ${stat(onlineCount,'online now')}
    ${stat(claimed+'/'+gearTotal,'gear claimed')}
    ${stat('$'+total.toFixed(0),'logged spend')}
    ${stat(state.stops.length,'route stops')}
    ${stat(state.chosenSite?(state.chosenSite==='ivy'?'Ivy Lea':'Plage'):'—','site')}
  </div>`;
  // packing progress per crew
  if(packRows.length){
    html+='<div class="kicker" style="margin:16px 0 8px">◆ Packing by crew member</div>';
    html+=packRows.map(r=>{const pct=r.total?Math.round(r.packed/r.total*100):0;
      return `<div class="progress-row"><span class="pl">${esc(r.n.split(' ')[0])}</span><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><span class="pv">${r.packed}/${r.total}</span></div>`;
    }).join('');
  }
  // votes
  if(Object.keys(votes).length){
    html+='<div class="kicker" style="margin:16px 0 8px">◆ Campsite votes</div>';
    html+=Object.entries(votes).map(([k,v])=>`<div class="settle-row"><span>${k==='ivy'?'Ivy Lea':'Camping de la Plage'}</span><span class="owe pos">${v} vote${v===1?'':'s'}</span></div>`).join('');
  }
  w.innerHTML=html;
}

/* --- user / crew management (within the trip) --- */
function renderAdminUsers(){
  const w=$('#admin-users');if(!w)return;
  let html='';
  // crew (trip members)
  if(!state.crew.length){html+='<div class="empty">No crew members yet.</div>';}
  else html+=state.crew.map(c=>{
    const role=Object.entries(state.roles).filter(([,n])=>n===c).map(([r])=>r).join(', ')||'—';
    const onlineP=presenceList.find(p=>(p.name||'')===c||(p.email||'')===c);
    const dot=onlineP?'<span style="color:var(--green);font-size:10px">● online</span>':'<span style="color:var(--faint);font-size:10px">offline</span>';
    return `<div class="admin-row"><span class="avatar" style="width:26px;height:26px;font-size:11px;background:${colorFor(c)}">${initials(c)}</span>
      <div style="flex:1"><div style="font-size:13px;font-weight:600">${esc(c)} ${dot}</div><div style="font-size:11px;color:var(--faint);font-family:var(--mono)">role: ${esc(role)}</div></div>
      <button class="btn ghost sm" onclick="adminRemoveCrew('${esc(c).replace(/'/g,"\\'")}')">Remove</button></div>`;
  }).join('');
  // leaders
  html+='<div class="kicker" style="margin:16px 0 8px">◆ Leaders — full access (no admin panel)</div>';
  const leaders=adminConfig.leaders||[];
  if(!leaders.length) html+='<div class="empty" style="margin-bottom:8px">No leaders yet. Grant by email below — that person gets full edit access and can reset the trip.</div>';
  else html+=leaders.map(e=>`<div class="admin-row"><span class="admin-tab-badge" style="color:var(--amber);background:rgba(240,180,85,.14);border-color:rgba(240,180,85,.3)">★ Leader</span><div style="flex:1;font-size:13px;font-family:var(--mono)">${esc(e)}</div><button class="btn ghost sm" onclick="adminRemoveLeader('${esc(e).replace(/'/g,"\\'")}')">Revoke</button></div>`).join('');
  html+=`<div style="display:flex;gap:6px;margin-top:10px"><input id="adm-leader-in" type="email" placeholder="leader@email.com" style="flex:1" onkeydown="if(event.key==='Enter')adminAddLeader()"><button class="btn sm" onclick="adminAddLeader()">Grant</button></div>`;
  w.innerHTML=html;
}
function adminRemoveCrew(name){
  if(!isOwner())return;
  if(!confirm('Remove '+name+' from the trip? This clears their gear claims, votes, role and expenses.'))return;
  removeCrew(name);
  renderAdminUsers();renderAdminPresence();
}
// Leaders: emails granted full-site access (same as admin minus the admin panel).
function adminAddLeader(){
  if(!isOwner())return;
  const inp=$('#adm-leader-in'); const email=(inp&&inp.value||'').trim().toLowerCase();
  if(!email||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){toast('Enter a valid email');return;}
  if(!adminConfig.leaders)adminConfig.leaders=[];
  if(!adminConfig.leaders.map(e=>e.toLowerCase()).includes(email)){ adminConfig.leaders.push(email); }
  if(inp)inp.value='';
  saveAdminConfig(); renderAdminUsers();
}
function adminRemoveLeader(email){
  if(!isOwner())return;
  adminConfig.leaders=(adminConfig.leaders||[]).filter(e=>e.toLowerCase()!==email.toLowerCase());
  saveAdminConfig(); renderAdminUsers();
}

function renderAuth(){
  const area=$('#auth-area'); if(!area)return;
  if(!sb){ area.innerHTML=''; return; }
  if(user){
    const name=user.user_metadata?.full_name||user.email||'Signed in';
    const pic=user.user_metadata?.avatar_url;
    const adminBtn=isOwner()?`<button class="btn ghost sm" style="margin-left:6px" onclick="openAdmin()" title="Admin">🛠 Admin</button>`:'';
    area.innerHTML=`<span class="user-chip">${pic?`<img src="${esc(pic)}" alt="">`:''}${esc(name.split(' ')[0])} <span class="x" style="cursor:pointer;color:var(--faint)" onclick="signOut()" title="Sign out">⎋</span></span>${adminBtn}`;
  } else {
    area.innerHTML=`<button class="btn ghost sm" onclick="openSignin()">Sign in</button>`;
  }
}
function isStandalonePWA(){
  return (window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone===true;
}

// On return from Google, the token arrives in the URL hash (implicit flow).
// A standalone iOS PWA can read this even though it can't share PKCE storage.
async function recoverSessionFromUrl(){
  try{
    const h=window.location.hash||'';
    if(h.includes('access_token')){
      const p=new URLSearchParams(h.replace(/^#/,''));
      const access_token=p.get('access_token'), refresh_token=p.get('refresh_token');
      if(access_token&&refresh_token){
        const {error}=await sb.auth.setSession({access_token,refresh_token});
        if(error) console.warn('setSession:',error.message);
      }
      // strip the token from the URL so it isn't left in history
      history.replaceState(null,'',location.origin+location.pathname);
    } else if(h.includes('error')){
      const p=new URLSearchParams(h.replace(/^#/,''));
      toast('Sign-in error: '+(p.get('error_description')||p.get('error')||'unknown'));
      history.replaceState(null,'',location.origin+location.pathname);
    }
  }catch(e){ console.warn('recoverSessionFromUrl:',e.message||e); }
}

async function signIn(){
  if(!sb){toast('Connect Supabase first (see README)');return;}
  const redirectTo=location.origin+location.pathname;
  try{
    // Plain full-page redirect. Implicit flow returns the token in the hash on the way back,
    // which works in Safari AND in the standalone home-screen app.
    const {error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo}});
    if(error) throw error;
  }catch(e){ toast('Sign-in failed: '+(e.message||e)); }
}
function openSignin(){
  if(!sb){toast('Connect Supabase first (see README)');return;}
  const st=document.getElementById('signin-email-status'); if(st) st.style.display='none';
  const inp=document.getElementById('signin-email'); if(inp) inp.value='';
  document.getElementById('signin-modal').classList.add('open');
}
function closeSignin(){ document.getElementById('signin-modal').classList.remove('open'); }
async function sendEmailLink(){
  if(!sb){toast('Connect Supabase first');return;}
  const inp=document.getElementById('signin-email');
  const status=document.getElementById('signin-email-status');
  const email=(inp&&inp.value||'').trim();
  if(!email||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){
    if(status){status.style.display='block';status.style.color='var(--danger)';status.textContent='Please enter a valid email address.';}
    return;
  }
  try{
    const allowNew = adminConfig.signupsOpen!==false; // default open unless admin turned off
    const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname,shouldCreateUser:allowNew}});
    if(error) throw error;
    if(status){status.style.display='block';status.style.color='var(--green)';status.textContent='✓ Link sent! Check your email and tap it on this device.';}
  }catch(e){
    const msg=(e.message||e)+'';
    if(status){status.style.display='block';status.style.color='var(--danger)';status.textContent=/Signups not allowed|not allowed for otp/i.test(msg)?'New sign-ups are currently closed. Ask the organizer for access.':'Could not send: '+msg;}
  }
}
async function signOut(){ if(sb){await sb.auth.signOut(); user=null; await applyAccess();} }

/* ============================================================
   DATA
   ============================================================ */
const SITES=[
 {key:'plage',flag:'🇨🇦 Quebec · Laurentians',name:'Camping de la Plage',meta:'Rivière-Rouge, QC · Route 117',
  mapsQ:'Camping de la Plage, Riviere-Rouge, QC', weatherUrl:'https://www.theweathernetwork.com/en/city/ca/quebec/riviere-rouge/14-days',
  mapImg:'maps/plage.jpg', phone:'819-275-7757',
  bookUrl:'http://www.campingdelaplage-qc.ca/plan-eng.html', fireUrl:'https://sopfeu.qc.ca/', fireLabel:'QC fire ban (SOPFEU)',
  facilities:['🚿 Showers','🧺 Laundry','🏪 Store','📶 Wi-Fi','🛶 Canoe/kayak','🏖 River beach','🔥 Firewood'],
  rows:[['Drive from DDO','~2 h · 170 km'],['Setting','Rivière Rouge bank'],['Tent site','~$40–55 · call'],['Open','May 10–Sep 22'],['Curfew','11:00 PM'],['Checkout','11:00 AM']],
  pros:['Closest — only ~2 hrs north of DDO','River beach + canoe/kayak rentals','Showers, laundry, store, Wi-Fi, firewood','Live music weekends · ~25 min to Mont-Tremblant'],
  cons:['Call 819-275-7757 to confirm June rates','Reviews note a strict noise policy — keep it chill'],
  url:'http://www.campingdelaplage-qc.ca/plan-eng.html'},
 {key:'ivy',flag:'🇨🇦 Ontario · 1000 Islands',name:'Ivy Lea Campground',meta:'Lansdowne, ON · Thousand Islands Pkwy',
  mapsQ:'Ivy Lea Campground, 649 Thousand Islands Parkway, Lansdowne, ON', weatherUrl:'https://www.theweathernetwork.com/en/city/ca/ontario/gananoque/14-days',
  mapImg:'maps/ivy.jpg', phone:'613-659-3057',
  bookUrl:'https://reservations.parks.on.ca/', infoUrl:'https://www.stlawrenceparks.com/to-do/camping/ivy-lea-campground/', fireUrl:'https://www.ontario.ca/page/forest-fires', fireLabel:'ON fire ban status',
  facilities:['🚿 Showers','🧺 Laundromat','🏪 Store','⛵ Boat launch','🤿 Scuba','🥾 Trails','🌉 Suspension bridge'],
  rows:[['Drive from DDO','~3–3.5 h'],['Basic site','$47.32 +HST'],['Waterfront','$55.30 +HST'],['Premium WF','$63.08 +HST'],['Extra vehicle','$13.00 / night'],['Reservation fee','$13.25 (n/r)'],['Checkout','1:00 PM']],
  pros:['Stunning 1000 Islands / St. Lawrence setting','Boat launch, scuba, trails, suspension bridge','Near Gananoque cruises + Boldt Castle','Premium waterfront sites available'],
  cons:['~1 hr farther than Rivière-Rouge','HST adds ~13% · some sites under the bridge'],
  url:'https://www.stlawrenceparks.com/to-do/camping/ivy-lea-campground/'},
];
const ORIGIN='Dollard-des-Ormeaux, QC';

const DEFAULT_GEAR=[
 {cat:'Shelter & sleep',items:[
  {id:'tent',n:'Tent(s)',t:'someone',note:'1×4-person or 2×2-person — confirm who has one'},
  {id:'sleepbag',n:'Sleeping bag + pad',t:'each',note:'Rate to at least 10°C for June nights'},
  {id:'pillow',n:'Pillow + extra blanket',t:'each',note:'Nights get genuinely cold'},
  {id:'tarp',n:'Tarp + rope',t:'someone',note:'Rain backup shelter over the kitchen'},
  {id:'lantern',n:'Lantern',t:'someone',note:'LED battery or propane'},
  {id:'headlamp',n:'Headlamp',t:'each',note:'Non-negotiable — phone torch doesn\'t cut it'}]},
 {cat:'Kitchen & fire',items:[
  {id:'stove',n:'Camp stove + fuel',t:'someone',note:'Check fuel compatibility before packing'},
  {id:'cooler',n:'Cooler (large)',t:'someone',note:'Pre-chill the night before with block ice'},
  {id:'castiron',n:'Cast iron / grill grate',t:'someone',note:'Ideal for campfire cooking'},
  {id:'pots',n:'Pots + pans',t:'someone',note:'1 large pot, 1 frying pan minimum'},
  {id:'dishes',n:'Plates / cups / cutlery',t:'shared',note:'One person brings a set for the group'},
  {id:'utensils',n:'Cooking utensils + knife + board',t:'someone',note:'Dedicated board for raw meat'},
  {id:'lighter',n:'Lighter + matches + firestarter',t:'shared',note:'Two ignition methods, always'},
  {id:'sticks',n:'Roasting sticks',t:'shared',note:'For s\'mores & sausages'}]},
 {cat:'Comfort & fun',items:[
  {id:'chair',n:'Camp chair',t:'each',note:'Everyone brings their own'},
  {id:'speaker',n:'Bluetooth speaker',t:'shared',note:'One waterproof for daytime + one for camp'},
  {id:'powerbank',n:'Power bank(s)',t:'shared',note:'At least one per car'},
  {id:'hammock',n:'Hammock',t:'someone',note:'Ideal for riverside lounging'},
  {id:'games',n:'Cards / board games',t:'shared',note:'Rain-day insurance'},
  {id:'coffee',n:'French press / AeroPress + kettle',t:'someone',note:'Morning ritual = good vibes'}]},
 {cat:'Clothing & attire',items:[
  {id:'cl1',n:'Fleece / warm layer',t:'each',note:'June nights near water drop to 8–12°C'},
  {id:'cl2',n:'Rain jacket',t:'each',note:'Always — even on a sunny forecast'},
  {id:'cl3',n:'Swimsuit + quick-dry towel',t:'each',note:'River/lake time both sites'},
  {id:'cl4',n:'Hiking shoes + camp shoes',t:'each',note:'Closed shoes for trails, slides/crocs at camp'},
  {id:'cl5',n:'Hat + sunglasses',t:'each',note:'Sun bounces hard off the water'},
  {id:'cl6',n:'Toque (yes, in June)',t:'each',note:'Worth more than an extra blanket at night'},
  {id:'cl7',n:'Long sleeves + pants for dusk',t:'each',note:'Mosquito armor from 7 PM'},
  {id:'cl8',n:'2–3 outfit changes + extra socks',t:'each',note:'Wet socks ruin a trip — pack double'}]},
 {cat:'Personal kit',items:[
  {id:'pk1',n:'Toiletries bag',t:'each',note:'Toothbrush, paste, deodorant, soap (biodegradable)'},
  {id:'pk2',n:'Sunscreen + after-sun cream',t:'each',note:'SPF 50 + aloe for the inevitable'},
  {id:'pk3',n:'Lip balm + moisturizer',t:'each',note:'Sun and campfire smoke dry you out'},
  {id:'pk4',n:'Personal meds + allergy pills',t:'each',note:'Plus antihistamines for bites'},
  {id:'pk5',n:'Phone charger + cable',t:'each',note:'One per person, power banks are shared'},
  {id:'pk6',n:'Earplugs + eye mask',t:'each',note:'5 AM birds and early sun are real'},
  {id:'pk7',n:'Garbage bag for dirty clothes',t:'each',note:'Keeps the wet/smoky stuff contained'},
  {id:'pk8',n:'ID, health card + some cash',t:'each',note:'Campground stores are often cash-friendly'}]},
 {cat:'Safety & health',items:[
  {id:'firstaid',n:'First aid kit',t:'shared',note:'Keep it in the lead car'},
  {id:'bugspray',n:'Bug spray (DEET/picaridin)',t:'shared',note:'June is peak mosquito + blackfly'},
  {id:'sunscreen',n:'Sunscreen',t:'each',note:'Plus a hat'},
  {id:'sanitizer',n:'Hand sanitizer',t:'shared',note:'Use before every meal'},
  {id:'water',n:'Water jugs (10–15 L)',t:'shared',note:'Backup to site tap water'}]},
];

const FOOD=[
 {n:'Marinated steaks / burgers',store:'cooler',cook:'fire',why:'Marinate at home in sealed bags, lay flat in cooler. Zero camp prep — just grill. Most filling meal of the trip.'},
 {n:'Sausages / hot dogs',store:'cooler',cook:'fire',why:'Easiest protein, no knife needed. Perfect Day-1 setup meal. Pre-cooked sausages are safest.'},
 {n:'Foil packet meals',store:'cooler',cook:'fire',why:'Pre-assemble at home: veg + protein + butter + seasoning. 15–20 min on coals. Zero dishes.'},
 {n:'Bacon + scrambled eggs',store:'cooler',cook:'stove',why:'Pre-crack eggs into a mason jar. Cast iron is perfect. Most filling breakfast.'},
 {n:'Campfire baked potatoes',store:'dry',cook:'fire',why:'Foil-wrap with butter & garlic, bury in coals 45–60 min. Incredibly filling, pairs with anything.'},
 {n:'Corn on the cob',store:'dry',cook:'fire',why:'Keep husks on, soak 30 min, grill 15 min. Sweet, smoky, no prep.'},
 {n:'Pasta + jarred sauce',store:'dry',cook:'stove',why:'Boil once. Add tuna or salami for protein. Best rain-day backup if the grill fails.'},
 {n:'Pre-made pasta / grain salad',store:'cooler',cook:'none',why:'Make at home; keeps 48 hrs sealed in the cooler. Perfect arrival-night side.'},
 {n:'Deli wraps',store:'cooler',cook:'none',why:'Tortillas + deli meat + cheese. Fast filling lunch, zero cooking. Tortillas beat bread in a cooler.'},
 {n:'Instant oatmeal',store:'dry',cook:'stove',why:'Just add boiling water. Stir in peanut butter + honey for serious calories. Solid backup breakfast.'},
 {n:'Canned beans / chili',store:'dry',cook:'stove',why:'Open, heat, wrap in a tortilla with cheese. Cheap, filling, no cooler space. Best emergency meal.'},
 {n:'Trail mix + granola bars',store:'dry',cook:'none',why:'High-calorie, travel-proof, no fridge. One bag per person in the day pack.'},
 {n:'Cheese + crackers + salami',store:'cooler',cook:'none',why:'Hard cheeses survive 2–4 hrs out of the cooler. Great fireside charcuterie board.'},
 {n:'S\'mores',store:'dry',cook:'fire',why:'Use chocolate bars (not chips), big marshmallows, cinnamon grahams. Keep dry in a sealed bag.'},
 {n:'Campfire pancakes',store:'dry',cook:'stove',why:'Pre-mix dry ingredients at home in a bag; add water + egg at camp. Make a big batch.'},
];
const MEALS=[
 {h:'Day 1 · Dinner',t:'Easy arrival',items:['Foil-packet veggies + sausage','Pre-made pasta salad','Garlic bread on the fire','Beers / drinks'],tip:'Foil packets prepped at home → straight on the grill'},
 {h:'Day 2 · Breakfast',t:'Slow morning',items:['Bacon + scrambled eggs (cast iron)','Toast on the grill grate','Fresh fruit + OJ','Pour-over / French press'],tip:'Eggs pre-cracked in a mason jar'},
 {h:'Day 2 · Lunch',t:'No-cook, relaxed',items:['Deli wraps + chips','Cheese, crackers, dips','Pickles, olives, snacks','Sparkling water / lemonade'],tip:''},
 {h:'Day 2 · Dinner ★',t:'Grill night — main event',items:['Marinated steaks or burgers','Corn on the cob (in fire)','Campfire baked potatoes','Coleslaw from home'],tip:'Marinate meat at home, packed flat in sealed bags'},
 {h:'Day 3 · Brunch',t:'Use up leftovers',items:['Campfire pancakes / French toast','Leftover sausage + eggs','Remaining fruit + snacks','Last of the coffee'],tip:''},
 {h:'Always-haves',t:'Accessible all trip',items:['Trail mix, granola bars, jerky','Chips, pretzels, popcorn','S\'mores: chocolate, grahams, mallows','Water + electrolytes'],tip:'Keep a snack bin outside the cooler'},
];
const PREP=[
 {tag:'Cooler',c:'it-log',title:'Block ice, not cubed',body:'Block ice lasts 2–3× longer. Buy a 5–10 lb block before leaving; add cubes around it. Pre-chill the empty cooler overnight with a sacrificial bag of ice.'},
 {tag:'Cooler',c:'it-log',title:'Layer in reverse meal order',body:'Bottom: ice → Day 3 → Day 2 → Day 1 on top. Drinks go in a separate cooler — that lid opens 20× more than the food cooler.'},
 {tag:'Cooler',c:'it-log',title:'Shade + drain daily',body:'Never leave it in a hot trunk (can hit 50°C). Keep it shaded and wrapped. Drain meltwater every morning.'},
 {tag:'Prep',c:'it-prep',title:'Mason jar eggs',body:'Crack & whisk all eggs at home into a wide-mouth jar or Nalgene. At camp: shake and pour. No shells, no mess.'},
 {tag:'Prep',c:'it-prep',title:'Pre-marinate in zip-locks',body:'Thursday night, bag the meat with marinade, squeeze out air, lay flat in the cooler. It marinates on the drive.'},
 {tag:'Prep',c:'it-prep',title:'Strip the packaging',body:'Pull everything from cardboard at home, repack in labelled zip-locks. Less trash at camp, more pack space.'},
 {tag:'Camp',c:'it-food',title:'Two-bin kitchen + snack bin',body:'Bin 1 = cooler (cold), Bin 2 = dry tote (bungee\'d shut against raccoons). Keep an open snack bin so nobody keeps opening the food cooler.'},
 {tag:'Safety',c:'it-safe',title:'Food safety basics',body:'Keep meat/dairy ≤4°C, never out >2 hrs in heat (1 hr if >30°C). Double-bag raw meat at the bottom of the cooler. Sanitize hands before every meal.'},
];

/* retailer search links: amz / ct / dec; best = our pick */
function rlinks(q,best,reason){
  const e=encodeURIComponent(q);
  return {amz:`https://www.amazon.ca/s?k=${e}`,ct:`https://www.canadiantire.ca/en/search-results.html?q=${e}`,dec:`https://www.decathlon.ca/en/search?q=${e}`,best,reason};
}
const SHOP=[
 // FOOD
 {cat:'food',tag:'Phase 1 — Home (DDO)',c:'it-log',title:'🍳 Food — buy before you leave',note:'Maxi or IGA in the West Island. Thu evening or Fri morning. Groceries are cheapest here.',
  items:[{n:'All meat (marinate overnight)'},{n:'Eggs (pre-crack into a jar)'},{n:'Dairy: butter, cheese, sour cream'},{n:'Dry: pasta, rice, oats, trail mix'},{n:'Canned: beans, corn, tomatoes'},{n:'Condiments + cooking oil'},{n:'S\'mores supplies'},{n:'Coffee (ground) + filters'},{n:'Drinks: beer, cider, sparkling water'},{n:'Snacks: chips, jerky, nuts'},{n:'Bread / tortillas / pita'},{n:'Foil, zip-locks, paper towels'},{n:'Biodegradable dish soap'},{n:'Garbage + compost bags'}]},
 {cat:'food',tag:'Phase 2 — Road stop',c:'it-prep',title:'🍳 Food — buy en route',note:'Rivière-Rouge: IGA Saint-Jérôme. Ivy Lea: Foodland Gananoque / Metro Kingston.',
  items:[{n:'Fresh produce (tomatoes, berries, corn)'},{n:'Ice (top up cooler at a gas station)'},{n:'Fresh buns for burgers'},{n:'Any forgotten item'},{n:'Breakfast sandwiches for the drive'},{n:'Alcohol top-ups (SAQ / LCBO)'}]},
 {cat:'food',tag:'Phase 3 — On site',c:'it-food',title:'🍳 Food — at the campground',note:'30–50% pricier — local essentials only.',
  items:[{n:'Firewood — always buy local'},{n:'Ice (if you run out)'},{n:'Convenience-store snacks'}]},
 // GEAR
 {cat:'gear',tag:'Phase 1 — Home · order early',c:'it-log',title:'🎒 Gear — core kit (order this week)',note:'Best store highlighted per item. Amazon = fast delivery; Canadian Tire = camping basics & sales; Decathlon = best value on real outdoor gear.',
  items:[
   {n:'Sleeping bag (10°C rated)',l:rlinks('sleeping bag 10 degree','dec','Decathlon Quechua bags are the value king')},
   {n:'Sleeping pad / air mattress',l:rlinks('camping sleeping pad','dec','Decathlon pads punch above their price')},
   {n:'Headlamp',l:rlinks('LED headlamp','amz','Amazon multipacks are cheapest')},
   {n:'Camp chair',l:rlinks('folding camp chair','ct','Canadian Tire constantly has chairs on sale')},
   {n:'Cooler (large hard-side)',l:rlinks('hard cooler 50qt','ct','Coleman/Igloo deals at Canadian Tire')},
   {n:'Camp stove + propane',l:rlinks('camping propane stove','ct','Coleman 2-burner is the CT classic')},
   {n:'Tarp + rope/paracord',l:rlinks('camping tarp paracord','ct','Cheap utility tarps in-store')},
   {n:'LED lantern',l:rlinks('LED camping lantern','amz','Amazon lantern multipacks are unbeatable')},
   {n:'Hammock',l:rlinks('camping hammock with straps','dec','Decathlon hammocks: solid + cheap')},
  ]},
 {cat:'gear',tag:'Phase 1 — Home · preventative',c:'it-safe',title:'🛡 Preventative & safety (do not skip)',note:'The unglamorous stuff that saves the weekend. All small, all cheap, all critical.',
  items:[
   {n:'Bug spray — DEET 25–30% or picaridin',l:rlinks('deet insect repellent','ct','Watkins/OFF! deals at Canadian Tire')},
   {n:'After-bite + antihistamines',l:rlinks('after bite antihistamine','amz','Pharmacy basket — Amazon is easiest')},
   {n:'First aid kit (full)',l:rlinks('first aid kit camping','amz','Best selection of compact kits')},
   {n:'Sunscreen SPF 50',l:rlinks('sunscreen spf 50','ct','Grab with the rest of the CT run')},
   {n:'Mosquito coils / thermacell',l:rlinks('thermacell mosquito repellent','ct','Thermacell units cheapest at CT')},
   {n:'Duct tape + zip ties',l:rlinks('duct tape zip ties','ct','Hardware aisle, two minutes')},
   {n:'Waterproof matches / firestarter',l:rlinks('waterproof matches fire starter','dec','Decathlon fire kit is great value')},
   {n:'Compact rain poncho (backup)',l:rlinks('rain poncho','dec','Decathlon ponchos: $5–10')},
   {n:'Water jugs / refillable 10 L',l:rlinks('water container 10l camping','ct','Reliance jugs at CT')},
  ]},
 {cat:'gear',tag:'Phase 2 — Road stop',c:'it-prep',title:'🎒 Gear — grab en route if forgotten',note:'Canadian Tire locations exist in Saint-Jérôme AND Kingston — perfect mid-route safety net for anything missed.',
  items:[{n:'Propane canisters'},{n:'Batteries (AA/AAA)'},{n:'Cheap foam pad (if someone forgot theirs)'},{n:'Bungee cords'},{n:'Lighter fluid / firestarters'}]},
];

const AREA={
 plage:{title:'Around Rivière-Rouge (QC)',items:['Canoe or kayak the Rouge River — rentals on-site','River beach swimming right at camp','Whitewater rafting day trips (Rouge River outfitters)','Mont-Tremblant village — 25 min north: lifts, luge, terrasses','Hiking in the Laurentians (Parc régional trails)','Live music nights at the campground (weekends)']},
 ivy:{title:'Around Ivy Lea / 1000 Islands (ON)',items:['1000 Islands boat cruise from Gananoque or Rockport','Boldt Castle visit (bring passports — it\'s US side)','1000 Islands Tower — viewing deck over the river','Skydeck suspension bridge walks','Scuba diving — famous freshwater wrecks','Fishing off the dock or boat launch','Kingston nightlife — 30 min west for a big night']},
};
const BRING=[
 {t:'Spikeball / volleyball',p:'The single best 4–5 person campsite game. Light, packs small.'},
 {t:'Frisbee / football',p:'Zero setup, infinite hours. Floats if it lands in the river.'},
 {t:'Fishing rods + basic tackle',p:'Both sites are on fishable water. Check licence rules (QC/ON).'},
 {t:'Water floaties / inflatable',p:'River lounging upgrade. Cheap at Canadian Tire in June.'},
 {t:'Binoculars',p:'1000 Islands ship-spotting or Laurentian birdlife. Underrated.'},
 {t:'Instant camera / disposables',p:'Better trip photos than phones — and nobody doomscrolls.'},
 {t:'Slackline',p:'Two trees + 15 minutes = hours of crew entertainment.'},
 {t:'Glow sticks',p:'Night games, marking tent lines so nobody faceplants.'},
];
const GAMES=[
 {t:'Cards: President / Poker',p:'Bring chips or play for camp chores. Classic fire-side format.'},
 {t:'Werewolf / Mafia',p:'Perfect for exactly 4–5 people around a fire at night.'},
 {t:'Campfire trivia',p:'One person preps 20 questions on the crew — guaranteed chaos.'},
 {t:'Story one-word-each',p:'Build a story one word per person. Gets dumb fast. That\'s the point.'},
 {t:'Flashlight hide & seek',p:'Sounds childish. Is incredible. Set boundaries before dark.'},
 {t:'Tent cinema',p:'Pre-download a movie, prop a phone/tablet, rain-night backup.'},
 {t:'Poker dice / Yahtzee',p:'One cup + five dice = entire rainy afternoon handled.'},
 {t:'Wood-carving contest',p:'Everyone carves a spoon or stake. Judge at the last fire.'},
];
const SITUATIONS=[
 {tag:'Rain',c:'it-log',title:'It starts raining hard',body:'Rig the tarp over the kitchen FIRST (ridgeline between trees, steep angle so water runs off). Trench check: never dig, but make sure the tent isn\'t in a depression. Keep gear off the tent walls — touching the fly wicks water through. Wet clothes go in a garbage bag, not the tent.'},
 {tag:'Rain',c:'it-log',title:'Prevent a wet tent before it happens',body:'Footprint UNDER the tent, slightly smaller than the floor (oversize collects water). Fly staked taut, doors zipped, vents open to kill condensation. Pitch on high ground. Seam-seal old tents at home the week before.'},
 {tag:'Bugs',c:'it-safe',title:'Mosquitos in the tent at night',body:'Rule 1: lights OFF before unzipping — light pulls them in. Open the zipper minimum, enter fast. Kill the ones inside with a headlamp sweep before bed. Never spray DEET inside the tent (it damages coatings); a Thermacell at the door 15 min before bed clears the zone.'},
 {tag:'Bugs',c:'it-safe',title:'Reduce bites at camp, especially at dusk',body:'Dusk = peak attack. Long sleeves + pants from 7 PM, DEET/picaridin on exposed skin, smoke side of the fire is the bug-free side. Avoid scented deodorant/soap. Treat bites with after-bite or antihistamine — don\'t scratch, scratching = infection risk while camping.'},
 {tag:'Fire',c:'it-prep',title:'Fire won\'t start / wood is damp',body:'Split damp logs — the inside is dry. Feather-stick the dry core with a knife. Build a proper ladder: firestarter → pencil-thin twigs → thumb-thick → wrist-thick. Don\'t smother it with big logs early. Cardboard + cooking oil is the emergency cheat.'},
 {tag:'Heat/Cold',c:'it-prep',title:'Cold night, someone\'s freezing',body:'Layer them up BEFORE shivering starts. A toque while sleeping is worth more than an extra blanket. Hot water in a Nalgene at the foot of the sleeping bag = camp radiator. Off the ground matters more than over the top — double the pads.'},
 {tag:'Wildlife',c:'it-safe',title:'Raccoons raided the camp',body:'They got food because food was out — fix the cause. Everything edible into the car or a latched cooler at night, including toothpaste and garbage. Never feed them or leave them dirty dishes. They remember sites that pay out.'},
 {tag:'Injury',c:'it-safe',title:'Cuts, burns & sprains',body:'Burns: cool water 10+ min, never ice, never butter. Cuts: pressure, clean, close, dress — and keep it dry (hard while camping; redress daily). Sprains: rest + elevate + compress, no "walking it off." Anything deep, gaping, or won\'t-stop-bleeding = drive to urgent care. Know where it is BEFORE the trip.'},
];
const FAQ=[
 {q:'How do I build a campfire that actually lights?',a:'Three sizes of fuel, staged: tinder (firestarter cube, birch bark, dryer lint), kindling (pencil → thumb thickness), then fuel logs (wrist+). Build a teepee or log-cabin around the tinder, light it from the upwind side, and don\'t add big logs until the kindling is roaring. Most failed fires die because people skip straight from tinder to logs.'},
 {q:'How much firewood do we need?',a:'For two long campfire nights, budget 2–3 bundles per night for a group fire (so 5–6 total). Buy it at the campground or the nearest town — transporting wood across regions is prohibited because it spreads invasive pests.'},
 {q:'What if there\'s a fire ban that weekend?',a:'Check sopfeu.qc.ca (QC) or ontario.ca/page/forest-fires (ON) the night before. A ban usually means no open fires but propane appliances are still allowed — so the camp stove handles cooking, and you pivot evenings to lantern + games. Pack the stove regardless.'},
 {q:'What temperature sleeping bag do I need in June?',a:'Nights near water in the Laurentians or on the St. Lawrence can drop to 8–12°C even after a 25°C day. A bag rated to 10°C (50°F) or lower is the safe call, plus a fleece and toque as backup.'},
 {q:'Do I really need a sleeping pad?',a:'Yes — and not mainly for comfort. The ground pulls heat out of you all night; a pad is insulation first, cushioning second. An air mattress with no insulation can actually sleep colder than a foam pad.'},
 {q:'How do we keep food cold for 3 days?',a:'Block ice (lasts 2–3× longer than cubes), a pre-chilled cooler, packing in reverse meal order, a separate drinks cooler, shade, and draining meltwater daily. Done right, a decent hard cooler holds safe temps the whole weekend.'},
 {q:'Is the water at the campsite drinkable?',a:'Both Camping de la Plage and Ivy Lea have potable tap water. Still bring 10–15 L in jugs as backup, and never drink straight from the river or lake without a filter.'},
 {q:'What\'s the deal with raccoons and food?',a:'Both parks have bold raccoons (and squirrels). Anything with a scent — food, garbage, toothpaste — goes into a car or latched cooler overnight. A bungee cord on the cooler lid is the minimum.'},
 {q:'Can we swim at both sites?',a:'Yes. Camping de la Plage has a river beach on the Rouge. Ivy Lea is on the St. Lawrence with dock and shoreline access — water is colder and currents are real, so swim near shore and never alone after drinks.'},
 {q:'Do we need a fishing licence?',a:'Yes, in both provinces. Quebec and Ontario each require their own licence (day or annual), buyable online in minutes. Don\'t skip it — fines are steep.'},
 {q:'Cell signal at the campsites?',a:'Spotty to fair at both — usable in open areas, weak in tree cover. That\'s exactly why this site works offline and why one printed emergency card per car matters.'},
 {q:'Check-in / check-out times?',a:'Camping de la Plage: curfew 11 PM, checkout 11 AM. Ivy Lea: checkout 1 PM, check-in typically early-mid afternoon. Arriving before check-in is usually fine — you can park and hit the beach.'},
];
const TIPS=[
 {i:'🌙',t:'June nights get cold',p:'Even with warm days, temps drop near water. Pack a fleece and a bag rated to at least 10°C (50°F).'},
 {i:'🦟',t:'Bugs peak in June',p:'Mosquitoes & blackflies are worst early June near lakes. DEET, long sleeves for evenings, mesh footprint.'},
 {i:'🔥',t:'Buy firewood local',p:'Never transport firewood across regions — it spreads invasive pests. Buy on-site or in town. ~$10–15/night.'},
 {i:'⏱️',t:'Prep the night before',p:'Pack the car, pre-portion food, pre-mix spices, make marinades. Arriving ready = zero stress on Day 1.'},
 {i:'🗑️',t:'Leave No Trace',p:'Pack out all trash, never leave food out, biodegradable soap 200 ft from water. Leave it better than you found it.'},
 {i:'🌧️',t:'Weather backup plan',p:'A tarp rigged over the kitchen is a game-changer. Pack cards + indoor entertainment for a rain day.'},
];
const ROLES=['Fire master','Meal lead','Gear coordinator','Lead driver','Navigator (car 2)','Quartermaster (snacks/water)'];

/* ============================================================
   RENDER
   ============================================================ */
function gearData(){
  if(!state.gear){state.gear=JSON.parse(JSON.stringify(DEFAULT_GEAR));return state.gear;}
  // migration: merge any new default categories/items into existing synced data
  const have=new Set();state.gear.forEach(c=>c.items.forEach(i=>have.add(i.id)));
  const archived=new Set(state.gearArchive.map(a=>a.id));
  DEFAULT_GEAR.forEach(dc=>{
    let cat=state.gear.find(c=>c.cat===dc.cat);
    dc.items.forEach(di=>{
      if(have.has(di.id)||archived.has(di.id))return;
      if(!cat){cat={cat:dc.cat,items:[]};state.gear.push(cat);}
      cat.items.push(JSON.parse(JSON.stringify(di)));have.add(di.id);
    });
  });
  return state.gear;
}

function renderSites(){
  const grid=$('#sites-grid');grid.innerHTML='';
  let pv=0,iv=0;Object.values(state.votes).forEach(v=>{if(v==='plage')pv++;if(v==='ivy')iv++;});
  SITES.forEach(s=>{
    const votes=Object.entries(state.votes).filter(([,v])=>v===s.key).map(([n])=>n);
    const isChosen=state.chosenSite===s.key;
    const isWin=!state.chosenSite&&((s.key==='plage'&&pv>iv&&pv>0)||(s.key==='ivy'&&iv>=pv&&(iv>0)));
    const card=document.createElement('div');card.className='site'+(isChosen?' chosen':isWin?' win':'');
    const opts=state.crew.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
    const faces=votes.map(n=>`<span class="avatar" style="background:${colorFor(n)}" title="${esc(n)}">${initials(n)}</span>`).join('');
    card.innerHTML=`
      <span class="chosen-badge">★ Chosen site</span>
      <div class="site-top"><div class="site-flag">${s.flag}</div><h3>${s.name}</h3><div class="site-meta">${s.meta}</div>
        <div class="facility-row">${s.facilities.map(f=>`<span class="fac">${f}</span>`).join('')}</div></div>
      <div class="site-body">
        ${s.rows.map(r=>`<div class="drow"><span class="dl">${r[0]}</span><span class="dv">${r[1]}</span></div>`).join('')}
        <div class="plist">${s.pros.map(p=>`<div class="pli pro">${p}</div>`).join('')}${s.cons.map(c=>`<div class="pli con">${c}</div>`).join('')}</div>
      </div>
      <div class="site-foot">
        <button class="btn sm ghost" onclick="window.open('${s.url}','_blank')">Visit ↗</button>
        <button class="btn sm ghost" onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.mapsQ)}','_blank')">📍 Directions</button>
        ${s.mapImg?`<button class="btn sm ghost" onclick="openSiteMap('${s.key}')">🗺 Site map</button>`:''}
        <button class="btn sm ghost" onclick="window.open('${s.weatherUrl}','_blank')">⛅ Weather</button>
        <select onchange="castVote('${s.key}',this.value)"><option value="">Vote as…</option>${opts}</select>
        <button class="btn sm ${isChosen?'amber':''}" onclick="chooseSite('${s.key}')">${isChosen?'✓ Chosen':'Choose this site'}</button>
        <span class="vote-tally"><span class="vote-faces">${faces}</span> ${votes.length} vote${votes.length===1?'':'s'}</span>
      </div>`;
    grid.appendChild(card);
  });
  renderRouteEndpoints();
}
function castVote(site,name){if(!requireEdit())return;if(!name)return;state.votes[name]=site;persist();renderSites();}
function chooseSite(key){state.chosenSite=state.chosenSite===key?'':key;persist();renderSites();renderQuickLinks();toast(state.chosenSite?'Site locked in — links & route updated':'Site un-chosen');}

/* ---------- dynamic quick links (follow the chosen site) ---------- */
function renderQuickLinks(){
  const w=$('#quicklinks');if(!w)return;
  const chosen=SITES.find(s=>s.key===state.chosenSite);
  const link=(href,ico,title,desc)=>`<a class="quicklink" href="${href}" target="_blank" rel="noopener"><div class="ico">${ico}</div><div><div class="qt">${title}</div><div class="qd">${desc}</div></div><div class="arr">↗</div></a>`;
  let html='';
  if(chosen){
    // chosen-site-specific links first
    html+=link(chosen.bookUrl||chosen.url,'🏕',(chosen.key==='ivy'?'Ivy Lea — Book now':'Camping de la Plage'),(chosen.key==='ivy'?'reservations.parks.on.ca':'campingdelaplage-qc.ca')+(chosen.phone?' · '+chosen.phone:''));
    if(chosen.infoUrl) html+=link(chosen.infoUrl,'ℹ️',chosen.name+' — info & rates','stlawrenceparks.com');
    html+=link('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(chosen.mapsQ),'📍','Directions to '+chosen.name,'Google Maps');
    html+=link(chosen.weatherUrl,'⛅','14-day weather','theweathernetwork.com · '+(chosen.key==='ivy'?'Gananoque':'Rivière-Rouge'));
    html+=link(chosen.fireUrl,'🔥',chosen.fireLabel,'check before you leave');
    html+=link('https://weather.gc.ca/','🌡','Environment Canada','weather.gc.ca');
  } else {
    // no site chosen yet -> show both options + general links
    html+=link('http://www.campingdelaplage-qc.ca/plan-eng.html','🏞️','Camping de la Plage','campingdelaplage-qc.ca · 819-275-7757');
    html+=link('https://reservations.parks.on.ca/','🛶','Ivy Lea — Book now','reservations.parks.on.ca · 613-659-3057');
    html+=link('https://www.stlawrenceparks.com/to-do/camping/ivy-lea-campground/','ℹ️','Ivy Lea — info & rates','stlawrenceparks.com');
    html+=link('https://sopfeu.qc.ca/','🔥','QC fire ban (SOPFEU)','sopfeu.qc.ca');
    html+=link('https://www.ontario.ca/page/forest-fires','🔥','ON fire ban status','ontario.ca');
    html+=link('https://weather.gc.ca/','⛅','Weather','weather.gc.ca · pick your site first for direct links');
  }
  w.innerHTML=html;
}

/* ---------- zoomable / pannable site map viewer ---------- */
let _mapState=null;
function openSiteMap(key){
  const s=SITES.find(x=>x.key===key);if(!s||!s.mapImg)return;
  const m=$('#map-modal');
  $('#map-title').textContent=s.name+' — site map';
  const img=$('#map-img');
  img.src=s.mapImg; img.alt=s.name+' campground map';
  _mapState={scale:1,x:0,y:0,key};
  applyMapTransform();
  m.classList.add('open');
}
function closeSiteMap(){ $('#map-modal').classList.remove('open'); }
function applyMapTransform(){
  const img=$('#map-img');if(!img||!_mapState)return;
  img.style.transform=`translate(${_mapState.x}px,${_mapState.y}px) scale(${_mapState.scale})`;
}
function mapZoom(delta,cx,cy){
  if(!_mapState)return;
  const old=_mapState.scale;
  let ns=Math.min(6,Math.max(1,old*(delta>0?1.2:1/1.2)));
  _mapState.scale=ns;
  if(ns===1){_mapState.x=0;_mapState.y=0;}
  applyMapTransform();
}
async function saveMap(){
  if(!_mapState)return;
  const s=SITES.find(x=>x.key===_mapState.key);if(!s)return;
  try{
    const res=await fetch(s.mapImg); const blob=await res.blob();
    const fname=(s.key==='ivy'?'ivy-lea':'camping-de-la-plage')+'-map.jpg';
    // Use Web Share with files if available (best on iOS — lets you save to Photos)
    if(navigator.canShare){
      const file=new File([blob],fname,{type:blob.type});
      if(navigator.canShare({files:[file]})){
        try{ await navigator.share({files:[file],title:s.name+' map'}); return; }catch(e){ if(e&&e.name==='AbortError') return; }
      }
    }
    // Fallback: trigger a download
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=fname;document.body.appendChild(a);a.click();a.remove();
    URL.revokeObjectURL(url);
    toast('Map saved');
  }catch(e){
    // last resort: open in new tab so user can long-press to save
    window.open(s.mapImg,'_blank');
  }
}
function initMapViewer(){
  const img=$('#map-img'), stage=$('#map-stage');
  if(!img||!stage)return;
  // wheel zoom (desktop)
  stage.addEventListener('wheel',e=>{e.preventDefault();mapZoom(-e.deltaY,e.clientX,e.clientY);},{passive:false});
  // drag to pan
  let dragging=false,sx=0,sy=0,ox=0,oy=0;
  const start=(x,y)=>{if(!_mapState||_mapState.scale<=1)return;dragging=true;sx=x;sy=y;ox=_mapState.x;oy=_mapState.y;};
  const move=(x,y)=>{if(!dragging||!_mapState)return;_mapState.x=ox+(x-sx);_mapState.y=oy+(y-sy);applyMapTransform();};
  const end=()=>{dragging=false;};
  stage.addEventListener('mousedown',e=>start(e.clientX,e.clientY));
  window.addEventListener('mousemove',e=>move(e.clientX,e.clientY));
  window.addEventListener('mouseup',end);
  // touch: drag + pinch
  let pinchDist=0,pinchScale=1;
  stage.addEventListener('touchstart',e=>{
    if(e.touches.length===1)start(e.touches[0].clientX,e.touches[0].clientY);
    else if(e.touches.length===2){pinchDist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);pinchScale=_mapState?_mapState.scale:1;}
  },{passive:true});
  stage.addEventListener('touchmove',e=>{
    if(e.touches.length===1)move(e.touches[0].clientX,e.touches[0].clientY);
    else if(e.touches.length===2&&_mapState){
      e.preventDefault();
      const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
      _mapState.scale=Math.min(6,Math.max(1,pinchScale*(d/pinchDist)));
      if(_mapState.scale===1){_mapState.x=0;_mapState.y=0;}
      applyMapTransform();
    }
  },{passive:false});
  stage.addEventListener('touchend',end);
  // double-tap / double-click to toggle zoom
  stage.addEventListener('dblclick',()=>{if(!_mapState)return;_mapState.scale=_mapState.scale>1?1:2.5;if(_mapState.scale===1){_mapState.x=0;_mapState.y=0;}applyMapTransform();});
}

/* ---------- route planner ---------- */
function chosenSiteObj(){ return SITES.find(s=>s.key===state.chosenSite)||null; }
function renderRouteEndpoints(){
  const el=$('#route-endpoints');if(!el)return;
  const dest=chosenSiteObj();
  el.innerHTML=`<span class="endpoint">🏠 ${ORIGIN}</span><span style="color:var(--faint)">→ ${state.stops.length} stop${state.stops.length===1?'':'s'} →</span><span class="endpoint dest">${dest?'⛺ '+dest.name:'⛺ Choose a site in the Campsites tab'}</span>`;
}
function renderStops(){
  const w=$('#stops-list');w.innerHTML='';
  if(!state.stops.length){w.innerHTML='<div class="empty">No stops yet — straight shot. Add gas/grocery/coffee stops above if you want them.</div>';}
  state.stops.forEach((s,i)=>{
    const r=document.createElement('div');r.className='stop-row';
    r.innerHTML=`<div class="num">${i+1}</div><div class="sd"><div class="sn">${esc(s.name)}</div><div class="sa">${esc(s.addr)}</div></div>
      <span class="mv" onclick="moveStop(${i},-1)" title="Move up">▲</span><span class="mv" onclick="moveStop(${i},1)" title="Move down">▼</span>
      <span class="x" onclick="delStop(${i})">✕</span>`;
    w.appendChild(r);
  });
  renderRouteEndpoints();
}
function addStop(){
  if(!requireEdit())return;
  const n=$('#stop-name').value.trim(), a=$('#stop-addr').value.trim();
  if(!n||!a){toast('Stop needs a name and an address');return;}
  state.stops.push({name:n,addr:a});$('#stop-name').value='';$('#stop-addr').value='';persist();renderStops();
}
function delStop(i){state.stops.splice(i,1);persist();renderStops();}
function moveStop(i,d){const j=i+d;if(j<0||j>=state.stops.length)return;[state.stops[i],state.stops[j]]=[state.stops[j],state.stops[i]];persist();renderStops();}
function openRoute(reverse){
  const dest=chosenSiteObj();
  if(!dest){toast('Choose a campsite first (Campsites tab)');return;}
  let origin=ORIGIN, destination=dest.mapsQ, ws=state.stops.map(s=>s.addr);
  if(reverse){[origin,destination]=[destination,origin];ws=ws.slice().reverse();}
  let url=`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
  if(ws.length)url+=`&waypoints=${ws.map(encodeURIComponent).join('%7C')}`;
  window.open(url,'_blank');
}

/* ---------- gear ---------- */
function renderGear(){
  const wrap=$('#gear-list');wrap.innerHTML='';
  $('#arch-count').textContent=state.gearArchive.length;
  // team packing overview (counts each "All crew" item once per crew member)
  let claimedUnits=0,packedUnits=0;
  gearData().forEach(cat=>cat.items.forEach(it=>{
    const claims=state.gearClaims[it.id]||[];
    if(!claims.length)return;
    const pk=state.gearPacked[it.id];
    if(claims.includes('ALL')){
      const n=Math.max(1,state.crew.length);
      claimedUnits+=n;
      packedUnits+=(pk&&typeof pk==='object')?Object.keys(pk).filter(k=>state.crew.includes(k)).length:0;
    }else{
      claimedUnits+=1;
      if(pk&&typeof pk!=='object')packedUnits+=1;
    }
  }));
  const ps=$('#pack-summary');
  if(ps){
    if(claimedUnits===0){ps.innerHTML='<div style="font-size:13px;color:var(--muted)">📦 Claim gear below, then each person marks their items <b>Packed</b>. Pick who you are on the Basecamp tab to track your own list.</div>';}
    else{
      const pct=Math.round(packedUnits/claimedUnits*100);
      ps.innerHTML=`<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><div style="font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)">Team packed</div><div style="font-family:var(--display);font-weight:700;font-size:18px">${packedUnits}/${claimedUnits}</div><div class="progress-track" style="flex:1;min-width:120px"><div class="progress-fill" style="width:${pct}%"></div></div><div style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--green)">${pct}%</div></div>`;
    }
  }
  gearData().forEach((cat,ci)=>{
    if(!cat.items.length)return;
    const g=document.createElement('div');
    g.innerHTML=`<div class="kicker" style="margin-top:0">◆ ${esc(cat.cat)}</div>`;
    cat.items.forEach(it=>{
      const claims=state.gearClaims[it.id]||[];
      const row=document.createElement('div');row.className='gear-item'+(claims.length?' claimed':'');
      const tcls=it.t==='shared'?'gt-shared':it.t==='each'?'gt-each':'gt-someone';
      const chips=claims.map(n=>n==='ALL'
        ?`<span class="assignee all">👥 All crew <span class="x" onclick="unassign('${it.id}','ALL')">✕</span></span>`
        :`<span class="assignee"><span class="avatar" style="width:18px;height:18px;font-size:9px;background:${colorFor(n)}">${initials(n)}</span>${esc(n)} <span class="x" onclick="unassign('${it.id}','${esc(n).replace(/&#39;/g,"\\'")}')">✕</span></span>`).join('');
      const avail=state.crew.filter(c=>!claims.includes(c));
      const opts=avail.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
      const allOpt=claims.includes('ALL')?'':'<option value="ALL">👥 All crew</option>';
      const isAll=claims.includes('ALL');
      const me=whoAmI();
      let packed=false, packLabel='Pack';
      const pk=state.gearPacked[it.id];
      if(isAll){
        // per-person: reflect the current "who am I" selection
        const cnt = (pk&&typeof pk==='object') ? Object.keys(pk).length : 0;
        packed = !!(me && pk && typeof pk==='object' && pk[me]);
        packLabel = me ? (packed?'✓ Packed':'Pack (you)') : `Packed ${cnt}/${state.crew.length}`;
      } else {
        packed = !!(pk && typeof pk!=='object');
        packLabel = packed?'✓ Packed':'Pack';
      }
      const packBtn=claims.length?`<button class="pack-btn ${packed?'on':''}" onclick="togglePacked('${it.id}')" title="${isAll&&!me?'Pick who you are on Basecamp to pack your copy':'Mark as packed'}">${packLabel}</button>`:'';
      if(packed) row.className+=' packed';
      row.innerHTML=`
        <div class="gear-info"><div class="gear-name">${esc(it.n)} <span class="gtype ${tcls}">${it.t}</span></div><div class="gear-note">${esc(it.note||'')}</div></div>
        <div class="gear-claim">${chips}
          <select onchange="assign('${it.id}',this.value);this.value=''"><option value="">${state.crew.length?'+ Assign…':'Add crew first'}</option>${allOpt}${opts}</select>
          ${packBtn}
        </div>
        <span class="gear-x" title="Remove (goes to archive)" onclick="archiveGear('${it.id}')">🗑</span>`;
      g.appendChild(row);
    });
    wrap.appendChild(g);
  });
}
function assign(id,name){
  if(!requireEdit())return;
  if(!name)return;
  const arr=state.gearClaims[id]||(state.gearClaims[id]=[]);
  if(name==='ALL'){state.gearClaims[id]=['ALL'];}
  else{const i=arr.indexOf('ALL');if(i>-1)arr.splice(i,1);if(!arr.includes(name))arr.push(name);}
  persist();renderGear();renderMyPacking();renderProgress();
}
function unassign(id,name){
  const arr=state.gearClaims[id]||[];const i=arr.indexOf(name);if(i>-1)arr.splice(i,1);
  if(!arr.length)delete state.gearClaims[id];
  persist();renderGear();renderMyPacking();renderProgress();
}
// Toggle packed for a gear item. If the item is assigned to "All crew", track per-person
// (each person packs their own); otherwise a single shared flag.
function togglePacked(id, person){
  if(!requireEdit())return;
  if(!state.gearPacked)state.gearPacked={};
  const claims=state.gearClaims[id]||[];
  const isAll=claims.includes('ALL');
  if(isAll){
    const who=person||whoAmI();
    if(!who){toast('Pick who you are first');return;}
    let m=state.gearPacked[id];
    if(!m||typeof m!=='object'){m={};state.gearPacked[id]=m;}
    if(m[who])delete m[who];else m[who]=true;
    if(Object.keys(m).length===0)delete state.gearPacked[id];
  }else{
    if(state.gearPacked[id]&&typeof state.gearPacked[id]!=='object')delete state.gearPacked[id];
    else state.gearPacked[id]=true;
  }
  persist();renderGear();renderMyPacking();renderProgress();
}

// Toggle a packing-list line from the personal "My packing list" view (handles both gear + personal items)
function toggleMyPack(key){
  const me=whoAmI();if(!me)return;
  if(key.startsWith('personal:')){
    const id=key.slice('personal:'.length);
    const arr=state.personalItems[me]||[];
    const item=arr.find(x=>x.id===id);if(item){item.packed=!item.packed;}
    persist();renderMyPacking();renderProgress();renderGear();
  }else{
    togglePacked(key,me);
  }
}
function addPersonalItem(){
  if(!requireEdit())return;
  const me=whoAmI();if(!me){toast('Pick who you are first');return;}
  const inp=$('#my-item-in');const v=(inp.value||'').trim();if(!v)return;
  if(!state.personalItems[me])state.personalItems[me]=[];
  state.personalItems[me].push({id:uid(),name:v,packed:false});
  inp.value='';persist();renderMyPacking();renderProgress();
}
function removePersonalItem(id){
  const me=whoAmI();if(!me)return;
  state.personalItems[me]=(state.personalItems[me]||[]).filter(x=>x.id!==id);
  persist();renderMyPacking();renderProgress();
}
function renderMyPacking(){
  const wrap=$('#my-packing');if(!wrap)return;
  const me=whoAmI();
  const fillSel=(sel)=>{ if(sel){const opts=state.crew.map(c=>`<option value="${esc(c)}" ${c===me?'selected':''}>${esc(c)}</option>`).join('');sel.innerHTML=`<option value="">Who are you?</option>${opts}`;} };
  fillSel($('#whoami-select'));
  fillSel($('#whoami-select-gear'));
  if(!me){
    wrap.innerHTML='<div class="empty">Pick your name above to see your personal packing list — everything assigned to you, plus anything marked “All crew”, plus your own custom items.</div>';
    return;
  }
  if(!state.crew.includes(me)){ // stale selection
    try{localStorage.removeItem('ww_whoami');}catch(e){}
    wrap.innerHTML='<div class="empty">Pick your name above to see your personal packing list.</div>';
    [$('#whoami-select'),$('#whoami-select-gear')].forEach(s=>{if(s)s.value='';});
    return;
  }
  const list=packingListFor(me);
  const stats=packStatsFor(me);
  const pct=stats.total?Math.round(stats.packed/stats.total*100):0;
  let html=`<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px">
    <div style="font-family:var(--display);font-weight:700;font-size:20px">${stats.packed}/${stats.total} packed</div>
    <div class="progress-track" style="flex:1;min-width:120px"><div class="progress-fill" style="width:${pct}%"></div></div>
    <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--green)">${pct}%</div></div>`;
  if(!list.length){
    html+='<div class="empty">Nothing on your list yet. Claim gear in the list below, or add personal items here.</div>';
  } else {
    html+=list.map(x=>{
      const tag = x.kind==='personal'?'<span class="gtype gt-each">personal</span>':x.kind==='all'?'<span class="gtype gt-shared">all crew</span>':'<span class="gtype gt-someone">yours</span>';
      const rm = x.kind==='personal'?`<span class="gear-x" onclick="removePersonalItem('${x.key.slice(9)}')" title="Remove">🗑</span>`:'';
      return `<div class="chk ${x.packed?'done':''}" onclick="toggleMyPack('${x.key.replace(/'/g,"\\'")}')">
        <div class="box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg></div>
        <div class="ct" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">${esc(x.name)} ${tag}</div>${rm}</div>`;
    }).join('');
  }
  // add personal item row
  html+=`<div style="display:flex;gap:6px;margin-top:12px">
    <input id="my-item-in" placeholder="Add a personal item (e.g. retainer, book)…" style="flex:1" onkeydown="if(event.key==='Enter')addPersonalItem()">
    <button class="btn sm" onclick="addPersonalItem()">Add</button></div>`;
  wrap.innerHTML=html;
}
function addGear(){
  if(!requireEdit())return;
  const n=$('#gear-name-in').value.trim(),note=$('#gear-note-in').value.trim(),t=$('#gear-type-in').value;
  if(!n){toast('Give the gear a name');return;}
  const g=gearData();let cat=g.find(c=>c.cat==='Crew additions');
  if(!cat){cat={cat:'Crew additions',items:[]};g.push(cat);}
  cat.items.push({id:uid(),n,t,note});
  $('#gear-name-in').value='';$('#gear-note-in').value='';
  persist();renderGear();toast('Gear added');
}
function archiveGear(id){
  const g=gearData();
  for(const cat of g){
    const i=cat.items.findIndex(it=>it.id===id);
    if(i>-1){
      const [item]=cat.items.splice(i,1);
      state.gearArchive.push({...item,fromCat:cat.cat,claims:state.gearClaims[id]||[],archivedAt:new Date().toISOString().slice(0,10)});
      delete state.gearClaims[id];
      persist();renderGear();toast('Moved to archive — restore anytime');return;
    }
  }
}
function restoreGear(idx){
  const a=state.gearArchive.splice(idx,1)[0];if(!a)return;
  const g=gearData();let cat=g.find(c=>c.cat===a.fromCat);
  if(!cat){cat={cat:a.fromCat||'Crew additions',items:[]};g.push(cat);}
  const {fromCat,claims,archivedAt,...item}=a;
  cat.items.push(item);
  if(claims&&claims.length)state.gearClaims[item.id]=claims;
  persist();renderGear();renderArchive();toast('Restored to the gear list');
}
function deleteForever(idx){state.gearArchive.splice(idx,1);persist();renderArchive();renderGear();}
function openArchive(){renderArchive();$('#archive-modal').classList.add('open');}
function closeArchive(){$('#archive-modal').classList.remove('open');}
function renderArchive(){
  const w=$('#archive-list');w.innerHTML='';
  if(!state.gearArchive.length){w.innerHTML='<div class="empty">Archive is empty — nothing has been removed.</div>';return;}
  state.gearArchive.forEach((a,i)=>{
    const r=document.createElement('div');r.className='gear-item';
    r.innerHTML=`<div class="gear-info"><div class="gear-name">${esc(a.n)}</div><div class="gear-note">from ${esc(a.fromCat||'?')} · removed ${a.archivedAt||''}</div></div>
      <button class="btn sm" onclick="restoreGear(${i})">Restore</button>
      <button class="btn sm ghost" onclick="deleteForever(${i})">Delete forever</button>`;
    w.appendChild(r);
  });
}

/* ---------- food ---------- */
let foodFilter='all';
function renderFood(){
  const tb=document.querySelector('#ftable tbody');tb.innerHTML='';
  const sl={cooler:'Cooler',dry:'Dry',fire:'Fire',stove:'Stove',none:'No cook'};
  FOOD.filter(f=>foodFilter==='all'||f.store===foodFilter||f.cook===foodFilter).forEach(f=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td class="fn">${f.n}</td><td><span class="fpill fp-${f.store}">${sl[f.store]}</span></td><td><span class="fpill fp-${f.cook}">${sl[f.cook]}</span></td><td>${f.why}</td>`;
    tb.appendChild(tr);
  });
}
function renderMeals(){const w=$('#meal-grid');w.innerHTML='';MEALS.forEach(m=>{const d=document.createElement('div');d.className='meal';
  d.innerHTML=`<div class="mh">${m.h}</div><h4>${m.t}</h4><ul>${m.items.map(i=>`<li>${i}</li>`).join('')}</ul>${m.tip?`<div class="mtip">↳ ${m.tip}</div>`:''}`;w.appendChild(d);});}
function renderPrep(){const w=$('#prep-grid');w.innerHTML='';PREP.forEach(p=>{const d=document.createElement('div');d.className='icard';
  d.innerHTML=`<div class="itag ${p.c}">${p.tag}</div><h4>${p.title}</h4><p>${p.body}</p>`;w.appendChild(d);});}

/* ---------- shopping ---------- */
let shopFilter='all';
function shopCat(btn,f){$$('.fbtn[data-sc]').forEach(b=>b.classList.remove('on'));btn.classList.add('on');shopFilter=f;renderShop();}
function renderShop(){
  const w=$('#shop-grid');w.innerHTML='';
  SHOP.filter(s=>shopFilter==='all'||s.cat===shopFilter).forEach((s)=>{
    const si=SHOP.indexOf(s);
    const card=document.createElement('div');card.className='icard';
    let html=`<div class="itag ${s.c}">${s.tag}</div><h4>${s.title}</h4><div style="margin:10px 0 0">`;
    s.items.forEach((it,ii)=>{
      const key='shop-'+si+'-'+ii;const done=state.checks[key];
      let links='';
      if(it.l){
        const L=it.l;
        const mk=(k,label,cls)=>`<a class="shoplink ${cls} ${L.best===k?'best':''}" href="${L[k]}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${L.best===k?'★ ':''}${label}</a>`;
        links=`<div class="shoplinks">${mk('amz','Amazon','sl-amz')}${mk('ct','Canadian Tire','sl-ct')}${mk('dec','Decathlon','sl-dec')}</div><div class="best-note">↳ ${L.reason}</div>`;
      }
      html+=`<div class="chk ${done?'done':''}" onclick="toggleCheck('${key}')"><div class="box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg></div><div class="ct">${esc(it.n)}${links}</div></div>`;
    });
    html+=`</div><div class="note" style="margin-top:12px">${s.note}</div>`;
    card.innerHTML=html;w.appendChild(card);
  });
}
function toggleCheck(k){if(!requireEdit())return;state.checks[k]=!state.checks[k];persist();renderShop();}

/* ---------- crew / roles ---------- */
function renderCrew(){
  const bar=$('#crew-bar');bar.innerHTML='';
  if(!state.crew.length){bar.innerHTML='<span class="empty" style="padding:8px">No crew yet — add names above.</span>';}
  state.crew.forEach(c=>{const chip=document.createElement('div');chip.className='crew-chip';
    chip.innerHTML=`<span class="avatar" style="background:${colorFor(c)}">${initials(c)}</span>${esc(c)}<span class="x" onclick="removeCrew('${esc(c).replace(/&#39;/g,"\\'")}')">✕</span>`;bar.appendChild(chip);});
  refreshCrewSelects();renderGear();renderRoles();renderSites();renderSettle();renderMyPacking();
}
function requireEdit(){ if(!isSignedIn()){ toast('🔒 Sign in to edit the trip'); return false; } return true; }
function addCrew(){
  if(!requireEdit())return;
  const i=$('#crew-input');const v=i.value.trim();
  if(!v||state.crew.includes(v))return;state.crew.push(v);i.value='';persist();renderCrew();
}
function removeCrew(name){
  state.crew=state.crew.filter(c=>c!==name);
  Object.keys(state.gearClaims).forEach(k=>{state.gearClaims[k]=(state.gearClaims[k]||[]).filter(n=>n!==name);if(!state.gearClaims[k].length)delete state.gearClaims[k];});
  delete state.votes[name];
  Object.keys(state.roles).forEach(k=>{if(state.roles[k]===name)delete state.roles[k];});
  state.expenses=state.expenses.filter(e=>e.who!==name);
  persist();renderCrew();renderExpenses();
}
function refreshCrewSelects(){
  const opts=state.crew.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
  const ew=$('#exp-who');if(ew){const cur=ew.value;ew.innerHTML=`<option value="">Who paid?</option>${opts}`;ew.value=cur;}
}
function renderRoles(){
  const w=$('#role-grid');w.innerHTML='';
  ROLES.forEach(r=>{const opts=state.crew.map(c=>`<option value="${esc(c)}" ${state.roles[r]===c?'selected':''}>${esc(c)}</option>`).join('');
    const d=document.createElement('div');d.className='role';
    d.innerHTML=`<div class="rn">${r}</div><select onchange="setRole('${r.replace(/'/g,"\\'")}',this.value)"><option value="">${state.crew.length?'Assign…':'Add crew first'}</option>${opts}</select>`;w.appendChild(d);});
}
function setRole(r,n){if(!requireEdit())return;if(n)state.roles[r]=n;else delete state.roles[r];persist();}

/* ---------- expenses ---------- */
function addExpense(){
  if(!requireEdit())return;
  const d=$('#exp-desc'),a=$('#exp-amt'),c=$('#exp-cat'),w=$('#exp-who');
  const desc=d.value.trim(),amt=parseFloat(a.value),who=w.value,cat=c.value;
  if(!desc||!amt||amt<=0||!who){toast('Need a description, amount & payer');return;}
  state.expenses.push({id:Date.now(),desc,amt:Math.round(amt*100)/100,who,cat});
  d.value='';a.value='';w.value='';persist();renderExpenses();
}
function delExpense(id){state.expenses=state.expenses.filter(e=>e.id!==id);persist();renderExpenses();}
function renderExpenses(){
  const w=$('#exp-list');w.innerHTML='';
  if(!state.expenses.length){w.innerHTML='<div class="empty">No expenses logged yet.</div>';}
  state.expenses.forEach(e=>{const r=document.createElement('div');r.className='exp-row';
    r.innerHTML=`<span class="avatar" style="background:${colorFor(e.who)}">${initials(e.who)}</span><div class="ed"><div class="edesc">${esc(e.desc)} <span class="catpill">${esc(e.cat||'Other')}</span></div><div class="emeta">paid by ${esc(e.who)}</div></div><div class="eamt">$${e.amt.toFixed(2)}</div><span class="x" onclick="delExpense(${e.id})">✕</span>`;w.appendChild(r);});
  renderCatBars();renderSettle();
}
function renderCatBars(){
  const w=$('#cat-bars');w.innerHTML='';
  if(!state.expenses.length)return;
  const byCat={};let max=0,total=0;
  state.expenses.forEach(e=>{const c=e.cat||'Other';byCat[c]=(byCat[c]||0)+e.amt;total+=e.amt;});
  Object.values(byCat).forEach(v=>max=Math.max(max,v));
  const colors={Site:'#9bce6f',Food:'#f0b455',Gas:'#6cb6d4',Firewood:'#e8896b',Gear:'#b49ad4',Other:'#9aaa8c'};
  let html=`<div class="kicker" style="margin:8px 0 10px">◆ Spend by category · total $${total.toFixed(2)}</div>`;
  Object.entries(byCat).sort((a,b)=>b[1]-a[1]).forEach(([c,v])=>{
    html+=`<div class="cat-bar-row"><span class="cl">${c}</span><div class="cat-track"><div class="cat-fill" style="width:${(v/max*100).toFixed(1)}%;background:${colors[c]||'#9aaa8c'}"></div></div><span class="cv">$${v.toFixed(2)}</span></div>`;
  });
  w.innerHTML=html;
}
function renderSettle(){
  const w=$('#settle-body');
  if(!state.crew.length||!state.expenses.length){w.innerHTML='<div class="empty">Add crew + expenses to see the split.</div>';return;}
  const total=state.expenses.reduce((s,e)=>s+e.amt,0);
  const share=total/state.crew.length;
  const bal={};state.crew.forEach(c=>bal[c]=-share);
  state.expenses.forEach(e=>{if(bal[e.who]!==undefined)bal[e.who]+=e.amt;});
  let html=`<div class="settle-row"><span>Total spent</span><span class="owe">$${total.toFixed(2)}</span></div><div class="settle-row"><span>Per person (${state.crew.length})</span><span class="owe">$${share.toFixed(2)}</span></div><div style="height:8px"></div>`;
  state.crew.forEach(c=>{const b=bal[c];const cls=b>=-0.005?'pos':'neg';const txt=b>=-0.005?`gets back $${Math.max(0,b).toFixed(2)}`:`owes $${Math.abs(b).toFixed(2)}`;
    html+=`<div class="settle-row"><span><span class="avatar" style="width:20px;height:20px;font-size:9px;background:${colorFor(c)};display:inline-flex;vertical-align:middle;margin-right:7px">${initials(c)}</span>${esc(c)}</span><span class="owe ${cls}">${txt}</span></div>`;});
  // minimal transfers (greedy)
  const debtors=[],creditors=[];
  Object.entries(bal).forEach(([n,b])=>{if(b<-0.005)debtors.push([n,-b]);else if(b>0.005)creditors.push([n,b]);});
  debtors.sort((a,b)=>b[1]-a[1]);creditors.sort((a,b)=>b[1]-a[1]);
  const transfers=[];let di=0,ci=0;
  while(di<debtors.length&&ci<creditors.length){
    const pay=Math.min(debtors[di][1],creditors[ci][1]);
    transfers.push([debtors[di][0],creditors[ci][0],pay]);
    debtors[di][1]-=pay;creditors[ci][1]-=pay;
    if(debtors[di][1]<0.005)di++;if(creditors[ci][1]<0.005)ci++;
  }
  if(transfers.length){
    html+=`<div class="kicker" style="margin:14px 0 10px">◆ Who pays who — ${transfers.length} transfer${transfers.length===1?'':'s'}</div>`;
    transfers.forEach(([from,to,amt])=>{
      html+=`<div class="transfer"><span class="avatar" style="background:${colorFor(from)}">${initials(from)}</span> ${esc(from)} <span style="color:var(--faint)">pays</span> <span class="avatar" style="background:${colorFor(to)}">${initials(to)}</span> ${esc(to)} <span class="amt">$${amt.toFixed(2)}</span></div>`;
    });
  }
  w.innerHTML=html;
}

/* ---------- activities / survival / faq ---------- */
function renderActivities(){
  const ag=$('#area-grid');ag.innerHTML='';
  const order=state.chosenSite==='ivy'?['ivy','plage']:['plage','ivy'];
  order.forEach(k=>{
    const a=AREA[k];const chosen=state.chosenSite===k;
    const d=document.createElement('div');d.className='icard';if(chosen)d.style.borderColor='var(--amber)';
    d.innerHTML=`<div class="itag it-fun">${chosen?'★ Our site':'Option'}</div><h4>${a.title}</h4><ul>${a.items.map(i=>`<li>${i}</li>`).join('')}</ul>`;
    ag.appendChild(d);
  });
  const bg=$('#bring-grid');bg.innerHTML='';
  BRING.forEach(b=>{const d=document.createElement('div');d.className='icard';d.innerHTML=`<h4>${b.t}</h4><p>${b.p}</p>`;bg.appendChild(d);});
  const gg=$('#games-grid');gg.innerHTML='';
  GAMES.forEach(g=>{const d=document.createElement('div');d.className='icard';d.innerHTML=`<h4>${g.t}</h4><p>${g.p}</p>`;gg.appendChild(d);});
}
function renderSituations(){
  const w=$('#situations-grid');w.innerHTML='';
  SITUATIONS.forEach(s=>{const d=document.createElement('div');d.className='icard';
    d.innerHTML=`<div class="itag ${s.c}">${s.tag}</div><h4>${s.title}</h4><p>${s.body}</p>`;w.appendChild(d);});
}
function renderFAQ(){
  const w=$('#faq-list');w.innerHTML='';
  FAQ.forEach(f=>{const d=document.createElement('details');d.className='faq';
    d.innerHTML=`<summary>${f.q}</summary><div class="fa">${f.a}</div>`;w.appendChild(d);});
}
function renderTips(){const w=$('#tips-card');w.innerHTML='';
  TIPS.forEach(t=>{const d=document.createElement('div');d.className='tip';
    d.innerHTML=`<div class="ti">${t.i}</div><div><h4>${t.t}</h4><p>${t.p}</p></div>`;w.appendChild(d);});}

/* ---------- help / export / misc ---------- */
function openHelp(){$('#help-modal').classList.add('open');}
function closeHelp(){$('#help-modal').classList.remove('open');}
function dismissBanner(){$('#help-banner').style.display='none';try{localStorage.setItem('ww_banner_hidden','1');}catch(e){}}
function showBannerAgain(){try{localStorage.removeItem('ww_banner_hidden');}catch(e){}$('#help-banner').style.display='flex';closeSettings();toast('Welcome banner restored');}

/* ---------- settings & theme (per-device, never synced) ---------- */
const ALL_THEMES=['classic','aurora','ember','glacier','topo','nebula','synthwave','botanic','abyss','sakura','carbon','dune'];
function getTheme(){try{return localStorage.getItem('ww_theme')||'classic';}catch(e){return 'classic';}}
// Alternating monthly default for signed-in users: even calendar month -> Botanic,
// odd month -> Aurora. Continues forever. Uses year*12+month so it never repeats wrongly.
function monthlyDefaultTheme(d){
  d=d||new Date();
  const idx=d.getFullYear()*12+d.getMonth(); // months since year 0
  return (idx%2===0)?'aurora':'botanic';
}
// Tag identifying which month-default a user has been auto-switched to, so we only
// auto-switch once per month and never override a manual choice the user made.
function getPinnedTheme(){try{return localStorage.getItem('ww_theme_pin')||'';}catch(e){return '';}}
function setPinnedTheme(t){
  try{
    if(t){localStorage.setItem('ww_theme_pin',t);}
    else{localStorage.removeItem('ww_theme_pin');}
  }catch(e){}
}
function applyMonthlyDefaultOnSignIn(){
  if(!user)return;
  // A pinned default always wins over the monthly rotation.
  const pin=getPinnedTheme();
  if(pin && canUseTheme(pin)){
    if(getTheme()!==pin){
      try{localStorage.setItem('ww_theme',pin);}catch(e){}
      document.documentElement.dataset.theme=pin;
      stopAmbient();startAmbient();
    }
    return;
  }
  const want=monthlyDefaultTheme();
  let lastAuto=null, manual=false;
  try{lastAuto=localStorage.getItem('ww_theme_auto');manual=localStorage.getItem('ww_theme_manual')==='1';}catch(e){}
  const cur=getTheme();
  const monthKey=new Date().getFullYear()+'-'+new Date().getMonth();
  if(lastAuto!==monthKey || (!manual && cur!==want)){
    try{
      localStorage.setItem('ww_theme',want);
      localStorage.setItem('ww_theme_auto',monthKey);
      localStorage.setItem('ww_theme_manual','0');
    }catch(e){}
    document.documentElement.dataset.theme=want;
    stopAmbient();startAmbient();
  }
}
// Display/motion settings are gated like themes: signed-out users can't change them.
// Defaults differ by sign-in state and are applied once per state via a marker key.
function motionOn(){
  try{ const v=localStorage.getItem('ww_motion'); if(v===null) return isSignedIn(); return v!=='0'; }catch(e){ return isSignedIn(); }
}
function liteOn(){ // formerly "performance mode": trims visual features for smoother performance
  try{ const v=localStorage.getItem('ww_lite'); if(v===null) return !isSignedIn(); return v==='1'; }catch(e){ return !isSignedIn(); }
}
function compactOn(){
  try{ const v=localStorage.getItem('ww_compact'); if(v===null) return !isSignedIn(); return v==='1'; }catch(e){ return !isSignedIn(); }
}
function simplifyOn(){try{return localStorage.getItem('ww_simplify')==='1';}catch(e){return false;}}

// Apply the correct DEFAULTS for the current sign-in state, once, unless the user has chosen.
// Signed-out: motion OFF, lite ON, compact ON.  Signed-in: motion ON, lite OFF, compact OFF.
function enforceDisplayDefaults(){
  const signed=isSignedIn();
  const marker = signed?'signed-in':'signed-out';
  let last=null; try{last=localStorage.getItem('ww_display_state');}catch(e){}
  if(last!==marker){
    // new state: reset display prefs to that state's defaults (clears any prior manual choices)
    try{
      localStorage.removeItem('ww_motion');
      localStorage.removeItem('ww_lite');
      localStorage.removeItem('ww_compact');
      localStorage.setItem('ww_display_state',marker);
    }catch(e){}
  }
  document.documentElement.classList.toggle('perf', liteOn());
  document.documentElement.classList.toggle('compact', compactOn());
}
function canUseTheme(t){return t==='classic'||!!user;}
function canUseDisplay(){ return isSignedIn(); }
function enforceThemeAccess(){
  if(!canUseTheme(getTheme())){
    try{localStorage.setItem('ww_theme','classic');}catch(e){}
    document.documentElement.dataset.theme='classic';
    stopAmbient();
  }
}
function setTheme(t){
  if(!canUseTheme(t)){toast('🔒 Sign in to unlock this theme');return;}
  try{localStorage.setItem('ww_theme',t);localStorage.setItem('ww_theme_manual','1');}catch(e){}
  document.documentElement.dataset.theme=t;
  renderSettingsUI();
  stopAmbient();startAmbient();
  if(t==='classic')unlockReveals();
  const names={aurora:'Aurora',ember:'Ember 🔥',glacier:'Glacier',topo:'Topo',classic:'Classic',nebula:'Nebula',synthwave:'Synthwave',botanic:'Botanic ☀',abyss:'Abyss',sakura:'Sakura',carbon:'Carbon',dune:'Dune'};
  toast((names[t]||t)+' theme — just for you, not the crew');
}
function renderPinUI(){
  const row=$('#pin-row'); if(!row) return;
  // only meaningful for signed-in users (themes locked otherwise)
  row.style.display=user?'flex':'none';
  const pin=getPinnedTheme();
  const cur=getTheme();
  const names={aurora:'Aurora',ember:'Ember',glacier:'Glacier',topo:'Topo',classic:'Classic',nebula:'Nebula',synthwave:'Synthwave',botanic:'Botanic',abyss:'Abyss',sakura:'Sakura',carbon:'Carbon',dune:'Dune'};
  const lbl=$('#pin-label'); const btn=$('#pin-btn');
  if(pin){
    if(lbl) lbl.innerHTML='📌 Pinned default: <b>'+(names[pin]||pin)+'</b> — overrides the monthly rotation.';
    if(btn) btn.textContent='Unpin (use monthly rotation)';
  } else {
    if(lbl) lbl.innerHTML='Monthly rotation is on (this month: <b>'+(names[monthlyDefaultTheme()]||'')+'</b>). Pin <b>'+(names[cur]||cur)+'</b> as your permanent default?';
    if(btn) btn.textContent='📌 Pin '+(names[cur]||cur)+' as my default';
  }
}
function togglePin(){
  if(!user){toast('Sign in to set a default theme');return;}
  if(getPinnedTheme()){
    setPinnedTheme('');
    toast('Unpinned — monthly rotation restored');
  } else {
    const cur=getTheme();
    if(cur==='classic'){toast('Pick a theme first, then pin it');return;}
    setPinnedTheme(cur);
    // pinning also clears the per-month manual flag so it's clean
    try{localStorage.setItem('ww_theme_manual','1');}catch(e){}
    toast('Pinned as your default theme 📌');
  }
  renderPinUI();
}
function toggleMotion(){
  if(!canUseDisplay()){toast('🔒 Sign in to change display settings');return;}
  const on=!motionOn();
  try{localStorage.setItem('ww_motion',on?'1':'0');}catch(e){}
  renderSettingsUI();
  if(on)startAmbient();else{stopAmbient();unlockReveals();}
  document.querySelectorAll('#aurora-blobs .blob').forEach(b=>b.style.animationPlayState=on?'running':'paused');
}
function renderSettingsUI(){
  const t=getTheme();
  ALL_THEMES.forEach(k=>{
    const card=$('#tc-'+k);if(!card)return;
    card.classList.toggle('on',t===k);
    card.classList.toggle('locked',!canUseTheme(k));
  });
  const note=$('#theme-lock-note');if(note)note.style.display=user?'none':'block';
  renderPinUI();
  // display toggles: show ON/OFF state, lock for signed-out
  const lockDisp=!canUseDisplay();
  [['#motion-toggle',motionOn()],['#perf-toggle',liteOn()],['#compact-toggle',compactOn()],['#simplify-toggle',simplifyOn()]].forEach(([id,on])=>{
    const el=$(id);if(!el)return;
    el.classList.toggle('done',on);
    el.classList.toggle('locked-row',lockDisp);
    const st=el.querySelector('.tg-state');
    if(st)st.textContent=on?'ON':'OFF';
  });
  const dnote=$('#display-lock-note');if(dnote)dnote.style.display=lockDisp?'block':'none';
}
function liteOnSet(v){try{localStorage.setItem('ww_lite',v?'1':'0');}catch(e){}}
function togglePerf(){
  if(!canUseDisplay()){toast('🔒 Sign in to change display settings');return;}
  const v=!liteOn();liteOnSet(v);document.documentElement.classList.toggle('perf',v);renderSettingsUI();
}
function toggleCompact(){
  if(!canUseDisplay()){toast('🔒 Sign in to change display settings');return;}
  const v=!compactOn();try{localStorage.setItem('ww_compact',v?'1':'0');}catch(e){}document.documentElement.classList.toggle('compact',v);renderSettingsUI();
}
function toggleSimplify(){
  if(!canUseDisplay()){toast('🔒 Sign in to change display settings');return;}
  const v=!simplifyOn();try{localStorage.setItem('ww_simplify',v?'1':'0');}catch(e){}applySimplify(v);renderSettingsUI();toast(v?'Simplified — extra tabs & sections hidden':'Full mode — everything shown');
}
// Simplify mode: hide non-essential tabs & sections to de-clutter (esp. mobile).
// Keeps the essentials: Basecamp, Campsites, Gear, Food, Survival. Hides Itinerary,
// Shopping, Costs, Activities, and trims secondary sections within kept pages.
const SIMPLIFY_HIDE_TABS=['plan','shop','money','fun'];
function applySimplify(on){
  document.documentElement.classList.toggle('simplify',on);
  // hide/show the secondary tabs
  SIMPLIFY_HIDE_TABS.forEach(p=>{
    const tab=document.querySelector('.tab[data-p="'+p+'"]');
    if(tab)tab.style.display=on?'none':'';
  });
  // if the active tab is being hidden, jump back to Basecamp
  if(on){
    const active=document.querySelector('.tab.active');
    if(active && SIMPLIFY_HIDE_TABS.includes(active.dataset.p)){
      const dash=document.querySelector('.tab[data-p="dash"]');if(dash)dash.click();
    }
  }
}
function openSettings(){renderSettingsUI();$('#settings-modal').classList.add('open');}
function closeSettings(){$('#settings-modal').classList.remove('open');}

/* ---------- ambient visuals — per-theme engine ----------
   Desktop (fine pointer, >=1024px, WebGL OK) -> Three.js scene per theme
   Mobile / fallback -> themed 2D canvas particles
   Themes: aurora (drift field) · ember (rising embers, camping)
           glacier (snowfall) · topo (wireframe terrain) · classic (none) */
let ffRAF=null,ffParticles=null,ff2dTheme=null;
let threeRAF=null,threeEnv=null;

const AMBIENT={
  aurora:{colors2d:['126,226,168','255,196,107'],drift:'float'},
  ember:{colors2d:['255,140,66','255,200,87','255,90,60'],drift:'rise'},
  glacier:{colors2d:['200,235,255','150,205,250'],drift:'fall'},
  topo:{colors2d:['88,255,155'],drift:'float'},
  nebula:{colors2d:['210,200,255','255,160,235','160,210,255'],drift:'float'},
  synthwave:{colors2d:['255,41,117','80,240,255'],drift:'float'},
  botanic:{colors2d:['120,150,60','170,190,90'],drift:'rise',blend:'normal'},
  abyss:{colors2d:['120,220,255','200,250,255'],drift:'rise'},
  sakura:{colors2d:['255,157,189','255,200,220'],drift:'fall'},
  carbon:{colors2d:['235,235,235'],drift:'float'},
  dune:{colors2d:['230,180,120','250,210,150'],drift:'wind'},
};

function isDesktop(){
  try{return window.matchMedia('(pointer: fine)').matches && innerWidth>=1024 && !('ontouchstart' in window);}catch(e){return innerWidth>=1024;}
}
function startAmbient(){
  const theme=getTheme();
  const cfg=AMBIENT[theme];
  if(!cfg||!motionOn()){stopAmbient();return;}
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const c=$('#fireflies');if(!c)return;
  if(c.dataset.mode==='2d'){start2D(cfg,theme);return;}
  if(c.dataset.mode==='three'){startThree(theme);return;}
  if(isDesktop())startThree(theme);else start2D(cfg,theme);
}
function stopAmbient(){stop2D();stopThree();}

function loadThree(){
  return new Promise((res,rej)=>{
    if(window.THREE)return res();
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
    s.onload=res;s.onerror=rej;document.head.appendChild(s);
  });
}
function softSprite(){
  const spr=document.createElement('canvas');spr.width=spr.height=64;
  const x=spr.getContext('2d');
  const g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(spr);
}
function makePoints(scene,sprite,count,size,colA,colB,spread,ySpread){
  const pos=new Float32Array(count*3),col=new Float32Array(count*3);
  const a=new THREE.Color(colA),bC=new THREE.Color(colB);
  for(let i=0;i<count;i++){
    pos[i*3]=(Math.random()-.5)*spread;
    pos[i*3+1]=(Math.random()-.5)*(ySpread||spread*.7);
    pos[i*3+2]=(Math.random()-.5)*spread;
    const cc=a.clone().lerp(bC,Math.random());
    col[i*3]=cc.r;col[i*3+1]=cc.g;col[i*3+2]=cc.b;
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('color',new THREE.BufferAttribute(col,3));
  const m=new THREE.PointsMaterial({size,map:sprite,vertexColors:true,transparent:true,opacity:.4,
    blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true});
  const p=new THREE.Points(g,m);scene.add(p);return p;
}

/* ---- per-theme scene builders: return {update(t,mx,my), objects[]} ---- */
function buildAurora(scene,sprite,camera){
  camera.position.set(0,0,90);
  const A=makePoints(scene,sprite,300,1.4,'#7ee2a8','#7cc8ff',200);
  const B=makePoints(scene,sprite,110,2.0,'#ffc46b','#c5a8ff',160);
  return {objects:[A,B],update(t,mx,my,sc){
    A.rotation.y=t*.22;A.rotation.x=Math.sin(t*.28)*.04;
    B.rotation.y=-t*.16;B.rotation.z=Math.cos(t*.2)*.03;
    A.material.opacity=.28+.12*Math.sin(t*.9);
    B.material.opacity=.24+.14*Math.sin(t*.7+1);
    camera.position.x=mx*5;camera.position.y=-my*3.5-Math.min(sc*.004,8);camera.lookAt(0,0,0);
  }};
}
function buildEmber(scene,sprite,camera){
  camera.position.set(0,0,90);
  const N=200;
  const E=makePoints(scene,sprite,N,1.5,'#ff9d4a','#ff5c3a',180,150);
  const pos=E.geometry.attributes.position;
  const meta=Array.from({length:N},()=>({vy:.04+Math.random()*.1,ph:Math.random()*6.28,sway:.5+Math.random()*1.2}));
  const glow=makePoints(scene,sprite,40,3.4,'#ffd27d','#ff7d3a',150,130);
  glow.material.opacity=.18;
  return {objects:[E,glow],update(t,mx,my,sc){
    for(let i=0;i<N;i++){
      let y=pos.getY(i)+meta[i].vy;
      if(y>78){y=-78;pos.setX(i,(Math.random()-.5)*180);}
      pos.setY(i,y);
      pos.setX(i,pos.getX(i)+Math.sin(t*1.4+meta[i].ph)*.018*meta[i].sway);
    }
    pos.needsUpdate=true;
    E.material.opacity=.34+.12*Math.sin(t*2.2);
    glow.rotation.y=t*.1;
    camera.position.x=mx*4;camera.position.y=-my*3;camera.lookAt(0,0,0);
  }};
}
function buildGlacier(scene,sprite,camera){
  camera.position.set(0,0,90);
  const N=260;
  const S=makePoints(scene,sprite,N,1.3,'#eaf6ff','#9fd4ff',200,170);
  const pos=S.geometry.attributes.position;
  const meta=Array.from({length:N},()=>({vy:.03+Math.random()*.08,ph:Math.random()*6.28,sway:.4+Math.random()}));
  return {objects:[S],update(t,mx,my,sc){
    for(let i=0;i<N;i++){
      let y=pos.getY(i)-meta[i].vy;
      if(y<-88){y=88;pos.setX(i,(Math.random()-.5)*200);}
      pos.setY(i,y);
      pos.setX(i,pos.getX(i)+Math.sin(t*.9+meta[i].ph)*.02*meta[i].sway);
    }
    pos.needsUpdate=true;
    S.material.opacity=.34+.1*Math.sin(t*.8);
    camera.position.x=mx*4;camera.position.y=-my*3;camera.lookAt(0,0,0);
  }};
}
function buildTopo(scene,sprite,camera){
  camera.position.set(0,26,70);
  const geo=new THREE.PlaneGeometry(340,340,64,64);
  geo.rotateX(-Math.PI/2);
  const mat=new THREE.MeshBasicMaterial({wireframe:true,color:0x58ff9b,transparent:true,opacity:.13});
  const mesh=new THREE.Mesh(geo,mat);mesh.position.y=-24;scene.add(mesh);
  const pos=geo.attributes.position;
  const dots=makePoints(scene,sprite,70,1.6,'#58ff9b','#a8ffd0',240,90);
  dots.material.opacity=.22;
  return {objects:[mesh,dots],update(t,mx,my,sc){
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),z=pos.getZ(i);
      pos.setY(i,5.5*Math.sin(x*.045+t*.7)+4*Math.cos(z*.05+t*.5)+2.2*Math.sin((x+z)*.03+t*.9));
    }
    pos.needsUpdate=true;
    mesh.rotation.y=t*.03;
    dots.rotation.y=-t*.05;
    camera.position.x=mx*6;camera.position.y=26-my*4+Math.min(sc*.006,10);camera.lookAt(0,-14,0);
  }};
}
function buildNebula(scene,sprite,camera){
  camera.position.set(0,0,100);
  const stars=makePoints(scene,sprite,520,1.0,'#ffffff','#b9a8ff',260,200);
  stars.material.opacity=.5;
  const tint=makePoints(scene,sprite,140,1.8,'#ff7ad9','#8fd0ff',220,170);
  tint.material.opacity=.25;
  // shooting star: single bright point
  const shoot=makePoints(scene,sprite,1,4.5,'#ffffff','#ffffff',1,1);
  const sp=shoot.geometry.attributes.position;
  let sx=999,sy=0,svx=0,svy=0,nextAt=2;
  return {objects:[stars,tint,shoot],update(t,mx,my,sc){
    stars.rotation.y=t*.05;stars.rotation.z=t*.012;
    tint.rotation.y=-t*.035;
    stars.material.opacity=.4+.15*Math.sin(t*1.2);
    if(t>nextAt&&sx>900){sx=-160;sy=40+Math.random()*60;svx=2.4+Math.random()*1.6;svy=-(.6+Math.random()*.5);}
    if(sx<900){sx+=svx;sy+=svy;sp.setXYZ(0,sx,sy,-30);sp.needsUpdate=true;
      shoot.material.opacity=Math.max(0,.9-Math.abs(sx)/200);
      if(sx>180){sx=999;nextAt=t+2.5+Math.random()*4;shoot.material.opacity=0;}}
    camera.position.x=mx*6;camera.position.y=-my*4-Math.min(sc*.005,10);camera.lookAt(0,0,0);
  }};
}
function buildSynthwave(scene,sprite,camera){
  camera.position.set(0,9,72);
  const geo=new THREE.PlaneGeometry(480,480,48,48);
  geo.rotateX(-Math.PI/2);
  const grid=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({wireframe:true,color:0xff2975,transparent:true,opacity:.3}));
  grid.position.y=-16;scene.add(grid);
  const sun=makePoints(scene,sprite,1,150,'#ff7ad9','#ff7ad9',1,1);
  sun.geometry.attributes.position.setXYZ(0,0,26,-180);sun.geometry.attributes.position.needsUpdate=true;
  sun.material.opacity=.5;
  const stars=makePoints(scene,sprite,160,1.1,'#50f0ff','#ffffff',300,140);
  stars.material.opacity=.3;
  const STEP=10;
  return {objects:[grid,sun,stars],update(t,mx,my,sc){
    grid.position.z=((t*46)%STEP);
    stars.rotation.y=t*.02;
    sun.material.opacity=.42+.1*Math.sin(t*1.6);
    camera.position.x=mx*7;camera.position.y=9-my*3+Math.min(sc*.004,6);camera.lookAt(0,-2,-60);
  }};
}
function buildBotanic(scene,sprite,camera){
  camera.position.set(0,0,90);
  const N=150;
  const P=makePoints(scene,sprite,N,2.0,'#7a9a3c','#b9c468',200,160);
  P.material.blending=THREE.NormalBlending;P.material.opacity=.5;
  const pos=P.geometry.attributes.position;
  const meta=Array.from({length:N},()=>({vy:.015+Math.random()*.05,ph:Math.random()*6.28,sw:.6+Math.random()}));
  return {objects:[P],update(t,mx,my,sc){
    for(let i=0;i<N;i++){
      let y=pos.getY(i)+meta[i].vy;
      if(y>85){y=-85;pos.setX(i,(Math.random()-.5)*200);}
      pos.setY(i,y);
      pos.setX(i,pos.getX(i)+Math.sin(t*.8+meta[i].ph)*.02*meta[i].sw);
    }
    pos.needsUpdate=true;
    camera.position.x=mx*4;camera.position.y=-my*3-Math.min(sc*.003,6);camera.lookAt(0,0,0);
  }};
}
function buildAbyss(scene,sprite,camera){
  camera.position.set(0,0,90);
  const N=230;
  const B=makePoints(scene,sprite,N,1.5,'#9fe8ff','#e6fbff',200,180);
  const pos=B.geometry.attributes.position;
  const meta=Array.from({length:N},()=>({vy:.05+Math.random()*.14,ph:Math.random()*6.28,sw:.6+Math.random()*1.4,sz:Math.random()}));
  return {objects:[B],update(t,mx,my,sc){
    for(let i=0;i<N;i++){
      let y=pos.getY(i)+meta[i].vy;
      if(y>95){y=-95;pos.setX(i,(Math.random()-.5)*200);}
      pos.setY(i,y);
      pos.setX(i,pos.getX(i)+Math.sin(t*1.8+meta[i].ph)*.05*meta[i].sw);
    }
    pos.needsUpdate=true;
    B.material.opacity=.3+.1*Math.sin(t*.7);
    camera.position.x=Math.sin(t*.4)*2+mx*4;camera.position.y=-my*3-Math.min(sc*.004,8);camera.lookAt(0,0,0);
  }};
}
function buildSakura(scene,sprite,camera){
  camera.position.set(0,0,90);
  const N=170;
  const P=makePoints(scene,sprite,N,2.0,'#ff9dbd','#ffd0e0',210,180);
  const pos=P.geometry.attributes.position;
  const meta=Array.from({length:N},()=>({vy:.025+Math.random()*.07,ph:Math.random()*6.28,sw:1+Math.random()*2}));
  return {objects:[P],update(t,mx,my,sc){
    for(let i=0;i<N;i++){
      let y=pos.getY(i)-meta[i].vy;
      if(y<-95){y=95;pos.setX(i,(Math.random()-.5)*210);}
      pos.setY(i,y);
      pos.setX(i,pos.getX(i)+Math.sin(t*1.1+meta[i].ph)*.045*meta[i].sw);
    }
    pos.needsUpdate=true;
    P.material.opacity=.4+.12*Math.sin(t*.9);
    camera.position.x=mx*4;camera.position.y=-my*3-Math.min(sc*.004,8);camera.lookAt(0,0,0);
  }};
}
function buildCarbon(scene,sprite,camera){
  camera.position.set(0,0,86);
  const knot=new THREE.Mesh(
    new THREE.TorusKnotGeometry(24,7,110,14),
    new THREE.MeshBasicMaterial({wireframe:true,color:0xffffff,transparent:true,opacity:.07}));
  knot.position.set(34,4,-30);scene.add(knot);
  const dots=makePoints(scene,sprite,70,1.2,'#ffffff','#d8f021',240,160);
  dots.material.opacity=.16;
  return {objects:[knot,dots],update(t,mx,my,sc){
    knot.rotation.x=t*.3;knot.rotation.y=t*.42;
    dots.rotation.y=t*.03;
    camera.position.x=mx*5;camera.position.y=-my*3-Math.min(sc*.004,7);camera.lookAt(0,0,0);
  }};
}
function buildDune(scene,sprite,camera){
  camera.position.set(0,0,90);
  const N=220;
  const S=makePoints(scene,sprite,N,1.3,'#e8b478','#ffd9a0',220,140);
  const pos=S.geometry.attributes.position;
  const meta=Array.from({length:N},()=>({vx:.12+Math.random()*.3,ph:Math.random()*6.28}));
  const sun=makePoints(scene,sprite,1,120,'#ffb86b','#ffb86b',1,1);
  sun.geometry.attributes.position.setXYZ(0,-70,42,-150);sun.geometry.attributes.position.needsUpdate=true;
  sun.material.opacity=.4;
  return {objects:[S,sun],update(t,mx,my,sc){
    const gust=1+.5*Math.sin(t*1.3);
    for(let i=0;i<N;i++){
      let x=pos.getX(i)+meta[i].vx*gust;
      if(x>120){x=-120;pos.setY(i,(Math.random()-.5)*140);}
      pos.setX(i,x);
      pos.setY(i,pos.getY(i)+Math.sin(t*2+meta[i].ph)*.012);
    }
    pos.needsUpdate=true;
    S.material.opacity=.3+.12*Math.sin(t*1.1);
    camera.position.x=mx*4;camera.position.y=-my*3-Math.min(sc*.004,7);camera.lookAt(0,0,0);
  }};
}
const THREE_BUILDERS={aurora:buildAurora,ember:buildEmber,glacier:buildGlacier,topo:buildTopo,
  nebula:buildNebula,synthwave:buildSynthwave,botanic:buildBotanic,abyss:buildAbyss,
  sakura:buildSakura,carbon:buildCarbon,dune:buildDune};

async function startThree(theme){
  const c=$('#fireflies');if(!c)return;
  try{await loadThree();}catch(e){start2D(AMBIENT[theme],theme);return;}
  if(threeEnv&&threeEnv.theme===theme){threeEnv.running=true;cancelAnimationFrame(threeRAF);threeEnv.loop();return;}
  if(!threeEnv){
    let renderer;
    try{renderer=new THREE.WebGLRenderer({canvas:c,alpha:true,antialias:false,powerPreference:'low-power'});}
    catch(e){start2D(AMBIENT[theme],theme);return;}
    c.dataset.mode='three';
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
    const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,1,400);
    let tx=0,ty=0;
    const onMouse=e=>{tx=(e.clientX/innerWidth-.5)*2;ty=(e.clientY/innerHeight-.5)*2;};
    const onResize=()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);};
    window.addEventListener('mousemove',onMouse,{passive:true});
    window.addEventListener('resize',onResize);
    onResize();
    threeEnv={renderer,camera,scene:new THREE.Scene(),sprite:softSprite(),t:0,mx:0,my:0,
      get tx(){return tx},get ty(){return ty},running:true,theme:null,built:null,loop:null};
  }
  const env=threeEnv;
  // clear previous theme objects
  if(env.built){env.built.objects.forEach(o=>{env.scene.remove(o);o.geometry&&o.geometry.dispose();o.material&&o.material.dispose();});}
  env.theme=theme;env.running=true;
  env.built=THREE_BUILDERS[theme](env.scene,env.sprite,env.camera);
  cancelAnimationFrame(threeRAF);
  env.loop=function loop(){
    if(!env.running)return;
    if(document.hidden){threeRAF=requestAnimationFrame(env.loop);return;}
    env.t+=.0016;
    env.mx+=(env.tx-env.mx)*.025;env.my+=(env.ty-env.my)*.025;
    env.built.update(env.t,env.mx,env.my,(window.scrollY||0));
    env.renderer.render(env.scene,env.camera);
    threeRAF=requestAnimationFrame(env.loop);
  };
  env.loop();
}
function stopThree(){
  cancelAnimationFrame(threeRAF);
  if(threeEnv){threeEnv.running=false;try{threeEnv.renderer.clear();}catch(e){}}
}
function start2D(cfg,theme){
  const c=$('#fireflies');if(!c)return;
  if(c.dataset.mode==='three')return;
  c.dataset.mode='2d';
  const ctx=c.getContext('2d');if(!ctx)return;
  const DPR=Math.min(window.devicePixelRatio||1,2);
  function size(){c.width=innerWidth*DPR;c.height=innerHeight*DPR;}
  size();window.addEventListener('resize',size);
  const N=innerWidth<700?18:36;
  if(!ffParticles||ff2dTheme!==theme){
    ff2dTheme=theme;
    const rise=cfg.drift==='rise',fall=cfg.drift==='fall',wind=cfg.drift==='wind';
    ffParticles=Array.from({length:N},()=>({
      x:Math.random()*c.width,y:Math.random()*c.height,
      r:(Math.random()*1.5+0.7)*DPR,
      vx:wind?(.18+Math.random()*.4)*DPR:(Math.random()-.5)*.14*DPR,
      vy:rise?-(.08+Math.random()*.2)*DPR:fall?(.06+Math.random()*.16)*DPR:(Math.random()-.5)*.12*DPR,
      ph:Math.random()*6.28,sp:.006+Math.random()*.012,
      col:cfg.colors2d[Math.floor(Math.random()*cfg.colors2d.length)]
    }));
  }
  cancelAnimationFrame(ffRAF);
  (function tick(){
    if(document.hidden){ffRAF=requestAnimationFrame(tick);return;}
    ctx.clearRect(0,0,c.width,c.height);
    for(const p of ffParticles){
      p.x+=p.vx;p.y+=p.vy;p.ph+=p.sp;
      if(p.x<0)p.x=c.width;if(p.x>c.width)p.x=0;
      if(p.y<-20)p.y=c.height+10;if(p.y>c.height+20)p.y=-10;
      const a=.16+.45*Math.abs(Math.sin(p.ph));
      const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*5);
      g.addColorStop(0,`rgba(${p.col},${a})`);g.addColorStop(1,`rgba(${p.col},0)`);
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.r*5,0,7);ctx.fill();
    }
    ffRAF=requestAnimationFrame(tick);
  })();
}
function stop2D(){
  cancelAnimationFrame(ffRAF);
  const c=$('#fireflies');
  if(c&&c.dataset.mode==='2d'){try{c.getContext('2d').clearRect(0,0,c.width,c.height);}catch(e){}}
}

/* ---------- GSAP entrance animations ---------- */
let revObserver=null;
function ensureObserver(){
  if(revObserver)return revObserver;
  revObserver=new IntersectionObserver(entries=>{
    entries.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');revObserver.unobserve(en.target);}});
  },{threshold:.06,rootMargin:'0px 0px -4% 0px'});
  return revObserver;
}
function animatePanel(panel){
  if(!motionOn()||getTheme()==='classic'){
    panel.querySelectorAll('.rv').forEach(el=>el.classList.add('in'));
    return;
  }
  const kids=panel.querySelectorAll('.card,.icard,.site,.meal,.gear-item,.tl-item,.role,.quicklink,details.faq,.stop-row,.exp-row');
  const obs=ensureObserver();let i=0;
  kids.forEach(el=>{
    if(el.classList.contains('in'))return;
    if(!el.classList.contains('rv')){
      el.style.transitionDelay=((i%8)*45)+'ms';i++;
      el.classList.add('rv');obs.observe(el);
    }
  });
}
function unlockReveals(){document.querySelectorAll('.rv').forEach(el=>el.classList.add('in'));}
function animateBoot(){
  if(!window.gsap||!motionOn())return;
  gsap.fromTo('header .brand',{opacity:0,y:-16},{opacity:1,y:0,duration:.7,ease:'power3.out'});
  gsap.fromTo('header .head-right',{opacity:0,y:-10},{opacity:1,y:0,duration:.7,delay:.12,ease:'power3.out'});
  gsap.fromTo('nav .tab',{opacity:0,y:10},{opacity:1,y:0,duration:.4,stagger:.04,delay:.2,ease:'power2.out',clearProps:'all'});
}

/* ---------- progress + share ---------- */
function renderProgress(){
  const w=$('#progress-wrap');if(!w)return;
  // shared trip readiness
  let total=0,claimed=0;
  gearData().forEach(c=>c.items.forEach(it=>{total++;if((state.gearClaims[it.id]||[]).length)claimed++;}));
  let sTotal=0,sDone=0;
  SHOP.forEach((s,si)=>s.items.forEach((_,ii)=>{sTotal++;if(state.checks['shop-'+si+'-'+ii])sDone++;}));
  const sitePicked=state.chosenSite?100:0;
  const crewPct=Math.min(100,Math.round(state.crew.length/4*100));
  const rows=[['Crew added',crewPct],['Site chosen',sitePicked],['Gear claimed',total?Math.round(claimed/total*100):0],['Shopping done',sTotal?Math.round(sDone/sTotal*100):0]];
  // personal packing row driven by "who am I"
  const me=whoAmI();
  if(me && state.crew.includes(me)){
    const st=packStatsFor(me);
    rows.push(['My packing ('+me.split(' ')[0]+')', st.total?Math.round(st.packed/st.total*100):0]);
  }
  w.innerHTML=rows.map(([l,v])=>`<div class="progress-row"><span class="pl">${l}</span><div class="progress-track"><div class="progress-fill" style="width:${v}%"></div></div><span class="pv">${v}%</span></div>`).join('');
}
function copySettle(){
  if(!state.crew.length||!state.expenses.length){toast('Nothing to copy yet');return;}
  const total=state.expenses.reduce((s,e)=>s+e.amt,0);
  const share=total/state.crew.length;
  const bal={};state.crew.forEach(c=>bal[c]=-share);
  state.expenses.forEach(e=>{if(bal[e.who]!==undefined)bal[e.who]+=e.amt;});
  const debtors=[],creditors=[];
  Object.entries(bal).forEach(([n,b])=>{if(b<-0.005)debtors.push([n,-b]);else if(b>0.005)creditors.push([n,b]);});
  debtors.sort((a,b)=>b[1]-a[1]);creditors.sort((a,b)=>b[1]-a[1]);
  let lines=['🏕 Camping 2026 — settle up','Total: $'+total.toFixed(2)+' · per person: $'+share.toFixed(2),''];
  let di=0,ci=0;
  while(di<debtors.length&&ci<creditors.length){
    const pay=Math.min(debtors[di][1],creditors[ci][1]);
    lines.push(debtors[di][0]+' pays '+creditors[ci][0]+' $'+pay.toFixed(2));
    debtors[di][1]-=pay;creditors[ci][1]-=pay;
    if(debtors[di][1]<0.005)di++;if(creditors[ci][1]<0.005)ci++;
  }
  const txt=lines.join('\n');
  if(navigator.clipboard){navigator.clipboard.writeText(txt).then(()=>toast('Settle-up copied — paste in the group chat')).catch(()=>toast(txt));}
  else toast(txt);
}
async function shareSite(){
  const data={title:'Camping 2026 — our camping plan',text:'Our June 19–21 camping plan — gear, route, costs, everything:',url:location.href};
  if(navigator.share){try{await navigator.share(data);}catch(e){}}
  else{try{await navigator.clipboard.writeText(location.href);toast('Link copied — paste it in the group chat');}catch(e){toast(location.href);}}
}

function exportJSON(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download='wildweekend-crew-data.json';a.click();URL.revokeObjectURL(url);
}
function importJSON(input){
  const file=input.files[0];if(!file)return;const r=new FileReader();
  r.onload=()=>{try{state=Object.assign(defaultState(),JSON.parse(r.result));persist();renderAll();toast('Crew data imported');}catch(e){toast('Could not read that file');}};
  r.readAsText(file);input.value='';
}
function exportPDF(){window.print();}
function resetData(){
  if(!canReset()){toast('🔒 Only an admin or leader can reset the trip');return;}
  if(confirm('Reset everything? This clears crew, gear, costs, votes, stops, roles & checklists for EVERYONE on the live trip.')){state=defaultState();persist();renderAll();}
}

/* ---------- tabs / boot ---------- */
function initTabs(){
  $$('.tab').forEach(t=>t.addEventListener('click',()=>{
    $$('.tab').forEach(x=>x.classList.remove('active'));
    $$('.panel').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');const panel=document.getElementById(t.dataset.p);panel.classList.add('active');
    animatePanel(panel);
    try{ trackPresence(); }catch(e){}
    window.scrollTo({top:0,behavior:'smooth'});
  }));
  $$('.fbtn[data-f]').forEach(b=>b.addEventListener('click',()=>{
    $$('.fbtn[data-f]').forEach(x=>x.classList.remove('on'));b.classList.add('on');foodFilter=b.dataset.f;renderFood();
  }));
}
function countdown(){
  const target=new Date('2026-06-19T08:00:00-04:00');const now=new Date();
  const diff=Math.ceil((target-now)/(86400000));
  const n=$('#cd-num'),l=$('#cd-lbl');
  if(diff>0){n.textContent=diff;l.textContent=diff===1?'day to go':'days to go';}
  else if(diff===0){n.textContent='GO';l.textContent="it's today";}
  else{n.textContent='✓';l.textContent='trip done';}
}
function renderAll(){
  renderCrew();renderExpenses();renderFood();renderMeals();renderPrep();renderShop();
  renderTips();renderSituations();renderFAQ();renderActivities();renderStops();renderSites();renderProgress();
  renderQuickLinks();renderPresence();renderMyPacking();renderDepartureBanner();
  const active=document.querySelector('.panel.active');if(active)animatePanel(active);
}
async function boot(){
  // --- CORE UI FIRST: must run no matter what, so the app is always usable & typeable ---
  try{ loadLocal(); }catch(e){ console.warn('loadLocal',e); }
  try{ if(localStorage.getItem('ww_banner_hidden'))$('#help-banner').style.display='none'; }catch(e){}
  try{ initTabs(); }catch(e){ console.warn('initTabs',e); }
  try{ initMapViewer(); }catch(e){ console.warn('initMapViewer',e); }
  try{ countdown(); }catch(e){}
  try{
    applyGateClasses();
    enforceDisplayDefaults();
    applySimplify(simplifyOn());
  }catch(e){}
  try{ renderAll(); }catch(e){ console.warn('renderAll',e); }
  try{ setSync('local','Local'); }catch(e){}
  try{ renderSettingsUI(); }catch(e){}

  // --- NICE-TO-HAVE (animations): never allowed to break the app ---
  try{ if(window.gsap) animateBoot(); }catch(e){}
  try{ startAmbient(); }catch(e){ console.warn('ambient',e); }

  // --- SERVICE WORKER: register WITHOUT the reload-on-controllerchange loop ---
  try{
    if('serviceWorker' in navigator && location.protocol.startsWith('http')){
      navigator.serviceWorker.register('sw.js').catch(()=>{});
    }
  }catch(e){}

  // --- SUPABASE / AUTH: fully optional; failure leaves the app in working local mode ---
  try{
    if(window.supabase && typeof window.supabase.createClient==='function'){
      await initSupabase();
      try{ renderAll(); }catch(e){}
    } else {
      setSync('local','Local'); // supabase lib didn't load — app still fully works locally
    }
  }catch(e){ console.warn('supabase boot skipped:',e); try{setSync('local','Local');}catch(_){} }
}
// run boot but never let a thrown error leave the page frozen
boot().catch(e=>{ console.error('boot failed, app still usable:',e); });
