"use client"

import { useEffect, useState } from "react"
import { CalendarCheck, MessageSquareText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePractice } from "@/components/practice-context"
import type { ActivityEvent } from "@/lib/types"

const fmtDT = (iso: string) => new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })

export default function BookingsPage() {
  const { tenantId, tenant, refreshTick } = usePractice()
  const [data, setData] = useState<{ bookings: ActivityEvent[]; messages: ActivityEvent[] } | null>(null)

  useEffect(() => {
    if (!tenantId) return
    fetch("/api/tenants/" + tenantId + "/activity")
      .then((r) => r.json())
      .then((d) => setData({ bookings: d.bookings ?? [], messages: d.messages ?? [] }))
      .catch(() => setData({ bookings: [], messages: [] }))
  }, [tenantId, refreshTick])

  const avgValue = tenant?.avg_appointment_value ?? 0
  const totalValue = (data?.bookings.length ?? 0) * avgValue

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Rendez-vous</h1>
        <p className="text-sm text-muted-foreground">
          {data ? data.bookings.length + " rendez-vous réservés" : "…"}
          {avgValue > 0 && data ? " — " + new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(totalValue) + " de production estimée" : ""}
        </p>
      </div>

      {!data ? (
        <Skeleton className="h-64 w-full" />
      ) : data.bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 px-6 py-14 text-center text-sm text-muted-foreground">
            <CalendarCheck className="size-6 opacity-40" />
            <p className="font-medium text-foreground">Aucun rendez-vous pour le moment</p>
            <p>Les rendez-vous pris par l&apos;agent au téléphone apparaîtront ici.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rendez-vous réservés</CardTitle>
            <CardDescription>Par l&apos;agent au téléphone, avec la valeur moyenne configurée</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Heure</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead className="text-right">Réf.</TableHead>
                  <TableHead className="text-right">Pris le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.bookings.map((b) => (
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
          {!data ? (
            <Skeleton className="h-24 w-full" />
          ) : data.messages.length === 0 ? (
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
                {data.messages.map((m) => (
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
