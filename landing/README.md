# Landing

Page d'accueil du produit (Standard IA — agent téléphonique IA), inspirée du
style de [eddie.eco](https://eddie.eco/) (Awwwards Site of the Day) : grande
typographie, preuve par la démo, sections à densité variable, animations
prévues mais laissées en **placeholders** (à construire par l'utilisateur).

Application Next.js autonome, sœur de `dashboard/`.

## Lancer

```bash
cd landing
npm install     # ou : pnpm install  (nécessaire une première fois)
npm run dev     # http://localhost:3000
```

## Vérifications

```bash
npm run build       # build de production
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run format      # prettier
```

## Direction de design (contractée dans app/layout.tsx)

- **Thèse** : prouver le produit dès le premier écran — un appel en cours, pas
  une promesse. Refuse le héros-métrique et l'empilement de cartes identiques.
- **Monde** : hérité du système existant (dashboard) — pierre neutre (oklch),
  indigo électrique en accent unique, Raleway en display/texte, Geist Mono pour
  les détails téléphoniques (numéros, minutage, transcript).
- **Signature** : la démo d'appel (téléphone + bulles de transcription +
  « Rendez-vous confirmé »).

## Structure

```
app/                  layout (fonts, metadata, contrat de direction) + page
components/landing/   sections (nav, hero, problem, features, demo, pricing,
                      faq, cta, footer, placeholders)
components/ui/        primitives shadcn-style (button, badge)
lib/                  utils
```

## Placeholders d'animation

Tous les emplacements animés sont des stand-ins statiques marqués
« Animation à venir » — voir `components/landing/README.md` pour la liste
complète (démo d'appel, onde sonore, appel en direct, marquee clients) et les
instructions de remplacement.

## À configurer (TODO utilisateur)

- Prix et remise annuelle : `components/landing/pricing.tsx`
- Coordonnées (e-mail, téléphone, réseaux) : `components/landing/footer.tsx`
- Vrais noms de clients : `components/landing/business-cloud.tsx`
- Alignement fin sur eddie.eco : envoyer des captures d'écran pour un passage
  pixel-exact (palette, typographie, sections).
