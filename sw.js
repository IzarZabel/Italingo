/* Italingo — service worker (hors-ligne). Généré le 2026-09-16 par outil/construire-sw.py — ne pas éditer à la main. */
const CACHE = 'italingo-73ce013686';
const FICHIERS = [
"./",
"./assets/decors/arche-basse.svg",
"./assets/decors/arche-escalier.svg",
"./assets/decors/arche-hero.svg",
"./assets/decors/arche-rouille.svg",
"./assets/decors/bord-droit.svg",
"./assets/decors/bord-gauche.svg",
"./assets/decors/coin-hd.svg",
"./assets/decors/coin-hg.svg",
"./assets/decors/fleur-baies.svg",
"./assets/decors/fleur.svg",
"./assets/decors/germe.svg",
"./assets/decors/germe2.svg",
"./assets/decors/germe3.svg",
"./assets/decors/graine.svg",
"./assets/decors/graine2.svg",
"./assets/decors/graine3.svg",
"./assets/decors/marguerite.svg",
"./assets/decors/massif-coin.svg",
"./assets/decors/massif-fleurs.svg",
"./assets/decors/massif-soleil.svg",
"./assets/decors/massif.svg",
"./assets/decors/p01.svg",
"./assets/decors/p02.svg",
"./assets/decors/p03.svg",
"./assets/decors/p04.svg",
"./assets/decors/p05.svg",
"./assets/decors/p06.svg",
"./assets/decors/p07.svg",
"./assets/decors/p08.svg",
"./assets/decors/p09.svg",
"./assets/decors/p10.svg",
"./assets/decors/p11.svg",
"./assets/decors/p12.svg",
"./assets/decors/p13.svg",
"./assets/decors/p14.svg",
"./assets/decors/p15.svg",
"./assets/decors/p16.svg",
"./assets/decors/p17.svg",
"./assets/decors/p18.svg",
"./assets/decors/p19.svg",
"./assets/decors/plante3.svg",
"./assets/decors/plante3b.svg",
"./assets/decors/plante3c.svg",
"./assets/decors/plante4.svg",
"./assets/decors/plante4b.svg",
"./assets/decors/plante4c.svg",
"./assets/decors/vagues.svg",
"./assets/fonts/instrument-serif-latin-400-italic.woff2",
"./assets/fonts/instrument-serif-latin-400-normal.woff2",
"./assets/fonts/manrope-latin-400-normal.woff2",
"./assets/fonts/manrope-latin-600-normal.woff2",
"./assets/icones/cards.svg",
"./assets/icones/chat.svg",
"./assets/icones/exo.svg",
"./assets/icones/home.svg",
"./assets/icones/me.svg",
"./assets/icones/trail.svg",
"./assets/lapin/01-face-rig.svg",
"./assets/lapin/01-face.svg",
"./assets/lapin/02-trois-quarts.svg",
"./assets/lapin/03-profil.svg",
"./assets/lapin/04-dos.svg",
"./assets/lapin/05-joie.svg",
"./assets/lapin/06-saut.svg",
"./assets/lapin/07-coucou-rig.svg",
"./assets/lapin/07-coucou.svg",
"./assets/lapin/08-dodo.svg",
"./assets/lapin/09-pattes-jointes.svg",
"./assets/lapin/10-rire.svg",
"./assets/lapin/11-surprise.svg",
"./assets/lapin/12-triste.svg",
"./assets/lapin/13-question.svg",
"./assets/lapin/14-boudeur.svg",
"./contenu/programme.json",
"./css/aube.css",
"./icons/badge-96.png",
"./icons/icon-192.png",
"./icons/icon-512.png",
"./icons/icon-maskable-512.png",
"./index.html",
"./js/app.js",
"./js/assets.js",
"./js/store.js",
"./manifest.webmanifest"
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const enCache = await c.match(e.request, { ignoreSearch: true });
    const reseau = fetch(e.request).then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(() => null);
    if (enCache) { reseau.catch(() => {}); return enCache; }
    const r = await reseau;
    return r || (e.request.mode === 'navigate' ? c.match('./index.html') : Response.error());
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
});
