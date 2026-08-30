# DESIGN — Landing Standard IA

Documenté depuis le monde construit (`app/globals.css`, `app/layout.tsx`,
`components/landing/*`). La landing **hérite** du système existant du dashboard
(pierre neutre + indigo) — elle l'étend, elle ne le remplace pas. Direction
contractée dans le commentaire de `app/layout.tsx` (THESIS / OWN-WORLD /
STORY / FIRST VIEWPORT / FORM / FINISH).

## Identité

- **Produit** : Standard IA — l'agent téléphonique IA d'une entreprise (répond,
  prend les rendez-vous, répond avec les documents de l'entreprise, veille après
  les heures d'ouverture, résume et enregistre chaque appel).
- **Mode** : Persuade — le visiteur décide d'essayer ; la preuve est la démo
  d'appel.
- **Signature** : un appel en cours (téléphone, bulles de transcription,
  « Rendez-vous confirmé ») — le produit fait son travail sous les yeux.

## Tokens (oklch, dans `app/globals.css`)

| Rôle | Clair | Sombre |
|---|---|---|
| `--background` | `oklch(1 0 0)` | `oklch(0.147 0.004 49.25)` |
| `--foreground` | `oklch(0.147 0.004 49.25)` | `oklch(0.985 0.001 106.423)` |
| `--card` | `oklch(1 0 0)` | `oklch(0.216 0.006 56.043)` |
| `--primary` | `oklch(0.488 0.243 264.376)` | `oklch(0.424 0.199 265.638)` |
| `--primary-strong` | `oklch(0.488 0.243 264.376)` | `oklch(0.62 0.195 265)` |
| `--muted` | `oklch(0.97 0.001 106.424)` | `oklch(0.268 0.007 34.298)` |
| `--muted-foreground` | `oklch(0.553 0.013 58.071)` | `oklch(0.709 0.01 56.259)` |
| `--border` | `oklch(0.923 0.003 48.717)` | `oklch(1 0 0 / 10%)` |
| `--radius` | `0.875rem` (dérivés : sm 0.6× → 4xl 2.6×) | idem |

- Stratégie couleur : **Restreinte** — neutres pierre + un accent indigo
  électrique. L'indigo est réservé aux actions, liens, icônes et à la
  conversation de l'agent (bulles « agent » en primary).
- Accent secondaire factuel : émeraude pour les états positifs (en ligne,
  rendez-vous confirmé, check) — `emerald-500/10` sur fond, `emerald-600`
  clair / `emerald-400` sombre.
- Surfaces de section alternées : `bg-background` / `bg-muted/40` + `border-y`.

## Typographie

- **Sans** : Raleway (variable, 100–900) via `next/font/google`, exposée en
  `--font-sans`. Display en `font-extrabold` (800) avec `tracking-[-0.03em]`,
  titres de section `font-bold` `tracking-[-0.02em]`, corps `font-medium/400`.
- **Mono** : Geist Mono (`--font-mono`) réservé aux données téléphoniques —
  numéros, minutage, dates de rendez-vous, durées d'appel.
- Échelle : hero `text-4xl → sm:text-6xl → lg:text-7xl` ; titres de section
  `text-3xl → sm:text-4xl → lg:text-5xl` ; corps `text-base/lg` mesuré à
  `max-w-xl/2xl` ; détails `text-sm`, `text-xs`, étiquettes
  `text-[10px] uppercase tracking-[0.14em]`.
- `text-balance` sur les titres, `text-pretty` sur les paragraphes.

## Forme & profondeur

- Coins : `rounded-xl` (cartes — token `--radius-xl` = 1.4×), `rounded-2xl`
  (bulles avec un coin écrasé — `rounded-bl-sm`/`rounded-br-sm`), `rounded-full`
  (pills, pastilles, boutons), `rounded-3xl` (bandeau CTA — token
  `--radius-3xl` = 2.2×).
- Profondeur : ombres douces à décalage réel
  (`shadow-[0_20px_60px_-20px_…]`), halo d'ambiance `blur-[100px-120px]` très
  discret (hero + CTA) en éclairage, jamais en faux relief.
- Lignes : `border` 1px (`--border`), jamais de bordures latérales colorées.

## Composants & motifs

- Boutons : Base UI via `components/ui/button.tsx` (shadcn base-luma) —
  `rounded-4xl`, variants default / outline / ghost / secondary. Liens par
  `render={<a …/>}` (Base UI, pas `asChild`).
- Badges : `components/ui/badge.tsx` (Base UI `useRender`).
- Sections (ordre dans `app/page.tsx`) :
  1. **Nav** — fixe, fond translucide au scroll (`bg-background/85` + blur),
     menu mobile en accordéon.
  2. **Hero** — titre géant, double CTA, démo d'appel (placeholder n°1).
  3. **Business cloud** — noms d'entreprises maquette (placeholder n°5).
  4. **Problème** — bande prose 2 colonnes, densité calme.
  5. **Fonctionnalités** — bento 6 cellules (4+2 / 2+2+2), cellules variées.
  6. **Démo** — 3 étapes numérotées + appel en direct (placeholder n°3, qui
     contient l'onde, placeholder n°2).
  7. **Témoignages** — 3 cartes (2+1+1), contenu illustratif marqué « Maquette ».
  8. **Tarifs** — 3 plans, toggle mensuel/annuel (−20 %), montants indicatifs.
  9. **FAQ** — `<details>` natifs stylés (plus qui tourne à 45°).
  10. **CTA** — bandeau primary plein, halo interne.
  11. **Footer** — 4 colonnes (marque + 3 navs), copyright, réseaux.
- Rythme vertical : `py-16/20/28` par section ; `gap-12` entre titre et grille ;
  plus d'espace au-dessus des titres qu'en dessous.

## Placeholders d'animation

5 emplacements marqués « Animation à venir » (stand-ins statiques soignés) —
registre et instructions dans `components/landing/README.md` :
1. Démo d'appel du hero (`phone-demo.tsx`)
2. Onde sonore (`waveform.tsx`)
3. Appel en direct (`live-call.tsx`)
4. Révélations au scroll (non posées — à ajouter avec la lib choisie)
5. Marquee clients (`business-cloud.tsx`)

## Surfaces navigateur

- `::selection` teinté primary (60 % transparent), texte `--foreground`.
- `:focus-visible` anneau 2px `--ring` global ; `focus-visible:ring-2
  focus-visible:ring-ring` sur les contrôles interactifs.
- Skip-link « Aller au contenu » (`sr-only` → `focus:not-sr-only`).
- `scroll-behavior: smooth` (désactivé si `prefers-reduced-motion`).

## Comportement

- Thème clair/sombre via `next-themes` (attribut `class`, défaut système,
  `disableTransitionOnChange`), toggle dans la nav.
- `viewport` : `themeColor` light `#ffffff` / dark `#0c0a09`, `colorScheme:
  "light dark"`.
- Ancres `#fonctionnalites #demo #tarifs #faq #cta #top` + `scroll-mt-24`.

## À faire (dépend de l'utilisateur)

- Alignement pixel-exact sur eddie.eco (palette/typo/sections) — voir
  `docs/eddie-eco-alignment.md`, en attente de captures d'écran.
- Vrais prix (`pricing.tsx`), vraies coordonnées (`footer.tsx`), vrais clients
  (`business-cloud.tsx`).
- Construire les animations des placeholders.
