/* WildWeekend — crew field plan. Data persists in localStorage; share via export/import. */
const STORE_KEY = 'wildweekend_v1';
let state = { crew:[], gearClaims:{}, expenses:[], votes:{}, roles:{}, checks:{} };

function load(){
  try{ const raw = localStorage.getItem(STORE_KEY); if(raw){ state = Object.assign(state, JSON.parse(raw)); } }
  catch(e){ console.warn('load failed', e); }
}
function save(){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch(e){ console.warn('save failed', e); }
}

const palette=['#9bce6f','#f0b455','#6cb6d4','#e8896b','#b49ad4','#7bb661'];
function colorFor(name){let h=0;for(let i=0;i<name.length;i++)h=name.charCodeAt(i)+((h<<5)-h);return palette[Math.abs(h)%palette.length];}
function initials(n){return n.trim().slice(0,2).toUpperCase();}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

/* ---------- data ---------- */
const GEAR=[
 {c:'Shelter & sleep',items:[
   {id:'tent',n:'Tent(s)',t:'someone',note:'1×4-person or 2×2-person — confirm who has one'},
   {id:'sleepbag',n:'Sleeping bag + pad',t:'each',note:'Rate to at least 10°C for June nights'},
   {id:'pillow',n:'Pillow + extra blanket',t:'each',note:'Nights get genuinely cold'},
   {id:'tarp',n:'Tarp + rope',t:'someone',note:'Rain backup shelter over the kitchen'},
   {id:'lantern',n:'Lantern',t:'someone',note:'LED battery or propane'},
   {id:'headlamp',n:'Headlamp',t:'each',note:'Non-negotiable — phone torch doesn\'t cut it'},
 ]},
 {c:'Kitchen & fire',items:[
   {id:'stove',n:'Camp stove + fuel',t:'someone',note:'Check fuel compatibility before packing'},
   {id:'cooler',n:'Cooler (large)',t:'someone',note:'Pre-chill the night before with block ice'},
   {id:'castiron',n:'Cast iron / grill grate',t:'someone',note:'Ideal for campfire cooking'},
   {id:'pots',n:'Pots + pans',t:'someone',note:'1 large pot, 1 frying pan minimum'},
   {id:'dishes',n:'Plates / cups / cutlery',t:'shared',note:'One person brings a set for the group'},
   {id:'utensils',n:'Cooking utensils + knife + board',t:'someone',note:'Dedicated board for raw meat'},
   {id:'lighter',n:'Lighter + matches + firestarter',t:'shared',note:'Two ignition methods, always'},
   {id:'sticks',n:'Roasting sticks',t:'shared',note:'For s\'mores & sausages'},
 ]},
 {c:'Comfort & fun',items:[
   {id:'chair',n:'Camp chair',t:'each',note:'Everyone brings their own'},
   {id:'speaker',n:'Bluetooth speaker',t:'shared',note:'One waterproof for daytime + one for camp'},
   {id:'powerbank',n:'Power bank(s)',t:'shared',note:'At least one per car'},
   {id:'hammock',n:'Hammock',t:'someone',note:'Ideal for riverside lounging'},
   {id:'games',n:'Cards / board games',t:'shared',note:'Rain-day insurance'},
   {id:'coffee',n:'French press / AeroPress + kettle',t:'someone',note:'Morning ritual = good vibes'},
 ]},
 {c:'Safety & health',items:[
   {id:'firstaid',n:'First aid kit',t:'shared',note:'Keep it in the lead car'},
   {id:'bugspray',n:'Bug spray (DEET/picaridin)',t:'shared',note:'June is peak mosquito + blackfly'},
   {id:'sunscreen',n:'Sunscreen',t:'each',note:'Plus a hat'},
   {id:'sanitizer',n:'Hand sanitizer',t:'shared',note:'Use before every meal'},
   {id:'water',n:'Water jugs (10–15 L)',t:'shared',note:'Backup to site tap water'},
 ]},
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
 {n:'Trail mix + granola bars',store:'dry',cook:'none',why:'High-calorie, travel-proof, no fridge. One bag per person in the day pack for hike/paddle days.'},
 {n:'Cheese + crackers + salami',store:'cooler',cook:'none',why:'Hard cheeses survive 2–4 hrs out of the cooler. Great fireside charcuterie board.'},
 {n:'S\'mores',store:'dry',cook:'fire',why:'Use chocolate bars (not chips), big marshmallows, cinnamon grahams. Keep dry in a sealed bag.'},
 {n:'Campfire pancakes',store:'dry',cook:'stove',why:'Pre-mix dry ingredients at home in a bag; add water + egg at camp. Make a big batch.'},
];
const MEALS=[
 {h:'Day 1 · Dinner',t:'Easy arrival',items:['Foil-packet veggies + sausage','Pre-made pasta salad','Garlic bread on the fire','Beers / drinks'],tip:'Foil packets prepped at home → straight on the grill'},
 {h:'Day 2 · Breakfast',t:'Slow morning',items:['Bacon + scrambled eggs (cast iron)','Toast on the grill grate','Fresh fruit + OJ','Pour-over / French press'],tip:'Eggs pre-cracked in a mason jar for easy cooking'},
 {h:'Day 2 · Lunch',t:'No-cook, relaxed',items:['Deli wraps + chips','Cheese, crackers, dips','Pickles, olives, snacks','Sparkling water / lemonade'],tip:''},
 {h:'Day 2 · Dinner ★',t:'Grill night — main event',items:['Marinated steaks or burgers','Corn on the cob (in fire)','Campfire baked potatoes','Coleslaw from home'],tip:'Marinate meat at home, packed flat in sealed bags'},
 {h:'Day 3 · Brunch',t:'Use up leftovers',items:['Campfire pancakes / French toast','Leftover sausage + eggs','Remaining fruit + snacks','Last of the coffee'],tip:''},
 {h:'Always-haves',t:'Accessible all trip',items:['Trail mix, granola bars, jerky','Chips, pretzels, popcorn','S\'mores: chocolate, grahams, mallows','Water + electrolytes'],tip:'Keep a snack bin outside the cooler for easy grabbing'},
];
const PREP=[
 {tag:'Cooler',c:'it-log',title:'Block ice, not cubed',body:'Block ice lasts 2–3× longer. Buy a 5–10 lb block before leaving; add cubes around it for gaps. Pre-chill the empty cooler overnight with a sacrificial bag of ice.'},
 {tag:'Cooler',c:'it-log',title:'Layer in reverse meal order',body:'Bottom: ice → Day 3 → Day 2 → Day 1 on top. Drinks go in a separate cooler — that lid opens 20× more than the food cooler.'},
 {tag:'Cooler',c:'it-log',title:'Shade + drain daily',body:'Never leave it in a hot trunk (can hit 50°C). Keep it shaded and wrapped. Drain meltwater every morning — sitting water spoils food and melts the rest faster.'},
 {tag:'Prep',c:'it-prep',title:'Mason jar eggs',body:'Crack & whisk all eggs at home into a wide-mouth jar or Nalgene. At camp: shake and pour. No shells, no mess, no broken yolks.'},
 {tag:'Prep',c:'it-prep',title:'Pre-marinate in zip-locks',body:'Thursday night, bag the meat with marinade, squeeze out air, lay flat in the cooler. It marinates on the drive and arrives ready to cook.'},
 {tag:'Prep',c:'it-prep',title:'Strip the packaging',body:'Pull everything from cardboard at home, repack in labelled zip-locks. Less trash at camp, more pack space, instructions written right on the bag.'},
 {tag:'Camp',c:'it-food',title:'Two-bin kitchen + snack bin',body:'Bin 1 = cooler (cold), Bin 2 = dry tote (shelf-stable, bungee\'d shut against raccoons). Keep a separate open snack bin so nobody keeps opening the food cooler.'},
 {tag:'Safety',c:'it-safe',title:'Food safety basics',body:'Keep meat/dairy ≤4°C, never out >2 hrs in heat (1 hr if >30°C). Double-bag raw meat at the bottom of the cooler. Sanitize hands before every meal — the #1 way to avoid a group stomach bug.'},
];
const SHOP=[
 {tag:'Phase 1 — Home (DDO)',c:'it-log',title:'Buy before you leave',note:'Maxi or IGA in the West Island. Thu evening or Fri morning.',items:['All meat (marinate overnight)','Eggs (pre-crack into a jar)','Dairy: butter, cheese, sour cream','Dry: pasta, rice, oats, trail mix','Canned: beans, corn, tomatoes','Condiments + cooking oil','S\'mores supplies','Coffee (ground) + filters','Drinks: beer, cider, sparkling water','Snacks: chips, jerky, nuts','Bread / tortillas / pita','Foil, zip-locks, paper towels','Biodegradable dish soap','Garbage + compost bags']},
 {tag:'Phase 2 — Road stop',c:'it-prep',title:'Buy en route',note:'Rivière-Rouge: IGA Saint-Jérôme. Ivy Lea: Foodland Gananoque / Metro Kingston.',items:['Fresh produce (tomatoes, berries, corn)','Ice (top up cooler at a gas station)','Fresh buns for burgers','Any forgotten item','Breakfast sandwiches for the drive','Alcohol top-ups (SAQ / LCBO)']},
 {tag:'Phase 3 — On site',c:'it-food',title:'Buy at the campground',note:'30–50% pricier — local essentials only.',items:['Firewood — always buy local','Fire starters / cubes','Ice (if you run out)','Propane canisters if needed','Forgotten paper plates / cutlery','Roasting sticks if forgotten','Convenience-store snacks']},
];
const TIPS=[
 {i:'🌙',t:'June nights get cold',p:'Even with warm days, temps drop near water. Pack a fleece and a bag rated to at least 10°C (50°F).'},
 {i:'🦟',t:'Bugs peak in June',p:'Mosquitoes & blackflies are worst early June near lakes. DEET, long sleeves for evenings, mesh footprint.'},
 {i:'🔥',t:'Buy firewood local',p:'Never transport firewood across regions — it spreads invasive pests. Buy on-site or in town. ~$10–15/night.'},
 {i:'⏱️',t:'Prep the night before',p:'Pack the car, pre-portion food, pre-mix spices, make marinades. Arriving ready = zero stress on Day 1.'},
 {i:'🗑️',t:'Leave No Trace',p:'Pack out all trash, never leave food out, biodegradable soap 200 ft from water. Leave it better than you found it.'},
 {i:'🌧️',t:'Weather backup plan',p:'A tarp rigged over the kitchen is a game-changer. Pack cards + indoor entertainment for a rain day.'},
];
const MISSING=[
 {tag:'Structure',c:'it-struct',title:'Group chat / comms',body:'Make a group text before the trip. Pin reservation details, arrival time, and the gear list. Kills 50 scattered messages.'},
 {tag:'Logistics',c:'it-log',title:'Convoy protocol',body:'Set a meetup point if cars split. Agree on lead car, gas stop, and a check-in midpoint. Walkie-talkies are underrated.'},
 {tag:'Logistics',c:'it-log',title:'Parking & setup plan',body:'Decide which car holds kitchen gear vs sleeping gear, and where each parks. Smooths the chaotic first 30 minutes.'},
 {tag:'Prep',c:'it-prep',title:'Night-before checklist',body:'Freeze water bottles (free ice + drinking water), confirm reservation, check weather + fire ban, charge everything.'},
 {tag:'Prep',c:'it-prep',title:'Fire ban check',body:'Check the night before. QC: sopfeu.qc.ca. ON: ontario.ca/page/forest-fires. Ban = camp-stove-only backup plan.'},
 {tag:'Food',c:'it-food',title:'Allergies & drinks',body:'Confirm any allergies / dietary needs before finalizing meals. Sort the drinks plan + dedicated drink cooler.'},
];
const ROLES=['Fire master','Meal lead','Gear coordinator','Lead driver','Navigator (car 2)','Quartermaster (snacks/water)'];

