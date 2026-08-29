import { RiCustomerService2Line, RiLinkedinLine, RiTwitterXLine } from "@remixicon/react"

const columns = [
  {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "#fonctionnalites" },
      { label: "La démo", href: "#demo" },
      { label: "Tarifs", href: "#tarifs" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Entreprise",
    links: [
      { label: "Manifeste", href: "#top" },
      { label: "Confidentialité", href: "#top" },
      { label: "Mentions légales", href: "#top" },
    ],
  },
  {
    title: "Contact",
    links: [
      // TODO (utilisateur) : remplacer par les vraies coordonnées.
      { label: "bonjour@standard-ia.fr", href: "mailto:bonjour@standard-ia.fr" },
      { label: "01 84 00 00 00", href: "tel:+33184000000" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-5 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <a href="#top" className="flex w-fit items-center gap-2.5 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <RiCustomerService2Line className="size-5" />
              </span>
              <span className="text-[15px] font-bold tracking-tight">Standard&nbsp;IA</span>
            </a>
            <p className="max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
              Chaque entreprise a son agent. Données locales, aucune fuite vers le
              cloud.
            </p>
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-sm font-semibold tracking-wide text-foreground">{col.title}</h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-sm"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Standard&nbsp;IA — Tous droits réservés.
          </p>
          <div className="flex items-center gap-2">
            <a
              href="#top"
              aria-label="LinkedIn (lien à configurer)"
              className="flex size-9 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <RiLinkedinLine className="size-4" />
            </a>
            <a
              href="#top"
              aria-label="X / Twitter (lien à configurer)"
              className="flex size-9 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <RiTwitterXLine className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
