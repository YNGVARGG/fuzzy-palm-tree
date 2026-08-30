"use client"

import * as React from "react"
import { RiCheckLine, RiSparklingLine } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * TARIFS — montants INDICATIFS.
 * TODO (utilisateur) : confirmer les vrais prix dans `plans` ci-dessous
 * (et l'éventuelle remise annuelle dans `yearlyDiscount`).
 */

const yearlyDiscount = 0.2 // −20 % à l'année — à confirmer

const plans = [
  {
    name: "Solo",
    tagline: "Pour les indépendants qui veulent ne plus manquer un appel.",
    monthly: 49,
    features: [
      "1 numéro de téléphone",
      "Accueil et prise de messages",
      "Résumés d'appels",
      "Horaires d'ouverture",
      "Messages et rappels",
    ],
    cta: "Commencer",
    featured: false,
  },
  {
    name: "Pro",
    tagline: "Pour les équipes qui vivent du rendez-vous.",
    monthly: 99,
    features: [
      "Tout le plan Solo",
      "Prise de rendez-vous automatique",
      "Réponses depuis vos documents",
      "Après les heures d'ouverture",
      "Enregistrements et transcriptions",
      "Agent personnalisé (prénom, ton)",
    ],
    cta: "Essayer 14 jours",
    featured: true,
  },
  {
    name: "Sur mesure",
    tagline: "Pour les multi-sites et les intégrations poussées.",
    monthly: null,
    features: [
      "Plusieurs numéros et langues",
      "Intégration agenda / CRM",
      "Marque blanche",
      "Accompagnement dédié",
    ],
    cta: "Nous contacter",
    featured: false,
  },
]

export function Pricing() {
  const [yearly, setYearly] = React.useState(false)

  return (
    <section id="tarifs" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12 px-5 md:px-8">
        <div className="flex max-w-2xl flex-col items-center gap-5 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:text-5xl">
            Un agent, trois façons de l&rsquo;embaucher.
          </h2>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Payez pour votre agent, pas pour les minutes&nbsp;: chaque plan couvre
            les appels reçus, sans surprise.
          </p>
          <div role="group" aria-label="Période de facturation" className="flex items-center gap-3">
            <span
              className={cn(
                "text-sm font-medium",
                !yearly ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Mensuel
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={yearly}
              aria-label="Basculer entre facturation mensuelle et annuelle"
              onClick={() => setYearly((v) => !v)}
              className={cn(
                "relative h-7 w-12 rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                yearly ? "border-primary bg-primary" : "border-border bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 size-5 rounded-full bg-background shadow-sm transition-transform",
                  yearly && "translate-x-5"
                )}
              />
            </button>
            <span
              className={cn(
                "text-sm font-medium",
                yearly ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Annuel
            </span>
            <Badge variant="secondary">−20&nbsp;%</Badge>
          </div>
        </div>

        <div className="grid w-full gap-5 lg:grid-cols-3">
          {plans.map((p) => {
            const price =
              p.monthly === null
                ? null
                : yearly
                  ? Math.round(p.monthly * (1 - yearlyDiscount))
                  : p.monthly
            return (
              <article
                key={p.name}
                className={cn(
                  "relative flex flex-col gap-6 rounded-xl border bg-card p-7",
                  p.featured &&
                    "border-primary/60 shadow-[0_24px_64px_-32px_color-mix(in_oklch,var(--primary),transparent_50%)]"
                )}
              >
                {p.featured ? (
                  <Badge className="absolute -top-3 left-7">
                    <RiSparklingLine data-icon="inline-start" className="size-3" />
                    Le plus choisi
                  </Badge>
                ) : null}
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-xl font-bold tracking-tight">{p.name}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{p.tagline}</p>
                </div>
                <div className="flex items-baseline gap-1.5">
                  {price === null ? (
                    <span className="text-4xl font-extrabold tracking-[-0.02em]">Sur devis</span>
                  ) : (
                    <>
                      <span className="text-5xl font-extrabold tracking-[-0.02em]">{price}€</span>
                      <span className="text-sm text-muted-foreground">/ mois</span>
                    </>
                  )}
                </div>
                <ul className="flex flex-col gap-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <RiCheckLine className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={p.featured ? "default" : "outline"}
                  size="lg"
                  render={<a href="#cta" />}
                  nativeButton={false}
                  className="mt-auto w-full"
                >
                  {p.cta}
                </Button>
              </article>
            )
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Tarifs indicatifs — un appel d&rsquo;essai vous est offert, sans engagement.
        </p>
      </div>
    </section>
  )
}