/* ---------- render: gear ---------- */
function renderGear(){
  const wrap=document.getElementById('gear-list');wrap.innerHTML='';
  GEAR.forEach(cat=>{
    const g=document.createElement('div');g.className='gear-cat';
    g.innerHTML=`<div class="kicker" style="margin-top:0">◆ ${cat.c}</div>`;
    cat.items.forEach(it=>{
      const claimed=state.gearClaims[it.id];
      const row=document.createElement('div');row.className='gear-item'+(claimed?' claimed':'');
      const tcls=it.t==='shared'?'gt-shared':it.t==='each'?'gt-each':'gt-someone';
      let claimHTML;
      if(claimed){
        claimHTML=`<div class="claimed-by"><span class="avatar" style="width:22px;height:22px;font-size:10px;background:${colorFor(claimed)}">${initials(claimed)}</span>${esc(claimed)}<span class="x" onclick="unclaim('${it.id}')">✕</span></div>`;
      }else{
        const opts=state.crew.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
        claimHTML=`<select onchange="claim('${it.id}',this.value)"><option value="">${state.crew.length?'Claim…':'Add crew first'}</option>${opts}</select>`;
      }
      row.innerHTML=`<div class="gear-info"><div class="gear-name">${it.n} <span class="gtype ${tcls}">${it.t}</span></div><div class="gear-note">${it.note}</div></div><div class="gear-claim">${claimHTML}</div>`;
      g.appendChild(row);
    });
    wrap.appendChild(g);
  });
}
function claim(id,name){if(!name)return;state.gearClaims[id]=name;save();renderGear();}
function unclaim(id){delete state.gearClaims[id];save();renderGear();}

