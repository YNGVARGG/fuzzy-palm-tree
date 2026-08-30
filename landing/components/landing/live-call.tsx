import { RiPlayLine, RiStopLine, RiVoiceprintLine } from "@remixicon/react"

import { Placeholder, SyntheticTag } from "@/components/landing/placeholder"
import { Waveform } from "@/components/landing/waveform"
import { Button } from "@/components/ui/button"

/**
 * APPEL EN DIRECT — panneau de démonstration (PLACEHOLDER d'animation n°3).
 *
 * TODO (à construire par l'utilisateur) : animer ce panneau —
 *   - transcript qui défile en temps réel (apparition ligne par ligne),
 *   - minuteur qui tourne,
 *   - bouton lecture relié à un vrai extrait audio (voir waveform.tsx).
 * Le bouton lecture est volontairement désactivé tant que l'extrait n'existe pas.
 */
export function LiveCall() {
  return (
    <Placeholder label="Appel en direct (transcript + onde)" className="w-full max-w-2xl">
      <div className="relative flex flex-col gap-5 rounded-xl border bg-card p-6 sm:p-8">
        <SyntheticTag />

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <RiVoiceprintLine className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Extrait d&rsquo;un appel réel</p>
              <p className="font-mono text-xs text-muted-foreground">01:24 · Salon Camille</p>
            </div>
          </div>
          <Button variant="outline" size="icon-lg" disabled aria-label="Lecture — extrait audio à venir">
            <RiPlayLine className="size-5" />
          </Button>
        </div>

        <Waveform />

        <ol className="flex flex-col gap-2.5 text-sm">
          <li className="self-start max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2">
            Bonjour, c&rsquo;est pour une coupe et une coloration samedi&nbsp;?
          </li>
          <li className="self-end max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-primary-foreground">
            Bonjour&nbsp;! Samedi il nous reste 10&nbsp;h&nbsp;30 ou 14&nbsp;h. La
            coloration avec Camille dure environ 2&nbsp;heures.
          </li>
          <li className="self-start max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2">
            10&nbsp;h&nbsp;30, c&rsquo;est parfait.
          </li>
        </ol>

        <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
          <span>Confirmation envoyée par SMS</span>
          <span className="inline-flex items-center gap-1.5">
            <RiStopLine className="size-3.5" />
            Fin de l&rsquo;appel
          </span>
        </div>
      </div>
    </Placeholder>
  )
}
