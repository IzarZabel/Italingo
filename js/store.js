/* =====================================================================
   ITALINGO — sauvegarde locale
   Tout ce que l'app enregistre vit dans le téléphone (localStorage),
   dans un seul objet « état » dont la forme suit l'architecture § 9.
   Le fichier de sauvegarde exporté est exactement cet objet.
   ===================================================================== */
(function () {
  const KEY = 'italingo.etat.v1';
  const VERSION = 1;

  function etatVide() {
    return {
      version: VERSION,
      profil: { prenom: '', objectif: 10, rappel: { actif: true, heure: '08:30' }, finJournee: 0, onboarded: false },
      voix: { vitesse: 'normale', lentNouveaux: true, sons: true, vibrations: true, voixId: '' },
      clavier: { sansCorrection: true },
      conversation: { cle: '', ton: 'encourageant', correction: 'douce' },
      progression: { lecons: {}, chapitres: {} },
      revision: {},
      journal: {},
      acquis: { xp: 0, badges: [], descripteurs: {}, jardin: { elements: [] } },
      serie: { jokers: 3, meilleure: 0 },
      carnet: { favoris: [], enRevision: [], entrees: [] },
      doutes: [],
      conversations: [],
      meta: { creeLe: new Date().toISOString(), derniereSauvegarde: null, rappelSauvegardeMensuel: true }
    };
  }

  /* fusion douce : les clés manquantes (nouvelle version) prennent la valeur par défaut */
  function completer(base, obj) {
    if (Array.isArray(base)) return Array.isArray(obj) ? obj : base;
    if (base && typeof base === 'object') {
      const out = {};
      for (const k of Object.keys(base)) out[k] = completer(base[k], obj && obj[k] !== undefined ? obj[k] : undefined);
      if (obj && typeof obj === 'object') for (const k of Object.keys(obj)) if (!(k in out)) out[k] = obj[k];
      return out;
    }
    return obj === undefined ? base : obj;
  }

  let etat = null;
  const abonnes = new Set();

  function charger() {
    let brut = null;
    try { brut = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { brut = null; }
    etat = completer(etatVide(), brut || {});
    etat.version = VERSION;
    return etat;
  }

  let timer = null;
  function enregistrer(immediat) {
    clearTimeout(timer);
    const go = () => {
      try { localStorage.setItem(KEY, JSON.stringify(etat)); } catch (e) { console.warn('Sauvegarde locale impossible', e); }
      abonnes.forEach(f => { try { f(etat); } catch (e) { console.error(e); } });
    };
    if (immediat) go(); else timer = setTimeout(go, 120);
  }

  function modifier(fn) { fn(etat); enregistrer(); return etat; }

  /* ---------- journée courante (heure de fin de journée réglable, § 8) ---------- */
  function cleJour(date) {
    const d = new Date(date || Date.now());
    d.setHours(d.getHours() - (etat.profil.finJournee || 0));
    const p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function jour(date) {
    const k = cleJour(date);
    if (!etat.journal[k]) etat.journal[k] = { minutes: 0, xp: 0, lecons: 0, valide: false, joker: null };
    return etat.journal[k];
  }
  function ajouterMinutes(m) {
    modifier(e => {
      const j = jour();
      j.minutes = Math.round((j.minutes + m) * 10) / 10;
      j.valide = j.minutes >= e.profil.objectif;
    });
  }

  /* série : jours validés d'affilée en remontant depuis aujourd'hui (ou hier si aujourd'hui pas encore fait).
     Les jokers seront branchés à l'étape 4 ; ici la mécanique de base. */
  function serie() {
    let n = 0;
    const d = new Date();
    let k = cleJour(d);
    if (!(etat.journal[k] && etat.journal[k].valide)) d.setDate(d.getDate() - 1);
    for (let i = 0; i < 3650; i++) {
      k = cleJour(d);
      const j = etat.journal[k];
      if (j && (j.valide || j.joker === 'consomme')) { n++; d.setDate(d.getDate() - 1); } else break;
    }
    return n;
  }

  /* ---------- statistiques simples ---------- */
  function stats() {
    const lecons = Object.values(etat.progression.lecons);
    const faites = lecons.filter(l => l.etat === 'terminee').length;
    const mots = Object.values(etat.revision).filter(r => r.type === 'mot' && r.niveau >= 3).length;
    const maitrises = Object.values(etat.revision).filter(r => r.niveau >= 5).length;
    const dus = Object.values(etat.revision).filter(r => r.prochaine && r.prochaine <= cleJour()).length;
    const minutesMois = Object.entries(etat.journal).filter(([k]) => k.slice(0, 7) === cleJour().slice(0, 7)).reduce((s, [, j]) => s + j.minutes, 0);
    return { faites, mots, maitrises, dus, minutesMois, xp: etat.acquis.xp, serie: serie(), jokers: etat.serie.jokers, meilleure: etat.serie.meilleure };
  }

  /* niveaux du jardin (§ 6.4) */
  const PALIERS = [0, 100, 250, 500, 850, 1300];
  const NOMS = ['Graine', 'Germe', 'Pousse', 'Bouton', 'Jeune plante', 'Jardinière', 'Jardinière confirmée', 'Maîtresse du jardin'];
  function niveauJardin(xp) {
    let n = 1, seuil = 0, prochain = PALIERS[1];
    for (let i = 1; ; i++) {
      const s = i < PALIERS.length ? PALIERS[i] : PALIERS[PALIERS.length - 1] + 600 * (i - PALIERS.length + 1);
      if (xp >= s) { n = i + 1; seuil = s; } else { prochain = s; break; }
    }
    return { n, nom: NOMS[Math.min(n - 1, NOMS.length - 1)], seuil, prochain, pct: Math.round(((xp - seuil) / (prochain - seuil)) * 100) };
  }

  /* ---------- export / import ---------- */
  function exporter() {
    modifier(e => { e.meta.derniereSauvegarde = new Date().toISOString(); });
    const contenu = JSON.stringify({ italingo: true, exporteLe: new Date().toISOString(), etat }, null, 1);
    const blob = new Blob([contenu], { type: 'application/json' });
    const a = document.createElement('a');
    const p = n => String(n).padStart(2, '0');
    const d = new Date();
    a.download = `italingo-sauvegarde-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
    a.href = URL.createObjectURL(blob);
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    return a.download;
  }
  function importer(texte) {
    let obj;
    try { obj = JSON.parse(texte); } catch (e) { throw new Error("Ce fichier n'est pas une sauvegarde lisible."); }
    const src = obj && obj.italingo && obj.etat ? obj.etat : (obj && obj.profil && obj.progression ? obj : null);
    if (!src) throw new Error("Ce fichier n'est pas une sauvegarde Italingo.");
    etat = completer(etatVide(), src);
    etat.version = VERSION;
    etat.meta.derniereSauvegarde = new Date().toISOString();
    enregistrer(true);
    return etat;
  }
  function reinitialiser() { etat = etatVide(); enregistrer(true); }

  window.Store = {
    charger, get: () => etat, modifier, enregistrer, cleJour, jour, ajouterMinutes, serie, stats, niveauJardin,
    exporter, importer, reinitialiser, abonner: f => abonnes.add(f), VERSION
  };
})();
