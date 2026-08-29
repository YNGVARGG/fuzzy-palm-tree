"""Company Phone Agent — a Pipecat voice agent that works for a business.

Pipeline: Transport -> STT -> PhoneLLM Alpha 1 (LLM) -> TTS -> Transport

The agent answers inbound phone calls for the company that owns the dialed
number (the "tenant", see tenant.py): it greets callers in the company's
language, answers FAQ questions, books appointments, takes messages, and
ends calls politely — like a receptionist who works there.

Run it with the pipecat runner (see README.md in this folder):

    uv run phone_agent.py -t webrtc      # talk to it in the browser (localhost:7860)
    uv run phone_agent.py -t twilio      # answer real phone calls via Twilio
    uv run phone_agent.py -t daily       # Daily WebRTC transport
"""

import os

from dotenv import load_dotenv
from loguru import logger
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.frames.frames import LLMRunFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.worker import PipelineParams, PipelineWorker
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.runner.types import RunnerArguments
from pipecat.runner.utils import create_transport
from pipecat.serializers.twilio import TwilioFrameSerializer
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.deepgram.flux.stt import DeepgramFluxSTTService
from pipecat.services.deepgram.flux.tts import DeepgramFluxTTSService
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.services.tts_service import TextAggregationMode
from pipecat.transcriptions.language import Language
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.transports.websocket.fastapi import FastAPIWebsocketParams
from pipecat.workers.runner import WorkerRunner

from business_context import build_system_instruction
from business_tools import TOOLS, BusinessStore
from tenant import load_tenant, resolve_tenant_for_call

load_dotenv(override=True)


# Voice defaults per TTS service; override either with TTS_VOICE.
DEFAULT_DEEPGRAM_VOICE = "flux-heather-en"
DEFAULT_CARTESIA_VOICE = "86e30c1d-714b-4074-a1f2-1cb6b552fb49"


def _is_twilio(transport) -> bool:
    """True when the transport is the Twilio WebSocket (telephony audio is 8kHz)."""
    serializer = getattr(getattr(transport, "_params", None), "serializer", None)
    return isinstance(serializer, TwilioFrameSerializer)


def require_env(name: str) -> str:
    """Return the value of a required environment variable or raise."""
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def build_llm(tenant: dict) -> OpenAILLMService:
    """Build the LLM service selected by LLM_SERVICE (phonellm | openai).

    "phonellm" (default) points at an OpenAI-compatible endpoint serving
    pipecat-ai/phonellm-alpha-1 — a Modal Auto Endpoint (MODAL_ENDPOINT_URL /
    MODAL_API_KEY from the official example) or a local vLLM server
    (LLM_BASE_URL=http://localhost:8000/v1, LLM_API_KEY=anything).

    NOTE: PhoneLLM Alpha 1 is English-only (model card: language=en). For
    French-speaking tenants use LLM_SERVICE=openai with a multilingual model
    such as gpt-4.1-mini — STT (Deepgram Flux) and TTS (Cartesia) handle
    French fine either way.
    """
    service = os.getenv("LLM_SERVICE", "phonellm").strip().lower()
    logger.info(f"LLM service: {service}")

    if service == "openai":
        # Works with any OpenAI-compatible endpoint: OpenAI, Groq, Cerebras, SambaNova...
        # Set LLM_BASE_URL to point at a free provider (e.g. https://api.groq.com/openai/v1).
        base_url = os.getenv("LLM_BASE_URL") or None
        return OpenAILLMService(
            api_key=require_env("OPENAI_API_KEY"),
            base_url=base_url,
            settings=OpenAILLMService.Settings(
                model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
                system_instruction=build_system_instruction(tenant),
            ),
        )

    if service != "phonellm":
        raise RuntimeError(f"Unknown LLM_SERVICE: {service!r} (expected 'phonellm' or 'openai')")

    powered_by = (
        " Tu es propulsé par PhoneLLM." if tenant.get("language") == "fr" else " You are powered by PhoneLLM."
    )
    # PhoneLLM Alpha 1 behind any OpenAI-compatible endpoint (Modal, vLLM, ...)
    return OpenAILLMService(
        api_key=require_env("LLM_API_KEY"),
        base_url=require_env("LLM_BASE_URL"),
        settings=OpenAILLMService.Settings(
            model=os.getenv("PHONELLM_MODEL", "pipecat-ai/phonellm-alpha-1"),
            # PhoneLLM is trained for temperature 0
            temperature=0,
            system_instruction=build_system_instruction(tenant, powered_by),
            # Disable reasoning
            extra={"extra_body": {"chat_template_kwargs": {"enable_thinking": False}}},
        ),
    )


