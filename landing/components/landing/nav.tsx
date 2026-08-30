"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { RiCloseLine, RiCustomerService2Line, RiMenuLine, RiMoonLine, RiSunLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const links = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#demo", label: "La démo" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#faq", label: "FAQ" },
]

export function Nav() {
  const { resolvedTheme, setTheme } = useTheme()
  const [open, setOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  // « Hydraté ? » sans effet de bord — motif useSyncExternalStore (lint-clean).
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 md:px-8"
      >
        <a href="#top" className="flex items-center gap-2.5 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <RiCustomerService2Line className="size-5" />
          </span>
          <span className="text-[15px] font-bold tracking-tight">
            Standard&nbsp;IA
          </span>
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Changer de thème (clair / sombre)"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {mounted && resolvedTheme === "dark" ? <RiSunLine className="size-4" /> : <RiMoonLine className="size-4" />}
          </Button>
          <Button render={<a href="#tarifs" />} nativeButton={false} size="lg" className="hidden sm:inline-flex">
            Essayer gratuitement
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <RiCloseLine className="size-5" /> : <RiMenuLine className="size-5" />}
          </Button>
        </div>
      </nav>

      {open ? (
        <div id="mobile-menu" className="border-t border-border/60 bg-background/95 backdrop-blur-md md:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-base font-medium text-foreground/90 transition-colors hover:bg-muted"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="mt-2">
              <Button render={<a href="#tarifs" onClick={() => setOpen(false)} />} nativeButton={false} size="lg" className="w-full">
                Essayer gratuitement
              </Button>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  )
}
