# Italingo — dossier de l'application (étape 1 · socle + jardin · v0.2.0)

Ce dossier **est** l'application : c'est lui qu'on met en ligne (GitHub Pages) pour l'installer sur Android. Rien à compiler, rien à installer : des pages web, des feuilles de style, du contenu et des dessins.

## Ce qu'il contient

| Élément | Rôle |
|---|---|
| `index.html` | La porte d'entrée de l'app (une seule page, tous les écrans s'y dessinent). |
| `css/aube.css` | Toute l'apparence : jetons de la charte « Aube » v1.4 repris tels quels + la coquille de l'app. |
| `js/app.js` | Les écrans, la navigation (5 onglets, sous-écrans, ouverture, onboarding). |
| `js/store.js` | La sauvegarde locale dans le téléphone, l'export/import du fichier de sauvegarde. |
| `js/assets.js` | Les icônes de navigation d'Isa et le visage animé de Coni (généré depuis la charte). |
| `contenu/programme.json` | Le programme pédagogique v1 (74 chapitres, A1 détaillé avec ses 176 leçons et 75 « je peux »). Extrait de `Programme/programme-italingo-v1.md`. |
| `assets/decors/` · `assets/lapin/` · `assets/icones/` | Les 47 décors, les 14 poses de Coni + 2 rigs, les 6 icônes — copies nettoyées de `DA/Charte Aube`. |
| `assets/fonts/` | Instrument Serif et Manrope, embarquées pour fonctionner hors ligne. |
| `icons/` | L'icône de l'app (tête de Coni sur cacao, recommandée par la charte). |
| `jardin/` | Le jardin aménageable (référence `claude/jardin-amenageable.md`) : `index.html` (la maquette d'Isa adaptée : plus de panneau Démo, progression et sauvegarde reliées à l'app), `zones/` (9 parcelles), `stickers/` (80 éléments), `coni/` (poses et course). Ouvert plein écran depuis Moi › Aménager. |
| `manifest.webmanifest` · `sw.js` | Ce qui rend l'app **installable** et **hors ligne**. |
| `outil/construire-sw.py` | Petit outil à relancer à chaque nouvelle version (il régénère `sw.js`). Pas besoin d'y toucher. |

## Règles

- Les fichiers sources d'Isa (`DA/`, `Programme/`, `Architecture/`) ne sont jamais modifiés : l'app en utilise des copies.
- Le contenu pédagogique est séparé de la mécanique : `contenu/` s'enrichit sans toucher au code.
- Chaque version est numérotée (`VERSION_APP` dans `js/app.js`) et `sw.js` est régénéré pour que les téléphones reçoivent la mise à jour.

## Mettre à jour l'app en ligne

1. Remplacer les fichiers du dépôt GitHub par ceux de ce dossier (glisser-déposer dans « Add file › Upload files »).
2. Attendre une minute : GitHub Pages republie.
3. Sur le téléphone, fermer et rouvrir Italingo deux fois : la nouvelle version s'installe toute seule.
