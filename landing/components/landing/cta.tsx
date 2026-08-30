import { RiArrowRightLine, RiPhoneLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"

export function Cta() {
  return (
    <section id="cta" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center sm:px-12 sm:py-20">
          {/* Halo interne : éclaire le bandeau sans décor gratuit */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary-foreground/15 blur-[100px]"
          />
          <div className="relative flex flex-col items-center gap-6">
            <h2 className="max-w-2xl text-balance text-3xl font-extrabold tracking-[-0.02em] text-primary-foreground sm:text-4xl lg:text-5xl">
              Votre entreprise mérite de répondre.
            </h2>
            <p className="max-w-xl text-pretty text-base leading-relaxed text-primary-foreground/80 sm:text-lg">
              Un appel d&rsquo;essai gratuit, un numéro en 10&nbsp;minutes. Écoutez
              votre agent prendre son premier rendez-vous.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="bg-primary-foreground px-7 text-base text-primary hover:bg-primary-foreground/90"
                render={<a href="#top" />}
                nativeButton={false}
              >
                Essayer gratuitement
                <RiArrowRightLine data-icon="inline-end" className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="px-7 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                render={<a href="#demo" />}
                nativeButton={false}
              >
                <RiPhoneLine data-icon="inline-start" className="size-4" />
                Revoir la démo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
