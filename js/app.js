/* =====================================================================
   ITALINGO — application (socle, étape 1)
   Navigation : 5 onglets (Accueil · Parcours · Exercices · Moi · Conversation),
   sous-écrans empilés avec flèche de retour, ouverture, onboarding.
   Le contenu pédagogique (leçons jouables, révision…) arrive aux étapes 2 et 3 :
   ici chaque écran a sa structure définitive et son état vide « habité ».
   ===================================================================== */
(function () {
  'use strict';
  const A = window.ITALINGO_ASSETS;
  const VERSION_APP = '0.2.1 · socle + jardin';
  let PROG = null;            // programme.json (niveaux + chapitres)
  let etat = Store.charger();

  /* ------------------------------------------------------------------ */
  /* petites fonctions de construction du DOM                           */
  /* ------------------------------------------------------------------ */
  function h(tag, attrs, ...enfants) {
    const el = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of enfants.flat(Infinity)) {
      if (c === null || c === undefined || c === false) continue;
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }
  const deco = (nom, style) => h('img', { class: 'deco', src: `assets/decors/${nom}.svg`, alt: '', style, draggable: 'false' });
  const POSES = { face: '01-face', 'trois-quarts': '02-trois-quarts', profil: '03-profil', dos: '04-dos', joie: '05-joie', saut: '06-saut', coucou: '07-coucou', dodo: '08-dodo', 'pattes-jointes': '09-pattes-jointes', rire: '10-rire', surprise: '11-surprise', triste: '12-triste', question: '13-question', boudeur: '14-boudeur' };
  const lapin = (pose, style) => h('img', { class: 'lapin', src: `assets/lapin/${POSES[pose] || POSES.face}.svg`, alt: 'Coni', style, draggable: 'false' });
  const avatar = (pose, taille) => h('div', { class: 'avatar', style: taille ? `width:${taille}px;height:${taille}px` : '' }, lapin(pose));
  const ico = (d, cls) => h('span', { class: cls || 'icnb', html: `<svg viewBox="0 0 24 24">${d}</svg>` });
  const SVG = {
    back: '<path d="M15 5l-7 7 7 7"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>', play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z"/>',
    sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a8 8 0 0 1 0 11"/>', mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>',
    down: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 19h16"/>', up: '<path d="M12 21V9"/><path d="M7 14l5-5 5 5"/><path d="M4 4h16"/>', flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    check: '<path d="M5 12l5 5L20 7"/>', text: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h10"/>', scene: '<path d="M4 19V8l8-4 8 4v11"/><path d="M9 19v-6h6v6"/>', pen: '<path d="M4 20h4l10-10-4-4L4 16z"/><path d="M13 7l4 4"/>',
    x: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>', chev: '<path d="M9 6l6 6-6 6"/>', key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9"/><path d="M16 5l3 3"/>', bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 21a2 2 0 0 0 4 0"/>'
  };
  const $ = s => document.querySelector(s);
  const app = $('#app');

  /* ------------------------------------------------------------------ */
  /* dates et salutations                                               */
  /* ------------------------------------------------------------------ */
  function dateIT(d) {
    d = d || new Date();
    const s = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function dateFR(d) {
    d = d || new Date();
    const s = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function salut() {
    const hr = new Date().getHours();
    return hr < 12 ? 'Buongiorno' : hr < 18 ? 'Buon pomeriggio' : 'Buonasera';
  }
  const prenom = () => (etat.profil.prenom || '').trim();
  const nomOu = (alt) => prenom() || alt || '';

  /* ------------------------------------------------------------------ */
  /* toasts et feuilles                                                 */
  /* ------------------------------------------------------------------ */
  function toast(msg, ok) {
    const box = $('#toasts');
    const t = h('div', { class: 'toast' + (ok ? ' ok' : ''), html: msg });
    box.append(t);
    setTimeout(() => { t.classList.add('leaving'); setTimeout(() => t.remove(), 320); }, 3200);
  }
  function feuille(contenu, opts) {
    opts = opts || {};
    const sh = h('div', { class: 'sheet' + (opts.center ? ' center' : '') }, h('div', { class: 'grab' }), contenu);
    const ov = h('div', { class: 'overlay' }, sh);
    ov.addEventListener('click', e => { if (e.target === ov) fermer(); });
    function fermer() { ov.classList.add('out'); setTimeout(() => ov.remove(), 260); }
    sh.fermer = fermer;
    app.append(ov);
    return fermer;
  }
  function confirmer(titre, texte, action, opts) {
    opts = opts || {};
    let fermer;
    fermer = feuille([
      h('h3', null, titre),
      h('p', { class: 'muted', style: 'margin:0 0 16px;font-size:14px;line-height:1.5' }, texte),
      h('button', { class: 'btn' + (opts.danger ? ' rust' : ''), onclick: () => { fermer(); action(); } }, opts.ok || 'Oui'),
      h('button', { class: 'btn ghost', onclick: () => fermer() }, opts.non || 'Annuler')
    ]);
  }

  /* ------------------------------------------------------------------ */
  /* rig de Coni (visage animé, charte)                                 */
  /* ------------------------------------------------------------------ */
  let rigN = 0;
  function rig(opts) {
    opts = opts || {};
    rigN++;
    let s = A.rig.replace(/id="(c[LR]\d+)"/g, 'id="$1_' + rigN + '"').replace(/url\(#(c[LR]\d+)\)/g, 'url(#$1_' + rigN + ')');
    const holder = h('div', { class: 'rig-holder', style: opts.style || '', html: s });
    const svg = holder.querySelector('svg');
    (opts.mods || 'live').split(' ').forEach(c => c && svg.classList.add(c));
    const x = opts.expr || 'neutre';
    svg.querySelectorAll('.expr').forEach(e => e.classList.toggle('on', e.dataset.x === x));
    if (opts.hop) setTimeout(() => { svg.classList.add('hop'); setTimeout(() => svg.classList.remove('hop'), 700); }, opts.hop);
    if (opts.vie) {
      const tick = () => {
        if (!holder.isConnected) return;
        const r = Math.random();
        const twitch = side => { const e = svg.querySelector(side === 'L' ? '[data-p=earL]' : '[data-p=earR]'); if (!e) return; e.classList.remove('twitch'); void e.offsetWidth; e.classList.add('twitch'); setTimeout(() => e.classList.remove('twitch'), 750); };
        const look = k => { svg.classList.remove('lookL', 'lookR', 'lookUp'); if (k) svg.classList.add(k); };
        const setX = k => svg.querySelectorAll('.expr').forEach(e => e.classList.toggle('on', e.dataset.x === k));
        if (r < .3) twitch(Math.random() < .5 ? 'L' : 'R');
        else if (r < .6) { look(Math.random() < .5 ? 'lookL' : 'lookR'); setTimeout(() => look(''), 1200 + Math.random() * 800); }
        else if (r < .8) { setX('clin'); setTimeout(() => setX(x), 260); }
        else { look('lookUp'); setTimeout(() => look(''), 1100); }
        setTimeout(tick, 2600 + Math.random() * 2400);
      };
      setTimeout(tick, 1500);
    }
    return holder;
  }

  /* ------------------------------------------------------------------ */
  /* anneau d'objectif                                                  */
  /* ------------------------------------------------------------------ */
  function anneau(val, max, libelle, taille) {
    taille = taille || 112;
    const L = 2 * Math.PI * 60;
    const v = Math.min(1, max ? val / max : 0);
    const el = h('div', { class: 'ring', style: `width:${taille}px;height:${taille}px`, html:
      `<svg viewBox="0 0 132 132"><circle cx="66" cy="66" r="60" stroke="#fff" stroke-width="7" fill="none"/><circle class="c2" cx="66" cy="66" r="60" stroke="#55211E" stroke-width="7" fill="none" stroke-linecap="round" style="stroke-dasharray:${L};stroke-dashoffset:${L}"/></svg>` });
    el.append(h('div', { class: 'num' }, h('div', null, h('b', null, String(val), h('small', null, `/${max}`)), h('span', null, libelle))));
    requestAnimationFrame(() => { const c = el.querySelector('.c2'); c.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.22,.8,.3,1) .3s'; c.style.strokeDashoffset = L * (1 - v); });
    return el;
  }

  /* ------------------------------------------------------------------ */
  /* programme : accès                                                  */
  /* ------------------------------------------------------------------ */
  const chapitre = n => PROG.chapitres.find(c => c.n === n);
  const niveauDe = n => PROG.niveaux.find(l => n >= l.from && n <= l.to);
  const cleLecon = (c, l) => `${c}-${l}`;
  function etatLecon(c, l) { return etat.progression.lecons[cleLecon(c, l)] || { etat: 'a-venir' }; }
  function chapitreEnCours() {
    for (const c of PROG.chapitres) { const p = etat.progression.chapitres[c.n]; if (!p || !p.termine) return c; }
    return PROG.chapitres[PROG.chapitres.length - 1];
  }
  const chapitreOuvert = c => c.n <= chapitreEnCours().n;
  function leconsTerminees(c) { return c.lecons.filter(l => l.type !== 'Bilan' && etatLecon(c.n, l.n).etat === 'terminee').length; }
  const FAMILLES = { Vocabulaire: '', Grammaire: 'b', Conjugaison: 'c', Dialogue: '', Expression: 'b', Prononciation: 'c', Bilan: '' };
  function pousse(c, l) {
    const e = etatLecon(c.n, l.n).etat, fam = FAMILLES[l.type] || '';
    const stade = e === 'terminee' ? 'plante3' : e === 'en-cours' ? 'germe' : 'graine';
    return stade + (stade === 'graine' ? { '': '', b: '2', c: '3' }[fam] : fam);
  }
  const titreBilan = l => l.type === 'Bilan' ? 'Bilan du chapitre' : l.titre;

  /* ------------------------------------------------------------------ */
  /* navigation                                                         */
  /* ------------------------------------------------------------------ */
  const ONGLETS = [
    { id: 'accueil', nom: 'Accueil', icon: 'home' }, { id: 'parcours', nom: 'Parcours', icon: 'trail' },
    { id: 'exercices', nom: 'Exercices', icon: 'exo' }, { id: 'moi', nom: 'Moi', icon: 'me' }, { id: 'conversation', nom: 'Conversation', icon: 'chat' }
  ];
  let ongletCourant = 'accueil';
  const pile = [];           // sous-écrans ouverts
  const memoParcours = { segment: 'sentier' };

  function barre() {
    const nav = h('nav', { class: 'nav', id: 'nav' });
    for (const o of ONGLETS) {
      nav.append(h('button', { class: o.id === ongletCourant ? 'on' : '', dataset: { tab: o.id }, onclick: () => allerOnglet(o.id), html: A.icons[o.icon] + `<span>${o.nom}</span>` }));
    }
    return nav;
  }
  function majBarre() {
    document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === ongletCourant));
    $('#nav').classList.toggle('hidden', pile.length > 0);
  }
  function allerOnglet(id) {
    while (pile.length) fermerSous(true);
    if (id === ongletCourant && $('#tab-' + id)) { const sc = $('#tab-' + id + ' .scroll'); if (sc) sc.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (id !== ongletCourant) memoParcours.segment = 'sentier';
    ongletCourant = id;
    rendreOnglet();
  }
  function rendreOnglet() {
    document.querySelectorAll('.screen.tab').forEach(s => s.remove());
    const ecran = ECRANS[ongletCourant]();
    ecran.id = 'tab-' + ongletCourant;
    ecran.classList.add('screen', 'tab', 'enter');
    app.insertBefore(ecran, $('#nav'));
    majBarre();
  }
  function ouvrirSous(construire) {
    const ecran = construire();
    ecran.classList.add('screen', 'sub');
    ecran.style.zIndex = 20 + pile.length;
    pile.push(ecran);
    app.insertBefore(ecran, $('#toasts'));
    majBarre();
    history.pushState({ sous: pile.length }, '');
    return ecran;
  }
  function fermerSous(immediat) {
    const e = pile.pop(); if (!e) return;
    if (immediat) e.remove(); else { e.classList.add('out'); setTimeout(() => e.remove(), 300); }
    majBarre();
  }
  window.addEventListener('popstate', () => { if (pile.length) fermerSous(); });

  function scroll(...enfants) { return h('div', { class: 'scroll' }, ...enfants); }
  function topbar(titre, opts) {
    opts = opts || {};
    return h('div', { class: 'topbar' },
      h('button', { class: 'icnb bare', 'aria-label': 'Retour', onclick: () => history.back(), html: `<svg viewBox="0 0 24 24">${SVG.back}</svg>` }),
      titre ? h('span', { class: 'tag' }, titre) : null,
      h('span', { class: 'spacer' }),
      opts.droite || null);
  }
  function entete(sur, titreHTML, opts) {
    opts = opts || {};
    return h('div', { class: 'hd' + (opts.center ? ' center' : ''), style: opts.style || '' }, sur ? h('div', { class: 'date' }, sur) : null, h('div', { class: 'greet' + (opts.sm ? ' sm' : ''), html: titreHTML }));
  }
  function vide(pose, titre, texte, sansLapin) {
    return h('div', { class: 'empty' }, sansLapin ? null : lapin(pose), h('b', null, titre), h('p', null, texte));
  }

  /* ------------------------------------------------------------------ */
  /* ACCUEIL                                                            */
  /* ------------------------------------------------------------------ */
  function ecranAccueil() {
    const st = Store.stats();
    const j = Store.jour();
    const obj = etat.profil.objectif;
    const atteint = j.minutes >= obj;
    const ch = chapitreEnCours();
    const suivantes = ch.lecons.filter(l => l.type !== 'Bilan' && etatLecon(ch.n, l.n).etat !== 'terminee').slice(0, 3);
    const enCours = ch.lecons.find(l => etatLecon(ch.n, l.n).etat === 'en-cours');
    const s = etat.profil.prenom ? `${salut()}, <em>${escape(prenom())}</em>.` : `${salut()}.`;

    const s0 = st.serie === 0;
    const sc = scroll(
      entete(dateIT(), s),
      h('div', { class: 'arch', style: 'margin-top:30px' }, deco('arche-hero'), anneau(Math.floor(j.minutes), obj, atteint ? 'fatto !' : 'minutes')),
      h('div', { class: 'arch-cta' }, h('button', { class: 'btn' + (atteint ? ' soft' : ''), style: atteint ? 'box-shadow:none' : '', onclick: () => enCours ? feuilleLecon(ch, enCours) : (st.faites ? allerOnglet('parcours') : feuilleLecon(ch, ch.lecons[0])) },
        atteint ? 'Encore un peu ?' : enCours ? 'Continuer la leçon' : 'Commencer')),
      h('div', { class: 'serie' }, lapin(atteint ? 'dodo' : s0 ? 'face' : 'joie', atteint ? 'width:66px' : ''),
        h('div', null, h('b', null, String(st.serie)), h('span', null, s0 ? 'jour d’affilée · ta série démarre aujourd’hui' : `jours d’affilée · ${st.jokers} joker${st.jokers > 1 ? 's' : ''}`))),
      h('div', { class: 'sect' }, h('span', { class: 't' }, 'Aujourd’hui')),
      st.dus > 0
        ? h('div', { class: 'card peach', style: 'margin-bottom:10px' }, h('div', { class: 'row' }, h('div', { class: 'txt' }, h('b', null, `${st.dus} éléments à réviser`), h('span', null, 'environ ' + Math.ceil(st.dus / 3) + ' min')), h('button', { class: 'btn sm', onclick: () => allerOnglet('exercices') }, 'Réviser')))
        : h('div', { class: 'card', style: 'margin-bottom:10px' }, h('div', { class: 'row' }, h('div', { class: 'txt' }, h('b', null, 'Rien à réviser pour l’instant'), h('span', null, 'Les mots appris reviendront ici le lendemain de chaque leçon.')))),
      h('div', { class: 'sect' }, h('span', { class: 't' }, `Chapitre ${ch.n}`), h('button', { class: 'more', onclick: () => allerOnglet('parcours') }, 'Voir tout le parcours ›')),
      h('div', { class: 'card white', style: 'padding:6px 16px' },
        h('div', { class: 'row', style: 'padding:8px 0 4px' }, h('div', { class: 'txt' }, h('b', { style: 'font-family:var(--fh);font-weight:400;font-size:20px' }, ch.it), h('span', null, `${ch.fr} · `, h('i', { class: 'hl' }, `${leconsTerminees(ch)} / ${ch.lecons.length - 1}`)))),
        h('div', { class: 'nodes compact' }, suivantes.map(l => noeud(ch, l, true))))
    );
    if (window.__installPrompt && !etat.meta.installIgnore) sc.append(banniereInstall());
    return h('div', null, sc);
  }
  function banniereInstall() {
    const b = h('div', { class: 'install' }, avatar('coucou', 40), h('div', { class: 'txt' }, h('b', null, 'Installer Italingo'), 'Ajoute l’app à ton écran d’accueil pour l’ouvrir en plein écran, même hors ligne.'),
      h('button', { class: 'btn sm', onclick: async () => { const p = window.__installPrompt; if (!p) return; p.prompt(); const r = await p.userChoice; if (r.outcome === 'accepted') { window.__installPrompt = null; b.remove(); toast('Italingo est sur ton écran d’accueil.', true); } } }, 'Installer'),
      h('button', { class: 'icnb bare', 'aria-label': 'Plus tard', onclick: () => { Store.modifier(e => e.meta.installIgnore = true); b.remove(); }, html: `<svg viewBox="0 0 24 24">${SVG.x}</svg>` }));
    return b;
  }

  /* ------------------------------------------------------------------ */
  /* PARCOURS : Sentier · Fiches · À retenir                            */
  /* ------------------------------------------------------------------ */
  function ecranParcours() {
    const corps = h('div', { style: 'display:contents' });
    const seg = h('div', { class: 'seg', style: 'margin-top:14px' });
    const segments = [['sentier', 'Sentier'], ['fiches', 'Fiches'], ['retenir', 'À retenir']];
    const rendre = () => {
      seg.innerHTML = '';
      segments.forEach(([id, nom]) => seg.append(h('button', { class: memoParcours.segment === id ? 'on' : '', onclick: () => { memoParcours.segment = id; rendre(); } }, nom)));
      corps.innerHTML = '';
      corps.append(memoParcours.segment === 'sentier' ? sentier() : memoParcours.segment === 'fiches' ? fiches() : carnet());
      if (memoParcours.segment === 'sentier' && chapitreEnCours().n > 1) requestAnimationFrame(() => { const c = corps.querySelector('.chapter.cur'); if (c) c.scrollIntoView({ block: 'start' }); });
    };
    rendre();
    const sc = scroll(
      h('div', { class: 'bg', style: 'right:-16px;top:-10px;width:82px;transform:scaleX(-1)' }, deco('p13')),
      entete('Niveau A1 · débutante', 'Ton <em>parcours</em>.'),
      seg, corps);
    return h('div', null, sc);
  }

  function noeud(ch, l, compact) {
    const e = etatLecon(ch.n, l.n).etat;
    const ouvert = chapitreOuvert(ch);
    const bilan = l.type === 'Bilan';
    const bilanOuvert = bilan && leconsTerminees(ch) >= ch.lecons.length - 1;
    const verrou = !ouvert || (bilan && !bilanOuvert);
    const pot = h('div', { class: 'pot' + (bilan ? ' bilan' : '') + (e === 'terminee' ? '' : e === 'en-cours' ? ' cur sprout' : ' seed') + (verrou ? ' lock' : '') },
      bilan ? h('span', { class: 'tag', style: 'font-size:9.5px' }, 'Bilan') : deco(pousse(ch, l)));
    const sous = bilan ? (bilanOuvert ? '≥ 70 % ouvre le chapitre suivant' : `Termine les ${ch.lecons.length - 1} leçons pour l’ouvrir`) : l.type + (l.sous ? ' · ' + l.sous : '');
    return h('div', { class: 'node' + (verrou ? ' lock' : ''), onclick: () => verrou ? toast(bilan ? `Termine d’abord les ${ch.lecons.length - 1} leçons du chapitre.` : `Termine d’abord le chapitre ${chapitreEnCours().n}.`, true) : feuilleLecon(ch, l) },
      pot, h('div', { class: 'txt' }, h('b', null, titreBilan(l)), h('span', null, sous)),
      e === 'terminee' ? h('div', { class: 'mini' }, '✓') : e === 'en-cours' ? h('span', { class: 'go' }, 'Reprendre') : null);
  }

  function sentier() {
    const wrap = h('div');
    const cur = chapitreEnCours();
    for (const lvl of PROG.niveaux) {
      const chs = PROG.chapitres.filter(c => c.n >= lvl.from && c.n <= lvl.to);
      const total = chs.reduce((s, c) => s + Math.max(0, c.lecons.length - 1), 0);
      const faites = chs.reduce((s, c) => s + leconsTerminees(c), 0);
      const pct = total ? Math.round(100 * faites / total) : 0;
      wrap.append(h('div', { class: 'lvl' }, h('span', { class: 'name' }, `${lvl.id} · ${lvl.nom}`), h('div', { class: 'prog' }, h('i', { style: `width:${pct}%` })), h('span', null, total ? `${pct} %` : 'à venir')));
      if (!total) {
        wrap.append(h('p', { class: 'muted small', style: 'margin:4px 0 6px' }, `${chs.length} chapitres. Les leçons seront découpées à la rédaction de ce niveau, au rythme de ton avancement.`));
        chs.forEach(c => wrap.append(h('div', { class: 'chapter lock', style: 'margin-top:0' }, h('div', { class: 'chap', style: 'padding:10px 0 8px' }, h('div', { class: 'name', style: 'font-size:19px' }, h('small', null, `Chapitre ${c.n}`), h('em', null, c.it), h('span', { style: 'display:block;font-family:var(--fb);font-size:12px;color:var(--taupe);margin-top:2px' }, c.fr))))));
        continue;
      }
      for (const c of chs) {
        const ouvert = chapitreOuvert(c);
        const detail = c.lecons.length > 0;
        const el = h('div', { class: 'chapter' + (ouvert ? '' : ' lock') + (c.n === cur.n ? ' cur' : '') },
          h('div', { class: 'chap' }, h('div', { class: 'name' }, h('small', null, `Chapitre ${c.n}`), h('em', null, c.it)), h('div', { class: 'p' }, detail ? `${leconsTerminees(c)} / ${c.lecons.length - 1}` : 'à venir')),
          h('div', { class: 'sub' }, c.fr));
        if (detail && (ouvert || c.n === cur.n + 1)) el.append(h('div', { class: 'nodes' }, c.lecons.map(l => noeud(c, l))));
        else if (detail) el.append(h('div', { class: 'sub', style: 'padding:4px 0 8px' }, `${c.lecons.length - 1} leçons + bilan`));
        else el.append(h('div', { class: 'sub', style: 'padding:4px 0 8px' }, 'Les leçons seront découpées à la rédaction de ce niveau.'));
        wrap.append(el);
      }
    }
    return wrap;
  }

  function feuilleLecon(ch, l) {
    const e = etatLecon(ch.n, l.n);
    let fermer;
    fermer = feuille([
      h('div', { style: 'display:flex;gap:12px;align-items:center;width:100%;text-align:left' },
        h('div', { class: 'pot' + (e.etat === 'terminee' ? '' : ' seed cur') }, deco(pousse(ch, l))),
        h('div', null, h('b', { style: 'font-size:16px;display:block' }, titreBilan(l)), h('span', { class: 'muted small' }, `Chapitre ${ch.n} · ${l.type}${l.sous ? ' · ' + l.sous : ''}`))),
      h('div', { class: 'talk', style: 'margin:18px 0 6px;width:100%;text-align:left' }, avatar('pattes-jointes'),
        h('div', { class: 'bubble' }, h('b', null, 'Le sentier est prêt, la leçon arrive.'), 'Cette leçon sera jouable dès que le contenu du niveau A1 sera écrit (étape 3) et que le moteur d’exercices sera en place (étape 2). Le socle que tu vois l’accueillera telle quelle.')),
      h('button', { class: 'btn', onclick: () => fermer() }, 'D’accord')
    ], { center: true });
  }

  function champRecherche(placeholder) {
    return h('label', { class: 'field' }, h('div', { class: 'in', style: 'border-radius:999px;padding:11px 16px', html: `<svg viewBox="0 0 24 24">${SVG.search}</svg>` }, h('input', { type: 'search', placeholder, autocomplete: 'off', autocorrect: 'off', spellcheck: 'false' })));
  }
  function fiches() {
    const carte = (titre, k, texte) => h('div', { class: 'card white', style: 'margin-top:12px' }, h('div', { style: 'display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:4px' }, h('span', { style: 'font-family:var(--fh);font-size:20px' }, titre), h('span', { class: 'muted small', style: 'font-weight:600' }, k)), h('p', { class: 'muted small', style: 'margin:0' }, texte));
    return h('div', null,
      h('div', { style: 'margin-top:16px' }, champRecherche('Un mot, un verbe, une règle…')),
      carte('Conjugaison', '0 verbe', 'Chaque verbe rencontré ouvrira ici son tableau complet, temps par temps.'),
      carte('Grammaire', '0 point', 'Les points de grammaire, dans l’ordre du programme : règle, exemples, exceptions, exercice ciblé.'),
      carte('Lexique', '0 mot', 'Tous tes mots, par thème ou de A à Z, avec un filtre « à revoir ».'),
      h('p', { class: 'muted', style: 'font-size:11.5px;text-align:center;margin:18px 0 0' }, 'Les fiches ne montrent que ce que tu as déjà rencontré : c’est un manuel qui s’écrit à ton rythme.'));
  }
  function carnet() {
    return h('div', null,
      h('div', { style: 'display:flex;gap:8px;align-items:center;margin-top:16px' }, h('div', { style: 'flex:1' }, champRecherche('Chercher dans le carnet…')), h('button', { class: 'chip', onclick: () => toast('Le filtre s’activera dès la première note.', true) }, 'Filtrer')),
      h('div', { style: 'display:flex;justify-content:space-between;font-size:11.5px;color:var(--taupe);margin-top:10px' }, h('span', { html: 'Groupées par <b style="color:var(--cacao)">chapitre</b> · <u>par thème</u>' })),
      h('div', { class: 'talk', style: 'margin-top:26px' }, avatar('surprise'), h('div', { class: 'bubble' }, h('b', null, 'Lo sai ?'), 'Chaque fin de leçon déposera ici son point à retenir : expressions, subtilités, exceptions, faux amis, prononciation. Tu pourras les mettre en favori ou t’interroger dessus.')));
  }

  /* ------------------------------------------------------------------ */
  /* EXERCICES                                                          */
  /* ------------------------------------------------------------------ */
  function ecranExercices() {
    const st = Store.stats();
    const illus = n => h('img', { class: 'illus', src: `assets/illus/${n}.png`, alt: '', draggable: 'false' });
    const bloc = (img, titre, sous, ...reste) => h('div', { class: 'card white', style: 'margin-top:12px' }, h('div', { class: 'row illus-row' }, illus(img), h('div', { class: 'txt' }, h('b', null, titre), h('span', null, sous), ...reste)));
    const bientot = 'Disponible avec les premières leçons.';
    const sc = scroll(
      h('div', { class: 'bg', style: 'right:-16px;top:-16px;width:82px;transform:scaleX(-1)' }, deco('p13')),
      entete('À la demande', 'Envie de <em>t’exercer</em> ?'),
      h('div', { class: 'card peach', style: 'margin-top:20px' }, h('div', { class: 'row illus-row' }, illus('revision'), h('div', { class: 'txt' }, h('div', { class: 't' }, 'Révision du jour'),
        st.dus ? [h('b', null, h('i', { class: 'hl' }, `${st.dus} éléments`), ' t’attendent'), h('span', null, 'environ ' + Math.ceil(st.dus / 3) + ' min'), h('button', { class: 'btn sm', style: 'margin-top:10px' }, 'Réviser')]
          : [h('b', null, 'Rien à réviser aujourd’hui'), h('span', null, 'Tes premiers mots arriveront ici le lendemain de ta première leçon.')]))),
      bloc('raviver', 'Raviver la mémoire', 'Des chapitres que tu n’as pas revus depuis longtemps', h('p', { class: 'muted small', style: 'margin:8px 0 0' }, 'Dès que tu auras terminé un chapitre, il apparaîtra ici quand il commencera à dater.')),
      bloc('renforcement', 'Renforcement', 'Là où tu te trompes le plus, ces 30 derniers jours', h('p', { class: 'muted small', style: 'margin:8px 0 0' }, 'Le podium de tes points fragiles se construira à partir de tes réponses.')),
      h('div', { style: 'margin-top:18px' }, h('b', { style: 'display:block;font-size:15px;margin-bottom:8px' }, 'Entraînement libre'),
        h('div', { class: 'chips' }, ['Prononciation', 'Compréhension orale', 'Compréhension écrite', 'Expression écrite', 'Dictée'].map(n => h('button', { class: 'chip ghost', onclick: () => toast(bientot, true) }, n)))),
      h('div', { class: 'card white', style: 'margin-top:14px;border-color:var(--rouille)' }, h('div', { class: 'row' }, h('div', { class: 'txt' }, h('b', null, 'Réflexes ', h('i', { class: 'muted', style: 'font-weight:400;font-style:normal' }, '· 1 min')), h('span', null, 'Associe les paires le plus vite possible · uniquement des mots appris')), h('button', { class: 'btn sm rust', onclick: () => toast('Le jeu s’ouvrira dès que tu connaîtras tes premiers mots.', true) }, 'Jouer'))),
      h('div', { class: 'card white dim', style: 'margin-top:12px' }, h('div', { class: 'row' }, h('div', { class: 'txt' }, h('b', null, 'Sur mesure avec Coni'), h('span', null, etat.conversation.cle ? 'Dis-moi ce que tu veux travailler, je te prépare un exercice. (étape 6)' : 'Nécessite la connexion et ta clé d’accès — réglable dans Moi › Réglages.'))))
    );
    return h('div', null, sc);
  }

  /* ------------------------------------------------------------------ */
  /* MOI                                                                */
  /* ------------------------------------------------------------------ */
  function ecranMoi() {
    const st = Store.stats();
    const nj = Store.niveauJardin(st.xp);
    const chev = h('span', { class: 'chev' }, '›');
    const sc = scroll(
      h('div', { class: 'topbar', style: 'margin-left:0;justify-content:space-between' }, h('div', { class: 'hd', style: 'margin:0' }, h('div', { class: 'date' }, 'Ta progression'), h('div', { class: 'greet', html: 'Ton <em>jardin</em>.' })),
        h('button', { class: 'icnb', 'aria-label': 'Réglages', onclick: () => ouvrirSous(ecranReglages), html: `<svg viewBox="0 0 24 24">${SVG.gear}</svg>` })),
      h('div', { class: 'garden' }, h('div', { class: 'soil' }),
        h('span', { class: 'cap tag' }, st.faites ? `${st.faites} plantes` : 'Tes plantes pousseront ici'),
        deco('graine', 'left:26px;width:30px'), deco('graine2', 'left:70px;width:30px'), deco('graine3', 'left:112px;width:30px'),
        lapin('dos', 'position:absolute;right:10px;bottom:4px;width:48px')),
      h('div', { style: 'display:flex;justify-content:space-between;align-items:baseline;margin-top:12px' }, h('span', { class: 'tag' }, 'Niveau du jardin'), h('span', { style: 'font-size:12.5px' }, `Niveau ${nj.n} · `, h('b', null, nj.nom), ` · ${st.xp} XP`)),
      h('div', { class: 'prog thick', style: 'margin:8px 0 6px' }, h('i', { style: `width:${nj.pct}%` })),
      carteJardin(),
      h('div', { class: 'card white row tap', style: 'margin-top:12px', onclick: () => ouvrirSous(ecranNiveau) }, h('div', { class: 'txt' }, h('div', { class: 'tag' }, 'Ton niveau'), h('div', { style: 'display:flex;align-items:baseline;gap:8px' }, h('span', { style: 'font-family:var(--fh);font-size:38px;line-height:1' }, 'A1'), h('span', { class: 'muted small' }, '· 0 % vers A1.1'))), chev.cloneNode(true)),
      h('div', { class: 'card white row tap', style: 'margin-top:12px', onclick: () => ouvrirSous(ecranMots) }, h('div', { class: 'txt' }, h('span', { style: 'font-family:var(--fh);font-size:30px;line-height:1' }, String(st.mots)), ' ', h('span', { style: 'font-size:13px' }, `mot${st.mots > 1 ? 's' : ''} connu${st.mots > 1 ? 's' : ''}`), h('span', null, st.mots ? `dont ${st.maitrises} maîtrisés` : 'Le premier arrive avec la première leçon.')), chev.cloneNode(true)),
      h('div', { class: 'card white row tap', style: 'margin-top:12px', onclick: () => toast('La liste se déploiera ici, chapitre par chapitre.', true) }, h('div', { class: 'txt' }, h('span', { style: 'font-family:var(--fh);font-size:30px;line-height:1' }, String(st.faites)), ' ', h('span', { style: 'font-size:13px' }, `leçon${st.faites > 1 ? 's' : ''} faite${st.faites > 1 ? 's' : ''}`), h('span', null, `sur ${PROG.chapitres.slice(0, 16).reduce((s, c) => s + c.lecons.length, 0)} au niveau A1`)), h('span', { class: 'chev' }, '⌄')),
      h('div', { class: 'sect' }, h('span', { class: 't' }, 'Badges'), h('button', { class: 'more', onclick: () => ouvrirSous(ecranBadges) }, 'Tous les badges ›')),
      h('div', { class: 'badges' }, [['7', '7 jours'], ['Ⅰ', 'Premier chapitre'], ['50', '50 mots']].map(([s, n]) => h('div', { class: 'bd off' }, h('div', { class: 'badge lock' }, h('span', { style: 'font-family:var(--fh);font-size:22px;color:var(--taupe)' }, s)), n)))
    );
    return h('div', null, sc);
  }

  /* ---------- jardin aménageable (référence : claude/jardin-amenageable.md) ---------- */
  const JARDIN_ZONES = [
    { id: 1, slug: 'grand-arbre', nom: 'Grand arbre', ouvre: 'B1.1' }, { id: 2, slug: 'terrasse', nom: 'Terrasse', ouvre: null }, { id: 3, slug: 'potager', nom: 'Potager', ouvre: 'B1.2' },
    { id: 4, slug: 'agrumier', nom: 'Agrumier', ouvre: 'A1.2' }, { id: 5, slug: 'fontaine', nom: 'Fontaine', ouvre: null }, { id: 6, slug: 'massifs', nom: 'Massifs fleuris', ouvre: 'A2.1' },
    { id: 7, slug: 'serre', nom: 'Serre', ouvre: 'B2.1' }, { id: 8, slug: 'bassin', nom: 'Bassin', ouvre: 'A2.2' }, { id: 9, slug: 'olivier', nom: 'Olivier', ouvre: 'B2.2' }];
  const NIVEAUX_ORDRE = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2'];
  const FIN_NIVEAU = { 'A1.1': 8, 'A1.2': 16, 'A2.1': 25, 'A2.2': 34, 'B1.1': 44, 'B1.2': 54, 'B2.1': 64, 'B2.2': 74 };
  function chapitresAccomplis() { let n = 0; while (etat.progression.chapitres[n + 1] && etat.progression.chapitres[n + 1].termine) n++; return n; }
  function niveauJardinCECRL(ch) { for (const l of NIVEAUX_ORDRE) if (ch < FIN_NIVEAU[l]) return l; return 'B2.2'; }
  function zoneOuverte(z) { return !z.ouvre || NIVEAUX_ORDRE.indexOf(niveauJardinCECRL(chapitresAccomplis())) >= NIVEAUX_ORDRE.indexOf(z.ouvre); }
  let CATALOGUE = null;
  const Z5 = { x: 1470, y: 1384, w: 1168, h: 1094 };           // parcelle Fontaine (grille.json)
  const TAILLES = { P: 184, M: 287, G: 427 }, ECHELLE_ELEM = { 1: .72 };
  function carteJardin() {
    const j = etat.acquis.jardin || {};
    const poses = Array.isArray(j.placed) ? j.placed : [];
    const apercu = h('div', { class: 'jardin-apercu', onclick: () => ouvrirSous(ecranJardin) }, h('img', { class: 'fond', src: 'jardin/zones/z5-fontaine.webp', alt: 'Ton jardin', draggable: 'false' }));
    const dessiner = () => {
      if (!CATALOGUE) return;
      const W = apercu.clientWidth, H = apercu.clientHeight; if (!W) return;
      const k = Math.max(W / Z5.w, H / Z5.h), ox = (W - Z5.w * k) / 2, oy = (H - Z5.h * k) / 2;
      apercu.querySelectorAll('.el').forEach(e => e.remove());
      const byId = Object.fromEntries(CATALOGUE.stickers.map(x => [x.id, x]));
      poses.filter(p => p.x >= Z5.x && p.x < Z5.x + Z5.w && p.y >= Z5.y && p.y < Z5.y + Z5.h).sort((a, b) => a.y - b.y).forEach(p => {
        const st = byId[p.id]; if (!st) return;
        const hh = TAILLES[st.size] * (ECHELLE_ELEM[st.id] || 1) * k, ww = hh * st.w / st.h, lift = st.cat === 'air' ? hh * .9 : 0;
        apercu.append(h('img', { class: 'el', src: 'jardin/stickers/' + st.file, alt: '', draggable: 'false', style: `left:${ox + (p.x - Z5.x) * k - ww / 2}px;top:${oy + (p.y - Z5.y) * k - hh - lift}px;width:${ww}px;height:${hh}px;${p.flip ? 'transform:scaleX(-1)' : ''}` }));
      });
    };
    requestAnimationFrame(() => { dessiner(); });
    if (!CATALOGUE) fetch('jardin/catalogue.json').then(r => r.json()).then(c => { CATALOGUE = c; dessiner(); }).catch(() => {});
    return h('div', { class: 'card white jardin-card', style: 'margin-top:16px' }, apercu, h('button', { class: 'btn sm jardin-btn', onclick: () => ouvrirSous(ecranJardin) }, 'Aménager'));
  }
  function ecranJardin() {
    const fr = h('iframe', { class: 'jardin-frame', src: 'jardin/index.html', title: 'Ton jardin', allow: 'fullscreen' });
    return h('div', { class: 'jardin-ecran' }, fr);
  }
  window.addEventListener('message', ev => { if (ev.data && ev.data.type === 'jardin:fermer' && pile.length) { history.back(); setTimeout(() => { if (ongletCourant === 'moi' && !pile.length) rendreOnglet(); }, 350); } });

  function ecranNiveau() {
    const comps = ['Écouter', 'Lire', 'Parler', 'Écrire'];
    return h('div', null, scroll(
      topbar('Moi', { droite: h('span', { class: 'pill' }, 'A1 · 0 %') }),
      h('div', { class: 'hd' }, h('div', { class: 'date' }, 'Ton niveau'), h('div', { class: 'greet', html: 'A1, <em>au départ</em>' })),
      h('div', { class: 'card', style: 'margin-top:16px' }, h('div', { class: 't' }, 'Aujourd’hui, tu peux'), h('p', { style: 'margin:0;font-size:14px;line-height:1.5' }, 'Tu as quelques bases orales, et c’est exactement le bon point de départ. Le premier chapitre commence par saluer et se présenter.')),
      h('div', { class: 'card white', style: 'margin-top:10px' }, h('div', { class: 't' }, 'Comment ce niveau est mesuré'), h('p', { style: 'margin:0;font-size:14px;line-height:1.5' }, 'Chaque leçon travaille des « je peux… » du Profilo della lingua italiana. Un descripteur passe « en cours » quand tu termines une leçon, « acquis » quand tu réussis le bilan du chapitre. Rien ici ne dépend des XP.')),
      h('div', { style: 'margin-top:14px' }, comps.map(c => h('div', { class: 'gauge' }, h('span', null, c), h('div', { class: 'prog' }, h('i', { style: 'width:0%' })), h('span', { class: 'v' }, '0 %')))),
      h('p', { class: 'muted', style: 'font-size:11.5px' }, 'À 10 minutes par jour, le niveau A1 complet représente environ douze mois. La projection s’affinera sur tes quatre dernières semaines.'),
      h('button', { class: 'btn ghost', onclick: () => ouvrirSous(ecranDescripteurs) }, 'Voir le détail des « je peux »')
    ));
  }
  function ecranDescripteurs() {
    let filtre = 'Tous';
    const liste = h('div');
    const chips = h('div', { class: 'chips', style: 'margin-top:14px' });
    const tous = PROG.chapitres.slice(0, 16).flatMap(c => c.jepeux.map(d => ({ ...d, ch: c.n })));
    const rendre = () => {
      chips.innerHTML = '';
      ['Tous', 'Écouter', 'Lire', 'Parler', 'Écrire'].forEach(f => chips.append(h('button', { class: 'chip sm' + (f === filtre ? ' on' : ''), onclick: () => { filtre = f; rendre(); } }, f === 'Tous' ? `Tous · ${tous.length}` : f)));
      liste.innerHTML = '';
      let ch = 0;
      tous.filter(d => filtre === 'Tous' || d.comp === filtre).forEach(d => {
        if (d.ch !== ch) { ch = d.ch; liste.append(h('div', { class: 'tag', style: 'display:block;margin:18px 0 4px' }, `Chapitre ${ch} · ${chapitre(ch).it}`)); }
        const st = etat.acquis.descripteurs[d.txt];
        liste.append(h('div', { class: 'desc' }, h('span', { class: 'cb' + (st === 'acquis' ? ' ok' : st === 'en-cours' ? ' half' : '') }), h('span', null, d.txt), h('span', { class: 'cmp' }, d.comp)));
      });
    };
    rendre();
    return h('div', null, scroll(
      topbar('Ton niveau', { droite: h('span', { class: 'pill' }, `A1 · ${tous.length} descripteurs`) }),
      h('div', { class: 'hd' }, h('div', { class: 'date' }, 'Niveau A1'), h('div', { class: 'greet sm' }, 'Ce que je pourrai faire')),
      h('p', { class: 'muted small', style: 'margin:6px 0 0' }, 'D’après le Profilo della lingua italiana. Acquis quand le bilan du chapitre est réussi.'),
      chips, liste,
      h('div', { class: 'muted', style: 'display:flex;gap:14px;font-size:11px;margin-top:16px' }, h('span', null, h('i', { class: 'cb ok', style: 'display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--rouille);margin-right:4px' }), 'acquis'), h('span', null, h('i', { style: 'display:inline-block;width:10px;height:10px;border-radius:50%;background:linear-gradient(90deg,var(--rouille) 50%,#fff 50%);border:1px solid var(--rouille);margin-right:4px' }), 'en cours'), h('span', null, h('i', { style: 'display:inline-block;width:10px;height:10px;border-radius:50%;border:1px solid var(--taupe-l);margin-right:4px' }), 'à venir'))
    ));
  }
  function ecranMots() {
    return h('div', null, scroll(
      topbar('Moi', { droite: h('span', { class: 'pill' }, '0') }),
      h('div', { class: 'hd' }, h('div', { class: 'greet' }, 'Mes mots.')),
      h('div', { style: 'display:flex;gap:8px;align-items:center;margin-top:14px' }, h('div', { style: 'flex:1' }, champRecherche('Chercher un mot…')), h('span', { class: 'chip ghost' }, 'À revoir · 0')),
      vide('question', 'Aucun mot pour l’instant', 'Tes mots apparaîtront ici par ordre de récence, les derniers appris en haut. Un toucher : la traduction et l’écoute ; un second : le détail du mot.')
    ));
  }
  function ecranBadges() {
    const fam = (nom, items) => [h('div', { class: 'set-h' }, nom), h('div', { class: 'badges' }, items.map(([s, n, cond]) => h('div', { class: 'bd off' }, h('div', { class: 'badge lock' }, h('span', { style: 'font-family:var(--fh);font-size:20px;color:var(--taupe)' }, s)), n, cond ? h('span', null, cond) : null)))];
    return h('div', null, scroll(
      topbar('Moi', { droite: h('span', { class: 'pill' }, '0 obtenu') }),
      h('div', { class: 'hd' }, h('div', { class: 'greet' }, 'Badges.')),
      h('p', { class: 'muted small', style: 'margin:6px 0 0' }, 'Ils récompensent des faits, jamais du temps passé. Leur dessin définitif viendra dans une conversation dédiée.'),
      fam('Programme', [['Ⅰ', 'Premier chapitre'], ['A1', 'A1.1 terminé', '8 chapitres'], ['A1', 'A1 complet', '16 chapitres']]),
      fam('Régularité', [['7', '7 jours'], ['30', '30 jours'], ['♣', 'Premier joker']]),
      fam('Savoir', [['50', '50 mots'], ['100', '100 mots'], ['10', '10 verbes']]),
      fam('Pratique', [['☕', '1re conversation'], ['10', '10 conversations'], ['♪', '100 phrases dites']]),
      fam('Niveaux du jardin', [['1', 'Graine', 'dès le départ'], ['2', 'Germe', '100 XP'], ['3', 'Pousse', '250 XP']])
    ));
  }

  /* ------------------------------------------------------------------ */
  /* CONVERSATION                                                       */
  /* ------------------------------------------------------------------ */
  function ecranConversation() {
    const cle = !!etat.conversation.cle;
    const enLigne = navigator.onLine;
    const entree = (svg, titre, sous) => h('div', { class: 'row', style: 'padding:12px 0;border-bottom:1px solid var(--filet);opacity:.55' }, ico(svg), h('div', { class: 'txt' }, h('b', null, titre), h('span', null, sous)));
    const sc = scroll(
      h('div', { style: 'display:flex;align-items:center;gap:10px;margin-top:4px' }, avatar('face', 36), h('div', null, h('b', { style: 'font-size:15px;display:block' }, 'Coni'), h('span', { class: 'muted', style: 'font-size:11px' }, 'niveau A1 · corrige en douceur'))),
      h('div', { class: 'end', style: 'padding-top:26px' }, lapin(cle && enLigne ? 'pattes-jointes' : 'question', 'width:130px'),
        h('div', { class: 'big', style: 'font-size:22px;margin-top:8px' }, cle && enLigne ? 'On parlera bientôt.' : !enLigne ? 'Pas de connexion pour l’instant.' : 'Pour discuter, il me faut une clé.'),
        h('p', { class: 'sub', style: 'max-width:300px;margin:4px 0 0' }, cle && enLigne ? 'La conversation avec Coni arrive à l’étape 6. Ta clé est bien enregistrée.' : !enLigne ? 'La conversation a besoin d’internet. Tout le reste d’Italingo fonctionne sans.' : 'La conversation demande une connexion et une clé d’accès au service d’IA. On la réglera ensemble à l’étape 6 ; le reste de l’app ne dépend jamais d’elle.'),
        !cle && enLigne ? h('button', { class: 'btn ghost sm', style: 'margin-top:16px', onclick: () => ouvrirSous(ecranReglages) }, 'Ouvrir les réglages') : null),
      h('div', { class: 'sect' }, h('span', { class: 't' }, 'Bientôt ici')),
      h('div', { class: 'line-list' },
        entree(SVG.text, 'Parler librement', 'écrit ou dicté, avec correction douce'),
        entree(SVG.scene, 'Scénarios', 'au café, à la gare… selon tes chapitres'),
        entree(SVG.pen, 'Corrige mon texte', 'colle un texte, Coni le corrige et explique'))
    );
    return h('div', null, sc);
  }

  /* ------------------------------------------------------------------ */
  /* RÉGLAGES et sous-pages                                             */
  /* ------------------------------------------------------------------ */
  function ligne(titre, valeur, action, opts) {
    opts = opts || {};
    return h('button', { class: 'setrow' + (opts.danger ? ' danger' : ''), onclick: action }, h('span', null, titre, opts.sous ? h('small', null, opts.sous) : null), h('span', { class: 'v' + (opts.rust ? ' rust' : '') }, valeur, action && !opts.rust ? h('span', { class: 'chev' }, ' ›') : null));
  }
  function ligneToggle(titre, actif, onchange, sous) {
    const t = h('button', { class: 'toggle' + (actif ? ' on' : ''), 'aria-pressed': actif ? 'true' : 'false' });
    t.addEventListener('click', () => { const on = !t.classList.contains('on'); t.classList.toggle('on', on); onchange(on); });
    return h('div', { class: 'setrow', style: 'cursor:default' }, h('span', null, titre, sous ? h('small', null, sous) : null), t);
  }
  function ecranReglages() {
    const e = etat;
    const cle = e.conversation.cle ? '•••• ' + e.conversation.cle.slice(-4) : 'non renseignée';
    const sauv = e.meta.derniereSauvegarde ? relative(e.meta.derniereSauvegarde) : 'jamais';
    const r = h('div');
    const rendre = () => {
      r.innerHTML = '';
      r.append(
        h('div', { class: 'set-h' }, 'Apprendre'),
        ligne('Objectif quotidien', `${e.profil.objectif} min`, () => choixObjectif(rendre)),
        ligne('Rappel quotidien', e.profil.rappel.actif ? e.profil.rappel.heure : 'désactivé', () => ouvrirSous(ecranRappel)),
        ligne('Fin de journée', e.profil.finJournee ? `${e.profil.finJournee} h du matin` : 'minuit', () => choixFinJournee(rendre), { sous: 'jusqu’à quelle heure une séance compte pour « aujourd’hui »' }),
        h('div', { class: 'set-h' }, 'Voix et son'),
        ligne('Voix italienne', e.voix.voixId ? e.voix.voixId.split('|')[0] : 'celle du téléphone', () => ouvrirSous(ecranVoix)),
        ligneToggle('Lire les nouveaux mots lentement', e.voix.lentNouveaux, v => Store.modifier(x => x.voix.lentNouveaux = v), 'd’abord lent, puis normal'),
        ligneToggle('Effets sonores', e.voix.sons, v => Store.modifier(x => x.voix.sons = v)),
        ligneToggle('Vibrations', e.voix.vibrations, v => Store.modifier(x => x.voix.vibrations = v)),
        h('div', { class: 'set-h' }, 'Clavier'),
        ligneToggle('Sans correction automatique', e.clavier.sansCorrection, v => Store.modifier(x => x.clavier.sansCorrection = v), 'dans Italingo seulement ; le clavier reste inchangé ailleurs'),
        h('div', { class: 'set-h' }, 'Conversation'),
        ligne('Clé d’accès à l’IA', cle, () => saisieCle(rendre)),
        ligne('Ton de Coni', e.conversation.ton, () => { Store.modifier(x => x.conversation.ton = x.conversation.ton === 'encourageant' ? 'complice' : 'encourageant'); rendre(); }),
        ligne('Correction', e.conversation.correction, () => { Store.modifier(x => x.conversation.correction = x.conversation.correction === 'douce' ? 'détaillée' : 'douce'); rendre(); }),
        h('div', { class: 'set-h' }, 'Données'),
        ligne('Sauvegarde', sauv, () => ouvrirSous(ecranSauvegarde)),
        ligne('Doutes signalés', String(e.doutes.length), () => ouvrirSous(ecranDoutes)),
        ligne('À propos', 'version ' + VERSION_APP, () => ouvrirSous(ecranAPropos)),
        ligne('Réinitialiser', 'tout effacer', () => confirmer('Tout effacer ?', 'Ta progression, tes réglages et ton jardin seront supprimés de ce téléphone. Pense à exporter une sauvegarde avant.', () => confirmer('Vraiment ?', 'Cette action est définitive.', () => { Store.reinitialiser(); location.reload(); }, { ok: 'Oui, tout effacer', danger: true }), { ok: 'Continuer', danger: true }), { danger: true, rust: true })
      );
    };
    rendre();
    return h('div', null, scroll(topbar('Moi'), h('div', { class: 'hd' }, h('div', { class: 'greet' }, 'Réglages.')), r));
  }
  function relative(iso) {
    const d = (Date.now() - new Date(iso).getTime()) / 864e5;
    return d < 1 ? 'aujourd’hui' : d < 2 ? 'hier' : `il y a ${Math.floor(d)} j`;
  }
  function choixObjectif(apres) {
    let fermer;
    const grid = h('div', { class: 'goal', style: 'width:100%' });
    [[5, 'en douceur'], [10, 'régulier'], [15, 'sérieux'], [20, 'intensif']].forEach(([m, l]) => grid.append(h('button', { class: etat.profil.objectif === m ? 'on' : '', onclick: () => { Store.modifier(e => { e.profil.objectif = m; }); fermer(); apres && apres(); } }, h('b', null, String(m)), `minutes · ${l}`)));
    fermer = feuille([h('h3', null, 'Combien de temps par jour ?'), grid]);
  }
  function choixFinJournee(apres) {
    let fermer;
    fermer = feuille([h('h3', null, 'Fin de journée'), h('p', { class: 'muted small', style: 'margin:0 0 12px' }, 'Pour les couche-tard : jusqu’à cette heure, une séance compte encore pour la veille.'),
      h('div', { class: 'stack' }, [0, 1, 2, 3].map(hh => h('button', { class: 'opt' + (etat.profil.finJournee === hh ? ' sel' : ''), onclick: () => { Store.modifier(e => e.profil.finJournee = hh); fermer(); apres && apres(); } }, hh ? `${hh} h du matin` : 'Minuit')))]);
  }
  function saisieCle(apres) {
    let fermer;
    const inp = h('input', { type: 'password', placeholder: 'Colle ta clé ici', autocomplete: 'off', value: etat.conversation.cle || '' });
    fermer = feuille([h('h3', null, 'Clé d’accès à l’IA'), h('p', { class: 'muted small', style: 'margin:0 0 12px' }, 'Elle reste dans ce téléphone, masquée. On la créera ensemble à l’étape 6 ; tu peux la coller dès maintenant si tu l’as.'),
      h('label', { class: 'field' }, h('div', { class: 'in', html: `<svg viewBox="0 0 24 24">${SVG.key}</svg>` }, inp)),
      h('button', { class: 'btn', onclick: () => { Store.modifier(e => e.conversation.cle = inp.value.trim()); fermer(); apres && apres(); toast('Clé enregistrée.', true); } }, 'Enregistrer'),
      etat.conversation.cle ? h('button', { class: 'btn ghost', onclick: () => { Store.modifier(e => e.conversation.cle = ''); fermer(); apres && apres(); } }, 'Retirer la clé') : null]);
  }
  function ecranRappel() {
    const perm = ('Notification' in window) ? Notification.permission : 'indisponible';
    const heure = h('input', { type: 'time', value: etat.profil.rappel.heure, onchange: ev => Store.modifier(e => e.profil.rappel.heure = ev.target.value) });
    const etatPerm = h('p', { class: 'muted small', style: 'margin:8px 0 0' });
    const majPerm = () => { etatPerm.textContent = perm === 'indisponible' ? 'Ce navigateur ne propose pas de notifications.' : Notification.permission === 'granted' ? 'Les notifications sont autorisées sur ce téléphone.' : Notification.permission === 'denied' ? 'Les notifications sont bloquées : à réactiver dans les réglages Android d’Italingo.' : 'Italingo n’a pas encore demandé la permission d’envoyer des notifications.'; };
    majPerm();
    return h('div', null, scroll(
      topbar('Réglages'),
      h('div', { class: 'hd' }, h('div', { class: 'greet' }, 'Rappel quotidien.')),
      h('p', { class: 'muted small', style: 'margin:6px 0 0' }, 'Une seule notification par jour, à l’heure choisie, avec la tête de Coni. Le texte nomme la pousse concrète, jamais une culpabilité.'),
      h('div', { style: 'margin-top:14px' }, ligneToggle('Rappel activé', etat.profil.rappel.actif, v => Store.modifier(e => e.profil.rappel.actif = v))),
      h('div', { class: 'setrow', style: 'cursor:default' }, h('span', null, 'Heure'), heure),
      h('div', { class: 'card', style: 'margin-top:18px' }, h('div', { class: 't' }, 'Sur ce téléphone'), etatPerm,
        h('div', { style: 'display:flex;gap:8px;margin-top:12px;flex-wrap:wrap' },
          h('button', { class: 'btn sm', onclick: async () => { if (!('Notification' in window)) return; await Notification.requestPermission(); majPerm(); } }, 'Autoriser'),
          h('button', { class: 'btn sm ghost', onclick: async () => { if (!('Notification' in window) || Notification.permission !== 'granted') { toast('Autorise d’abord les notifications.'); return; } const reg = await navigator.serviceWorker?.getRegistration(); const opts = { body: 'Dix minutes et ta première pousse grandit. Coni t’attend.', icon: 'icons/icon-192.png', badge: 'icons/badge-96.png' }; if (reg) reg.showNotification('Buongiorno' + (prenom() ? ', ' + prenom() : ''), opts); else new Notification('Buongiorno', opts); } }, 'Envoyer un test'))),
      h('p', { class: 'muted', style: 'font-size:11.5px;margin-top:14px' }, 'Le déclenchement automatique à l’heure choisie dépend de ce que ton Android autorise aux web apps installées ; c’est le point à vérifier ensemble sur ton téléphone.')
    ));
  }
  function ecranVoix() {
    const liste = h('div', { class: 'line-list', style: 'margin-top:8px' });
    const info = h('p', { class: 'muted small' });
    const phrase = 'Buongiorno! Mi chiamo Coni. Piacere di conoscerti.';
    function parler(voice, lent) {
      if (!('speechSynthesis' in window)) return toast('Pas de synthèse vocale sur ce navigateur.');
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(phrase); u.lang = 'it-IT'; if (voice) u.voice = voice; u.rate = lent ? 0.7 : 0.95;
      speechSynthesis.speak(u);
    }
    function rendre() {
      liste.innerHTML = '';
      const voix = ('speechSynthesis' in window) ? speechSynthesis.getVoices().filter(v => /^it/i.test(v.lang)) : [];
      info.textContent = voix.length ? `${voix.length} voix italienne${voix.length > 1 ? 's' : ''} disponible${voix.length > 1 ? 's' : ''} sur ce téléphone.` : 'Aucune voix italienne trouvée pour l’instant. Sur Android : Paramètres › Synthèse vocale › installer la langue italienne.';
      voix.forEach(v => {
        const id = v.name + '|' + v.lang;
        liste.append(h('div', { class: 'row', style: 'padding:12px 0;border-bottom:1px solid var(--filet)' },
          h('button', { class: 'icnb', 'aria-label': 'Écouter', onclick: () => parler(v), html: `<svg viewBox="0 0 24 24">${SVG.sound}</svg>` }),
          h('div', { class: 'txt' }, h('b', null, v.name), h('span', null, v.lang + (v.localService ? ' · hors ligne' : ' · en ligne'))),
          h('button', { class: 'chip sm' + (etat.voix.voixId === id ? ' on' : ''), onclick: () => { Store.modifier(e => e.voix.voixId = id); rendre(); } }, etat.voix.voixId === id ? 'Choisie' : 'Choisir')));
      });
    }
    rendre();
    if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = rendre;
    return h('div', null, scroll(
      topbar('Réglages'),
      h('div', { class: 'hd' }, h('div', { class: 'greet' }, 'Voix italienne.')),
      h('p', { class: 'muted small', style: 'margin:6px 0 0' }, 'La voix vient du téléphone. Chaque mot et chaque phrase pourront être réécoutés, normalement ou au ralenti, sans limite.'),
      h('div', { style: 'display:flex;gap:8px;margin-top:14px' }, h('button', { class: 'btn sm', onclick: () => parler(null, false) }, 'Écouter un exemple'), h('button', { class: 'btn sm ghost', onclick: () => parler(null, true) }, 'Au ralenti')),
      h('div', { class: 'sect' }, h('span', { class: 't' }, 'Voix disponibles')), info, liste
    ));
  }
  function ecranSauvegarde() {
    const st = Store.stats();
    const fichier = h('input', { type: 'file', accept: 'application/json,.json' });
    fichier.addEventListener('change', () => {
      const f = fichier.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { confirmer('Remplacer la progression ?', `Le fichier « ${f.name} » remplacera tout ce qui est dans ce téléphone.`, () => { try { Store.importer(rd.result); toast('Sauvegarde restaurée.', true); setTimeout(() => location.reload(), 600); } catch (e) { toast(e.message); } }, { ok: 'Restaurer' }); };
      rd.readAsText(f);
    });
    const derniere = etat.meta.derniereSauvegarde;
    return h('div', null, scroll(
      topbar('Réglages'),
      h('div', { class: 'hd' }, h('div', { class: 'greet' }, 'Sauvegarde.')),
      h('p', { style: 'font-size:13.5px;margin:8px 0 0' }, 'Toute ta progression est dans ce téléphone. Une sauvegarde est un fichier que tu gardes où tu veux ; le réimporter sur un autre téléphone restaure Italingo à l’identique.'),
      h('div', { class: 'card', style: 'margin-top:14px' }, h('div', { class: 't' }, 'Dernière sauvegarde'), h('p', { style: 'margin:0;font-size:14px' }, derniere ? new Date(derniere).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }) : 'Aucune pour l’instant'), h('p', { class: 'muted small', style: 'margin:2px 0 0' }, `Aujourd’hui : ${st.faites} leçons · ${st.mots} mots · ${st.xp} XP`)),
      h('button', { class: 'btn', style: 'margin-top:14px', onclick: () => { const n = Store.exporter(); toast(`Fichier « ${n} » enregistré dans tes téléchargements.`, true); } }, 'Exporter une sauvegarde'),
      h('button', { class: 'btn ghost', style: 'margin-top:8px', onclick: () => fichier.click() }, 'Importer un fichier'), fichier,
      h('div', { style: 'margin-top:6px' }, ligneToggle('Me rappeler chaque mois', etat.meta.rappelSauvegardeMensuel, v => Store.modifier(e => e.meta.rappelSauvegardeMensuel = v))),
      h('div', { class: 'card white', style: 'margin-top:14px' }, h('div', { class: 't' }, 'Ce que contient le fichier'), h('p', { class: 'muted small', style: 'margin:0' }, 'Profil et réglages · progression des leçons · éléments de révision · journal quotidien (minutes, XP, jokers) · acquis, badges, jardin · carnet · doutes signalés · conversations.')),
      h('div', { class: 'talk', style: 'margin-top:auto;padding-top:22px' }, avatar('face'), h('div', { class: 'bubble' }, 'Pense à sauvegarder avant de changer de téléphone ! On choisira ensemble la méthode définitive avant la fin du projet.'))
    ));
  }
  function ecranDoutes() {
    return h('div', null, scroll(
      topbar('Réglages', { droite: h('span', { class: 'pill' }, String(etat.doutes.length)) }),
      h('div', { class: 'hd' }, h('div', { class: 'greet' }, 'Doutes signalés.')),
      h('p', { class: 'muted small', style: 'margin:6px 0 0' }, 'Chaque exercice aura un bouton « signaler un doute ». Ce que tu marques remonte ici, pour qu’on le traite ensemble.'),
      etat.doutes.length ? h('div', { class: 'line-list' }, etat.doutes.map(d => h('div', { class: 'row' }, h('div', { class: 'txt' }, h('b', null, d.exercice), h('span', null, d.date + (d.commentaire ? ' · ' + d.commentaire : ''))))))
        : vide('question', 'Aucun doute pour l’instant', 'Et c’est très bien. La liste pourra s’exporter pour qu’on la relise ensemble.')
    ));
  }
  function ecranAPropos() {
    const installee = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const swOk = !!navigator.serviceWorker?.controller;
    const l = (a, b) => h('div', { class: 'setrow', style: 'cursor:default' }, h('span', null, a), h('span', { class: 'v' }, b));
    return h('div', null, scroll(
      topbar('Réglages'),
      h('div', { class: 'hd' }, h('div', { class: 'greet', html: 'Ital<em>ingo</em>.' })),
      h('p', { class: 'muted small', style: 'margin:6px 0 0' }, 'Ton application personnelle pour passer de zéro à un italien de voyage, puis conversationnel. Charte « Aube », mascotte Coni.'),
      h('div', { style: 'margin-top:14px' },
        l('Version', VERSION_APP), l('Étape', '1 · socle'), l('Mode', installee ? 'installée sur l’écran d’accueil' : 'ouverte dans le navigateur'), l('Hors ligne', swOk ? 'prête' : 'en préparation…'), l('Programme', `${PROG.chapitres.length} chapitres · A1 détaillé`)),
      window.__installPrompt ? h('button', { class: 'btn', style: 'margin-top:18px', onclick: async () => { const p = window.__installPrompt; p.prompt(); await p.userChoice; } }, 'Installer sur l’écran d’accueil') : null,
      h('div', { class: 'talk', style: 'margin-top:auto;padding-top:22px' }, avatar('coucou'), h('div', { class: 'bubble' }, h('b', null, 'Une conversation par étape.'), 'Construite avec Claude, à partir de la charte, de l’architecture et du programme validés par Isa.'))
    ));
  }

  /* ------------------------------------------------------------------ */
  /* ONBOARDING (3 écrans) et OUVERTURE                                 */
  /* ------------------------------------------------------------------ */
  function onboarding(fin) {
    let etape = 0;
    const brouillon = { prenom: etat.profil.prenom || '', objectif: etat.profil.objectif || 10, rappel: true, heure: '08:30' };
    const ecran = h('div', { class: 'screen onb', style: 'z-index:90' });
    const cadre = (pose, contenu) => h('div', { class: 'scroll' },
      h('div', { style: 'position:relative;height:250px;margin:0 calc(-1 * var(--pad))' }, deco('arche-rouille', 'position:absolute;left:50%;transform:translateX(-50%);bottom:8px;width:300px'), lapin(pose, 'position:absolute;left:50%;transform:translateX(-50%);bottom:8px;width:84px')),
      ...contenu);
    const rendre = () => {
      ecran.innerHTML = '';
      if (etape === 0) {
        const inp = h('input', { type: 'text', placeholder: 'Ton prénom', value: brouillon.prenom, autocomplete: 'given-name', autocapitalize: 'words', oninput: ev => { brouillon.prenom = ev.target.value; btn.disabled = !brouillon.prenom.trim(); } });
        const btn = h('button', { class: 'btn', disabled: !brouillon.prenom.trim(), onclick: () => { etape = 1; rendre(); } }, 'Continuer');
        ecran.append(cadre('coucou', [
          h('div', { class: 'hd', style: 'text-align:center' }, h('div', { class: 'greet sm', html: 'Ciao ! Comment <em>t’appelles-tu</em> ?' }), h('div', { class: 'date', style: 'margin-top:8px' }, 'Coni s’en servira pour te saluer.')),
          h('label', { class: 'field', style: 'margin-top:20px' }, h('div', { class: 'in' }, inp)),
          h('div', { class: 'foot' }, btn)]));
        setTimeout(() => inp.focus(), 400);
      } else if (etape === 1) {
        const grid = h('div', { class: 'goal' });
        const maj = () => { grid.innerHTML = ''; [[5, 'en douceur'], [10, 'régulier'], [15, 'sérieux'], [20, 'intensif']].forEach(([m, l]) => grid.append(h('button', { class: brouillon.objectif === m ? 'on' : '', onclick: () => { brouillon.objectif = m; maj(); } }, h('b', null, String(m)), `minutes · ${l}`))); };
        maj();
        ecran.append(cadre('question', [
          h('div', { class: 'hd', style: 'text-align:center' }, h('div', { class: 'greet sm', html: 'Combien de temps <em>par jour</em> ?' }), h('div', { class: 'date', style: 'margin-top:8px' }, 'Tu pourras changer à tout moment.')),
          grid,
          h('div', { class: 'foot' }, h('button', { class: 'btn', onclick: () => { etape = 2; rendre(); } }, 'Continuer'), h('button', { class: 'link', style: 'display:block;margin:14px auto 0;font-size:13px', onclick: () => { etape = 0; rendre(); } }, 'Retour'))]));
      } else {
        const heure = h('input', { type: 'time', value: brouillon.heure, onchange: ev => brouillon.heure = ev.target.value, style: 'font-size:22px;font-family:var(--fh);text-align:center' });
        const tog = ligneToggle('Me rappeler chaque jour', brouillon.rappel, v => brouillon.rappel = v);
        ecran.append(cadre('pattes-jointes', [
          h('div', { class: 'hd', style: 'text-align:center' }, h('div', { class: 'greet sm', html: 'À quelle heure <em>te rappeler</em> ?' }), h('div', { class: 'date', style: 'margin-top:8px' }, 'Une seule notification par jour, jamais de reproche.')),
          h('div', { style: 'display:flex;justify-content:center;margin-top:18px' }, heure),
          h('div', { style: 'margin-top:8px' }, tog),
          h('div', { class: 'foot' }, h('button', { class: 'btn', onclick: () => {
            Store.modifier(e => { e.profil.prenom = brouillon.prenom.trim(); e.profil.objectif = brouillon.objectif; e.profil.rappel = { actif: brouillon.rappel, heure: brouillon.heure }; e.profil.onboarded = true; });
            if (brouillon.rappel && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
            ecran.classList.add('out'); setTimeout(() => ecran.remove(), 300); fin();
          } }, 'C’est parti'), h('button', { class: 'link', style: 'display:block;margin:14px auto 0;font-size:13px', onclick: () => { etape = 1; rendre(); } }, 'Retour'))]));
      }
    };
    rendre();
    app.append(ecran);
  }

  function ouverture(fin) {
    const s = h('div', { class: 'splash' },
      h('div', { class: 'bg', style: 'left:-30px;right:-30px;bottom:0' }, deco('vagues')),
      h('div', { class: 'bg', style: 'right:-20px;top:-30px;width:190px' }, deco('coin-hd')),
      rig({ mods: 'live perk', expr: 'rire', hop: 400 }),
      h('div', { class: 'greet', html: prenom() ? `Ciao, <em>${escape(prenom())}</em> !` : 'Ciao !' }),
      h('div', { class: 'date' }, dateIT()));
    app.append(s);
    setTimeout(() => { s.classList.add('out'); setTimeout(() => s.remove(), 520); fin(); }, 1900);
  }
  function escape(t) { return String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  /* ------------------------------------------------------------------ */
  /* démarrage                                                          */
  /* ------------------------------------------------------------------ */
  const ECRANS = { accueil: ecranAccueil, parcours: ecranParcours, exercices: ecranExercices, moi: ecranMoi, conversation: ecranConversation };

  async function demarrer() {
    try {
      PROG = await (await fetch('contenu/programme.json')).json();
    } catch (e) { PROG = { niveaux: [], chapitres: [] }; }
    app.append(barre(), h('div', { class: 'toasts', id: 'toasts' }));
    // désactiver la correction automatique du clavier dans l'app (réglage § 8), champ par champ
    new MutationObserver(() => { if (etat.clavier.sansCorrection) document.querySelectorAll('input[type=text],input[type=search],textarea').forEach(i => { i.setAttribute('autocorrect', 'off'); i.setAttribute('autocomplete', i.getAttribute('autocomplete') || 'off'); i.setAttribute('spellcheck', 'false'); }); }).observe(app, { childList: true, subtree: true });
    const lancer = () => { rendreOnglet(); };
    if (!etat.profil.onboarded) { rendreOnglet(); $('#nav').classList.add('hidden'); onboarding(() => { $('#nav').classList.remove('hidden'); rendreOnglet(); }); }
    else { ouverture(lancer); }
    window.addEventListener('online', () => { if (ongletCourant === 'conversation' && !pile.length) rendreOnglet(); });
    window.addEventListener('offline', () => { if (ongletCourant === 'conversation' && !pile.length) rendreOnglet(); });
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); window.__installPrompt = e; if (ongletCourant === 'accueil' && !pile.length && etat.profil.onboarded) rendreOnglet(); });
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW', err)));
  demarrer();
})();
