const faqs = [
  {
    q: "Comment ça s'installe ?",
    a: "En 10 minutes : vous choisissez de rediriger votre numéro existant vers l'agent, ou nous vous fournissons un nouveau numéro. Aucun logiciel à installer, aucune ligne à changer.",
  },
  {
    q: "Est-ce que l'agent comprend vraiment mon activité ?",
    a: "Oui. Vous lui donnez votre profil (nom, horaires, services, FAQ, consignes) et, si vous le souhaitez, vos documents : il répond alors avec vos informations exactes — tarifs, garanties, guides — pas avec des généralités.",
  },
  {
    q: "Que se passe-t-il après les heures d'ouverture ?",
    a: "L'agent explique vos horaires, prend un message ou une demande de rappel avec la promesse que vous rappellerez — et vous retrouvez tout dans votre espace au matin.",
  },
  {
    q: "Les appels sont-ils enregistrés ?",
    a: "Chaque appel donne lieu à une transcription, un résumé généré par l'IA et, quand disponible, l'enregistrement audio. Vous restez propriétaire de ces données.",
  },
  {
    q: "Dans quelles langues parle-t-il ?",
    a: "Français et anglais, avec le prénom que vous choisissez pour votre agent. Le ton et les consignes se règlent dans votre espace.",
  },
  {
    q: "Et si un client veut vraiment me parler ?",
    a: "Vous définissez les règles : transfert vers votre mobile, prise de message, ou proposition de rappel. L'agent suit vos consignes, jamais l'inverse.",
  },
]

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 border-t bg-muted/40 py-20 sm:py-28">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-5 md:px-8">
        <div className="flex max-w-2xl flex-col gap-4">
          <h2 className="text-balance text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:text-5xl">
            Les questions qu&rsquo;on nous pose au téléphone.
          </h2>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Et les réponses qu&rsquo;on aurait aimé avoir en un appel.
          </p>
        </div>

        <div className="flex flex-col divide-y divide-border border-y">
          {faqs.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                <span className="text-base font-semibold tracking-tight sm:text-lg">{f.q}</span>
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-transform duration-200 group-open:rotate-45"
                >
                  <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 1v10M1 6h10" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="max-w-2xl pb-6 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
