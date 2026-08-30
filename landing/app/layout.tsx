import type { Metadata, Viewport } from "next"
import { Geist_Mono, Raleway } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Standard IA — Chaque entreprise a son agent téléphonique",
    template: "%s — Standard IA",
  },
  description:
    "L'agent téléphonique IA de votre entreprise : il répond à chaque appel, prend les rendez-vous, répond aux questions de vos documents et ne laisse plus jamais sonner dans le vide.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Standard IA",
    title: "Standard IA — Chaque entreprise a son agent téléphonique",
    description:
      "L'agent téléphonique IA de votre entreprise : il répond à chaque appel, prend les rendez-vous et ne laisse plus jamais sonner dans le vide.",
  },
  twitter: {
    card: "summary",
    title: "Standard IA — Chaque entreprise a son agent téléphonique",
    description:
      "L'agent téléphonique IA de votre entreprise : il répond, prend les rendez-vous et résume chaque appel.",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
  colorScheme: "light dark",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", raleway.variable)}
    >
      <body>
        {/*
        CONTRAT DE DIRECTION — landing (code-led, voir .dsh/skills/impeccable).
        THESIS : une landing qui prouve le produit dès le premier écran — un appel
        en cours, pas une promesse ; refuse le héros-métrique et l'empilement de
        cartes identiques.
        OWN-WORLD : hérité du système existant — pierre neutre (oklch) sur fond
        clair ou noir chaud, indigo électrique en accent unique, Raleway (sans
        géométrique) en display et texte, Geist Mono pour les détails téléphoniques
        (numéros, minutage, transcript). Coins arrondis (radius 0.875rem), lignes
        fines, ombres douces à décalage réel.
        STORY : le visiteur entend « plus jamais d'appel manqué », voit un appel
        réellement pris en charge (transcript, rendez-vous posé), croit que son
        entreprise peut l'avoir en quelques minutes.
        FIRST VIEWPORT : nav fine ; titre énorme « Plus jamais d'appel manqué » ;
        sous-titre et double CTA ; démo d'appel animée (PLACEHOLDER) centrée en
        bas du viewport — téléphone, bulles de transcript, rendez-vous confirmé.
        FORM : structure à démonstration (démo = preuve), sections à densité
        variable ; signature = la démo d'appel. Placeholders d'animation marqués.
        FINISH : « unreviewed and undocumented is unfinished; this build ends
        with the finish review, the verdict, DESIGN.md, and every shipping raster
        carrying its provenance »
        */}
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only z-[60] rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            Aller au contenu
          </a>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
