# Research: Pipecat + PhoneLLM Alpha 1

_Compiled from official sources — links at the bottom. Date: research snapshot for this project._

## 1. Pipecat — the framework we'll build on

**What it is:** an open-source Python framework for voice agents and real-time multimodal AI,
maintained by **Daily** and the community (~10k+ GitHub stars). It's the orchestration layer:
audio comes in, gets transcribed, an LLM thinks, speech comes out — all wired as a
**pipeline of processors** designed for sub-second (phone-call-quality) latency.

**Core concepts**
- **Pipeline**: `Transport -> STT -> LLM (agent) -> TTS -> Transport`, where each stage is an
  async processor. Pipecat handles framing, interruption (barge-in), and flow control.
- **60+ integrations** (one-liner swaps):
  - STT: Deepgram, AssemblyAI, Whisper, Azure, Google, Groq, ElevenLabs...
  - LLM: OpenAI, Anthropic, Google, Groq, and **any OpenAI-compatible endpoint** (this is how
    we plug in PhoneLLM via vLLM), plus local runners (Ollama, LM Studio).
  - TTS: Cartesia, ElevenLabs, Deepgram, PlayHT, Rime, Azure, Google...
  - Transports: **Twilio (WebSocket and WebRTC/Daily)**, Vonage, Asterisk, Telnyx, WebSocket,
    Daily, local audio, and Pipecat Cloud for hosting.
- **CLI**: `uv tool install pipecat-ai-cli` → `pipecat init quickstart` scaffolds a bot.

**Why it fits this project:** it's purpose-built for "an agent that answers the company phone"
— inbound telephony is a first-class transport, and every model/provider we want is a pluggable
processor rather than something we build ourselves.

## 2. PhoneLLM Alpha 1 — the brain for phone conversations

**What it is:** an **open-weight LLM made specifically for voice/phone agents**, released by the
Pipecat team (see the Daily announcement). Based on NVIDIA's **Nemotron-3-Nano — 30B total /
3B active, mixture-of-experts** (model card: `base_model: nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16`,
BSD-2-Clause license) — and fine-tuned on telephony data so it behaves like a good person on a
call instead of a chat bot:

- **Short, natural spoken answers** (no essays, no markdown).
- **Fast time-to-first-token** — the thing that makes a call feel real.
- Trained to handle **interruptions / barge-in** and backchannels ("uh-huh", "got it").
- **Cheap to run**: as an MoE it activates only ~3B parameters per token — far cheaper than a
  dense 30B — and it's trained for **tool use / function calling**, which is exactly what a
  business agent needs (booking, lookups). The model card shows it topping **PhoneBench v1**.
- **Trade-off to plan around**: a 30B MoE knows less general trivia than frontier models.
- **English-only today**: the model card lists `language: en`. For a **French-first product**, French
  calls should use a multilingual model for the LLM layer (e.g. `gpt-4.1-mini`), while STT
  (Deepgram Flux) and TTS (Cartesia) already handle French — PhoneLLM stays the brain for English.
  The fix is what we'd do anyway for a business agent: give it the company's knowledge
  (system prompt + retrieval) and tools (book appointment, look up order, transfer), and
  escalate to a human (or a bigger model) when it's out of its depth.

**Serving options:** the official example uses a **Modal Auto Endpoint**
(`modal endpoint create --model pipecat-ai/phonellm-alpha-1`, OpenAI-compatible, scales to
zero) or **local vLLM**; either plugs into Pipecat's `OpenAILLMService` via a custom base URL.
FP8 quantized vLLM serving setups exist (e.g. on Modal). Related reading: the PhoneLM paper
(arXiv 2411.05046) describes the earlier phone-specialized model family from the same group.

## 3. Target architecture — "the agent is an employee, not a SaaS"

```
Caller dials company number (Twilio)
        │
        ▼
Twilio (WebSocket / WebRTC) ──► Pipecat pipeline
        │                         ├─ STT: Deepgram (fast, phone-accurate)
        │                         ├─ Agent: PhoneLLM Alpha 1 via Modal/vLLM (OpenAI-compatible)
        │                         │     + company system prompt
        │                         │     + tools (calendar booking, order lookup, FAQ/RAG)
        │                         │     + escalation rules (transfer to human)
        │                         └─ TTS: Cartesia / ElevenLabs (natural voice)
        │
        ▼
Business layer: after-call summary, CRM/calendar updates, missed-call callbacks
```

**Why "not a SaaS":** we're not building a dashboard where businesses configure a generic bot.
We're building one agent that *works for the company* — it has the business's phone number,
knows the business's facts, uses the business's calendar and systems, and is accountable like
an employee (call logs, summaries, hand-offs to humans).

## Sources
- Pipecat repo: https://github.com/pipecat-ai/pipecat
- Pipecat examples (incl. Twilio inbound): https://github.com/pipecat-ai/pipecat-examples
- Pipecat docs / quickstart: https://docs.pipecat.ai
- PhoneLLM Alpha 1 model card: https://huggingface.co/pipecat-ai/phonellm-alpha-1
- PhoneLLM announcement: https://www.daily.co/blog/announcing-pipecat-phonellm-alpha-1/
- FP8 + vLLM serving reference: https://github.com/maisterr/phone-llm-fp8
- PhoneLM paper: https://arxiv.org/abs/2411.05046
