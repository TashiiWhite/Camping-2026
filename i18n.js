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
    en: { name:'English (CA)',  flag:'🇨🇦', dir:'ltr' },
    fr: { name:'Français (CA)', flag:'🇨🇦', dir:'ltr' }
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
      'hdr.sub':'Fri Jun 19 → Sun Jun 21, 2026 · 4–5 guys · 1–2 cars · car camping',
      'hdr.settingsBtn':'Settings & theme','hdr.helpBtn':'How to use this site','hdr.daysToGo':'days to go',
      'bc.mission':'◆ The mission',
      'bc.missionText':'A three-day, two-night car-camping weekend for the crew — heavy on the campfire, the lake, and the food. One rented car rolling out of DDO, one shared cooler philosophy, zero forgotten tent poles. Everything syncs live across every device.',
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
      'it.t2when':'Fri Jun 19 · 8–9 AM','it.t2title':'Roll out of DDO','it.t2body':'2-car convoy, lead car set. Gas up before the highway. Share the playlist across both cars.',
      'it.t3when':'Fri Jun 19 · ~10 AM','it.t3title':'Road grocery stop','it.t3body':'Last real store: IGA in Saint-Jérôme (Rivière-Rouge run) or Foodland in Gananoque (Ivy Lea run). Ice top-up, fresh produce, buns, breakfast sandwiches.',
      'it.t4when':'Fri Jun 19 · 12–1 PM','it.t4title':'Arrive & set up','it.t4body':'Both cars park. Pitch all tents first. Build the kitchen station. Buy firewood on-site. Light the first fire. Easy foil-packet dinner. Night-one campfire.',
      'it.t5when':'Sat Jun 20 · all day','it.t5title':'The main day','it.t5body':"Slow breakfast & coffee. Lake/river time — swim, canoe, kayak. No-cook lunch. Golden-hour hangs. Grill night. Long fire with games, music & s'mores.",
      'it.t6when':'Sun Jun 21 · AM','it.t6title':'Wind down & pack out','it.t6body':'Leftover brunch. Break down camp systematically across both cars. Leave-no-trace sweep. Check out (11 AM QC / 1 PM Ivy Lea). Hit "Reverse — route home" above for the drive back.',
      'it.addPointLabel':'Add a timeline point (leaders & admin)','it.whenPh':'When (e.g. Sat · 3 PM)','it.titlePh':'Title','it.detailsPh':'Details (optional)','it.addPoint':'Add',
      'it.removePoint':'Remove','it.hidePoint':'Hide','it.needTitle':'Give the point a title','it.pointAdded':'Timeline point added — sorted into place','it.confirmHide':'Hide this default timeline point?','it.restoreHidden':'Restore hidden points','it.restored':'Hidden points restored',
      'lock.page':'Sign in (top right) to view and edit this page.','lock.signInToView':'Sign in to view this page',
      'gear.title':'Gear — claim, pack, archive',
      'gear.desc':'Assign one or more people per item (or <b>All</b> = everyone brings their own). Pick who you are to get your own packing checklist, then tick things off as you pack. Add custom gear for the team below, or personal items to your own list.',
      'gear.myList':'◆ My packing list','gear.teamGear':"◆ Team gear — who's bringing what",
      'gear.newItemPh':'New gear item (e.g. Axe)','gear.notePh':'Note (optional)',
      'gear.someone':'Someone','gear.shared':'Shared','gear.each':'Each','gear.addGear':'Add gear','gear.viewArchive':'🗃 View archive',
      'gear.viewing':'Viewing:','gear.readonly':'read-only','gear.meSuffix':'me','gear.packed':'packed','gear.whoAreYou':'Who are you?',
      'gear.pickNameLong':'Pick your name above to see your personal packing list — everything assigned to you, plus anything marked "All crew", plus your own custom items.',
      'gear.pickName':'Pick your name above to see your personal packing list.',
      'gear.nothingYet':'Nothing on this list yet.','gear.claimBelow':'Claim gear below, or add personal items here.',
      'gear.tagPersonal':'personal','gear.tagAllCrew':'all crew','gear.tagTheirs':'theirs',
      'gear.addPersonalPh':'Add a personal item (e.g. retainer)…','gear.qty':'Qty','gear.optionalQty':'Optional quantity','gear.add':'Add',
      'food.title':'Food — easy to haul, easy to cook, fills you up',
      'food.desc':'Filter the food matrix by how it stores or how it cooks. Below: the 9-meal plan and the expert prep playbook.',
      'food.fAll':'All','food.fCooler':'Cooler','food.fDry':'Dry / no fridge','food.fFire':'Campfire','food.fStove':'Camp stove','food.fNone':'No cook',
      'food.thFood':'Food','food.thStore':'Store','food.thCook':'Cook','food.thWhy':'Why it works + pro tip',
      'food.addItem':'Add a food item','food.namePh':'Food name','food.oCooler':'Cooler','food.oDry':'Dry','food.oFire':'Fire','food.oStove':'Stove','food.oNone':'No cook',
      'food.mealPlan':'◆ The 9-meal plan','food.prepTitle':'◆ Expert prep, packing & storage',
      'meal.editHint':'Tap an item to edit it directly','meal.addItem':'add item','meal.newItem':'New item','meal.updated':'Meal updated',
      'shop.boughtThisTitle':'bought this','shop.youBought':'You marked this bought','shop.markBought':'Mark that you bought this','shop.bought':'✓ bought','shop.iBought':'I bought this',
      'shop.assignBuyers':'Assign buyers (admin)','shop.assign':'assign','shop.assignTitle':'Who bought this?','shop.assignDesc':'Tap everyone who chipped in for this item. Admin-only.','shop.noCrew':'No crew to assign yet.','shop.done':'Done',
      'cost.visitorHidden':'Costs are private to the crew. Link your name to a crew member to see the numbers.',
      'cost.whoPaid':'Who paid?','role.assign':'Assign…','role.addFirst':'Add crew first',
      'act.ourSite':'★ Our site','act.option':'Option',
      'shop.title':'Shopping — food & gear, in 3 phases',
      'shop.desc':'Two categories: <b>Food</b> (groceries — Maxi/IGA at home, road stops en route) and <b>Gear & essentials</b> (with Amazon / Canadian Tire / Decathlon links — the highlighted store is our best-value pick for that item). Checks sync for the whole crew.',
      'shop.everything':'Everything','shop.food':'🍳 Food','shop.gear':'🎒 Gear & essentials',
      'shop.note':'Campground store prices run 30–50% above retail. On-site, only buy what must be local (firewood) or what you genuinely forgot. Store picks are general guidance — flyers change weekly, so a 10-second price check before buying never hurts.',
      'cost.title':'Cost splitter',
      'cost.desc':'Log every shared expense with a category. You get per-person balances, totals by category, and the exact minimal transfers to settle up — synced for everyone.',
      'cost.whatPh':'What was it? (e.g. firewood)','cost.amtPh':'$ amount',
      'cost.catSite':'Site','cost.catFood':'Food','cost.catGas':'Gas','cost.catFirewood':'Firewood','cost.catGear':'Gear','cost.catOther':'Other',
      'cost.edit':'Edit','cost.paidBy':'paid by','cost.noExpenses':'No expenses logged yet.',
      'cost.spendByCat':'Spend by category · total','cost.settleEmpty':'Add crew + expenses to see the split.',
      'cost.totalSpent':'Total spent','cost.perPerson':'Per person','cost.getsBack':'gets back','cost.owes':'owes',
      'cost.whoPays':'Who pays who','cost.transfer':'transfer','cost.transfers':'transfers','cost.pays':'pays',
      'cost.split':'Split','cost.splitAll':'Everyone','cost.splitPayer':'Just payer (personal)','cost.splitCustom':'Choose people…',
      'cost.pickPeople':'Pick who shares this cost','cost.needShare':'Pick at least one person to split with',
      'cost.splitEveryone':'split evenly','cost.personal':'personal','cost.splitAmong':'split among','cost.splitEvenly':'Split evenly',
      'cost.mixedNote':'Some costs are split differently — see each item.','cost.save':'Save','cost.cancel':'Cancel','cost.updated':'Expense updated',
      'act.title':'Activities & entertainment',
      'act.desc':"Three layers of fun: what's around the campsite, what to throw in the car, and what to do at camp when the fire's going.",
      'act.inArea':'◆ In the area — depends on the site','act.toBring':'◆ Fun things to bring','act.games':'◆ Camp zone & tent games',
      'surv.title':'Survival kit — tips, situations, FAQ & roles',
      'surv.desc':'Who does what, the safety basics, what to do when things go sideways, and answers to the questions someone will definitely ask.',
      'surv.roles':'◆ Assign roles','surv.situations':'◆ Situations & fixes — when things go sideways','surv.emergency':'◆ Emergency & key info',
      'surv.safetyTag':'Safety','surv.printTitle':'Print one copy per car','surv.printBody':"Campground phone (Plage 819-275-7757 / Ivy Lea 613-659-3057), nearest hospital & urgent care, and provincial fire/police non-emergency numbers. Don't rely on phones — service is spotty.",
      'surv.waterTag':'Water','surv.waterTitle':'Bring backup water','surv.waterBody':'Both sites have potable tap water, but pack 10–15 L in jugs as backup. Never drink from the river or lake without a filter.',
      'food.added':'added',
      'rep.liveNow':'Live now','rep.analyticsOffline':'analytics table not found — run the v8 analytics SQL',
      'rep.online':'online total','rep.signedOut':'signed-out','rep.visitors':'visitors','rep.campers':'campers','rep.leaders':'leaders','rep.admins':'admins',
      'rep.audience':'Audience','rep.visitsAll':'visits all-time','rep.visitsMonth':'visits this month','rep.uniquePeople':'unique people','rep.emails':'emails','rep.anon':'anon',
      'rep.totalTime':'total time on site','rep.avgTime':'avg per visitor','rep.crewSize':'crew size',
      'rep.visitorLog':'Visitor log','rep.thWho':'Who (email)','rep.thRole':'Role','rep.thVisits':'Visits','rep.thTime':'Time','rep.thLast':'Last seen',
      'rep.anonVisitor':'anonymous visitor','rep.noVisitors':'No visitor analytics yet — this fills in as people open the live site.',
      'rep.trafficPeak':'Peak online per day','rep.noTraffic':'No traffic recorded yet.','rep.visitsPerDay':'Visits per day',
      'rep.tripData':'Trip data','rep.gearClaimed':'Gear claimed','rep.claimed':'Claimed','rep.unclaimed':'Unclaimed',
      'rep.votes':'Campsite votes','rep.shopping':'Shopping done','rep.done':'Done','rep.toBuy':'To buy',
      'rep.packingByCrew':'Packing progress by crew (%)','rep.spendByPerson':'Spend by person ($)','rep.itemsBought':'Items bought by crew','rep.rolesAssigned':'Roles assigned',
      'rep.refreshed':'Refreshed','rep.liveNote':'live counters update automatically',
      'help.title':'Comment utiliser Camping 2026',
      'help.signedOut':"🔒 You're browsing signed out — the trip is read-only and crew pages are locked. <b>Sign in (top right)</b> to add the crew, claim gear, sync live, and unlock every feature.",
      'help.intro':"One shared trip, every device, live. Here's the 60-second version:",
      'help.s1':"<b>Add the crew</b> — Basecamp tab → type each person's name. Names power everything else.",
      'help.s2':'<b>Say who you are</b> — Basecamp tab → pick yourself in the <b>"I\'m:"</b> dropdown. This gives you a personal packing list and your own progress bar.',
      'help.s3':'<b>Pick the campsite</b> — Campsites tab → vote with your name, then hit <b>Choose this site</b>. That switches the quick links, weather & route to that site, and shows its <b>site map</b> (zoom, pan, save).',
      'help.s4':'<b>Claim & pack your gear</b> — Gear tab → assign people per item (or "All"). Your <b>My packing list</b> shows everything you need; tick items off as you pack, and add your own personal items.',
      'help.s5':'<b>Plan the drive</b> — Itinerary tab → add stops, open the route in Google Maps, one tap reverses it for home.',
      'help.s6':'<b>Shop & split costs</b> — Shopping tab for the 3-phase lists with store picks; Costs tab logs expenses and computes who pays who.',
      'help.s7':"<b>Sign in to go live</b> — top right. Signing in syncs the trip with the whole crew in real time and unlocks all themes. Signed out, you're in local (this-device) mode on the Classic theme.",
      'help.s8':'<b>Make it yours</b> — ⚙ Settings → switch themes, and turn on <b>Simplify</b> to hide extra tabs for a cleaner phone view. Add the site to your home screen (Share → Add to Home Screen) for an app icon + offline use.',
      'arch.title':'🗃 Gear archive','arch.desc':'Everything removed from the gear list lands here. Restore anything with one tap.',
      'set.animations':'Animations','set.animationsSub':'Fireflies, ambient scenes & transitions',
      'set.lite':'Lite mode','set.liteSub':'Trims visual effects (glass blur) for smoother performance on older devices',
      'set.compact':'Compact mode','set.compactSub':'Tighter spacing, more on screen',
      'set.simplify':'Simplify','set.simplifySub':'Hide extra tabs & sections (keeps Basecamp, Campsites, Gear, Food, Survival). Great on mobile.',
      'set.help':'Help','set.openGuide':'Open the how-to guide','set.showBanner':'Show the welcome banner again',
      'map.hint':'Pinch or scroll to zoom · drag to pan · double-tap to reset','admin.exitPreview':'Exit preview',
      'link.title':'Who are you on this trip?','link.desc':'Link your sign-in to a crew member so you can edit the trip and track your own packing. Or just browse as a visitor.',
      'link.existing':"I'm an existing crew member",'link.choose':'Choose your name…','link.link':'Link',
      'link.addNew':'Add me as new crew','link.yourNamePh':'Your name','link.add':'Add',
      'link.browsing':'Just browsing (visitor)','link.note':"Visitors can view everything but can't edit. You can link your name later from Basecamp."
    },
    fr: {
      'tab.dash':'Camp de base','tab.sites':'Campings','tab.plan':'Itinéraire','tab.gear':'Équipement',
      'tab.food':'Nourriture','tab.shop':'Achats','tab.money':'Coûts','tab.fun':'Activités','tab.info':'Survie',
      'settings.title':'Réglages','settings.language':'Langue','settings.theme':'Thème',
      'settings.note':'Ces préférences sont enregistrées sur <b>cet appareil seulement</b> — elles ne changent jamais ce que voient tes coéquipiers.',
      'hdr.eyebrow':'◆ Camp de base · le plan de la gang',
      'hdr.sub':'Ven 19 juin → Dim 21 juin 2026 · 4–5 gars · 1–2 autos · camping en auto',
      'hdr.settingsBtn':'Réglages et thème','hdr.helpBtn':'Comment utiliser le site','hdr.daysToGo':'jours avant le départ',
      'bc.mission':'◆ La mission',
      'bc.missionText':'Une fin de semaine de camping de trois jours et deux nuits pour la gang — axée sur le feu de camp, le lac et la bouffe. Une auto louée qui part de DDO, une philosophie de glacière commune, zéro piquet de tente oublié. Tout se synchronise en direct sur tous les appareils.',
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
      'it.t2when':'Ven 19 juin · 8 h–9 h','it.t2title':'Départ de DDO','it.t2body':'Convoi de 2 autos, auto de tête désignée. Faire le plein avant l\'autoroute. Partager la liste de lecture entre les deux autos.',
      'it.t3when':'Ven 19 juin · ~10 h','it.t3title':'Arrêt épicerie en route','it.t3body':'Dernier vrai magasin : IGA à Saint-Jérôme (trajet Rivière-Rouge) ou Foodland à Gananoque (trajet Ivy Lea). Remplir la glace, produits frais, pains, sandwichs déjeuner.',
      'it.t4when':'Ven 19 juin · 12 h–13 h','it.t4title':'Arrivée et installation','it.t4body':'Les deux autos se garent. Monter toutes les tentes d\'abord. Bâtir la station cuisine. Acheter du bois sur place. Allumer le premier feu. Souper papillote facile. Feu de camp première nuit.',
      'it.t5when':'Sam 20 juin · toute la journée','it.t5title':'La grosse journée','it.t5body':'Déjeuner tranquille et café. Temps au lac/rivière — baignade, canot, kayak. Dîner sans cuisson. Détente à l\'heure dorée. Soirée grillades. Long feu avec jeux, musique et guimauves.',
      'it.t6when':'Dim 21 juin · matin','it.t6title':'Ralentir et plier bagage','it.t6body':'Brunch des restes. Démonter le camp méthodiquement entre les deux autos. Tournée « ne rien laisser ». Départ (11 h QC / 13 h Ivy Lea). Clique « Inverser — trajet retour » ci-dessus pour le retour.',
      'it.addPointLabel':'Ajouter un point à la chronologie (chefs et admin)','it.whenPh':'Quand (ex. Sam · 15 h)','it.titlePh':'Titre','it.detailsPh':'Détails (optionnel)','it.addPoint':'Ajouter',
      'it.removePoint':'Retirer','it.hidePoint':'Masquer','it.needTitle':'Donne un titre au point','it.pointAdded':'Point ajouté — trié au bon endroit','it.confirmHide':'Masquer ce point par défaut de la chronologie?','it.restoreHidden':'Restaurer les points masqués','it.restored':'Points masqués restaurés',
      'lock.page':'Connecte-toi (en haut à droite) pour voir et modifier cette page.','lock.signInToView':'Connecte-toi pour voir cette page',
      'gear.title':'Équipement — réclamer, emballer, archiver',
      'gear.desc':"Assigne une ou plusieurs personnes par article (ou <b>Tous</b> = chacun apporte le sien). Choisis qui tu es pour obtenir ta propre liste d'emballage, puis coche les articles à mesure que tu emballes. Ajoute de l'équipement pour la gang ci-dessous, ou des articles personnels à ta liste.",
      'gear.myList':"◆ Ma liste d'emballage",'gear.teamGear':'◆ Équipement de groupe — qui apporte quoi',
      'gear.newItemPh':'Nouvel article (ex. Hache)','gear.notePh':'Note (optionnel)',
      'gear.someone':'Quelqu\'un','gear.shared':'Partagé','gear.each':'Chacun','gear.addGear':'Ajouter','gear.viewArchive':'🗃 Voir les archives',
      'gear.viewing':'Voir :','gear.readonly':'lecture seule','gear.meSuffix':'moi','gear.packed':'emballé','gear.whoAreYou':'Qui es-tu?',
      'gear.pickNameLong':'Choisis ton nom ci-dessus pour voir ta liste d\'emballage personnelle — tout ce qui t\'est assigné, plus tout ce qui est marqué « Tous », plus tes articles personnels.',
      'gear.pickName':'Choisis ton nom ci-dessus pour voir ta liste d\'emballage personnelle.',
      'gear.nothingYet':'Rien sur cette liste pour l\'instant.','gear.claimBelow':'Réclame de l\'équipement ci-dessous, ou ajoute des articles personnels ici.',
      'gear.tagPersonal':'personnel','gear.tagAllCrew':'toute la gang','gear.tagTheirs':'à eux',
      'gear.addPersonalPh':'Ajouter un article personnel (ex. broche)…','gear.qty':'Qté','gear.optionalQty':'Quantité optionnelle','gear.add':'Ajouter',
      'food.title':'Nourriture — facile à transporter, facile à cuisiner, rassasiante',
      'food.desc':'Filtre la matrice de nourriture selon le mode de conservation ou de cuisson. Ci-dessous : le plan de 9 repas et le guide expert de préparation.',
      'food.fAll':'Tout','food.fCooler':'Glacière','food.fDry':'Sec / sans frigo','food.fFire':'Feu de camp','food.fStove':'Réchaud','food.fNone':'Sans cuisson',
      'food.thFood':'Aliment','food.thStore':'Conserv.','food.thCook':'Cuisson','food.thWhy':'Pourquoi ça marche + truc de pro',
      'food.addItem':'Ajouter un aliment','food.namePh':'Nom de l\'aliment','food.oCooler':'Glacière','food.oDry':'Sec','food.oFire':'Feu','food.oStove':'Réchaud','food.oNone':'Sans cuisson',
      'food.mealPlan':'◆ Le plan de 9 repas','food.prepTitle':'◆ Préparation, emballage et conservation experts',
      'meal.editHint':'Tape un item pour le modifier directement','meal.addItem':'ajouter un item','meal.newItem':'Nouvel item','meal.updated':'Repas mis à jour',
      'shop.boughtThisTitle':'a acheté ça','shop.youBought':'Tu as marqué ceci comme acheté','shop.markBought':'Marque que tu as acheté ça','shop.bought':'✓ acheté','shop.iBought':'J\'ai acheté ça',
      'shop.assignBuyers':'Assigner des acheteurs (admin)','shop.assign':'assigner','shop.assignTitle':'Qui a acheté ça?','shop.assignDesc':'Tape tous ceux qui ont contribué pour cet article. Admin seulement.','shop.noCrew':'Personne à assigner encore.','shop.done':'Terminé',
      'cost.visitorHidden':'Les coûts sont privés à la gang. Lie ton nom à un membre pour voir les chiffres.',
      'cost.whoPaid':'Qui a payé?','role.assign':'Assigner…','role.addFirst':'Ajoute la gang d\'abord',
      'act.ourSite':'★ Notre site','act.option':'Option',
      'shop.title':'Achats — nourriture et équipement, en 3 phases',
      'shop.desc':'Deux catégories : <b>Nourriture</b> (épicerie — Maxi/IGA à la maison, arrêts en route) et <b>Équipement et essentiels</b> (avec liens Amazon / Canadian Tire / Decathlon — le magasin surligné est notre meilleur choix qualité-prix pour cet article). Les coches se synchronisent pour toute la gang.',
      'shop.everything':'Tout','shop.food':'🍳 Nourriture','shop.gear':'🎒 Équipement et essentiels',
      'shop.note':'Les prix au magasin du camping sont 30–50 % plus élevés qu\'en magasin. Sur place, achète seulement ce qui doit être local (bois) ou ce que tu as vraiment oublié. Les suggestions de magasin sont indicatives — les circulaires changent chaque semaine, alors une vérification de 10 secondes ne nuit jamais.',
      'cost.title':'Partage des coûts',
      'cost.desc':'Note chaque dépense partagée avec une catégorie. Tu obtiens les soldes par personne, les totaux par catégorie, et les transferts minimaux exacts pour régler — synchronisé pour tout le monde.',
      'cost.whatPh':'C\'était quoi? (ex. bois)','cost.amtPh':'Montant $',
      'cost.catSite':'Camping','cost.catFood':'Nourriture','cost.catGas':'Essence','cost.catFirewood':'Bois','cost.catGear':'Équipement','cost.catOther':'Autre',
      'cost.edit':'Modifier','cost.paidBy':'payé par','cost.noExpenses':'Aucune dépense enregistrée.',
      'cost.spendByCat':'Dépenses par catégorie · total','cost.settleEmpty':'Ajoute la gang + des dépenses pour voir le partage.',
      'cost.totalSpent':'Total dépensé','cost.perPerson':'Par personne','cost.getsBack':'récupère','cost.owes':'doit',
      'cost.whoPays':'Qui paie qui','cost.transfer':'transfert','cost.transfers':'transferts','cost.pays':'paie',
      'cost.split':'Partage','cost.splitAll':'Tout le monde','cost.splitPayer':'Payeur seul (perso)','cost.splitCustom':'Choisir…',
      'cost.pickPeople':'Choisis qui partage ce coût','cost.needShare':'Choisis au moins une personne',
      'cost.splitEveryone':'partagé également','cost.personal':'perso','cost.splitAmong':'partagé entre','cost.splitEvenly':'Partagé également',
      'cost.mixedNote':'Certains coûts sont partagés différemment — voir chaque item.','cost.save':'Enregistrer','cost.cancel':'Annuler','cost.updated':'Dépense mise à jour',
      'act.title':'Activités et divertissement',
      'act.desc':'Trois niveaux de plaisir : ce qu\'il y a autour du camping, ce qu\'on lance dans l\'auto, et quoi faire au camp quand le feu brûle.',
      'act.inArea':'◆ Dans le coin — dépend du site','act.toBring':'◆ Trucs le fun à apporter','act.games':'◆ Jeux de zone de camp et de tente',
      'surv.title':'Trousse de survie — trucs, situations, FAQ et rôles',
      'surv.desc':'Qui fait quoi, les bases de sécurité, quoi faire quand ça tourne mal, et les réponses aux questions que quelqu\'un va assurément poser.',
      'surv.roles':'◆ Assigner les rôles','surv.situations':'◆ Situations et solutions — quand ça tourne mal','surv.emergency':'◆ Urgence et infos clés',
      'surv.safetyTag':'Sécurité','surv.printTitle':'Imprime une copie par auto','surv.printBody':'Téléphone du camping (Plage 819-275-7757 / Ivy Lea 613-659-3057), hôpital et clinique d\'urgence les plus proches, et numéros non urgents des pompiers/police provinciaux. Ne te fie pas aux téléphones — le service est faible.',
      'surv.waterTag':'Eau','surv.waterTitle':'Apporte de l\'eau de secours','surv.waterBody':'Les deux sites ont de l\'eau du robinet potable, mais apporte 10–15 L en bidons en secours. Ne bois jamais de la rivière ou du lac sans filtre.',
      'food.added':'ajouté',
      'rep.liveNow':'En direct','rep.analyticsOffline':'table analytique introuvable — exécute le SQL analytique v8',
      'rep.online':'en ligne total','rep.signedOut':'déconnectés','rep.visitors':'visiteurs','rep.campers':'campeurs','rep.leaders':'chefs','rep.admins':'admins',
      'rep.audience':'Audience','rep.visitsAll':'visites totales','rep.visitsMonth':'visites ce mois','rep.uniquePeople':'personnes uniques','rep.emails':'courriels','rep.anon':'anon',
      'rep.totalTime':'temps total sur le site','rep.avgTime':'moy. par visiteur','rep.crewSize':'taille de la gang',
      'rep.visitorLog':'Journal des visiteurs','rep.thWho':'Qui (courriel)','rep.thRole':'Rôle','rep.thVisits':'Visites','rep.thTime':'Temps','rep.thLast':'Vu',
      'rep.anonVisitor':'visiteur anonyme','rep.noVisitors':'Aucune donnée analytique encore — ça se remplit quand les gens ouvrent le site en direct.',
      'rep.trafficPeak':'Pic en ligne par jour','rep.noTraffic':'Aucun trafic enregistré encore.','rep.visitsPerDay':'Visites par jour',
      'rep.tripData':'Données du voyage','rep.gearClaimed':'Équipement réclamé','rep.claimed':'Réclamé','rep.unclaimed':'Non réclamé',
      'rep.votes':'Votes camping','rep.shopping':'Achats faits','rep.done':'Fait','rep.toBuy':'À acheter',
      'rep.packingByCrew':'Progression d\'emballage par membre (%)','rep.spendByPerson':'Dépenses par personne ($)','rep.itemsBought':'Articles achetés par la gang','rep.rolesAssigned':'Rôles assignés',
      'rep.refreshed':'Actualisé','rep.liveNote':'les compteurs en direct se mettent à jour automatiquement',
      'help.title':'Comment utiliser Camping 2026',
      'help.signedOut':'🔒 Tu navigues sans être connecté — le voyage est en lecture seule et les pages de la gang sont verrouillées. <b>Connecte-toi (en haut à droite)</b> pour ajouter la gang, réclamer de l\'équipement, synchroniser en direct et débloquer toutes les fonctions.',
      'help.intro':'Un voyage partagé, sur tous les appareils, en direct. Voici la version 60 secondes :',
      'help.s1':'<b>Ajoute la gang</b> — onglet Camp de base → tape le nom de chaque personne. Les noms activent tout le reste.',
      'help.s2':'<b>Dis qui tu es</b> — onglet Camp de base → choisis-toi dans le menu <b>« Je suis : »</b>. Ça te donne une liste d\'emballage personnelle et ta propre barre de progression.',
      'help.s3':'<b>Choisis le camping</b> — onglet Campings → vote avec ton nom, puis clique <b>Choisir ce camping</b>. Ça change les liens rapides, la météo et le trajet vers ce site, et affiche sa <b>carte</b> (zoom, déplacement, sauvegarde).',
      'help.s4':'<b>Réclame et emballe ton équipement</b> — onglet Équipement → assigne des gens par article (ou « Tous »). Ta <b>liste d\'emballage</b> montre tout ce qu\'il te faut; coche à mesure que tu emballes, et ajoute tes articles personnels.',
      'help.s5':'<b>Planifie la route</b> — onglet Itinéraire → ajoute des arrêts, ouvre le trajet dans Google Maps, un clic l\'inverse pour le retour.',
      'help.s6':'<b>Achète et partage les coûts</b> — onglet Achats pour les listes en 3 phases avec suggestions de magasin; l\'onglet Coûts note les dépenses et calcule qui paie qui.',
      'help.s7':'<b>Connecte-toi pour passer en direct</b> — en haut à droite. La connexion synchronise le voyage avec toute la gang en temps réel et débloque tous les thèmes. Déconnecté, tu es en mode local (cet appareil) avec le thème Classic.',
      'help.s8':'<b>Personnalise-le</b> — ⚙ Réglages → change de thème, et active <b>Simplifier</b> pour cacher les onglets supplémentaires sur téléphone. Ajoute le site à ton écran d\'accueil (Partager → Ajouter à l\'écran d\'accueil) pour une icône d\'app + usage hors ligne.',
      'arch.title':'🗃 Archives d\'équipement','arch.desc':'Tout ce qui est retiré de la liste d\'équipement atterrit ici. Restaure n\'importe quoi d\'un seul clic.',
      'set.animations':'Animations','set.animationsSub':'Lucioles, scènes d\'ambiance et transitions',
      'set.lite':'Mode léger','set.liteSub':'Réduit les effets visuels (flou de verre) pour de meilleures performances sur les vieux appareils',
      'set.compact':'Mode compact','set.compactSub':'Espacement plus serré, plus de contenu à l\'écran',
      'set.simplify':'Simplifier','set.simplifySub':'Cache les onglets et sections supplémentaires (garde Camp de base, Campings, Équipement, Nourriture, Survie). Idéal sur mobile.',
      'set.help':'Aide','set.openGuide':'Ouvrir le guide','set.showBanner':'Réafficher la bannière de bienvenue',
      'map.hint':'Pince ou défile pour zoomer · glisse pour déplacer · double-tape pour réinitialiser','admin.exitPreview':'Quitter l\'aperçu',
      'link.title':'Qui es-tu pour ce voyage?','link.desc':'Lie ta connexion à un membre de la gang pour pouvoir modifier le voyage et suivre ton propre emballage. Ou navigue simplement comme visiteur.',
      'link.existing':'Je suis un membre existant','link.choose':'Choisis ton nom…','link.link':'Lier',
      'link.addNew':'Ajoute-moi comme nouveau membre','link.yourNamePh':'Ton nom','link.add':'Ajouter',
      'link.browsing':'Juste en visite (visiteur)','link.note':'Les visiteurs voient tout mais ne peuvent pas modifier. Tu peux lier ton nom plus tard depuis le Camp de base.'
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
