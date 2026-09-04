import { DM_Sans, Geist_Mono, Outfit } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { PracticeProvider } from "@/components/practice-context"
import { AppShell } from "@/components/app-shell"
import { cn } from "@/lib/utils"

const outfitHeading = Outfit({ subsets: ["latin"], variable: "--font-heading" })
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className={cn("antialiased", fontMono.variable, "font-sans", dmSans.variable, outfitHeading.variable)}>
      <body>
        <ThemeProvider>
          <PracticeProvider>
            <AppShell>{children}</AppShell>
          </PracticeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
