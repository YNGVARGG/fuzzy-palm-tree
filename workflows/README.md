# Appointment reminder workflow

Import appointment-reminders.n8n.json into n8n. It is inactive by default and contains no secrets. Select a Header Auth credential on the HTTP Request node: header name Authorization, value Bearer followed by your private CAMPAIGN_WORKFLOW_TOKEN. Configure the same token (at least 32 random bytes) and CAMPAIGN_WORKFLOW_TENANT on the dashboard server. The credential is scoped to that clinic; the request cannot override it.

Set the node URL to the dashboard origin plus /api/workflows/campaigns. For local n8n on the same host, the supplied 127.0.0.1 URL works. Docker/container 127.0.0.1 points to the container: configure authenticated networking to the dashboard explicitly. Do not expose an unauthenticated local development server to the internet.

Create an appointment reminder in the dashboard Campaigns page, add a synthetic recipient and a future confirmed appointment, choose a reminder due time, and validate for simulation. Run Test manuel. The API returns mode=simulation, simulated=count and sent=0. It returns counts only, not recipient phone numbers or message contents. Retries are safe because the server changes pending to simulated in one SQLite transaction. The weekday 09:00–18:00 rule and duplicate guard are enforced by the server, not n8n.

Enable the schedule only when ready to automate simulation. Both triggers call the same API. Workflow success/manual/error execution payload retention is disabled. Add your operational error notification destination before production use. Never put recipient lists or provider keys in workflow JSON.

Validation: JSON parses, connections resolve and the API's state machine/authentication are tested locally. Import and execution in a live n8n instance are still required; this workflow has not been run in n8n here. No live sending nodes exist. The dashboard mode remains simulation even if n8n is activated.
