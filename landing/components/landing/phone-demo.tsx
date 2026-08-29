import { RiCalendarCheckLine, RiCheckLine, RiMicLine, RiPhoneLine } from "@remixicon/react"

import { Placeholder, SyntheticTag } from "@/components/landing/placeholder"

/**
 * DÉMO D'APPEL — stand-in statique (PLACEHOLDER d'animation n°1).
 *
 * TODO (à construire par l'utilisateur) : remplacer ce composant par la version
 * animée — l'appel qui « se passe » sous les yeux :
 *   - le téléphone sonne puis décroche (état « Sonnerie… » → « En conversation »),
 *   - les bulles de transcription apparaissent en séquence (frappe au clavier),
 *   - le micro pulse pendant la parole de l'agent,
 *   - la pastille « Rendez-vous confirmé » se pose avec un léger rebond.
 * Bibliothèques possibles : framer-motion (séquences), GSAP (timeline) ou Lottie.
 */
export function PhoneDemo() {
  return (
    <Placeholder label="Démo d'appel animée (hero)" className="mx-auto w-full max-w-md">
      <div className="relative flex flex-col gap-4 rounded-[calc(var(--radius)*1.4)] border bg-card p-5 shadow-[0_20px_60px_-20px_color-mix(in_oklch,var(--foreground),transparent_70%)] sm:p-6">
        <SyntheticTag />

        {/* Barre d'appel */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
              <RiPhoneLine className="size-4.5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Standard IA — Salon Camille</p>
              <p className="font-mono text-xs text-muted-foreground">01 42 00 00 00 · 00:47</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-current" />
            En conversation
          </span>
        </div>

        {/* Transcription */}
        <ol className="flex flex-col gap-2.5">
          <li className="self-start max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm">
            <span className="mb-0.5 block text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Appelant</span>
            Bonjour, je voudrais prendre rendez-vous pour une coupe.
          </li>
          <li className="self-end max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground">
            <span className="mb-0.5 block text-[10px] font-semibold tracking-wide text-primary-foreground/70 uppercase">Alex · Agent IA</span>
            Bonjour ! Bien sûr. Êtes-vous disponible jeudi à 14&nbsp;h&nbsp;30&nbsp;?
          </li>
          <li className="self-start max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm">
            Oui, parfait.
          </li>
          <li className="self-end max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground">
            <span className="mb-0.5 block text-[10px] font-semibold tracking-wide text-primary-foreground/70 uppercase">Alex · Agent IA</span>
            C&rsquo;est noté : jeudi 14&nbsp;h&nbsp;30 avec Camille. Je vous envoie un SMS de confirmation.
          </li>
        </ol>

        {/* Résultat */}
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-background px-3.5 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <RiCalendarCheckLine className="size-4" />
            </span>
            <p className="text-sm font-semibold">Rendez-vous confirmé</p>
          </div>
          <p className="font-mono text-xs text-muted-foreground">jeu. 14&nbsp;h&nbsp;30</p>
        </div>

        {/* Pied : micro + statuts */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <RiMicLine className="size-3.5" />
            </span>
            Reconnaissance vocale active
          </span>
          <span className="inline-flex items-center gap-1.5">
            <RiCheckLine className="size-3.5 text-emerald-500" />
            Résumé généré
          </span>
        </div>
      </div>
    </Placeholder>
  )
}
