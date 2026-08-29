"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * PLACEHOLDER — blocs animés à remplacer plus tard par l'utilisateur.
 *
 * Le site de référence (eddie.eco) est un Awwwards SOTD : ses sections clés
 * sont animées (démo téléphone, onde sonore, révélations au scroll…).
 * Ici, chaque emplacement d'animation est un stand-in STATIQUE mais soigné :
 *   - les enfants rendent la version statique de la section,
 *   - un marqueur discret signale l'emplacement à animer,
 *   - le code porte un commentaire TODO décrivant l'animation prévue.
 *
 * Quand l'animation réelle sera prête (framer-motion / GSAP / Lottie / WebGL…),
 * remplacer <Placeholder label="...">…</Placeholder> par le composant animé
 * et supprimer le marqueur. Voir components/landing/README.md pour la liste.
 */
export function Placeholder({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      data-placeholder={label}
      className={cn(
        "relative overflow-hidden rounded-[calc(var(--radius)*1.4)] border border-dashed border-[color-mix(in_oklch,var(--foreground),transparent_75%)]",
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--foreground),transparent_80%)] bg-background/90 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase text-muted-foreground backdrop-blur"
      >
        <span className="size-1.5 rounded-full bg-primary" />
        Animation à venir
      </span>
      {children}
    </div>
  )
}

/** Petite étiquette pour signaler un numéro de téléphone / une maquette factice. */
export function SyntheticTag() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute right-2.5 bottom-2.5 z-10 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase text-muted-foreground backdrop-blur"
    >
      Maquette
    </span>
  )
}
