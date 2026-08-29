import { RiArrowRightLine, RiPlayCircleLine } from "@remixicon/react"

import { PhoneDemo } from "@/components/landing/phone-demo"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20">
      {/* Halo discret d'ambiance — pas un décor gratuit : il éclaire la démo comme un projecteur */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-12rem] left-1/2 h-[28rem] w-[52rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]"
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-5 md:px-8">
        <div className="flex max-w-3xl flex-col items-center text-center">
          <h1 className="text-balance text-4xl font-extrabold tracking-[-0.03em] sm:text-6xl lg:text-7xl">
            Plus jamais d&rsquo;appel{" "}
            <span className="text-primary">manqué</span>
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Standard&nbsp;IA est l&rsquo;agent téléphonique de votre entreprise&nbsp;: il
            répond à chaque appel, prend les rendez-vous, répond aux questions de vos
            documents — et tout est résumé et enregistré pour vous.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Button size="lg" render={<a href="#tarifs" />} className="w-full px-7 text-base sm:w-auto">
              Essayer gratuitement
              <RiArrowRightLine data-icon="inline-end" className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<a href="#demo" />}
              className="w-full px-7 text-base sm:w-auto"
            >
              <RiPlayCircleLine data-icon="inline-start" className="size-4" />
              Voir la démo
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Sans carte bancaire&nbsp;·&nbsp;Prêt en 10&nbsp;minutes&nbsp;·&nbsp;En français
          </p>
        </div>

        {/* La preuve : un appel réellement pris en charge.
            PLACEHOLDER d'animation n°1 — voir phone-demo.tsx */}
        <div className="mt-16 w-full sm:mt-20">
          <PhoneDemo />
        </div>
      </div>
    </section>
  )
}
