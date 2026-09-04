# Arini AI Receptionist page — deep dive (requirements mine)

Source: full text of https://www.arini.ai/ai-receptionist-page (pasted by user, 2026-08).
Purpose: turn each block into a concrete requirement for OUR product (dental, France).

## 1. Core loop (their diagram)
Incoming call AND message → AI agent → "confirmation sent" + "appointment created".
→ Requirement: one agent handling voice + SMS/chat, same rules. (SMS = roadmap; telephony needed first.)

## 2. Never Miss A Call
"Practices miss ~1/3 of calls during lunch, peak hours, after-hours."
Blocks:
- **Custom Scheduling Logic**: per-provider (Dr Smith vs Dr Lee), appointment types/durations/templates,
  emergency slots. → Requirement: agent asks which provider; tenant config carries providers + slot rules.
- **Guardrails** (their standout): operates inside team-defined rules; OUTSIDE → escalate, never guess.
  Examples shown: *dental insurance question* and *medical advice detected* → transferred to clinical
  staff. → Requirement: rule-based triggers (medical advice, insurance nuance, billing, complaints) call
  an escalation path that lands a HUMAN TASK with the transcript.
- **Knowledge Base**: practice policies, providers, insurance, services.
- Sample flow shown: pediatric dental EMERGENCY booking for tomorrow + checking office status.
- Proof: $900K+ production / 2,000+ appointments / 100+ staff days saved per quarter (one DSO).

## 3. Outbound Campaigns — "Recover Unscheduled Treatment"
Proactive phone+text outreach: reminders, re-activation, no-show reduction; multi-touch;
STOPS when patient responds/books. → Roadmap: needs telephony + SMS; reminders first.

## 4. Online Scheduling
Embeddable module on the practice website; task/appointment feed per provider.
→ Roadmap: public booking widget writing to the calendar.

## 5. Trained for Your Practice
- **Multi-lingual** with mid-call language switch (EN→ES example). For us: FR + AR/EN etc. — later.
- **Complex scheduling rules**: durations, templates, preferred providers, emergency slots.
- **Practice knowledge**: providers, services, accepted insurance, locations, promotions, policies.

## 6. Watchtower (their analytics = OUR dashboard north star)
- **Performance Analytics**: calls → appointments conversion; WHY patients don't book (reasons!).
- **Conversion Intelligence**: revenue from bookings; per location/provider/campaign.
- **Call summaries**: what patients call about; trends.
- **Tasks**: QA agents review EVERY call → create tasks when follow-up/escalation needed.
→ Requirement mapping to our dashboard:
  - Vue d'ensemble KPIs (have), reasons-not-booked (needs summary field + QA parse — add field
    "raison_non_reservation" to summary prompt), revenue (have, avg value), tasks = messages page (have,
    rename framing to "Tâches / suivis" in future).
- "AI should never be a black box" — transcripts+audio (we have).

## 7. Service ("Hiring agents ≠ buying software")
5 min urgent response, 1 h email, 4 h resolution; success manager; continuous optimization.
→ Ops/team requirement, not code. Note for offer: onboarding pack.

## 8. Integrations Anywhere
Cloud or on-prem PMS; scheduling/records/insurance synced. → Our equivalent: calendar (Google) +
PMS/Doctolib-type booking APIs. Roadmap; RGPD/HDS when patient records involved.

## 9. Segmentation & proof stats
1-20 / 20-100 / 100+ locations. Small practice stats: 20+ new patients recovered/mo, 60+ questions
answered/mo. "Hear a call" (sample recordings on site), exec testimonials, ROI calculator.

## Now-vs-later (what we build first)
NOW (agent): medical-advice guardrail + escalate_to_staff tool + no-guessing rule; emergency-slot
language in the dental prompt; call summary gains an "action/raison" line.
NOW (dashboard): messages → "Tâches / suivis" framing; summary lines shown as tags.
LATER: SMS channel, outbound reminders, online scheduling widget, multi-provider rules, insurance/PMS
integrations, multilingual switch, sample-call player on the landing page.
