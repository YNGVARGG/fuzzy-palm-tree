"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { BarChart3, CalendarCheck, FileText, Inbox, LayoutDashboard, Megaphone, Moon, PhoneCall, Settings, Sparkles, Sun, Menu, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"
import { usePractice } from "@/components/practice-context"
import { cn } from "@/lib/utils"

const GROUPS = [
  {label:"ESPACE DE TRAVAIL",items:[
    {href:"/",label:"Aujourd’hui",icon:LayoutDashboard},
    {href:"/inbox",label:"Boîte de réception",icon:Inbox},
    {href:"/calls",label:"Appels",icon:PhoneCall},
    {href:"/bookings",label:"Rendez-vous",icon:CalendarCheck},
  ]},
  {label:"PILOTAGE",items:[
    {href:"/performance",label:"Rapports",icon:BarChart3},
    {href:"/documents",label:"Connaissances",icon:FileText},
    {href:"/campaigns",label:"Campagnes",icon:Megaphone},
    {href:"/settings",label:"Réglages",icon:Settings},
  ]},
]

function Brand(){return <div className="flex items-center gap-3 px-2 py-2"><Image src="/standard-bird.png" width={40} height={40} alt="" className="rounded-xl"/><div><p className="font-heading text-lg font-semibold tracking-tight">Standard<span className="text-teal-300"> IA</span></p><p className="text-xs text-slate-400">L’accueil de votre cabinet</p></div></div>}

export function AppShell({children}:{children:React.ReactNode}) {
  const pathname=usePathname()
  const {resolvedTheme,setTheme}=useTheme()
  const {tenant,tenantId,agentUp,demoEnabled,setDemoEnabled}=usePractice()
  const [mobileOpen,setMobileOpen]=useState(false)
  if(pathname === "/login" || pathname.startsWith("/schedule")) return <>{children}</>
  const active=(href:string)=>href==="/"?pathname==="/":pathname===href||pathname.startsWith(href+"/")
  const current=GROUPS.flatMap(g=>g.items).find(i=>active(i.href))
  const navigation=<nav aria-label="Navigation principale" className="mt-8 space-y-7">{GROUPS.map(group=><div key={group.label}><p className="mb-3 px-3 text-xs font-medium tracking-widest text-slate-400">{group.label}</p><div className="space-y-1">{group.items.map(item=><Link key={item.href} href={item.href} onClick={()=>setMobileOpen(false)} aria-current={active(item.href)?"page":undefined} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",active(item.href)?"bg-teal-400/15 font-semibold text-teal-200 ring-1 ring-teal-400/20":"text-slate-300 hover:bg-white/5 hover:text-white")}><item.icon className="size-[18px] shrink-0" />{item.label}</Link>)}</div></div>)}</nav>
  return <div className="workspace-shell flex min-h-svh">
    <a href="#main-content" className="sr-only z-50 focus:not-sr-only focus:absolute focus:bg-background focus:p-4">Aller au contenu</a>
    <aside className="workspace-sidebar sticky top-0 hidden h-svh w-60 shrink-0 flex-col overflow-y-auto px-4 py-5 lg:flex"><Brand />{navigation}<div className="mt-auto pt-8"><div className="rounded-xl border border-white/10 p-3"><p className="text-sm font-medium text-white">Votre équipe garde la main</p><Link href="/inbox" className="mt-2 flex items-center justify-between text-xs text-slate-300 hover:text-white">Consulter les demandes <ArrowUpRight className="size-4" /></Link></div></div></aside>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-20 flex min-h-[72px] items-center gap-3 border-b bg-card/95 px-4 backdrop-blur lg:px-8">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Ouvrir le menu" />}><Menu className="size-5" /></SheetTrigger><SheetContent side="left" className="workspace-sidebar px-4"><SheetHeader className="px-2 pb-0"><SheetTitle className="text-white">Standard IA</SheetTitle><SheetDescription className="text-slate-400">Espace du cabinet</SheetDescription></SheetHeader>{navigation}</SheetContent></Sheet>
        <p className="hidden text-sm font-medium text-muted-foreground xl:block">{current?.label??"Espace du cabinet"}</p>
        <div className="min-w-0 flex-1 xl:ml-6">
          <p className="truncate text-sm font-semibold">{tenant?.name??"Chargement du cabinet…"}</p>
        </div>
        {demoEnabled?<Button size="sm" variant="secondary" onClick={()=>setDemoEnabled(false)}><Sparkles className="size-4" /><span className="hidden sm:inline">Données démo</span></Button>:null}
        <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><span className={cn("size-2 rounded-full",agentUp===null?"bg-slate-400":agentUp?"bg-emerald-500":"bg-amber-500")} />{agentUp===null?"Vérification…":agentUp?"Agent connecté":"Agent déconnecté"}</span>
        <Button variant="ghost" size="icon" aria-label="Basculer le thème" onClick={()=>setTheme(resolvedTheme==="dark"?"light":"dark")}><Sun className="hidden size-4 dark:block" /><Moon className="size-4 dark:hidden" /></Button>
        <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>Déconnexion</Button>
      </header>
      <main key={`${tenantId}:${pathname}`} id="main-content" className="workspace-page mx-auto w-full max-w-[1480px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  </div>
}