/* ---------- render: food ---------- */
let foodFilter='all';
function renderFood(){
  const tb=document.querySelector('#ftable tbody');tb.innerHTML='';
  FOOD.filter(f=>foodFilter==='all'||f.store===foodFilter||f.cook===foodFilter).forEach(f=>{
    const sl={cooler:'Cooler',dry:'Dry',fire:'Fire',stove:'Stove',none:'No cook'};
    const tr=document.createElement('tr');
    tr.innerHTML=`<td class="fn">${f.n}</td><td><span class="fpill fp-${f.store}">${sl[f.store]}</span></td><td><span class="fpill fp-${f.cook}">${sl[f.cook]}</span></td><td>${f.why}</td>`;
    tb.appendChild(tr);
  });
}
function renderMeals(){
  const w=document.getElementById('meal-grid');w.innerHTML='';
  MEALS.forEach(m=>{const d=document.createElement('div');d.className='meal';
    d.innerHTML=`<div class="mh">${m.h}</div><h4>${m.t}</h4><ul>${m.items.map(i=>`<li>${i}</li>`).join('')}</ul>${m.tip?`<div class="mtip">↳ ${m.tip}</div>`:''}`;w.appendChild(d);});
}
function renderPrep(){
  const w=document.getElementById('prep-grid');w.innerHTML='';
  PREP.forEach(p=>{const d=document.createElement('div');d.className='icard';
    d.innerHTML=`<div class="itag ${p.c}">${p.tag}</div><h4>${p.title}</h4><p>${p.body}</p>`;w.appendChild(d);});
}

