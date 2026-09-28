# Activate invitation-only email login

The login screen uses a personal email link. Google/Apple are hidden. Email configuration takes precedence; legacy OAuth backend configuration remains compatible when email is not configured. No password or public self-enrolment is added.

## Required setup

1. Set AUTH_SECRET privately and keep it stable. Set AUTH_URL to the deployed cabinet app origin (HTTPS in production). Local testing can use http://localhost:3001.
2. Verify a sending domain in Resend. Set AUTH_RESEND_KEY and AUTH_EMAIL_FROM (for example Standard IA <connexion@your-domain>) in .env.local or deployment secrets, never in chat or source control. See https://authjs.dev/getting-started/providers/resend.
3. Set PRACTICE_AUTH_DB to a persistent private SQLite path, or use the default ../agent/email-auth.sqlite. All app workers must share this database. This is a single-host deployment model; separate hosts need a shared database and limiter before scaling.
4. Explicitly invite each team member in the ignored agent/auth-memberships.json file:

```json
{"memberships":[{"provider":"email","email":"owner@example.com","tenantId":"cabinet-dentaire-saint-michel","role":"owner"}]}
```

Replace the email and clinic ID with real, authorized values. Existing Google-only memberships do not automatically grant email access. Removing a membership revokes access on the next request, including sessions already issued.

5. Restart the cabinet app and verify delivery, clicking the link, logout, a second browser and access revocation with a real invited test account. Live email delivery remains unverified until sender credentials are configured.

## Security and verification

Auth.js creates random tokens and hashes them with AUTH_SECRET before storage. Links expire after 15 minutes and are consumed by one atomic DELETE RETURNING operation. An expired, replayed, wrong-address or revoked link cannot create an authorized session. The email-only adapter supports JWT sessions; it is not a general OAuth/database-session adapter. Membership is checked before sending and after verification. Unknown addresses and throttled requests receive the same check-your-email redirect. Requests are limited to 3 per address and 100 globally per 15 minutes in SQLite; add perimeter abuse protection when deploying publicly. No patient data is included in sign-in emails.

Auth callback URLs contain a bearer token: exclude their query strings from infrastructure access logs and analytics. Avoid opening sign-in links through third-party tracking. Store the database and its WAL files privately, outside the served web root and source control.

Run pnpm test, pnpm build, node tests/auth-http.mjs, and node tests/email-http.mjs. Tests use isolated synthetic data and never send live emails. The email HTTP test covers a real callback/session flow, expiry, replay, uninvited addresses and revocation.

## Access model

- One account membership resolves to one clinic in this release. Unrelated plumbing/demo profiles are neither listed nor accessible. Ambiguous memberships across clinics are denied.
- `viewer`: read clinic data. `staff`: also update tasks. `admin`: also edit settings/documents, export and purge calls. `owner`: also delete the clinic.
- Memberships are read on each authenticated request, so removal revokes access even for an existing session. Sessions expire after eight hours. Logout clears the browser session; a stolen JWT remains usable until expiry unless membership or signing secret is revoked.
- API route handlers enforce access independently of page redirects. Mutations verify the configured origin. Do not trust arbitrary forwarded hosts or add untrusted origins.
- A chain needs an organisation record, clinic memberships and location permissions before adding a location switcher. This release intentionally has no chain selector.

## Public requests and calendar

Public appointment requests are disabled unless the operator sets `public_booking_enabled: true` in that clinic's tenant JSON. The public link is `/schedule?p=<clinic-id>` and exposes only its public name and service list. Requests become inbox tasks, never confirmed bookings. Add an edge abuse limiter and clinic privacy notice before enabling publicly; the included limiter is single-process.

The voice agent now requires `GOOGLE_CALENDAR_TENANT_ID` to match the active clinic, in addition to the calendar ID and credentials. The clinic must explicitly configure `timezone`, `appointment_duration_minutes` and approved `calendar_slots` such as `["2026-10-15T10:00"]`. Missing configuration, unapproved slots, calendar errors or uncertain writes produce staff follow-up. Availability checking and writes are not atomic against other calendar users, so this remains a controlled pilot connector, not a full practice-management-system scheduler.

Restart the voice agent to load the changes. Unknown dialed numbers are rejected instead of falling back to another business. `TENANT_ID` must explicitly select the dental practice for local test calls. Audio and raw transcript persistence are disabled for new calls pending a verified consent flow. Operational tasks still contain patient information; speech/AI providers still process call data. Historical recordings have not been deleted.

## Verification

`pnpm test` checks indexing, membership policy and request validation. After `pnpm build`, `node tests/auth-http.mjs` starts an isolated server with synthetic data and fixture-signed sessions to verify denied/allowed API requests. It never uses live OAuth or clinic data. In `agent`, run `.venv/Scripts/python.exe -m unittest test_booking_safety` for calendar failure and retention checks. No live calendar writes were performed.

