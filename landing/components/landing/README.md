# Placeholders d'animation — landing

La page de référence (eddie.eco, Awwwards SOTD) est riche en animations.
Conformément à la demande (« pour l'animé importé, mets un placeholder, je le
construirai plus tard »), chaque emplacement animé est un **stand-in statique**
avec un marqueur « Animation à venir » et un commentaire `TODO` dans le code.

## Emplacements prévus

| # | Composant / section | Emplacement | Animation prévue (TODO) |
|---|---|---|---|
| 1 | `HeroPhone` (démo d'appel) | `components/landing/hero.tsx` | Démo d'appel animée : bulles de transcription qui apparaissent en séquence, état « sonnerie → en conversation », micro pulsant |
| 2 | `Waveform` (onde sonore) | `components/landing/waveform.tsx` | Barres d'onde animées (equalizer) pendant la lecture d'un extrait |
| 3 | `PhoneDemo` (appel en direct) | `components/landing/phone-demo.tsx` | Appel en direct simulé : transcript qui défile en temps réel, minuteur |
| 4 | Révélations au scroll | `components/landing/*` (sections) | Apparitions au scroll (intersection observer / framer-motion `whileInView`) |
| 5 | Marquees / bandeaux défilants | `components/landing/marquee.tsx` | Défilement continu (CSS ou GSAP) |

## Règle d'or

Quand l'animation est prête :
1. remplacer `<Placeholder label="…">` par le composant animé,
2. supprimer le marqueur « Animation à venir »,
3. supprimer la ligne correspondante de ce tableau.