def build_tts(tenant: dict) -> DeepgramFluxTTSService | CartesiaTTSService:
    """Build the TTS service selected by TTS_SERVICE (cartesia | deepgram).

    The synthesis language follows the tenant (fr -> French, otherwise English) —
    without this, Cartesia defaults to English and mangles French pronunciation.
    """
    service = os.getenv("TTS_SERVICE", "cartesia").strip().lower()
    logger.info(f"TTS service: {service}")
    tts_language = Language.FR if tenant.get("language") == "fr" else Language.EN

    if service == "cartesia":
        return CartesiaTTSService(
            api_key=require_env("CARTESIA_API_KEY"),
            text_aggregation_mode=TextAggregationMode.TOKEN,
            settings=CartesiaTTSService.Settings(
                model="sonic-3.6",
                voice=os.getenv("TTS_VOICE", DEFAULT_CARTESIA_VOICE),
                language=tts_language,
            ),
        )

    if service != "deepgram":
        raise RuntimeError(f"Unknown TTS_SERVICE: {service!r} (expected 'cartesia' or 'deepgram')")

    # Flux streams LLM tokens straight to synthesis
    return DeepgramFluxTTSService(
        api_key=require_env("DEEPGRAM_API_KEY"),
        settings=DeepgramFluxTTSService.Settings(
            voice=os.getenv("TTS_VOICE", DEFAULT_DEEPGRAM_VOICE),
        ),
    )


async def run_bot(transport: BaseTransport, runner_args: RunnerArguments, tenant: dict) -> None:
    """Run the voice agent for one call session, working for the given tenant."""
    logger.info(f"Starting phone agent for tenant {tenant['id']} — {tenant['name']}")

    # Speech-to-Text service — multilingual + biased to the tenant's language.
    # (The default is flux-general-en: French speech gets misheard as English.)
    if tenant.get("language") == "fr":
        stt = DeepgramFluxSTTService(
            api_key=require_env("DEEPGRAM_API_KEY"),
            settings=DeepgramFluxSTTService.Settings(
                model="flux-general-multi",
                language=Language.FR,
                language_hints=[Language.FR],
            ),
        )
    else:
        stt = DeepgramFluxSTTService(api_key=require_env("DEEPGRAM_API_KEY"))

    # Text-to-Speech service (TTS_SERVICE: cartesia | deepgram)
    tts = build_tts(tenant)

    # LLM service (LLM_SERVICE: phonellm | openai)
    llm = build_llm(tenant)

    context = LLMContext(tools=TOOLS)

    # Note: no VAD analyzer on the transport on purpose: Deepgram Flux does its
    # own turn detection. The user aggregator still gets Silero for end-of-turn.
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
        context,
        user_params=LLMUserAggregatorParams(vad_analyzer=SileroVADAnalyzer()),
    )

    # Pipeline — assembled from reusable components
    pipeline = Pipeline(
        [
            transport.input(),
            stt,
            user_aggregator,
            llm,
            tts,
            transport.output(),
            assistant_aggregator,
        ]
    )

    # Telephony (Twilio) carries 8kHz audio — pipecat must match sample rates
    params_kwargs: dict = {"enable_metrics": True, "enable_usage_metrics": True}
    if _is_twilio(transport):
        params_kwargs["audio_in_sample_rate"] = 8000
        params_kwargs["audio_out_sample_rate"] = 8000

    worker = PipelineWorker(
        pipeline,
        params=PipelineParams(**params_kwargs),
        # Per-call business memory, shared with the tool handlers
        app_resources=BusinessStore(tenant),
    )

    runner = WorkerRunner(handle_sigint=runner_args.handle_sigint)

    await runner.add_workers(worker)

    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        # Kick off the conversation, in the tenant's language
        # NOTE: user role (not "developer") — Groq/Qwen rejects a first turn with no
        # user message ("No user query found in messages").
        greeting = (
            "(Démarre la conversation.) Accueille brièvement l'appelant et demande comment tu peux l'aider."
            if tenant.get("language") == "fr"
            else "(Start the conversation.) Concisely greet the caller and ask how you can help."
        )
        context.add_message({"role": "user", "content": greeting})
        await worker.queue_frames([LLMRunFrame()])

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info("Client disconnected")
        await runner.cancel()

    await runner.run()


def _daily_params():
    """Daily transport params — imported lazily: daily-python has no Windows wheels."""
    from pipecat.transports.daily.transport import DailyParams

    return DailyParams(audio_in_enabled=True, audio_out_enabled=True)


async def bot(runner_args: RunnerArguments):
    """Main bot entry point — transport is selected with `-t <name>`.

    The tenant (which company the agent works for on this call) is resolved
    from the dialed number via TENANTS_PHONE_MAP, else TENANT_ID.
    """
    transport_params = {
        "twilio": lambda: FastAPIWebsocketParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
        ),
        "webrtc": lambda: TransportParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
        ),
        "daily": lambda: _daily_params(),  # Daily needs Linux (daily-python has no Windows wheels)
    }

    # create_transport auto-detects the telephony provider, builds the matching
    # serializer (e.g. TwilioFrameSerializer from TWILIO_ACCOUNT_SID /
    # TWILIO_AUTH_TOKEN), and sets add_wav_header=False.
    transport = await create_transport(runner_args, transport_params)

    # Which company is this call for?
    call_data = runner_args.call_data
    if call_data:
        logger.info(f"Call {call_data.call_id} from {getattr(call_data, 'from_number', 'unknown')}")
    tenant_id = resolve_tenant_for_call(call_data)
    tenant = load_tenant(tenant_id)
    logger.info(f"Tenant resolved: {tenant_id} — {tenant['name']} ({tenant.get('language', 'en')})")

    await run_bot(transport, runner_args, tenant)


if __name__ == "__main__":
    from pipecat.runner.run import main

    main()