# Company Phone Agent

A Pipecat voice agent that **works for a business** — the product is a new kind of SaaS:
each company (a **tenant**) gets its own AI employee that answers its phone number, in its
language, with its facts. It greets callers, answers questions, books appointments, takes
messages, and hangs up politely.

- **Brain:** [PhoneLLM Alpha 1](https://huggingface.co/pipecat-ai/phonellm-alpha-1)
  (open-weights, phone-trained) behind any OpenAI-compatible endpoint (Modal, vLLM),
  or a multilingual OpenAI model for French tenants.
- **STT:** Deepgram Flux (multilingual incl. French) · **TTS:** Cartesia (default) or Deepgram Flux.
- **Telephony:** Twilio inbound (WebSocket) or Daily/WebRTC for testing.

## Files

| File | What it is |
|---|---|
| `phone_agent.py` | The bot: pipeline (STT → LLM → TTS), transports, tenant resolution |
| `tenant.py` | Tenant registry: load a company's config, map dialed number → tenant |
| `tenants/<id>/tenant.json` | **One folder per company** — profile, FAQ, language, phone numbers |
| `business_context.py` | Builds the system prompt (French or English) from the tenant config |
| `business_tools.py` | Tools: answer_question, book_appointment, take_message, end_call |

## 0. One-time setup

```bash
# from the project root
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1   # clones repos + installs deps
cd agent
cp .env.example .env        # then fill in your keys
```

## 1. Which model speaks for the agent?

**PhoneLLM Alpha 1 is English-only** (model card: `language: en`). Decide per product stage:

- **French tenants (default for now):** `LLM_SERVICE=openai`, `OPENAI_MODEL=gpt-4.1-mini`
  (multilingual, fast, cheap). STT/TTS handle French regardless.
- **English tenants / English market:** `LLM_SERVICE=phonellm` with a Modal endpoint or local vLLM:

```bash
modal setup
modal endpoint create --model pipecat-ai/phonellm-alpha-1   # note the URL (~20 min)
modal workspace proxy-tokens create                          # note token id + secret
# .env:  LLM_BASE_URL=<endpoint url>   LLM_API_KEY=<token-id>.<token-secret>
```

or local vLLM: `vllm serve pipecat-ai/phonellm-alpha-1 --max-model-len 4096 --port 8000`
with `LLM_BASE_URL=http://localhost:8000/v1`, `LLM_API_KEY=anything`.

## 2. Talk to it in the browser (no phone yet)

```bash
cd agent
uv run phone_agent.py -t webrtc     # open http://localhost:7860 and talk (in French!)
```

## 3. Answer real phone calls (Twilio)

1. Start ngrok: `ngrok http 7860`
2. In the Twilio console create a **TwiML Bin** pointing at your ngrok URL
   (see the upstream example for the exact TwiML — `<Connect><Stream url="..."/></Connect>`):
   https://github.com/pipecat-ai/pipecat-examples/tree/main/twilio-chatbot/inbound
3. Point your Twilio number's voice webhook at the TwiML Bin.
4. Map numbers to companies in `.env`: `TENANTS_PHONE_MAP=+33123456789:french-demo`
5. Run the bot:

```bash
cd agent
uv run phone_agent.py -t twilio
```

## 4. Onboard a new company (a new tenant)

A company = a folder: `tenants/<company-id>/tenant.json`. Copy the french-demo one and
edit name, hours, services, FAQ, and `language` (`fr` or `en`). No code changes needed —
the system prompt, FAQ matching, and fallback messages follow the tenant config.

The `BusinessStore` in `business_tools.py` is the per-call backend (in-memory + JSONL log);
swap its internals for a real calendar/CRM without changing the tool signatures.

## Reference material

The official examples this bot was modeled on are kept under
`../reference/` (fetched from pipecat-examples): the PhoneLLM bot
(`reference/phonellm/`) and the Twilio inbound bot (`reference/twilio-inbound/`).