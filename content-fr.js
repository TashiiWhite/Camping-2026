/* ============================================================
   French (Canada) translations of the trip CONTENT data.
   Parallel to the EN arrays in app.js. Render functions pick
   the right set via contentArr(name). Index-aligned with EN.
   ============================================================ */
window.CONTENT_FR = {
  FOOD: [
    {n:'Steaks / burgers marinés',why:'Mariner à la maison dans des sacs scellés, déposer à plat dans la glacière. Zéro préparation au camp — juste griller. Le repas le plus rassasiant du voyage.'},
    {n:'Saucisses / hot-dogs',why:'La protéine la plus facile, pas besoin de couteau. Repas d\'installation parfait pour le jour 1. Les saucisses précuites sont les plus sûres.'},
    {n:'Repas en papillote',why:'Préassembler à la maison : légumes + protéine + beurre + assaisonnement. 15–20 min sur les braises. Aucune vaisselle.'},
    {n:'Bacon + œufs brouillés',why:'Casser les œufs d\'avance dans un pot Mason. La fonte est parfaite. Le déjeuner le plus rassasiant.'},
    {n:'Patates au feu de camp',why:'Emballer dans du papier alu avec beurre et ail, enfouir dans les braises 45–60 min. Incroyablement rassasiant, va avec tout.'},
    {n:'Blé d\'Inde',why:'Garder les feuilles, tremper 30 min, griller 15 min. Sucré, fumé, aucune préparation.'},
    {n:'Pâtes + sauce en pot',why:'Une seule ébullition. Ajouter du thon ou du salami pour la protéine. Le meilleur plan B les jours de pluie si le gril flanche.'},
    {n:'Salade de pâtes / grains préparée',why:'Préparer à la maison; se conserve 48 h scellée dans la glacière. Accompagnement parfait pour le soir de l\'arrivée.'},
    {n:'Wraps de charcuterie',why:'Tortillas + charcuterie + fromage. Dîner rapide et rassasiant, zéro cuisson. Les tortillas survivent mieux que le pain dans une glacière.'},
    {n:'Gruau instantané',why:'Juste ajouter de l\'eau bouillante. Mélanger du beurre d\'arachide + miel pour de vraies calories. Bon déjeuner de secours.'},
    {n:'Fèves / chili en conserve',why:'Ouvrir, réchauffer, rouler dans une tortilla avec du fromage. Pas cher, rassasiant, aucun espace de glacière. Le meilleur repas d\'urgence.'},
    {n:'Mélange du randonneur + barres granola',why:'Riche en calories, à l\'épreuve du transport, sans frigo. Un sac par personne dans le sac de jour.'},
    {n:'Fromage + craquelins + salami',why:'Les fromages fermes survivent 2–4 h hors de la glacière. Excellente planche de charcuterie au coin du feu.'},
    {n:'S\'mores',why:'Utiliser des barres de chocolat (pas des pépites), de grosses guimauves, des biscuits Graham à la cannelle. Garder au sec dans un sac scellé.'},
    {n:'Crêpes au feu de camp',why:'Pré-mélanger les ingrédients secs à la maison dans un sac; ajouter eau + œuf au camp. Faire une grosse fournée.'}
  ],
  MEALS: [
    {h:'Jour 1 · Souper',t:'Arrivée facile',items:['Légumes + saucisse en papillote','Salade de pâtes préparée','Pain à l\'ail sur le feu','Bières / boissons'],tip:'Papillotes préparées à la maison → directement sur le gril'},
    {h:'Jour 2 · Déjeuner',t:'Matinée tranquille',items:['Bacon + œufs brouillés (fonte)','Rôties sur la grille','Fruits frais + jus d\'orange','Café filtre / piston'],tip:'Œufs cassés d\'avance dans un pot Mason'},
    {h:'Jour 2 · Dîner',t:'Sans cuisson, relax',items:['Wraps de charcuterie + chips','Fromage, craquelins, trempettes','Cornichons, olives, grignotines','Eau pétillante / limonade'],tip:''},
    {h:'Jour 2 · Souper ★',t:'Soirée grillades — l\'événement',items:['Steaks ou burgers marinés','Blé d\'Inde (dans le feu)','Patates au feu de camp','Salade de chou maison'],tip:'Mariner la viande à la maison, à plat dans des sacs scellés'},
    {h:'Jour 3 · Brunch',t:'Finir les restes',items:['Crêpes / pain doré au feu','Restes de saucisse + œufs','Fruits + grignotines restants','Le reste du café'],tip:''},
    {h:'Toujours sous la main',t:'Accessible tout le voyage',items:['Mélange du randonneur, barres, jerky','Chips, bretzels, popcorn','S\'mores : chocolat, Graham, guimauves','Eau + électrolytes'],tip:'Garder un bac de grignotines hors de la glacière'}
  ],
  PREP: [
    {tag:'Glacière',title:'Bloc de glace, pas en cubes',body:'Un bloc de glace dure 2–3× plus longtemps. Achète un bloc de 5–10 lb avant de partir; ajoute des cubes autour. Pré-refroidis la glacière vide la veille avec un sac de glace sacrifié.'},
    {tag:'Glacière',title:'Empile à l\'envers des repas',body:'Fond : glace → Jour 3 → Jour 2 → Jour 1 sur le dessus. Les boissons vont dans une glacière séparée — ce couvercle s\'ouvre 20× plus que celui de la nourriture.'},
    {tag:'Glacière',title:'Ombre + vidange quotidienne',body:'Ne jamais la laisser dans un coffre chaud (peut atteindre 50 °C). Garde-la à l\'ombre et emballée. Vide l\'eau de fonte chaque matin.'},
    {tag:'Prépa',title:'Œufs en pot Mason',body:'Casse et fouette tous les œufs à la maison dans un pot à large ouverture ou une Nalgene. Au camp : brasse et verse. Pas de coquilles, pas de dégât.'},
    {tag:'Prépa',title:'Mariner d\'avance en sacs',body:'Le jeudi soir, mets la viande en sac avec la marinade, chasse l\'air, dépose à plat dans la glacière. Elle marine pendant la route.'},
    {tag:'Prépa',title:'Enlève les emballages',body:'Sors tout du carton à la maison, remballe dans des sacs étiquetés. Moins de déchets au camp, plus d\'espace.'},
    {tag:'Camp',title:'Cuisine à deux bacs + bac à grignotines',body:'Bac 1 = glacière (froid), Bac 2 = caisse sèche (attachée contre les ratons). Garde un bac à grignotines ouvert pour que personne n\'ouvre sans cesse la glacière.'},
    {tag:'Sécurité',title:'Bases de salubrité alimentaire',body:'Garde viande/produits laitiers ≤4 °C, jamais sortis >2 h à la chaleur (1 h si >30 °C). Double-emballe la viande crue au fond de la glacière. Désinfecte tes mains avant chaque repas.'}
  ],
  SHOP: [
    {tag:'Phase 1 — Maison (DDO)',title:'🍳 Nourriture — acheter avant de partir',note:'Maxi ou IGA dans l\'Ouest-de-l\'Île. Jeudi soir ou vendredi matin. L\'épicerie est la moins chère ici.',
     items:[{n:'Toute la viande (mariner la veille)'},{n:'Œufs (casser d\'avance dans un pot)'},{n:'Produits laitiers : beurre, fromage, crème sure'},{n:'Sec : pâtes, riz, gruau, mélange du randonneur'},{n:'Conserves : fèves, maïs, tomates'},{n:'Condiments + huile de cuisson'},{n:'Provisions à s\'mores'},{n:'Café (moulu) + filtres'},{n:'Boissons : bière, cidre, eau pétillante'},{n:'Grignotines : chips, jerky, noix'},{n:'Pain / tortillas / pita'},{n:'Papier alu, sacs zip, essuie-tout'},{n:'Savon à vaisselle biodégradable'},{n:'Sacs à ordures + compost'}]},
    {tag:'Phase 2 — Arrêt en route',title:'🍳 Nourriture — acheter en chemin',note:'Rivière-Rouge : IGA Saint-Jérôme. Ivy Lea : Foodland Gananoque / Metro Kingston.',
     items:[{n:'Produits frais (tomates, petits fruits, maïs)'},{n:'Glace (remplir la glacière à une station-service)'},{n:'Pains frais pour les burgers'},{n:'Tout article oublié'},{n:'Sandwichs déjeuner pour la route'},{n:'Réappro d\'alcool (SAQ / LCBO)'}]},
    {tag:'Phase 3 — Sur place',title:'🍳 Nourriture — au camping',note:'30–50 % plus cher — essentiels locaux seulement.',
     items:[{n:'Bois de chauffage — toujours acheter local'},{n:'Glace (si tu en manques)'},{n:'Grignotines du dépanneur'}]},
    {tag:'Phase 1 — Maison · commander tôt',title:'🎒 Équipement — kit de base (commander cette semaine)',note:'Meilleur magasin surligné par article. Amazon = livraison rapide; Canadian Tire = bases de camping et soldes; Decathlon = meilleur rapport qualité-prix en plein air.',
     items:[{n:'Sac de couchage (coté 10 °C)'},{n:'Matelas de sol / matelas gonflable'},{n:'Lampe frontale'},{n:'Chaise de camp'},{n:'Glacière (grande, rigide)'},{n:'Réchaud + propane'},{n:'Bâche + corde/paracorde'},{n:'Lanterne DEL'},{n:'Hamac'}]},
    {tag:'Phase 1 — Maison · préventif',title:'🛡 Préventif et sécurité (à ne pas sauter)',note:'Le petit stock pas glamour qui sauve la fin de semaine. Petit, pas cher, essentiel.',
     items:[{n:'Chasse-moustiques — DEET 25–30 % ou picaridine'},{n:'Après-piqûre + antihistaminiques'},{n:'Trousse de premiers soins (complète)'},{n:'Crème solaire FPS 50'},{n:'Serpentins anti-moustiques / Thermacell'},{n:'Ruban gris + attaches'},{n:'Allumettes imperméables / allume-feu'},{n:'Poncho de pluie compact (secours)'},{n:'Bidons d\'eau / 10 L réutilisable'}]},
    {tag:'Phase 2 — Arrêt en route',title:'🎒 Équipement — à prendre en route si oublié',note:'Il y a des Canadian Tire à Saint-Jérôme ET à Kingston — filet de sécurité parfait à mi-chemin pour tout oubli.',
     items:[{n:'Cartouches de propane'},{n:'Piles (AA/AAA)'},{n:'Matelas mousse pas cher (si quelqu\'un a oublié le sien)'},{n:'Tendeurs élastiques'},{n:'Liquide à briquet / allume-feu'}]}
  ],
  AREA: {
    plage:{title:'Autour de Rivière-Rouge (QC)',items:['Canot ou kayak sur la rivière Rouge — location sur place','Baignade à la plage de la rivière, directement au camp','Excursions de rafting en eau vive (pourvoyeurs de la Rouge)','Village de Mont-Tremblant — 25 min au nord : remontées, luge, terrasses','Randonnée dans les Laurentides (sentiers du parc régional)','Soirées de musique en direct au camping (fins de semaine)']},
    ivy:{title:'Autour d\'Ivy Lea / Mille-Îles (ON)',items:['Croisière dans les Mille-Îles depuis Gananoque ou Rockport','Visite du château Boldt (apporte ton passeport — c\'est côté É.-U.)','Tour des Mille-Îles — plateforme d\'observation au-dessus du fleuve','Marche sur le pont suspendu Skydeck','Plongée sous-marine — célèbres épaves d\'eau douce','Pêche du quai ou de la rampe de mise à l\'eau','Vie nocturne de Kingston — 30 min à l\'ouest pour une grosse soirée']}
  },
  BRING: [
    {t:'Spikeball / volleyball',p:'Le meilleur jeu de camping pour 4–5 personnes. Léger, compact.'},
    {t:'Frisbee / ballon de football',p:'Aucune installation, des heures de plaisir. Flotte s\'il tombe à l\'eau.'},
    {t:'Cannes à pêche + agrès de base',p:'Les deux sites sont sur des eaux poissonneuses. Vérifie les règles de permis (QC/ON).'},
    {t:'Flotteurs / matelas gonflable',p:'Pour flâner sur la rivière. Pas cher chez Canadian Tire en juin.'},
    {t:'Jumelles',p:'Observation des bateaux aux Mille-Îles ou des oiseaux des Laurentides. Sous-estimé.'},
    {t:'Appareil photo instantané / jetable',p:'De meilleures photos que les téléphones — et personne ne scrolle.'},
    {t:'Slackline',p:'Deux arbres + 15 minutes = des heures de plaisir pour la gang.'},
    {t:'Bâtons lumineux',p:'Jeux de nuit, marquer les haubans de tente pour que personne ne s\'enfarge.'}
  ],
  GAMES: [
    {t:'Cartes : Président / Poker',p:'Apporte des jetons ou joue pour les corvées de camp. Format classique au coin du feu.'},
    {t:'Loup-garou / Mafia',p:'Parfait pour exactement 4–5 personnes autour d\'un feu la nuit.'},
    {t:'Quiz au coin du feu',p:'Une personne prépare 20 questions sur la gang — chaos garanti.'},
    {t:'Histoire un mot chacun',p:'Bâtir une histoire un mot par personne. Ça devient niaiseux vite. C\'est le but.'},
    {t:'Cache-cache à la lampe de poche',p:'Ça a l\'air enfantin. C\'est incroyable. Fixe les limites avant la noirceur.'},
    {t:'Cinéma sous la tente',p:'Télécharge un film d\'avance, cale un téléphone/tablette, plan B les soirs de pluie.'},
    {t:'Dés poker / Yahtzee',p:'Un gobelet + cinq dés = tout un après-midi pluvieux réglé.'},
    {t:'Concours de sculpture sur bois',p:'Chacun sculpte une cuillère ou un piquet. Juge au dernier feu.'}
  ],
  SITUATIONS: [
    {tag:'Pluie',title:'Il se met à pleuvoir fort',body:'Installe la bâche au-dessus de la cuisine EN PREMIER (ligne de crête entre les arbres, angle prononcé pour que l\'eau s\'écoule). Vérification : ne creuse jamais, mais assure-toi que la tente n\'est pas dans un creux. Garde l\'équipement loin des parois de la tente — toucher le double-toit fait passer l\'eau. Les vêtements mouillés vont dans un sac à ordures, pas dans la tente.'},
    {tag:'Pluie',title:'Prévenir une tente mouillée avant que ça arrive',body:'Toile de sol SOUS la tente, légèrement plus petite que le plancher (trop grande, elle ramasse l\'eau). Double-toit tendu et piqueté, portes fermées, évents ouverts pour éliminer la condensation. Monte sur un terrain élevé. Scelle les coutures des vieilles tentes à la maison la semaine d\'avant.'},
    {tag:'Insectes',title:'Des moustiques dans la tente la nuit',body:'Règle 1 : lumières ÉTEINTES avant d\'ouvrir la fermeture — la lumière les attire. Ouvre le minimum, entre vite. Tue ceux à l\'intérieur avec un balayage de lampe frontale avant de dormir. Ne vaporise jamais de DEET dans la tente (ça abîme les enduits); un Thermacell à la porte 15 min avant le coucher dégage la zone.'},
    {tag:'Insectes',title:'Réduire les piqûres au camp, surtout au crépuscule',body:'Le crépuscule = pic d\'attaque. Manches longues + pantalon dès 19 h, DEET/picaridine sur la peau exposée, le côté fumée du feu est le côté sans bibittes. Évite déodorant/savon parfumé. Traite les piqûres avec de l\'après-piqûre ou un antihistaminique — ne gratte pas, gratter = risque d\'infection en camping.'},
    {tag:'Feu',title:'Le feu ne part pas / le bois est humide',body:'Fends les bûches humides — l\'intérieur est sec. Fais des bâtons d\'allumage du cœur sec au couteau. Bâtis une vraie échelle : allume-feu → brindilles fines comme un crayon → grosses comme un pouce → comme un poignet. Ne l\'étouffe pas avec de grosses bûches trop tôt. Carton + huile de cuisson est la triche d\'urgence.'},
    {tag:'Chaud/Froid',title:'Nuit froide, quelqu\'un gèle',body:'Habille-le AVANT que les frissons commencent. Une tuque pour dormir vaut plus qu\'une couverture de plus. De l\'eau chaude dans une Nalgene au pied du sac de couchage = radiateur de camp. Être isolé du sol compte plus que par-dessus — double les matelas.'},
    {tag:'Faune',title:'Des ratons ont pillé le camp',body:'Ils ont eu de la nourriture parce qu\'elle traînait — règle la cause. Tout ce qui est comestible va dans l\'auto ou une glacière verrouillée la nuit, y compris le dentifrice et les déchets. Ne les nourris jamais et ne leur laisse pas de vaisselle sale. Ils se souviennent des sites payants.'},
    {tag:'Blessure',title:'Coupures, brûlures et entorses',body:'Brûlures : eau froide 10 min et plus, jamais de glace, jamais de beurre. Coupures : pression, nettoyer, fermer, panser — et garder au sec (difficile en camping; refaire le pansement chaque jour). Entorses : repos + élévation + compression, pas de « ça va passer ». Tout ce qui est profond, béant ou qui ne cesse de saigner = direction l\'urgence. Sache où elle est AVANT le voyage.'}
  ],
  FAQ: [
    {q:'Comment faire un feu de camp qui prend vraiment?',a:'Trois grosseurs de combustible, par étapes : amadou (cube allume-feu, écorce de bouleau, mousse de sécheuse), petit bois (crayon → pouce), puis bûches (poignet et plus). Bâtis un tipi ou une cabane autour de l\'amadou, allume du côté au vent, et n\'ajoute pas de grosses bûches avant que le petit bois rugisse. La plupart des feux ratés meurent parce qu\'on saute de l\'amadou aux bûches.'},
    {q:'Combien de bois de chauffage nous faut-il?',a:'Pour deux longues soirées de feu, prévois 2–3 fagots par nuit pour un feu de groupe (donc 5–6 au total). Achète-le au camping ou en ville — transporter du bois entre régions est interdit car ça propage des ravageurs envahissants.'},
    {q:'Et s\'il y a une interdiction de feu cette fin de semaine?',a:'Vérifie sopfeu.qc.ca (QC) ou ontario.ca/page/forest-fires (ON) la veille. Une interdiction signifie généralement pas de feu ouvert, mais les appareils au propane restent permis — donc le réchaud gère la cuisson, et tu pivotes les soirées vers lanterne + jeux. Apporte le réchaud peu importe.'},
    {q:'Quel sac de couchage me faut-il en juin?',a:'Les nuits près de l\'eau dans les Laurentides ou sur le Saint-Laurent peuvent descendre à 8–12 °C même après une journée à 25 °C. Un sac coté 10 °C ou moins est le choix sûr, plus une polaire et une tuque en secours.'},
    {q:'Ai-je vraiment besoin d\'un matelas de sol?',a:'Oui — et pas surtout pour le confort. Le sol te pompe la chaleur toute la nuit; un matelas est d\'abord de l\'isolation, du rembourrage ensuite. Un matelas gonflable sans isolation peut dormir plus froid qu\'un matelas mousse.'},
    {q:'Comment garder la nourriture froide 3 jours?',a:'Bloc de glace (dure 2–3× plus que des cubes), une glacière pré-refroidie, emballer dans l\'ordre inverse des repas, une glacière à boissons séparée, l\'ombre, et vider l\'eau de fonte chaque jour. Bien fait, une bonne glacière rigide tient des températures sûres toute la fin de semaine.'},
    {q:'L\'eau au camping est-elle potable?',a:'Camping de la Plage et Ivy Lea ont tous deux de l\'eau du robinet potable. Apporte quand même 10–15 L en bidons en secours, et ne bois jamais directement de la rivière ou du lac sans filtre.'},
    {q:'C\'est quoi l\'affaire avec les ratons et la nourriture?',a:'Les deux parcs ont des ratons (et des écureuils) effrontés. Tout ce qui a une odeur — nourriture, déchets, dentifrice — va dans une auto ou une glacière verrouillée la nuit. Un tendeur sur le couvercle de la glacière est le minimum.'},
    {q:'Peut-on se baigner aux deux sites?',a:'Oui. Camping de la Plage a une plage sur la rivière Rouge. Ivy Lea est sur le Saint-Laurent avec accès au quai et à la rive — l\'eau est plus froide et les courants sont réels, alors baigne-toi près du bord et jamais seul après avoir bu.'},
    {q:'Faut-il un permis de pêche?',a:'Oui, dans les deux provinces. Le Québec et l\'Ontario exigent chacun leur propre permis (journalier ou annuel), achetable en ligne en quelques minutes. Ne le saute pas — les amendes sont salées.'},
    {q:'Signal cellulaire aux campings?',a:'Faible à correct aux deux — utilisable en zones dégagées, faible sous le couvert d\'arbres. C\'est exactement pourquoi ce site fonctionne hors ligne et pourquoi une carte d\'urgence imprimée par auto compte.'},
    {q:'Heures d\'arrivée / de départ?',a:'Camping de la Plage : couvre-feu 23 h, départ 11 h. Ivy Lea : départ 13 h, arrivée généralement en début-milieu d\'après-midi. Arriver avant l\'heure d\'arrivée est habituellement correct — tu peux te garer et aller à la plage.'}
  ],
  TIPS: [
    {i:'🌙',t:'Les nuits de juin sont froides',p:'Même avec des journées chaudes, ça baisse près de l\'eau. Apporte une polaire et un sac coté au moins 10 °C.'},
    {i:'🦟',t:'Les bibittes culminent en juin',p:'Moustiques et mouches noires pires début juin près des lacs. DEET, manches longues le soir, toile moustiquaire.'},
    {i:'🔥',t:'Achète le bois local',p:'Ne transporte jamais de bois entre régions — ça propage des ravageurs envahissants. Achète sur place ou en ville. ~10–15 $/nuit.'},
    {i:'⏱️',t:'Prépare la veille',p:'Charge l\'auto, portionne la nourriture, pré-mélange les épices, fais les marinades. Arriver prêt = zéro stress le jour 1.'},
    {i:'🗑️',t:'Ne laisse aucune trace',p:'Rapporte tous les déchets, ne laisse jamais de nourriture dehors, savon biodégradable à 60 m de l\'eau. Laisse mieux que tu as trouvé.'},
    {i:'🌧️',t:'Plan B météo',p:'Une bâche au-dessus de la cuisine change tout. Apporte des cartes + du divertissement intérieur pour un jour de pluie.'}
  ],
  ROLES: ['Maître du feu','Responsable des repas','Coordonnateur d\'équipement','Conducteur principal','Navigateur (auto 2)','Intendant (collations/eau)']
};

