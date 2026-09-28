import type { Metadata } from "next"
import { DM_Sans, Outfit, Geist_Mono } from "next/font/google"
import "./globals.css"
import "./landing.css"
const body=DM_Sans({subsets:["latin"],variable:"--font-body"})
const display=Outfit({subsets:["latin"],variable:"--font-display"})
const mono=Geist_Mono({subsets:["latin"],variable:"--font-mono"})
export const metadata:Metadata={title:"Standard IA — Un accueil plus serein pour votre cabinet",description:"L’assistant d’accueil IA pensé pour les cabinets dentaires. Des demandes structurées, des suivis clairs et votre équipe aux commandes.",openGraph:{type:"website",locale:"fr_FR",siteName:"Standard IA",title:"Standard IA — Plus de présence. Moins d’interruptions.",description:"L’accueil IA pensé pour les équipes dentaires."}}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr" className={`${body.variable} ${display.variable} ${mono.variable}`}><body><a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-white focus:p-3">Aller au contenu</a>{children}</body></html>}
