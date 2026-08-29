# Hetzner CX32 — getting the code on the server (voice-agent-prod)

**Your server:** Hetzner **CX32** — 4 vCPU / 8 GB RAM / 160 GB — `voice-agent-prod`,
`78.47.190.110`, Falkenstein (EU), fresh Ubuntu.

**Fastest path:** once you can SSH in, run the one-command setup:

```bash
bash deploy/first-login.sh   # update OS, firewall, clone code, bootstrap — then follow its prompts
```

**IMPORTANT (security):** the root password was shared in a chat log. Change it on first
login (`passwd`) and prefer SSH-key auth (step 0 below). Anything sent in chat should be
considered public from then on.

**Good news:** 8 GB is plenty for the agent (it's a lightweight WebSocket server). The 30B
brain can't run here (needs a GPU), so it stays on **Modal / OpenAI API** — exactly the
architecture we set up. The VPS just answers the phone and calls the brain.

## 0. SSH in (first time)

Password is in the Hetzner email; save the server IP in `~/.ssh/config` later if you like.

```powershell
# Windows PowerShell:
ssh root@78.47.190.110          # password from Hetzner
apt update && apt upgrade -y    # first login: update the OS

# Optional but recommended — key auth instead of password (run from your PC):
type $env:USERPROFILE\.ssh\id_rsa.pub | ssh root@78.47.190.110 "cat >> ~/.ssh/authorized_keys"
```

## 1. Get the code onto the server — pick one

### Path A — GitHub (recommended, easiest updates)

1. Your repo already exists: `https://github.com/YNGVARGG/fuzzy-palm-tree` (empty, public).
   Suggested: rename it to `company-phone-agent` and switch it to **Private** in
   Settings → General (the code is open-source anyway, but the product plan isn't).
2. On your PC, from the project folder, publish it:

```powershell
cd C:\Users\yonat\Documents\Project
git init
git add -A
git commit -m "Company Phone Agent: Pipecat + PhoneLLM, multi-tenant, French-first"
git branch -M main
git remote add origin https://github.com/YNGVARGG/fuzzy-palm-tree.git
git push -u origin main        # sign in: use a Personal Access Token or GitHub CLI (see below)
```

3. On the server:

```bash
apt install -y git
git clone https://github.com/YNGVARGG/fuzzy-palm-tree.git /opt/company-phone-agent
cd /opt/company-phone-agent
```

Future updates: `git pull` on the server, then rebuild (step 5).
(Public repo = no credentials needed for the clone; if you make it Private, use a Personal Access Token.)

### Path B — no GitHub yet (scp straight from your PC)

```powershell
ssh root@78.47.190.110 "mkdir -p /opt/company-phone-agent"
cd C:\Users\yonat\Documents\Project
scp -r . root@78.47.190.110:/opt/company-phone-agent/
```

(`scp -r .` includes hidden files like `.env.example`; re-run it whenever you change code.)

## 2. Bootstrap (installs Docker, creates agent/.env)

```bash
bash deploy/bootstrap.sh
# -> creates agent/.env, then exits — fill in keys (step 3), then re-run
```

## 3. Fill in agent/.env

- `NGROK_AUTHTOKEN` — from https://dashboard.ngrok.com (free account)
- Brain — **French tenants:** `LLM_SERVICE=openai`, `OPENAI_API_KEY=...` (multilingual model,
  e.g. gpt-4.1-mini). **English tenants:** `LLM_SERVICE=phonellm` with the Modal endpoint
  (see agent/README.md). Tip: if using Modal, prefer an **EU region** endpoint — your callers
  are in Europe.
- `DEEPGRAM_API_KEY`, `CARTESIA_API_KEY` (STT/TTS; pick a French voice via `TTS_VOICE`)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
- `TENANTS_PHONE_MAP=+33123456789:french-demo` — each company number → its tenant

## 4. Build, start, point Twilio at it

```bash
bash deploy/bootstrap.sh                          # builds + starts agent and ngrok
docker compose -f deploy/docker-compose.yml logs ngrok | grep url   # e.g. https://abcd1234.ngrok.app
```

Twilio Console → **TwiML Bins** → create → paste:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://abcd1234.ngrok.app/ws" />
  </Connect>
</Response>
```

Phone Numbers → your number → Voice Configuration → “A call comes in” = **TwiML Bin** → save.
Call the number — you should hear the French greeting.

## 5. Everyday ops

```bash
docker compose -f deploy/docker-compose.yml ps            # status
docker compose -f deploy/docker-compose.yml logs agent --tail 50   # call logs / debug
docker compose -f deploy/docker-compose.yml up -d --build # update after git pull
```

## Security basics (do once)

- `ufw allow OpenSSH && ufw enable` — ngrok dials *out*, so no inbound ports are needed
  (open 80/443 only if you later enable the Caddy/domain profile).
- Keys live only in `agent/.env` (git-ignored + excluded from the Docker image).
- Optional hardening: `adduser deploy` + disable root password login once keys work.

## If the ngrok URL changes

Free ngrok URLs rotate on restart. Either update the TwiML Bin, or take the stable path:
cheap domain → A record → `docker compose --profile domain up -d` (Caddy auto-HTTPS) —
details in deploy/README.md.