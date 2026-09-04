# Practice Dashboard — Product Spec (dental, France)

Research base: Arini teardown (docs/competitive-arini.md) + their Watchtower product page.
Goal: a dashboard that sells itself in a demo — outcome data, not empty CRUD.

## North star UX principles
1. **A practice owner must understand value in 5 seconds**: € produced, calls that
   would have been missed, bookings. Big numbers first.
2. **Never an empty screen**: no data → offer DEMO DATA instantly (+ a clear path to
   go live). Demo data is clearly labeled, switchable in one click.
3. **One clear action per screen**; guidance when not configured (phone line, value/€).
4. French microcopy, dental vocabulary (patients, soins, mutuelle, urgences).

## Pages

### 1. Vue d'ensemble (Overview) — the money screen
- Header: practice name, date, agent status, period note, refresh.
- KPI row (4): **Rendez-vous réservés** (period) · **Production estimée €** (bookings ×
  valeur moyenne RDV) · **Appels gérés** · **Taux de conversion** (RDV/appels).
- Trend area chart: RDV + appels par jour, 14 days.
- **Missed-call framing card**: "Avant l'agent, X appels/mois restaient sans réponse"
  (config missed_calls_per_month) → "Y appels répondus par l'agent cette période".
- Alert/action strip: no phone line configured → 3-step activation card; QA-style
  tasks later.
- Derniers appels (3) with summary + audio → link to Appels.

### 2. Appels (Calls)
- List: date, duration-ish, résumé, tags (RDV pris / message / question / urgent),
  audio. Filter: tous / avec RDV / messages.
- Detail (expandable): transcription patient/agent bubbles + résumé + audio.
- Empty → demo data offer.

### 3. Rendez-vous (Bookings + messages)
- Table: date, heure, soin/service, patient, tel, réf, valeur €.
- Sous-total production estimée.
- Messages/rappels section (agent couldn't conclude → human follow-up).

### 4. Campagnes (Outbound) — placeholder with roadmap note (needs telephony);
  describes reminders/reactivation as "bientôt" (Arini parity roadmap).

### 5. Documents (knowledge base)
- Upload .txt/.md → index → status (chunks). Agent answers from them.

### 6. Réglages (Settings)
- Cabinet profile (name, slogan, hours, services, FAQ, langue, prénom agent).
- **Valeur moyenne d'un RDV (€)** — drives the money numbers.
- Appels manqués avant agent (/mois) — drives the missed-call framing.
- Téléphonie: statut de la ligne (none/Twilio/Telnyx) + lien doc.
- Nouveau cabinet (multi-cabinets).

## Data & states
- Real data: agent/calls + call-activity.jsonl via existing API (unchanged).
- Demo mode: deterministic client-side generator when real data empty OR user
  enables "Mode démo" — labeled badge; toggle in header; auto-suggested banner.
- Loading = skeleton; error = retry; empty = action.

## Design
- Fonts already set: DM Sans (texte) / Outfit (titres). Langue fr, html lang=fr.
- Primary: teal médical (override --primary) — confiance + soin.
- Icons: lucide. Brand: tooth mark. Radius doux. Light + dark.
- Components: card/table/tabs/select/badge/input/textarea/label/separator/skeleton/
  sheet/chart (recharts) — already installed.

## Out of scope v1 (roadmap)
Auth/multi-user, patients CRM, outbound campaigns live, online scheduling widget,
billing, RGPD portal. Noted for later rounds.
