import {
  RiCalendarCheckLine,
  RiFileList3Line,
  RiFileTextLine,
  RiGlobalLine,
  RiMoonLine,
  RiPhoneLine,
} from "@remixicon/react"

const features = [
  {
    icon: RiPhoneLine,
    title: "Répond à chaque appel",
    text: "Votre numéro, votre horaire : quand vous ne pouvez pas décrocher, l'agent le fait à votre place — et il ne raccroche jamais brutalement.",
    detail: "Sonnerie → réponse en moins de 2 secondes",
  },
  {
    icon: RiCalendarCheckLine,
    title: "Prend les rendez-vous",
    text: "Il connaît vos services et vos créneaux, propose les disponibilités et confirme la réservation — sans double-emploi dans votre agenda.",
    detail: "Synchronisation agenda en option",
  },
  {
    icon: RiFileTextLine,
    title: "Répond avec vos documents",
    text: "Tarifs, garanties, guides, politique : indexez vos fichiers, l'agent répond aux questions précises avec vos propres informations.",
    detail: "Indexation automatique des .txt et .md",
  },
  {
    icon: RiMoonLine,
    title: "Veille après les heures d'ouverture",
    text: "Le soir et le week-end, il prend le message, explique les horaires et promet un rappel — plus aucun appel perdu dans le vide.",
    detail: "Consigne de fermeture personnalisable",
  },
  {
    icon: RiFileList3Line,
    title: "Résume et enregistre chaque appel",
    text: "Transcription, résumé généré par l'IA et audio : tout ce qui s'est dit au téléphone, consultable et classé.",
    detail: "Consultable dans votre espace",
  },
  {
    icon: RiGlobalLine,
    title: "Parle la langue de vos clients",
    text: "Français ou anglais, avec le prénom que vous choisissez pour votre agent. L'entreprise reste au centre de la conversation.",
    detail: "Agent personnalisé : prénom, ton, consignes",
  },
]

export function Features() {
  return (
    <section id="fonctionnalites" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-5 md:px-8">
        <div className="flex max-w-2xl flex-col gap-4">
          <h2 className="text-balance text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:text-5xl">
            Un agent, tout le travail de standard.
          </h2>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Pas un répondeur&nbsp;: un employé qui connaît votre entreprise par cœur
            et qui ne rate jamais un appel.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-6">
          {features.map((f, i) => {
            const Icon = f.icon
            const span =
              i === 0 ? "md:col-span-4" : i === 1 ? "md:col-span-2" : "md:col-span-2"
            return (
              <article
                key={f.title}
                className={
                  "group relative flex flex-col justify-between gap-8 overflow-hidden rounded-[calc(var(--radius)*1.4)] border bg-card p-6 transition-shadow hover:shadow-[0_16px_48px_-24px_color-mix(in_oklch,var(--foreground),transparent_60%)] sm:p-7 " +
                  span
                }
              >
                <div className="flex flex-col gap-4">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="text-lg font-bold tracking-tight sm:text-xl">{f.title}</h3>
                  <p className="max-w-prose text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                    {f.text}
                  </p>
                </div>
                <p className="inline-flex w-fit items-center rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                  {f.detail}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
