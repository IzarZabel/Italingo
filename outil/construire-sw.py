#!/usr/bin/env python3
"""Génère sw.js (service worker) à la racine de l'app, avec la liste complète des
fichiers à mettre en cache pour le hors-ligne et une empreinte de version calculée
sur leur contenu. À relancer à chaque nouvelle version de l'app :
    python3 outil/construire-sw.py
"""
import hashlib, os, json, datetime
racine = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fichiers = []
for dossier, _, noms in os.walk(racine):
    rel = os.path.relpath(dossier, racine)
    if rel.startswith(('outil', '.git')) or rel == 'outil':
        continue
    for n in noms:
        if n in ('sw.js', 'LISEZMOI.md') or n.startswith('.'):
            continue
        p = os.path.normpath(os.path.join(rel, n)).replace(os.sep, '/')
        fichiers.append(p if not p.startswith('./') else p[2:])
fichiers = sorted(f for f in fichiers if f != '.')
h = hashlib.sha1()
for f in fichiers:
    h.update(f.encode()); h.update(open(os.path.join(racine, f), 'rb').read())
version = h.hexdigest()[:10]
liste = ['./'] + ['./' + f for f in fichiers]
sw = f"""/* Italingo — service worker (hors-ligne). Généré le {datetime.date.today().isoformat()} par outil/construire-sw.py — ne pas éditer à la main. */
const CACHE = 'italingo-{version}';
const FICHIERS = {json.dumps(liste, ensure_ascii=False, indent=0)};
self.addEventListener('install', e => {{
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
}});
self.addEventListener('activate', e => {{
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
}});
self.addEventListener('fetch', e => {{
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {{
    const enCache = await c.match(e.request, {{ ignoreSearch: true }});
    const reseau = fetch(e.request).then(r => {{ if (r && r.ok) c.put(e.request, r.clone()); return r; }}).catch(() => null);
    if (enCache) {{ reseau.catch(() => {{}}); return enCache; }}
    const r = await reseau;
    return r || (e.request.mode === 'navigate' ? c.match('./index.html') : Response.error());
  }}));
}});
self.addEventListener('notificationclick', e => {{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({{ type: 'window' }}).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
}});
"""
open(os.path.join(racine, 'sw.js'), 'w', encoding='utf-8').write(sw)
print(f'sw.js écrit : {len(fichiers)} fichiers, version {version}')