/* ---------- render: shopping ---------- */
function renderShop(){
  const w=document.getElementById('shop-grid');w.innerHTML='';
  SHOP.forEach((s,si)=>{
    const card=document.createElement('div');card.className='icard';
    let html=`<div class="itag ${s.c}">${s.tag}</div><h4>${s.title}</h4><div style="margin:10px 0 0">`;
    s.items.forEach((it,ii)=>{const key='shop-'+si+'-'+ii;const done=state.checks[key];
      html+=`<div class="chk ${done?'done':''}" onclick="toggleCheck('${key}')"><div class="box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg></div><div class="ct">${it}</div></div>`;});
    html+=`</div><div class="note" style="margin-top:12px">${s.note}</div>`;
    card.innerHTML=html;w.appendChild(card);
  });
}
function toggleCheck(k){state.checks[k]=!state.checks[k];save();renderShop();}

/* ---------- crew / votes / roles ---------- */
function renderCrew(){
  const bar=document.getElementById('crew-bar');bar.innerHTML='';
  if(!state.crew.length){bar.innerHTML='<span class="empty" style="padding:8px">No crew yet — add names above.</span>';}
  state.crew.forEach(c=>{const chip=document.createElement('div');chip.className='crew-chip';
    chip.innerHTML=`<span class="avatar" style="background:${colorFor(c)}">${initials(c)}</span>${esc(c)}<span class="x" onclick="removeCrew('${esc(c).replace(/&#39;/g,"\\'")}')">✕</span>`;bar.appendChild(chip);});
  refreshCrewSelects();renderGear();renderRoles();renderVotes();renderSettle();
}
function addCrew(){
  const i=document.getElementById('crew-input');const v=i.value.trim();
  if(!v||state.crew.includes(v))return;state.crew.push(v);i.value='';save();renderCrew();
}
function removeCrew(name){
  state.crew=state.crew.filter(c=>c!==name);
  Object.keys(state.gearClaims).forEach(k=>{if(state.gearClaims[k]===name)delete state.gearClaims[k];});
  Object.keys(state.votes).forEach(k=>{if(k===name)delete state.votes[k];});
  Object.keys(state.roles).forEach(k=>{if(state.roles[k]===name)delete state.roles[k];});
  state.expenses=state.expenses.filter(e=>e.who!==name);
  save();renderCrew();renderExpenses();
}
function refreshCrewSelects(){
  const opts=state.crew.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
  ['vote-plage','vote-ivy'].forEach(id=>{const s=document.getElementById(id);s.innerHTML=`<option value="">Vote as…</option>${opts}`;});
  const ew=document.getElementById('exp-who');const cur=ew.value;ew.innerHTML=`<option value="">Who paid?</option>${opts}`;ew.value=cur;
}
function castVote(site,name){if(!name)return;state.votes[name]=site;save();renderVotes();document.getElementById('vote-'+site).value='';}
function renderVotes(){
  let p=0,i=0;Object.values(state.votes).forEach(v=>{if(v==='plage')p++;if(v==='ivy')i++;});
  document.getElementById('tally-plage').textContent=p+(p===1?' vote':' votes');
  document.getElementById('tally-ivy').textContent=i+(i===1?' vote':' votes');
  document.getElementById('site-plage').classList.toggle('win',p>i&&p>0);
  document.getElementById('site-ivy').classList.toggle('win',i>=p&&(i>0||p===0));
}
function renderRoles(){
  const w=document.getElementById('role-grid');w.innerHTML='';
  ROLES.forEach(r=>{const opts=state.crew.map(c=>`<option value="${esc(c)}" ${state.roles[r]===c?'selected':''}>${esc(c)}</option>`).join('');
    const d=document.createElement('div');d.className='role';
    d.innerHTML=`<div class="rn">${r}</div><select onchange="setRole('${r.replace(/'/g,"\\'")}',this.value)"><option value="">${state.crew.length?'Assign…':'Add crew first'}</option>${opts}</select>`;w.appendChild(d);});
}
function setRole(r,n){if(n){state.roles[r]=n;}else{delete state.roles[r];}save();}

