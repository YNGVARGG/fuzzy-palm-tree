# Company Phone Agent — the AI employee who answers the phone

> **A new kind of SaaS.** Not a dashboard where businesses configure a generic bot: a product
> where each company gets its **own AI employee** — it has the company's phone number, speaks
> the company's language, knows the company's facts, uses the company's calendar, and is
> accountable like an employee (call logs, summaries, hand-offs to humans).

Built on [Pipecat](https://github.com/pipecat-ai/pipecat) with
[PhoneLLM Alpha 1](https://huggingface.co/pipecat-ai/phonellm-alpha-1) as the phone-trained
brain (with a multilingual model for French), **French-first**.

## What the agent does (v1 scope)

- Answers **inbound calls** on the company's real phone number (Twilio).
- Greets callers like a receptionist — in the company's language: "Merci d'appeler Dupont, ici Alex…"
- Answers **company questions** from the company's FAQ (hours, services, pricing, policies).
- **Books appointments** (tool call) and confirms them back to the caller.
- **Takes messages / captures lead info** (name, phone, reason).
- **Escalates**: offers a callback when it can't help; hangs up politely when done.
- Logs **after-call activity** (bookings + messages) to `call-activity.jsonl` for auditing.

## How it works — one company per call

```
Caller dials a company's number (Twilio)  →  dialed number maps to a TENANT  →  the agent
works for that tenant: tenant.json profile + FAQ + language drive the system prompt and tools

Twilio (WebSocket) ──► Pipecat pipeline:  STT (Deepgram Flux) → LLM (PhoneLLM / OpenAI
multilingual) → TTS (Cartesia)  ──► back to the caller
```

## Repo layout

```
Project/
├── README.md              # this file
├── docs/research.md       # research notes: Pipecat + PhoneLLM (with sources)
├── agent/                 # THE PRODUCT: the agent (a Pipecat bot)
│   ├── phone_agent.py     #   pipeline: STT -> LLM -> TTS, transports, tenant resolution
│   ├── tenant.py          #   tenant registry: dialed number -> company config
│   ├── tenants/           #   one folder per company (tenant.json: profile, FAQ, language)
│   │   └── french-demo/   #   sample French company: Dupont Chauffage & Plomberie
│   ├── business_context.py#   system prompt builder (FR/EN) from tenant config
│   ├── business_tools.py  #   tools: answer_question, book_appointment, take_message, end_call
│   ├── pyproject.toml     #   deps: pipecat-ai[...]
│   ├── .env.example       #   keys/config template
│   └── README.md          #   how to run (browser test, Twilio, onboarding a company)
├── deploy/                # VPS deployment: Dockerfile/compose, ngrok tunnel, Caddy, walkthrough
├── reference/             # official examples fetched from pipecat-examples
│   ├── phonellm/          #   the official PhoneLLM bot (server + env + Dockerfile)
│   └── twilio-inbound/    #   the official Twilio inbound bot
└── scripts/setup.ps1      # one-time Windows setup: clone repos + venv + deps + .env
```

## Quickstart

```bash
# 1. One-time setup (clones pipecat + pipecat-examples, installs deps, creates .env)
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1

# 2. Pick the brain: French tenants -> OpenAI multilingual (see agent/README.md);
#    English -> PhoneLLM via Modal/vLLM. Then fill keys in agent/.env

# 3. Talk to it in the browser first (no phone yet) — the demo tenant speaks French
cd agent && uv run phone_agent.py -t webrtc    # open http://localhost:7860

# 4. Then wire a real number (Twilio + ngrok) — see agent/README.md
# 5. One script, everything: start bot + dashboard, run the 8-check test, open browsers
powershell -ExecutionPolicy Bypass -File scripts\start-everything.ps1

# 6. Production: deploy the always-on agent to your VPS — see deploy/README.md
```

## Roadmap

1. **M0 – Local voice loop**: bot + brain, browser test, French demo tenant (Dupont).
2. **M1 – Real phone number**: Twilio inbound; dialed number → tenant mapping.
3. **M2 – Company onboarding**: self-serve tenant creation (profile/FAQ form), calendar/CRM backends.
4. **M3 – Accountability**: per-tenant call log, after-call summaries, missed-call callbacks.
5. **M4 – Scale & product**: dashboard, usage-based billing, concurrency, outbound calls (reminders).

## Notes

- This workspace was built from the official examples (`reference/`), also kept
  upstream in the [pipecat-examples](https://github.com/pipecat-ai/pipecat-examples) repo.
- In this session the shell was unavailable, so the full repos are cloned by `scripts/setup.ps1`
  on your machine instead of here.
- **PhoneLLM Alpha 1 is English-only** — French tenants use a multilingual model for the LLM
  layer (STT/TTS are multilingual). Details in [docs/research.md](docs/research.md).