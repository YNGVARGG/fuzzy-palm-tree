import { RiChatQuoteLine, RiStarFill } from "@remixicon/react"

import { SyntheticTag } from "@/components/landing/placeholder"

/**
 * TÉMOIGNAGES — contenu ILLUSTRATIF (maquette).
 * TODO (utilisateur) : remplacer par de vrais témoignages clients
 * (nom, entreprise, propos) quand ils existeront. Les noms et citations
 * ci-dessous sont fictifs — la pastille « Maquette » le signale.
 */
const testimonials = [
  {
    name: "Sophie Moreau",
    role: "Gérante — Atelier de coiffure, Lyon",
    quote:
      "Avant, je décrochais entre deux coupes. Maintenant c'est l'agent qui répond, et le rendez-vous est déjà posé quand je rappelle le client. Je ne savais pas que je perdais autant d'appels.",
    featured: true,
  },
  {
    name: "Karim Benali",
    role: "Cabinet dentaire, Nantes",
    quote:
      "Le soir et le week-end, les urgences laissent un message et sont rappelées le lundi matin, dans l'ordre. Plus aucune demande perdue.",
    featured: false,
  },
  {
    name: "Claire Delattre",
    role: "Clinique vétérinaire, Bordeaux",
    quote:
      "Il répond avec nos vrais tarifs et nos vrais horaires — les clients ne voient même pas la différence.",
    featured: false,
  },
]

export function Testimonials() {
  return (
    <section aria-label="Témoignages" className="py-20 sm:py-28">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-5 md:px-8">
        <div className="flex max-w-2xl flex-col gap-4">
          <h2 className="text-balance text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:text-5xl">
            Ils ont remis le téléphone au travail.
          </h2>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Des commerces, des cabinets, des ateliers — qui ont cessé de courir
            après le téléphone.
          </p>
          <p className="inline-flex w-fit items-center gap-2 rounded-full border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <RiChatQuoteLine className="size-3.5" />
            Témoignages illustratifs — à remplacer par les vrais
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className={
                "relative flex flex-col justify-between gap-6 rounded-xl border bg-card p-6 sm:p-7 " +
                (t.featured ? "md:col-span-2" : "md:col-span-1")
              }
            >
              <SyntheticTag />
              <div className="flex flex-col gap-4">
                <span role="img" aria-label="5 étoiles sur 5" className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <RiStarFill key={i} className="size-4" />
                  ))}
                </span>
                <blockquote className="text-pretty text-sm leading-relaxed sm:text-[15px]">
                  «&nbsp;{t.quote}&nbsp;»
                </blockquote>
              </div>
              <figcaption className="flex flex-col gap-0.5">
                <span className="text-sm font-bold tracking-tight">{t.name}</span>
                <span className="text-xs text-muted-foreground">{t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