/* ---------- expenses ---------- */
function addExpense(){
  const d=document.getElementById('exp-desc'),a=document.getElementById('exp-amt'),w=document.getElementById('exp-who');
  const desc=d.value.trim(),amt=parseFloat(a.value),who=w.value;
  if(!desc||!amt||amt<=0||!who)return;
  state.expenses.push({id:Date.now(),desc,amt:Math.round(amt*100)/100,who});
  d.value='';a.value='';w.value='';save();renderExpenses();
}
function delExpense(id){state.expenses=state.expenses.filter(e=>e.id!==id);save();renderExpenses();}
function renderExpenses(){
  const w=document.getElementById('exp-list');w.innerHTML='';
  if(!state.expenses.length){w.innerHTML='<div class="empty">No expenses logged yet.</div>';}
  state.expenses.forEach(e=>{const r=document.createElement('div');r.className='exp-row';
    r.innerHTML=`<span class="avatar" style="background:${colorFor(e.who)}">${initials(e.who)}</span><div class="ed"><div class="edesc">${esc(e.desc)}</div><div class="emeta">paid by ${esc(e.who)}</div></div><div class="eamt">$${e.amt.toFixed(2)}</div><span class="x" onclick="delExpense(${e.id})">✕</span>`;w.appendChild(r);});
  renderSettle();
}
function renderSettle(){
  const w=document.getElementById('settle-body');
  if(!state.crew.length||!state.expenses.length){w.innerHTML='<div class="empty">Add crew + expenses to see the split.</div>';return;}
  const total=state.expenses.reduce((s,e)=>s+e.amt,0);
  const share=total/state.crew.length;
  const bal={};state.crew.forEach(c=>bal[c]=-share);
  state.expenses.forEach(e=>{if(bal[e.who]!==undefined)bal[e.who]+=e.amt;});
  let html=`<div class="settle-row"><span>Total spent</span><span class="owe">$${total.toFixed(2)}</span></div><div class="settle-row"><span>Per person (${state.crew.length})</span><span class="owe">$${share.toFixed(2)}</span></div><div style="height:8px"></div>`;
  state.crew.forEach(c=>{const b=bal[c];const cls=b>=0?'pos':'neg';const txt=b>=0?`gets back $${b.toFixed(2)}`:`owes $${Math.abs(b).toFixed(2)}`;
    html+=`<div class="settle-row"><span><span class="avatar" style="width:20px;height:20px;font-size:9px;background:${colorFor(c)};display:inline-flex;vertical-align:middle;margin-right:7px">${initials(c)}</span>${esc(c)}</span><span class="owe ${cls}">${txt}</span></div>`;});
  w.innerHTML=html;
}

