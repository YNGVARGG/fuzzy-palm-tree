"use client"

import { CalendarCheck, MessageSquareText } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePractice } from "@/components/practice-context"
import { usePracticeData } from "@/components/use-practice-data"
import type { ActivityEvent } from "@/lib/types"

const fmtDT = (iso: string) => new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
const fmtEUR = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

export default function BookingsPage() {
  const { tenant } = usePractice()
  const data = usePracticeData()
  const bookings = data.bookings as ActivityEvent[]
  const messages = data.messages as ActivityEvent[]
  const avgValue = tenant?.avg_appointment_value ?? 0
  const totalValue = bookings.length * avgValue

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Rendez-vous</h1>
        <p className="text-sm text-muted-foreground">
          {data.loading ? "…" : bookings.length + " rendez-vous réservés"}
          {avgValue > 0 && bookings.length > 0 ? " — " + fmtEUR(totalValue) + " de production estimée" : ""}
          {data.demo ? " · données de démonstration" : ""}
        </p>
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
            <CardTitle className="text-base">Rendez-vous réservés par l&apos;agent</CardTitle>
            <CardDescription>Valeur moyenne configurée : {avgValue > 0 ? fmtEUR(avgValue) : "à définir dans Réglages"}</CardDescription>
          </CardHeader>
          <CardContent>
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
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={String(b.reference)}>
                    <TableCell>{String(b.date)}</TableCell>
                    <TableCell>{String(b.time)}</TableCell>
                    <TableCell>{String(b.service)}</TableCell>
                    <TableCell className="font-medium">{String(b.customer_name)}</TableCell>
                    <TableCell className="font-mono text-xs">{String(b.phone)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{String(b.reference)}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{fmtDT(String(b.at))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Messages et demandes de rappel</CardTitle>
          <CardDescription>Quand l&apos;agent ne peut pas conclure, il prend un message pour votre équipe</CardDescription>
        </CardHeader>
        <CardContent>
          {data.loading ? (
            <Skeleton className="h-24 w-full" />
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
              <MessageSquareText className="size-5 opacity-40" />
              <p className="font-medium text-foreground">Aucun message</p>
              <p>Les demandes de rappel seront listées ici.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-right">Reçu le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((m) => (
                  <TableRow key={String(m.message_id)}>
                    <TableCell className="font-medium">{String(m.customer_name)}</TableCell>
                    <TableCell className="font-mono text-xs">{String(m.phone)}</TableCell>
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
