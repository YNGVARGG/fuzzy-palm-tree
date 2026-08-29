import { Placeholder } from "@/components/landing/placeholder"

/**
 * ONDE SONORE — stand-in statique (PLACEHOLDER d'animation n°2).
 *
 * TODO (à construire par l'utilisateur) : remplacer les barres statiques par une
 * onde animée (equalizer) pendant la lecture d'un extrait réel d'appel —
 * par exemple wavesurfer.js, une animation SVG générée, ou un petit composant
 * canvas. Brancher ensuite le bouton lecture du panneau LiveCall dessus.
 */
export function Waveform() {
  // Hauteurs fixes pseudo-aléatoires — simples barres statiques, aucune animation.
  const bars = [10, 22, 14, 30, 18, 26, 12, 34, 20, 16, 28, 14, 24, 18, 30, 12, 22, 16, 26, 10]
  return (
    <Placeholder label="Onde sonore animée (lecture d'extrait)" className="w-full">
      <div className="flex h-24 items-center justify-center gap-1 px-4">
        {bars.map((h, i) => (
          <span
            key={i}
            aria-hidden
            className="w-1 rounded-full bg-primary/60"
            style={{ height: `${h * 2}px` }}
          />
        ))}
      </div>
    </Placeholder>
  )
}
