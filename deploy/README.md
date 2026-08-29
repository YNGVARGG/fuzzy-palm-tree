# Deploy the Phone Agent to your VPS

Your VPS is CPU-only, so the split is: **the VPS runs the always-on agent** (Pipecat bot +
Twilio WebSocket server), **the AI brain runs elsewhere** — Modal (PhoneLLM, English) or the
OpenAI API (multilingual model for French). Twilio connects to the agent over a secure
WebSocket (`wss://`) provided by a free **ngrok** tunnel.

```
Caller -> Twilio number -> wss://<ngrok-url>/ws -> agent (VPS, Docker) -> Modal / OpenAI (brain)
```

## 0. Hetzner? Start here

If this is the Hetzner CX32 (voice-agent-prod, `78.47.190.110`), follow
[hetzner-getting-started.md](hetzner-getting-started.md) — it covers SSH, getting the code
onto the server (GitHub or scp), and the Twilio wiring.

## 1. Get the project onto the VPS

```bash
scp -r /path/to/project user@vps:/opt/company-phone-agent   # or git clone if you push it
ssh user@vps
cd /opt/company-phone-agent
```

## 2. Bootstrap (installs Docker, creates agent/.env)

```bash
bash deploy/bootstrap.sh
# -> creates agent/.env, then exits — fill in your keys (step 3), then re-run
```

## 3. Fill in agent/.env

- `NGROK_AUTHTOKEN` — from https://dashboard.ngrok.com (free; required for the tunnel)
- Brain: **French tenants** → `LLM_SERVICE=openai`, `OPENAI_API_KEY=...` (multilingual model).
  **English tenants** → `LLM_SERVICE=phonellm`, `LLM_BASE_URL=<Modal endpoint url>`,
  `LLM_API_KEY=<token-id>.<token-secret>` (see agent/README.md for Modal setup).
- `DEEPGRAM_API_KEY`, `CARTESIA_API_KEY` (STT/TTS; French voices work — pick a French
  voice in `TTS_VOICE` from play.cartesia.ai)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
- `TENANTS_PHONE_MAP=+33123456789:french-demo` — map each company number to its tenant

## 4. Build & start

```bash
bash deploy/bootstrap.sh
docker compose -f deploy/docker-compose.yml ps        # both services Up
docker compose -f deploy/docker-compose.yml logs agent --tail 50
```

## 5. Point Twilio at the tunnel

1. Get the tunnel URL:

```bash
docker compose -f deploy/docker-compose.yml logs ngrok | grep url
# e.g. url=https://abcd1234.ngrok.app
```

2. Twilio Console → TwiML Bins → create a bin:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://abcd1234.ngrok.app/ws" />
  </Connect>
</Response>
```

3. Phone Numbers → your number → Voice Configuration → “A call comes in” = **TwiML Bin** →
   select it → Save.

## 6. Test & debug

- Call the number — you should hear the French greeting.
- `docker compose -f deploy/docker-compose.yml logs agent` shows the call log, tenant resolution,
  bookings and messages (also appended to the `call_logs` volume as call-activity.jsonl).
- Every booking/message is per-tenant and timestamped — the product's audit trail.

## 7. Updating the agent

```bash
cd /opt/company-phone-agent
# (pull/upload the new code)
docker compose -f deploy/docker-compose.yml up -d --build
```

## Caveats & upgrade paths

- **ngrok free = random URL** that changes on restart. If the URL changes, update the TwiML
  Bin (or use a paid ngrok domain).
- **Stable URL**: buy a cheap domain (≈$1–2/yr) → A record to the VPS →
  `docker compose --profile domain up -d` (Caddy auto-HTTPS, `wss://agent.yourdomain.com/ws`).
- **GPU later**: if you ever get a GPU box, add a vLLM service and point `LLM_BASE_URL` at it
  — the bot doesn't care where the OpenAI-compatible endpoint lives.
- **Pipecat Cloud** remains the zero-ops alternative if the VPS becomes a hassle.
- Firewall: ngrok needs no inbound ports (it dials out); the domain path needs 80/443.
- Secrets live only in `agent/.env` (git-ignored, excluded from the Docker image via
  `.dockerignore`) — never commit them.