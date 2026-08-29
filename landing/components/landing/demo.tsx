import { LiveCall } from "@/components/landing/live-call"

const steps = [
  {
    title: "Le client appelle",
    text: "Votre numéro habituel sonne — mais c'est votre agent qui décroche, avec votre nom, votre ton, votre langage.",
  },
  {
    title: "L'agent prend la main",
    text: "Il écoute, répond avec vos informations (services, horaires, tarifs, documents) et garde la conversation naturelle.",
  },
  {
    title: "Le rendez-vous est posé",
    text: "Réservation confirmée, SMS envoyé au client, résumé et enregistrement classés dans votre espace.",
  },
]

export function Demo() {
  return (
    <section id="demo" className="scroll-mt-24 border-y bg-muted/40 py-20 sm:py-28">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-5 md:px-8">
        <div className="flex max-w-2xl flex-col gap-4">
          <h2 className="text-balance text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:text-5xl">
            Trois étapes. Un rendez-vous de plus.
          </h2>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Voilà ce qui se passe quand le téléphone sonne chez vous — sans que vous
            ayez à y être.
          </p>
        </div>

        <ol className="grid gap-8 sm:grid-cols-3 sm:gap-6">
          {steps.map((s, i) => (
            <li key={s.title} className="relative flex flex-col gap-3">
              <span
                aria-hidden
                className="flex size-10 items-center justify-center rounded-full border bg-background text-base font-extrabold text-primary"
              >
                {i + 1}
              </span>
              <h3 className="text-lg font-bold tracking-tight">{s.title}</h3>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                {s.text}
              </p>
            </li>
          ))}
        </ol>

        {/* PLACEHOLDER d'animation n°3 — voir live-call.tsx */}
        <div className="flex justify-center">
          <LiveCall />
        </div>
      </div>
    </section>
  )
}
