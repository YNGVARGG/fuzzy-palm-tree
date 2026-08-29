import { Placeholder } from "@/components/landing/placeholder"

const businesses = [
  "Atelier de coiffure",
  "Cabinet médical",
  "Garage automobile",
  "Clinique vétérinaire",
  "Studio de yoga",
  "Boulangerie artisanale",
  "Cabinet d'architecte",
  "Salle de sport",
]

/**
 * BANDEAU D'ENTREPRISES — stand-in statique (PLACEHOLDER d'animation n°5).
 *
 * TODO (à construire par l'utilisateur) : transformer cette rangée en marquee —
 * défilement horizontal continu (CSS keyframes, GSAP ou Lenis + ScrollTrigger),
 * avec les vrais noms de clients quand ils existeront. Les noms ci-dessous sont
 * une maquette (voir la pastille « Maquette »).
 */
export function BusinessCloud() {
  return (
    <section aria-label="Ils utilisent Standard IA" className="py-14 sm:py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-5 md:px-8">
        <p className="text-center text-sm font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Chaque entreprise a son agent
        </p>
        <Placeholder label="Marquee clients (défilement)" className="w-full">
          <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-6 sm:gap-x-14">
            {businesses.map((name) => (
              <li
                key={name}
                className="text-base font-bold tracking-tight text-foreground/40 transition-colors hover:text-foreground/70 sm:text-lg"
              >
                {name}
              </li>
            ))}
          </ul>
        </Placeholder>
      </div>
    </section>
  )
}
