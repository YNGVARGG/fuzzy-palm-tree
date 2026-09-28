"use client"
import { useEffect, useState } from "react"
import { signIn } from "next-auth/react"
import { Mail, CalendarCheck, PhoneCall, ShieldCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function LoginForm({ providers, initialSent = false, initialError = false, initialLimited = false }: { providers: string[]; initialSent?: boolean; initialError?: boolean; initialLimited?: boolean }) {
  const [busy, setBusy] = useState("")
  const limitedMessage = "Plusieurs liens ont déjà été demandés. Utilisez un lien récent encore inutilisé ou attendez 15 minutes avant de réessayer."
  const [error, setError] = useState(initialLimited ? limitedMessage : initialError ? "Ce lien est expiré, déjà utilisé ou non autorisé. Demandez un nouveau lien ou contactez votre administrateur." : "")
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(initialSent)
  const [cooldown, setCooldown] = useState(0)
  const coolingDown = cooldown > 0
  useEffect(() => {
    if (!coolingDown) return
    const timer = window.setInterval(() => setCooldown(value => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [coolingDown])
  async function connect(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    setBusy("email"); setError("")
    try {
      const result = await signIn("email", { email, redirect: false, redirectTo: "/" })
      if (result?.url && new URL(result.url, window.location.origin).searchParams.get("retry") === "1") setError(limitedMessage)
      else if (result?.error) setError("L’envoi est indisponible pour le moment. Réessayez dans quelques minutes.")
      else { setSent(true); setCooldown(60) }
    } catch { setError("La connexion a échoué. Réessayez.") }
    finally { setBusy("") }
  }  return <div className="login-surface min-h-svh bg-[#f5f8f9] text-[#182b38] lg:grid lg:grid-cols-2">
    <section className="relative hidden flex-col overflow-hidden bg-[#102832] p-12 text-white lg:flex xl:p-16">
      <div className="flex items-center gap-3 font-heading text-xl font-semibold"><Image src="/standard-bird.png" width={40} height={40} alt="" className="rounded-xl"/>Standard <span className="-ml-2 text-teal-300">IA</span></div>
      <div className="my-auto py-16"><p className="mb-5 text-xs font-medium uppercase tracking-[.2em] text-teal-200">L’accueil, en toute simplicité</p><h1 className="max-w-lg font-heading text-5xl font-medium leading-[1.12] tracking-tight">Votre équipe soigne.<br /><span className="text-teal-300">Votre accueil suit.</span></h1><p className="mt-6 max-w-md text-base leading-relaxed text-slate-300">Les appels, les demandes de rendez-vous et les suivis de votre cabinet, réunis dans un seul espace.</p>
      <div className="mt-10 max-w-md rounded-2xl border border-white/10 bg-white/5 p-5"><div className="mb-5 flex items-center justify-between"><span className="text-xs text-slate-400">Un quotidien mieux organisé</span><Sparkles className="size-4 text-teal-300" /></div>{[{icon:PhoneCall,title:"Chaque demande trouve sa place",text:"Un accueil adapté à votre cabinet."},{icon:CalendarCheck,title:"Votre équipe garde la main",text:"Les suivis importants restent visibles."}].map(x=><div key={x.title} className="flex gap-3 py-3"><x.icon className="mt-1 size-5 text-teal-300" /><div><p className="text-sm font-medium">{x.title}</p><p className="mt-1 text-sm text-slate-400">{x.text}</p></div></div>)}</div></div>
      <p className="text-xs text-slate-400">Pensé pour les équipes dentaires.</p>
    </section>
    <section className="flex min-h-svh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm"><div className="mb-12 flex items-center gap-2 text-lg font-semibold lg:hidden"><Image src="/standard-bird.png" width={32} height={32} alt="" className="rounded-lg"/>Standard IA</div><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-teal-700">Espace du cabinet</p><h2 className="font-heading text-3xl font-semibold tracking-tight">Heureux de vous retrouver.</h2><p className="mt-3 text-sm leading-relaxed text-slate-500">Saisissez votre email professionnel. Nous vous envoyons un lien personnel pour ouvrir votre cabinet.</p>
      {sent ? <div role="status" className="mt-8 rounded-2xl border border-teal-200 bg-teal-50 p-5"><Mail className="mb-3 size-6 text-teal-700"/><h3 className="font-semibold">Consultez votre boîte mail</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">Si cette adresse dispose d’un accès au cabinet, vous recevrez un lien personnel valable 15 minutes. Après une déconnexion, demandez un nouveau lien : un lien déjà utilisé ne fonctionne plus. Pensez à vérifier vos indésirables.</p>{email && <Button className="mt-4 w-full" variant="outline" disabled={Boolean(busy)||coolingDown} onClick={()=>void connect()}>{busy?"Envoi…":coolingDown?`Renvoyer dans ${cooldown} s`:"Renvoyer un lien"}</Button>}<Button variant="ghost" className="mt-3" onClick={()=>setSent(false)}>Utiliser une autre adresse</Button></div> : <form onSubmit={connect} className="mt-8 space-y-4"><div><label htmlFor="login-email" className="mb-2 block text-sm font-medium">Email professionnel</label><input id="login-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@cabinet.fr" className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"/></div><Button type="submit" disabled={Boolean(busy)||!providers.includes("email")} className="h-12 w-full gap-3 rounded-xl bg-[#182b38] text-white hover:bg-[#263e4c]"><Mail className="size-4"/>{busy?"Envoi en cours…":"Recevoir mon lien de connexion"}</Button><p className="text-xs leading-relaxed text-slate-500">Un lien sécurisé, sans mot de passe. Utilisez l’adresse invitée par votre cabinet.</p></form>}      {!providers.includes("email")?<p role="status" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">La connexion de ce cabinet est en cours de configuration. Votre administrateur vous préviendra dès que votre accès sera prêt.</p>:null}
      {error?<p role="alert" className="mt-4 text-sm text-red-700">{error}</p>:null}
      <div className="mt-8 flex items-start gap-3 border-t border-slate-200 pt-6 text-xs leading-relaxed text-slate-500"><ShieldCheck className="size-5 shrink-0 text-teal-700" /><p>Accès réservé aux membres autorisés de votre cabinet. Aucun mot de passe supplémentaire à mémoriser.</p></div></div>
    </section>
  </div>
}



