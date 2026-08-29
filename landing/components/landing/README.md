# Placeholders d'animation — landing

La page de référence (eddie.eco, Awwwards SOTD) est riche en animations.
Conformément à la demande (« pour l'animé importé, mets un placeholder, je le
construirai plus tard »), chaque emplacement animé est un **stand-in statique**
avec un marqueur « Animation à venir » et un commentaire `TODO` dans le code.

## Emplacements prévus

| # | Composant / section | Fichier | Animation prévue (TODO) |
|---|---|---|---|
| 1 | `PhoneDemo` (démo d'appel du héros) | `components/landing/phone-demo.tsx` | Appel qui « se passe » : sonnerie → décroché, bulles de transcription en séquence, micro pulsant, pastille « Rendez-vous confirmé » avec rebond |
| 2 | `Waveform` (onde sonore) | `components/landing/waveform.tsx` | Barres d'onde animées (equalizer) pendant la lecture d'un vrai extrait audio |
| 3 | `LiveCall` (appel en direct) | `components/landing/live-call.tsx` | Transcript qui défile en temps réel, minuteur qui tourne, bouton lecture branché sur l'extrait audio |
| 4 | Révélations au scroll | `components/landing/*` (sections) | Apparitions au scroll (IntersectionObserver / framer-motion `whileInView`) — non posées pour l'instant, à ajouter quand la lib d'animation sera choisie |
| 5 | `BusinessCloud` (marquee clients) | `components/landing/business-cloud.tsx` | Défilement horizontal continu (CSS keyframes, GSAP ou Lenis + ScrollTrigger) |

## Règle d'or

Quand l'animation est prête :
1. remplacer `<Placeholder label="…">` par le composant animé,
2. supprimer le marqueur « Animation à venir » et la pastille « Maquette »,
3. supprimer la ligne correspondante de ce tableau.

## À configurer plus tard (non-animé)

- `components/landing/pricing.tsx` — montants et remise annuelle (`TODO utilisateur`).
- `components/landing/footer.tsx` — e-mail, téléphone, liens sociaux (`TODO utilisateur`).
- `components/landing/business-cloud.tsx` — vrais noms de clients.