/* ---------- export / import / reset ---------- */
function exportData(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download='wildweekend-crew-data.json';a.click();URL.revokeObjectURL(url);
}
function importData(input){
  const file=input.files[0];if(!file)return;const r=new FileReader();
  r.onload=()=>{try{const data=JSON.parse(r.result);state=Object.assign({crew:[],gearClaims:{},expenses:[],votes:{},roles:{},checks:{}},data);save();renderAll();alert('Crew data imported.');}catch(e){alert('Could not read that file.');}};
  r.readAsText(file);input.value='';
}
function resetData(){if(confirm('Reset everything? This clears crew, gear, costs, votes, roles & checklists on this device.')){state={crew:[],gearClaims:{},expenses:[],votes:{},roles:{},checks:{}};save();renderAll();}}

/* ---------- tabs / filters / countdown ---------- */
function initTabs(){
  document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');document.getElementById(t.dataset.p).classList.add('active');
    window.scrollTo({top:0,behavior:'smooth'});
  }));
  document.querySelectorAll('.fbtn').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('.fbtn').forEach(x=>x.classList.remove('on'));b.classList.add('on');foodFilter=b.dataset.f;renderFood();
  }));
}
function countdown(){
  const target=new Date('2026-06-19T08:00:00-04:00');const now=new Date();
  const diff=Math.ceil((target-now)/(1000*60*60*24));
  const n=document.getElementById('cd-num'),l=document.getElementById('cd-lbl');
  if(diff>0){n.textContent=diff;l.textContent=diff===1?'day to go':'days to go';}
  else if(diff===0){n.textContent='GO';l.textContent='it\'s today';}
  else{n.textContent='✓';l.textContent='trip done';}
}
function renderTips(){const w=document.getElementById('tips-card');w.innerHTML='';
  TIPS.forEach(t=>{const d=document.createElement('div');d.className='tip';
    d.innerHTML=`<div class="ti">${t.i}</div><div><h4>${t.t}</h4><p>${t.p}</p></div>`;w.appendChild(d);});}
function renderMissing(){const w=document.getElementById('missing-grid');w.innerHTML='';
  MISSING.forEach(m=>{const d=document.createElement('div');d.className='icard';
    d.innerHTML=`<div class="itag ${m.c}">${m.tag}</div><h4>${m.title}</h4><p>${m.body}</p>`;w.appendChild(d);});}

function renderAll(){
  renderFood();renderMeals();renderPrep();renderShop();renderTips();renderMissing();renderCrew();renderExpenses();
}
function boot(){ load(); initTabs(); countdown(); renderAll(); }
boot();
