"use client"

import { CalendarCheck, Download, MessageSquareText } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePractice } from "@/components/practice-context"
import { usePracticeData } from "@/components/use-practice-data"
import type { ActivityEvent } from "@/lib/types"

const fmtDT = (iso: string) => new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
const fmtEUR = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

const todayISO = () => new Date().toISOString().slice(0, 10)

export default function BookingsPage() {
  const { tenant, tenantId } = usePractice()
  const data = usePracticeData()
  const bookings = (data.bookings as ActivityEvent[]).slice()
  const messages = data.messages as ActivityEvent[]
  const avgValue = tenant?.avg_appointment_value ?? 0
  const totalValue = bookings.length * avgValue
  const today = todayISO()
  const upcoming = bookings.filter((b) => String(b.date) >= today)
  const past = bookings.filter((b) => String(b.date) < today)

  const exportCsv = () => {
    const head = ["reference", "date", "heure", "soin", "patient", "telephone", "pris_le"]
    const rows = bookings.map((b) => [b.reference, b.date, b.time, b.service, b.customer_name, b.phone, b.at].map((v) => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(","))
    const csv = "\uFEFF" + [head.join(","), ...rows].join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "rendez-vous-" + today + ".csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const Rows = ({ list }: { list: ActivityEvent[] }) => (
    <>
      {list.map((b) => (
        <TableRow key={String(b.reference) + String(b.at)}>
          <TableCell>{String(b.date)}</TableCell>
          <TableCell>{String(b.time)}</TableCell>
          <TableCell>{String(b.service)}</TableCell>
          <TableCell className="font-medium">{String(b.customer_name)}</TableCell>
          <TableCell>
            <Link href={"tel:" + String(b.phone).replace(/s/g, "")} className="font-mono text-xs text-primary hover:underline">{String(b.phone)}</Link>
          </TableCell>
          <TableCell className="text-right font-mono text-xs">{String(b.reference)}</TableCell>
          <TableCell className="text-right text-xs text-muted-foreground">{fmtDT(String(b.at))}</TableCell>
        </TableRow>
      ))}
    </>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Rendez-vous</h1>
          <p className="text-sm text-muted-foreground">
            {data.loading ? "…" : bookings.length + " rendez-vous réservés par l'agent"}
            {avgValue > 0 && bookings.length > 0 ? " — " + fmtEUR(totalValue) + " de production estimée" : ""}
            {data.demo ? " · données de démonstration" : ""}
          </p>
        </div>
        {bookings.length > 0 ? (
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="size-3.5" /> Exporter CSV</Button>
        ) : null}
      </div>

      {data.loading ? (
        <Skeleton className="h-64 w-full" />
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 px-6 py-14 text-center text-sm text-muted-foreground">
            <CalendarCheck className="size-6 opacity-40" />
            <p className="font-medium text-foreground">Aucun rendez-vous pour le moment</p>
            <p>Activez le mode démo depuis la vue d&apos;ensemble pour explorer le produit.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agenda réservé par l&apos;agent</CardTitle>
            <CardDescription>Valeur moyenne d&apos;un rendez-vous : {avgValue > 0 ? fmtEUR(avgValue) : "à définir dans Réglages"} · cliquez sur un numéro pour appeler</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upcoming">
              <TabsList>
                <TabsTrigger value="upcoming">À venir ({upcoming.length})</TabsTrigger>
                <TabsTrigger value="past">Passés ({past.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming">
                {upcoming.length === 0 ? (
                  <p className="px-2 py-8 text-center text-sm text-muted-foreground">Aucun rendez-vous à venir.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Heure</TableHead>
                        <TableHead>Soin / service</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead className="text-right">Réf.</TableHead>
                        <TableHead className="text-right">Pris le</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody><Rows list={upcoming} /></TableBody>
                  </Table>
                )}
              </TabsContent>
              <TabsContent value="past">
                {past.length === 0 ? (
                  <p className="px-2 py-8 text-center text-sm text-muted-foreground">Aucun rendez-vous passé.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Heure</TableHead>
                        <TableHead>Soin / service</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead className="text-right">Réf.</TableHead>
                        <TableHead className="text-right">Pris le</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody><Rows list={past} /></TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Messages, escalades et demandes de rappel</CardTitle>
          <CardDescription>Tâches pour votre équipe quand l&apos;agent ne peut pas conclure</CardDescription>
        </CardHeader>
        <CardContent>
          {data.loading ? (
            <Skeleton className="h-24 w-full" />
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
              <MessageSquareText className="size-5 opacity-40" />
              <p className="font-medium text-foreground">Aucune tâche</p>
              <p>Les demandes de rappel et escalades (avis médical, urgence, cas complexe) seront listées ici.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Détail</TableHead>
                  <TableHead className="text-right">Reçu le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((m) => (
                  <TableRow key={String(m.message_id) + String(m.at)}>
                    <TableCell>
                      {m.kind === "escalation" ? <Badge className="border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400">Escalade</Badge> : <Badge variant="secondary">Message</Badge>}
                    </TableCell>
                    <TableCell className="font-medium">{String(m.customer_name)}</TableCell>
                    <TableCell>
                      <Link href={"tel:" + String(m.phone).replace(/s/g, "")} className="font-mono text-xs text-primary hover:underline">{String(m.phone)}</Link>
                    </TableCell>
                    <TableCell className="max-w-md truncate">{String(m.message)}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{fmtDT(String(m.at))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}