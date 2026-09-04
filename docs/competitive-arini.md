# Competitive teardown — Arini (arini.ai)

_Research date: 2026-08. Sources: arini.ai (home, AI receptionist page, ROI calculator, book-a-demo, case studies), YC profile, competitor comparisons (SkipCalls, TensorLinks, SwissMonkey). Where a figure is a third-party estimate, it is labeled as such._

## 1. Snapshot

- **What**: "The leading AI receptionist for dentists" — YC W24 (San Francisco).
- **Founders**: Abdul Jamjoom (CEO, Harvard CS) and Rami Rustom (CTO, MIT CS), both ex-Threads (enterprise comms) AI/eng.
- **Claimed traction**: "Trusted by 1,000+ dentists"; case studies from single practices to DSOs (25–100+ locations).
- **Positioning**: "the operating system for dental groups" — 80% of appointments are booked by phone; practices miss 20–35% of inbound calls = lost revenue.
- **Vertical**: dental ONLY (US). Deliberate.

## 2. How they work (product suite)

1. **Inbound AI receptionist (flagship)**: answers 100% of calls 24/7 — books appointments, answers questions, escalates to staff only when needed.
2. **Custom scheduling logic**: learns each practice's providers, appointment types, durations, templates, block/staggered scheduling, emergency slots — "exactly how your team would".
3. **Guardrails**: operates inside rules defined by the practice; anything outside → escalate to the human team (never guesses).
4. **Practice knowledge base**: trained on each practice's policies, insurance plans, providers, services, promotions, locations.
5. **Outbound campaigns**: reactivation of inactive patients, no-show recovery, recalls — phone + text, multi-touchpoint, stops when the patient responds/books.
6. **Online scheduling**: embeddable web widget (one customer claims $10k+/mo of production booked through it).
7. **Multilingual**: auto-detects mid-call language switches and continues naturally.
8. **Watchtower (analytics)**: performance analytics (call→booking conversion, why patients don't book), **conversion intelligence in dollars** (revenue per booking/location/provider/campaign), call summaries, and QA agents that review every call and create human tasks.
9. **Integrations**: deep with practice management systems (OpenDental, Dentrix family, EagleSoft, Denticon, CareStack, Curve…) — cloud AND on-prem; scheduling, records, insurance, availability stay synced.
10. **Service model** ("hiring agents ≠ buying software"): dedicated success manager, US-based support (5 min urgent-response claim), onboarding + continuous optimization, "deployed in days".
11. **Segments**: small practices (1–2 locations), groups (20–100), enterprise DSO (100+, "Forward Deployed Engineers").

## 3. Pricing

- **Not published.** Sales-led: /book-a-demo (Calendly) → qualified form (name, # practices: 1/2-4/5-19/20-99/100+, which PMS, are you an IT provider/consultant) → custom quote.
- Third-party estimates of what Arini-level dental AI costs:
  - SkipCalls (competitor, biased low): "$200–500+/month" per location, "$2,400–6,000+/year", no free trial.
  - SwissMonkey (Feb 2026 roundup): AI dental receptionists with PMS integrations typically **$300–700/month**; "pricing can reach more than $600 monthly for full features".
  - TensorLinks (2026 landscape): AI dental receptionists run **$399–1,500+/month**; Arini = "contact for quote".
- Industry benchmarks they sell against: full-time receptionist **$3,750–5,400/month**; answering services **$1–3/minute or $1.50–5/call**.
- Category hidden-fee traps: per-minute AI fees ($0.10–0.50), per-SMS fees, $500–2,000 setup fees, 12-month contracts.
- Bottom line: their real price is almost certainly **$500–1,500+/month per location** depending on suite + DSO scale — they sell a *replacement receptionist*, not a phone bot.

## 4. Why they win (their good parts)

1. **Extreme vertical focus** — one industry, deep workflow expertise (scheduling templates, insurance, dental terminology, DSO ops). The integration + workflow moat IS the product.
2. **They sell dollars, not software** — every page quantifies missed-call %, conversion ("68% booking conversion"), and production booked ($140k, $500k, $1M, $342k in 10 months, $42k LTV/month). ROI calculator with practice-level math.
3. **Case-study engine** — 7+ named case studies with exec testimonials and hard numbers; the marketing is the proof.
4. **Suite, not a bot** — inbound + outbound + SMS + online scheduling + analytics = "patient engagement OS": more surfaces, more value, more lock-in.
5. **Accountability layer** — Watchtower + QA tasks + call summaries make buyers trust it enough to run the front desk.
6. **Service-heavy motion** — success manager, fast support, continuous optimization; they know the buyer will be blamed if it fails.
7. **Sales machinery** — demo-first with sharp qualification (PMS, scale, channel), enterprise tier for DSOs, channel plays via IT providers/consultants.
8. **Trust assets** — YC brand, 1,000+ dentists, named customers, humans on the phone.
9. **Market timing** — US dental staffing shortage + 80% phone-booked appointments = burning pain.

## 5. Gap analysis — what's missing on our side

- **Deep vertical playbooks + real integrations** — they integrate with the industry's actual systems (PMS/calendar) and schedule "exactly how your team would". We have a generic multi-tenant agent, in-memory bookings, an optional Google Calendar hook, no vertical workflow depth. BIGGEST GAP.
- **Outbound + SMS** — reactivation, reminders, no-show recovery. We are inbound-only (plus message-taking). BIG GAP.
- **Online scheduling surface** — their embeddable booking widget. We have none.
- **Revenue analytics** — they report dollars per booking, conversion, QA tasks. We have transcripts/summaries/activity — the raw data — but no $-math, no ROI story, no QA layer.
- **Quantified GTM** — ROI calculator, case studies with numbers, named testimonials. Our landing page exists but is placeholder.
- **Sales motion** — qualified demo flow, scale tiers, channel program. None yet.
- **Mid-call language switching** — tenant language is fixed (fr/en). Small gap.
- **Compliance** — for any health vertical: RGPD/HDS (FR) — and we already record calls, so consent handling matters.

## 6. What we already have that they'd envy

- Transcripts + AI summaries + recordings per call (their Watchtower-lite) — already built.
- RAG over company documents (they train knowledge bases; we do it dynamically).
- True multi-tenant onboarding wizard — a new company live in 1 minute.
- Cheap open stack (Mistral + Cartesia + Deepgram, ~€0 marginal cost) — Arini's stack costs them real money per call.
- CI + automated e2e tests (8 checks) — engineering credibility.
- **French-first position**: Arini is US-only, English. The French market has no equivalent leader yet — that is the opening.

## 7. Recommended next moves (adapted to our position)

1. **Pick the beachhead vertical for France** — Arini's lesson: one industry, deep. Candidates: artisans/plomberie (our demo already points there), vétérinaires, cabinets médicaux (HDS/RGPD), restaurants.
2. **Real booking integration** per vertical (Google Calendar done; add the tools the vertical actually uses) so bookings are real events, not log lines.
3. **Impact analytics**: turn transcripts into $-relevant metrics (appointments booked, hours saved, missed-call math) + an ROI calculator page.
4. **Outbound + reminders** once telephony exists (Twilio/Telnyx): confirmations/reminders are the highest-ROI first outbound use case.
5. **Landing + demo with quantified proof** — finish the landing/ project; add an ROI calculator.
6. **Pricing decision**: FR SMBs expect transparency (published tiers, e.g. €199–499/mo per business) vs Arini's quote model — decide deliberately.
7. **Trust**: real customer stories with numbers, a human contact channel.
8. **Compliance early** if any health vertical: RGPD + call-recording consent.

## Sources
- https://www.arini.ai (home, /ai-receptionist-page, /roi-calculator, /book-a-demo, case studies)
- https://www.ycombinator.com/companies/arini (YC W24, founders)
- https://skipcalls.com/comparison/arini (competitor, biased on price)
- https://www.tensorlinks.com/blog/ai-dental-receptionist-pricing-comparison-2026/
- https://www.swissmonkey.io/articles/staffing-solutions/best-ai-dental-receptionists-2026
- https://www.capterra.com/p/10036210/Arini/ (blocked by Cloudflare from this research session)