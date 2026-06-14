/* ============================================================
   i18n — per-user language. English + French (Canada).
   Adding a language later = add one entry to DICT with its keys.
   Usage:
     t('key')                  -> translated string (falls back to EN, then key)
     applyI18n()               -> translate every [data-i18n] / [data-i18n-ph] node
     setLang('fr'); getLang()  -> per-device language (localStorage 'ww_lang')
   ============================================================ */
(function(){
  'use strict';

  const LANGS = {
    en: { name:'English',  flag:'🇬🇧', dir:'ltr' },
    fr: { name:'Français', flag:'🇨🇦', dir:'ltr' }
    // future: ar:{name:'العربية',flag:'🇸🇦',dir:'rtl'}, es, it, ja, pt ...
  };

  // ---- Dictionaries. Keys are stable IDs; values are the display text. ----
  const DICT = {
    en: {
      'tab.dash':'Basecamp','tab.sites':'Campsites','tab.plan':'Itinerary','tab.gear':'Gear',
      'tab.food':'Food','tab.shop':'Shopping','tab.money':'Costs','tab.fun':'Activities','tab.info':'Survival',
      'settings.title':'Settings','settings.language':'Language','settings.theme':'Theme',
      'settings.note':'These preferences are saved on <b>this device only</b> — they never change what your crewmates see.',
      'hdr.eyebrow':"◆ Basecamp · the crew's field plan",
      'hdr.sub':'Fri Jun 19 → Sun Jun 21, 2026 · 4–5 guys · 2 cars · car camping',
      'hdr.settingsBtn':'Settings & theme','hdr.helpBtn':'How to use this site','hdr.daysToGo':'days to go',
      'bc.mission':'◆ The mission',
      'bc.missionText':'A three-day, two-night car-camping weekend for the crew — heavy on the campfire, the lake, and the food. Two cars rolling out of DDO, one shared cooler philosophy, zero forgotten tent poles. Everything syncs live across every device.',
      'bc.days':' days','bc.crewMembers':'crew members','bc.cars':'cars · convoy','bc.perPerson':'est. / person',
      'bc.readiness':'◆ Trip readiness','bc.im':"I'm:",'bc.showsProgress':'→ shows your packing progress',
      'bc.theCrew':'◆ The crew','bc.addEveryone':'Add everyone first — names power gear claims, cost splits, votes & roles.',
      'bc.addNamePh':'Add a name…','bc.add':'Add','bc.quickLinks':'◆ Quick links','bc.dataSync':'◆ Data, sync & export',
      'bc.exportJson':'⬇ Export crew data (.json)','bc.importData':'⬆ Import crew data','bc.resetAll':'↺ Reset all',
      'bc.linkCta':'👋 This is me — link my name to the crew',
      'cd.dayToGo':'day to go','cd.daysToGo':'days to go','cd.today':"it's today",'cd.done':'trip done',
      'sites.title':'Two campsites on the table',
      'sites.desc':'Vote with your name — then lock the winner with <b>Choose this site</b>. The chosen site powers the route planner in the Itinerary tab and the weather/maps links below.',
      'sites.cancellation':"Ivy Lea cancellations: free changes 8+ days before arrival; within 7 days you forfeit one night's fee plus an $11.25 fee. Camping de la Plage: call 819-275-7757 for June 2026 rates.",
      'it.title':'The weekend, hour by hour','it.desc':'Times assume a Rivière-Rouge run; add an hour of drive time for Ivy Lea.',
      'it.routePlanner':'Route planner — drive there & back',
      'it.routeDesc':'Add optional stops (gas, grocery, coffee) — everyone sees the same list. Then generate the full route in Google Maps with every stop included, or flip it for the drive home.',
      'it.stopNamePh':'Stop name (e.g. IGA Saint-Jérôme)','it.stopAddrPh':'Address or place (e.g. 900 Boul. Grignon, Saint-Jérôme)',
      'it.addStop':'Add stop','it.reverse':'↩ Reverse — route home','it.timeline':'◆ Timeline',
      'it.t1when':'Thu Jun 18 · night before','it.t1title':'Pack & prep','it.t1body':'Car-pack both vehicles. Pre-make marinades & foil packets. Pre-crack eggs into a jar. Freeze water bottles (free ice + drinking water). Confirm reservation, check weather & fire ban. Charge every power bank.',
      'it.t2when':'Fri Jun 19 · 8–9 AM','it.t2title':'Roll out of DDO',
      'it.t3when':'Fri Jun 19 · ~10 AM','it.t3title':'Road grocery stop','it.t3body':'Last real store: IGA in Saint-Jérôme (Rivière-Rouge run) or Foodland in Gananoque (Ivy Lea run). Ice top-up, fresh produce, buns, breakfast sandwiches.',
      'it.t4when':'Fri Jun 19 · 12–1 PM','it.t4title':'Arrive & set up','it.t4body':'Both cars park. Pitch all tents first. Build the kitchen station. Buy firewood on-site. Light the first fire. Easy foil-packet dinner. Night-one campfire.',
      'it.t5when':'Sat Jun 20 · all day','it.t5title':'The main day','it.t5body':"Slow breakfast & coffee. Lake/river time — swim, canoe, kayak. No-cook lunch. Golden-hour hangs. Grill night. Long fire with games, music & s'mores.",
      'it.t6when':'Sun Jun 21 · AM','it.t6title':'Wind down & pack out','it.t6body':'Leftover brunch. Break down camp systematically across both cars. Leave-no-trace sweep. Check out (11 AM QC / 1 PM Ivy Lea). Hit "Reverse — route home" above for the drive back.',
      'it.addPointLabel':'Add a timeline point (leaders & admin)','it.whenPh':'When (e.g. Sat · 3 PM)','it.titlePh':'Title','it.detailsPh':'Details (optional)','it.addPoint':'Add'
    },
    fr: {
      'tab.dash':'Camp de base','tab.sites':'Campings','tab.plan':'Itinéraire','tab.gear':'Équipement',
      'tab.food':'Nourriture','tab.shop':'Achats','tab.money':'Coûts','tab.fun':'Activités','tab.info':'Survie',
      'settings.title':'Réglages','settings.language':'Langue','settings.theme':'Thème',
      'settings.note':'Ces préférences sont enregistrées sur <b>cet appareil seulement</b> — elles ne changent jamais ce que voient tes coéquipiers.',
      'hdr.eyebrow':'◆ Camp de base · le plan de la gang',
      'hdr.sub':'Ven 19 juin → Dim 21 juin 2026 · 4–5 gars · 2 autos · camping en auto',
      'hdr.settingsBtn':'Réglages et thème','hdr.helpBtn':'Comment utiliser le site','hdr.daysToGo':'jours avant le départ',
      'bc.mission':'◆ La mission',
      'bc.missionText':'Une fin de semaine de camping de trois jours et deux nuits pour la gang — axée sur le feu de camp, le lac et la bouffe. Deux autos qui partent de DDO, une philosophie de glacière commune, zéro piquet de tente oublié. Tout se synchronise en direct sur tous les appareils.',
      'bc.days':' jours','bc.crewMembers':'membres','bc.cars':'autos · convoi','bc.perPerson':'est. / personne',
      'bc.readiness':'◆ Préparatifs','bc.im':'Je suis :','bc.showsProgress':'→ affiche ta progression',
      'bc.theCrew':'◆ La gang','bc.addEveryone':"Ajoute tout le monde d'abord — les noms activent les réservations d'équipement, le partage des coûts, les votes et les rôles.",
      'bc.addNamePh':'Ajouter un nom…','bc.add':'Ajouter','bc.quickLinks':'◆ Liens rapides','bc.dataSync':'◆ Données, sync et export',
      'bc.exportJson':'⬇ Exporter les données (.json)','bc.importData':'⬆ Importer les données','bc.resetAll':'↺ Tout réinitialiser',
      'bc.linkCta':"👋 C'est moi — lier mon nom à la gang",
      'cd.dayToGo':'jour avant le départ','cd.daysToGo':'jours avant le départ','cd.today':"c'est aujourd'hui",'cd.done':'voyage terminé',
      'sites.title':'Deux campings au choix',
      'sites.desc':'Vote avec ton nom — puis verrouille le gagnant avec <b>Choisir ce camping</b>. Le camping choisi alimente le planificateur de trajet dans l\'onglet Itinéraire ainsi que les liens météo/cartes ci-dessous.',
      'sites.cancellation':"Annulations Ivy Lea : modifications gratuites 8 jours et plus avant l'arrivée; dans les 7 jours, tu perds une nuitée plus des frais de 11,25 $. Camping de la Plage : appelle au 819-275-7757 pour les tarifs de juin 2026.",
      'it.title':'La fin de semaine, heure par heure','it.desc':'Les heures supposent un trajet vers Rivière-Rouge; ajoute une heure de route pour Ivy Lea.',
      'it.routePlanner':'Planificateur — aller et retour',
      'it.routeDesc':'Ajoute des arrêts optionnels (essence, épicerie, café) — tout le monde voit la même liste. Génère ensuite le trajet complet dans Google Maps avec tous les arrêts, ou inverse-le pour le retour.',
      'it.stopNamePh':'Nom de l\'arrêt (ex. IGA Saint-Jérôme)','it.stopAddrPh':'Adresse ou lieu (ex. 900 boul. Grignon, Saint-Jérôme)',
      'it.addStop':'Ajouter un arrêt','it.reverse':'↩ Inverser — trajet retour','it.timeline':'◆ Chronologie',
      'it.t1when':'Jeu 18 juin · la veille','it.t1title':'Préparer et empaqueter','it.t1body':'Charger les deux autos. Préparer les marinades et les papillotes. Casser les œufs dans un pot. Congeler des bouteilles d\'eau (glace gratuite + eau potable). Confirmer la réservation, vérifier la météo et l\'interdiction de feu. Charger toutes les batteries.',
      'it.t2when':'Ven 19 juin · 8 h–9 h','it.t2title':'Départ de DDO',
      'it.t3when':'Ven 19 juin · ~10 h','it.t3title':'Arrêt épicerie en route','it.t3body':'Dernier vrai magasin : IGA à Saint-Jérôme (trajet Rivière-Rouge) ou Foodland à Gananoque (trajet Ivy Lea). Remplir la glace, produits frais, pains, sandwichs déjeuner.',
      'it.t4when':'Ven 19 juin · 12 h–13 h','it.t4title':'Arrivée et installation','it.t4body':'Les deux autos se garent. Monter toutes les tentes d\'abord. Bâtir la station cuisine. Acheter du bois sur place. Allumer le premier feu. Souper papillote facile. Feu de camp première nuit.',
      'it.t5when':'Sam 20 juin · toute la journée','it.t5title':'La grosse journée','it.t5body':'Déjeuner tranquille et café. Temps au lac/rivière — baignade, canot, kayak. Dîner sans cuisson. Détente à l\'heure dorée. Soirée grillades. Long feu avec jeux, musique et guimauves.',
      'it.t6when':'Dim 21 juin · matin','it.t6title':'Ralentir et plier bagage','it.t6body':'Brunch des restes. Démonter le camp méthodiquement entre les deux autos. Tournée « ne rien laisser ». Départ (11 h QC / 13 h Ivy Lea). Clique « Inverser — trajet retour » ci-dessus pour le retour.',
      'it.addPointLabel':'Ajouter un point à la chronologie (chefs et admin)','it.whenPh':'Quand (ex. Sam · 15 h)','it.titlePh':'Titre','it.detailsPh':'Détails (optionnel)','it.addPoint':'Ajouter'
    }
  };

  function getLang(){
    try{ const l=localStorage.getItem('ww_lang'); if(l && LANGS[l]) return l; }catch(e){}
    return 'en';
  }
  function setLang(l){
    if(!LANGS[l]) l='en';
    try{ localStorage.setItem('ww_lang', l); }catch(e){}
    document.documentElement.lang = l;
    document.documentElement.dir = LANGS[l].dir;
    applyI18n();
    // let the app re-render dynamic content in the new language
    try{ if(typeof window.onLangChange==='function') window.onLangChange(l); }catch(e){}
  }
  function t(key, fallback){
    const l=getLang();
    if(DICT[l] && DICT[l][key]!=null) return DICT[l][key];
    if(DICT.en && DICT.en[key]!=null) return DICT.en[key];
    return (fallback!=null)?fallback:key;
  }
  // translate the static DOM: elements carrying data-i18n (textContent) or data-i18n-ph (placeholder)
  function applyI18n(root){
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(el=>{
      const key=el.getAttribute('data-i18n');
      const v=t(key, el.getAttribute('data-i18n-default'));
      if(v!=null) el.textContent=v;
    });
    root.querySelectorAll('[data-i18n-html]').forEach(el=>{
      const key=el.getAttribute('data-i18n-html');
      const v=t(key);
      if(v!=null && v!==key) el.innerHTML=v;
    });
    root.querySelectorAll('[data-i18n-ph]').forEach(el=>{
      const key=el.getAttribute('data-i18n-ph');
      const v=t(key);
      if(v!=null && v!==key) el.setAttribute('placeholder',v);
    });
    root.querySelectorAll('[data-i18n-title]').forEach(el=>{
      const key=el.getAttribute('data-i18n-title');
      const v=t(key);
      if(v!=null && v!==key) el.setAttribute('title',v);
    });
  }

  // expose
  window.i18n = { LANGS, DICT, t, getLang, setLang, applyI18n };
  window.t = t; // convenience
})();
