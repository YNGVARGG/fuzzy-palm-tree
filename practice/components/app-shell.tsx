"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { BarChart3, CalendarCheck, FileText, LayoutDashboard, Megaphone, Moon, PhoneCall, Settings, Sparkles, Sun } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePractice } from "@/components/practice-context"
import { cn } from "@/lib/utils"

function ToothMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 5.5c-1.6-1.4-3.9-2-6.2-1C3.9 5.4 3 7.9 3.4 10.4c.3 1.9.9 3.3 1.6 4.9.7 1.6 1.1 3.7 1.7 5.4.2.6.4 1.3 1 1.3.9 0 1-1.2 1.2-2.2.3-1.3.5-2.6 1.2-3.6.5-.7 1.3-1.1 2-1.1s1.5.4 2 1.1c.7 1 .9 2.3 1.2 3.6.2 1 .3 2.2 1.2 2.2.6 0 .8-.7 1-1.3.6-1.7 1-3.8 1.7-5.4.7-1.6 1.3-3 1.6-4.9.4-2.5-.5-5-2.4-5.9-2.3-1-4.6-.4-6.2 1Z"
        fill="currentColor"
      />
    </svg>
  )
}

const NAV = [
  { href: "/", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/calls", label: "Appels", icon: PhoneCall },
  { href: "/bookings", label: "Rendez-vous", icon: CalendarCheck },
  { href: "/campaigns", label: "Campagnes", icon: Megaphone },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/performance", label: "Performances", icon: BarChart3 },
  { href: "/settings", label: "Réglages", icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const { tenant, agentUp, demoEnabled, setDemoEnabled } = usePractice()

  if (pathname.startsWith("/schedule")) return <>{children}</>

  return (
    <div className="flex min-h-svh">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-svh w-64 flex-col border-r bg-sidebar p-4 md:flex">
        <div className="flex items-center gap-2.5 px-1">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ToothMark className="size-5" />
          </div>
          <div>
            <p className="font-heading text-sm font-semibold leading-none">Standard IA</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Réceptionniste dentaire</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-1.5">
          {NAV.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl border p-2.5">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Agent</p>
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <span className={cn("size-2 rounded-full", agentUp ? "bg-emerald-500" : "bg-red-500")} />
                {agentUp ? "En ligne" : "Hors ligne"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Basculer le thème"
            >
              {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar (all screens) */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ToothMark className="size-4" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-sm font-semibold md:text-base">{tenant?.name ?? "Chargement…"}</p>
            {tenant ? <p className="hidden text-xs text-muted-foreground md:block">{tenant.tagline}</p> : null}
          </div>
          {demoEnabled ? (
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setDemoEnabled(false)}>
              <Sparkles className="size-3.5" /> Démo
            </Button>
          ) : null}
          <Badge variant={agentUp ? "default" : "secondary"} className="hidden sm:inline-flex">
            {agentUp ? "Agent en ligne" : "Agent hors ligne"}
          </Badge>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b px-3 py-2 md:hidden">
          {NAV.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  )
}