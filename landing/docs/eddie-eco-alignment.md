# Alignement eddie.eco — checklist du passage pixel-exact

Objectif : approcher au maximum https://eddie.eco/ (Awwwards Site of the Day)
une fois que l'utilisateur fournit des captures d'écran (haut / milieu / bas de
page, desktop + mobile). Recherche web épuisée : seuls le prix Awwwards et une
review vidéo sont indexés ; rien sur les couleurs, polices ou sections.

## Ce qu'il faut demander à l'utilisateur

1. Captures d'écran de la page d'accueil (pleine page si possible).
2. Ce que vend eddie.eco (produit / audience) — pour caler le ton.
3. Le détail qui lui plaît le plus (« la démo d'appel », « la typo », « les
   couleurs »…).

## Comment fournir les captures (pour l'utilisateur)

- Ouvrir https://eddie.eco/ dans Chrome/Edge, puis F12 → icône appareil photo
  (ou Ctrl+Maj+P → « Capture full size screenshot ») → le fichier PNG est
  téléchargé, il suffit de le glisser dans le chat.
- Idéalement 3 captures : haut de page (hero), milieu (features/démo),
  bas (tarifs/footer) — + une capture mobile (F12 → mode appareil, 390 px de
  large) si le rendu mobile diffère.
- Chaque capture peut être accompagnée d'une remarque : « j'aime ceci », « pas
  ceci » — le passage s'en trouve accéléré.

## Points d'alignement (dans l'ordre d'impact)

### 1. Palette
- `app/globals.css` — remplacer les tokens oklch actuels (pierre + indigo) par
  ceux d'eddie.eco (relever les couleurs sur les captures : fond, texte,
  accent, surfaces).
- Vérifier contraste ≥ 4.5:1 (texte courant) et 3:1 (grand texte).

### 2. Typographie
- `app/layout.tsx` — remplacer Raleway par la famille d'eddie.eco si elle est
  identifiable (Google Fonts si possible), et ajuster `--font-mono`.
- Caler les échelles : taille du titre de hero, graisses, tracking.

### 3. Structure des sections
- Réordonner / renommer les sections de `app/page.tsx` pour épouser la
  structure réelle (hero, logos, démo, features, pricing, etc.).
- Ajouter les sections d'eddie.eco absentes de la landing (testimonials,
  presse, blog, équipe…).

### 4. Animations (placeholders — l'utilisateur les construit)
- Repérer sur les captures les éléments animés et les ajouter au registre
  `components/landing/README.md` si de nouveaux emplacements apparaissent.

### 5. Détails de finition
- Coins, ombres, espacements (`--radius`, paddings verticaux des sections).
- Surfaces navigateur déjà thémées (selection, focus) — les re-vérifier avec la
  nouvelle palette.

## Comment faire le passage

1. L'utilisateur colle les captures dans le chat (ou dans `landing/docs/`).
2. Relever palette + typos + structure sur les captures.
3. Mettre à jour `globals.css`, `layout.tsx`, les sections concernées.
4. L'utilisateur relance `npm run build` pour valider.

## Statut actuel (round 2)

- Landing complète construite dans le monde hérité (pierre + indigo, Raleway,
  démo d'appel en signature) — en attendant les captures.
- Vérification par review indépendante en cours (pas de shell dans la session,
  donc pas de `npm run build` possible ici).
