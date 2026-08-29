export function Problem() {
  return (
    <section aria-label="Le problème" className="border-y bg-muted/40">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:py-20 md:grid-cols-[1.2fr_1fr] md:px-8">
        <h2 className="text-balance text-2xl font-bold tracking-[-0.02em] sm:text-3xl lg:text-4xl">
          Chaque appel manqué est un client qui appelle ailleurs.
        </h2>
        <div className="flex flex-col justify-center gap-5 text-pretty leading-relaxed text-muted-foreground">
          <p>
            Le téléphone sonne pendant un rendez-vous, un service, une livraison. Le
            client raccroche — et il ne rappelle pas toujours.
          </p>
          <p>
            C&rsquo;est une réservation perdue, une question sans réponse, un rappel
            oublié. Puis un avis, une étoile, un concurrent.
          </p>
        </div>
      </div>
    </section>
  )
}
