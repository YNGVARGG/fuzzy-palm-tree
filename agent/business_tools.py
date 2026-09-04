"""Tools (function calls) the phone agent uses while talking to callers.

Tools are declared as **direct functions**: pipecat derives the name,
description, parameter schema, and required fields from the signature and the
Google-style docstring — listing the function in LLMContext(tools=TOOLS) is all
it takes.

The business "backend" is an in-memory BusinessStore shared with the handlers
via PipelineWorker(app_resources=...) and read back as params.app_resources.
The store carries the tenant (the company the agent works for), so FAQ answers
come from the right company, in the right language. Swap the store internals
for a real calendar/CRM later — the tool signatures stay the same.
"""

import json
import os
from datetime import datetime
from pathlib import Path

from loguru import logger
from pipecat.adapters.schemas.direct_function import tool_options
from pipecat.frames.frames import EndWorkerFrame
from pipecat.services.llm_service import FunctionCallParams

from calendar_service import create_event

_TENANTS_DIR = Path(__file__).resolve().parent / "tenants"


def _embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed with Mistral (OpenAI-compatible embeddings endpoint)."""
    from openai import OpenAI

    client = OpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("EMBED_BASE_URL") or "https://api.mistral.ai/v1",
    )
    resp = client.embeddings.create(
        model=os.getenv("EMBED_MODEL", "mistral-embed"), input=texts
    )
    return [d.embedding for d in resp.data]


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(y * y for y in b) ** 0.5
    return dot / (na * nb) if na and nb else 0.0


def _load_index(tenant_id: str) -> dict | None:
    p = _TENANTS_DIR / tenant_id / "faq_index.json"
    if not p.is_file():
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


# Keyword -> FAQ key, for English and French callers.
_FAQ_KEYWORDS = {
    "en": {
        "hour": "hours", "open": "hours", "close": "hours", "when": "hours",
        "emergency": "emergency", "urgent": "emergency", "leak": "emergency",
        "price": "cost_estimate", "cost": "cost_estimate", "quote": "cost_estimate", "estimate": "cost_estimate",
        "area": "service_area", "where": "service_area",
        "pay": "payment", "card": "payment", "cash": "payment", "invoice": "payment",
        "guarantee": "guarantee", "warranty": "guarantee",
        "boiler": "boiler_service", "maintenance": "boiler_service",
        "callback": "callback", "call back": "callback", "message": "callback",
    },
    "fr": {
        "horaire": "horaires", "ouvert": "horaires", "ferme": "horaires", "fermé": "horaires", "quand": "horaires",
        "urgence": "urgence", "urgent": "urgence", "fuite": "urgence",
        "devis": "devis", "prix": "devis", "tarif": "devis", "cout": "devis", "coût": "devis", "combien": "devis",
        "zone": "zone_intervention", "secteur": "zone_intervention", "intervenez": "zone_intervention",
        "paiement": "paiement", "payer": "paiement", "carte": "paiement", "especes": "paiement", "espèces": "paiement", "virement": "paiement", "facture": "paiement",
        "garantie": "garantie", "garanti": "garantie",
        "chaudiere": "chaudiere", "chaudière": "chaudiere", "entretien": "chaudiere",
        "rappel": "rappel", "rappeler": "rappel", "message": "rappel", "disponible": "rappel",
    },
}

_FALLBACK = {
    "en": "No FAQ entry matches. Say you are not sure and offer to have a team member call back.",
    "fr": "Aucune entrée de la FAQ ne correspond. Dis que tu n'es pas sûr(e) et propose qu'un membre de l'équipe rappelle.",
}


class BusinessStore:
    """Per-call working memory: the tenant + appointments booked + messages taken.

    One instance per call session. Appends every event to a JSONL log
    (BUSINESS_LOG_FILE, defaults to call-activity.jsonl in the working dir)
    so the business can audit what the agent did.
    """

    def __init__(self, tenant: dict) -> None:
        self.tenant = tenant
        self._next_booking_id = 1000
        self._next_message_id = 1
        self.appointments: list[dict] = []
        self.messages: list[dict] = []

    def book(self, customer_name: str, phone: str, service: str, date: str, time: str) -> dict:
        booking = {
            "reference": str(self._next_booking_id),
            "tenant": self.tenant["id"],
            "customer_name": customer_name,
            "phone": phone,
            "service": service,
            "date": date,
            "time": time,
        }
        self._next_booking_id += 1
        self.appointments.append(booking)
        _log_event("appointment_booked", booking)
        return booking

    def record_escalation(self, customer_name: str, phone: str, reason: str, details: str) -> dict:
        entry = {
            "message_id": self._next_message_id,
            "kind": "escalation",
            "tenant": self.tenant["id"],
            "customer_name": customer_name or "Appelant",
            "phone": phone or "—",
            "message": f"[{reason}] {details}",
        }
        self._next_message_id += 1
        self.messages.append(entry)
        _log_event("escalation", entry)
        return entry

    def record_message(self, customer_name: str, phone: str, message: str) -> dict:
        entry = {
            "message_id": self._next_message_id,
            "tenant": self.tenant["id"],
            "customer_name": customer_name,
            "phone": phone,
            "message": message,
        }
        self._next_message_id += 1
        self.messages.append(entry)
        _log_event("message_taken", entry)
        return entry


def _log_event(kind: str, payload: dict) -> None:
    log_file = os.getenv("BUSINESS_LOG_FILE", "call-activity.jsonl")
    try:
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(json.dumps({"kind": kind, "at": datetime.now().isoformat(), **payload}) + "\n")
    except OSError as e:
        logger.warning(f"Could not write to {log_file}: {e}")


def _faq_matches(store: BusinessStore, question: str) -> list[tuple[str, str]]:
    """Return the tenant's FAQ entries whose keywords appear in the question."""
    lang = store.tenant.get("language", "en")
    keywords = _FAQ_KEYWORDS.get(lang, _FAQ_KEYWORDS["en"])
    faq = store.tenant.get("faq", {})
    q = question.lower()
    matched: list[tuple[str, str]] = []
    for word, key in keywords.items():
        if word in q and key in faq and (key, faq[key]) not in matched:
            matched.append((key, faq[key]))
    return matched


async def answer_question(params: FunctionCallParams, question: str):
    """Answer a question about the company: hours, services, prices, area, payments, guarantees, emergencies.

    Args:
        question: The caller's question, as they asked it.
    """
    store: BusinessStore = params.app_resources
    matches = _faq_matches(store, question)
    logger.info(f"answer_question({question!r}) -> {len(matches)} matches")
    if matches:
        await params.result_callback(
            {"found": True, "answers": [{"topic": topic, "answer": answer} for topic, answer in matches]}
        )
    else:
        lang = store.tenant.get("language", "en")
        await params.result_callback({"found": False, "message": _FALLBACK.get(lang, _FALLBACK["en"])})


async def search_documents(params: FunctionCallParams, question: str):
    """Search the company's documents (price lists, policies, guides) for a precise answer.

    Use this when the question is specific (tarifs, garanties, délais, marques, aides) and not covered by the FAQ.

    Args:
        question: The caller's question, as they asked it.
    """
    store: BusinessStore = params.app_resources
    tenant_id = store.tenant["id"]
    index = _load_index(tenant_id)
    if not index or not index.get("chunks"):
        logger.info(f"search_documents({question!r}) -> no index for {tenant_id}")
        await params.result_callback(
            {"found": False, "message": "Aucun document indexé pour cette entreprise."}
        )
        return
    try:
        q_emb = _embed_texts([question])[0]
    except Exception as e:
        logger.warning(f"Embedding failed: {e}")
        await params.result_callback({"found": False, "message": "Recherche documentaire indisponible."})
        return
    chunks = index["chunks"]
    scored = sorted(
        ((_cosine(q_emb, c["embedding"]), c) for c in chunks), reverse=True
    )[:3]
    context = "\n\n".join(f"[{c['source']}] {c['chunk']}" for _, c in scored)
    logger.info(f"search_documents({question!r}) -> {len(scored)} chunks")
    await params.result_callback({"found": True, "context": context[:4000]})


async def book_appointment(
    params: FunctionCallParams,
    customer_name: str,
    phone: str,
    service: str,
    date: str,
    time: str,
):
    """Book an appointment once the caller's name, phone number, service, date, and time are all known.

    Args:
        customer_name: The caller's full name.
        phone: The caller's phone number.
        service: Which service they want (e.g. 'boiler servicing').
        date: Appointment date in YYYY-MM-DD format.
        time: Appointment time in 24-hour HH:MM format.
    """
    store: BusinessStore = params.app_resources
    booking = store.book(customer_name, phone, service, date, time)
    logger.info(f"book_appointment(...) -> {booking}")
    calendar_ok, calendar_note = create_event(booking)
    await params.result_callback(
        {
            "success": True,
            "reference": booking["reference"],
            "details": f"{service} on {date} at {time}",
            "calendar": calendar_note,
        }
    )


async def take_message(
    params: FunctionCallParams,
    customer_name: str,
    phone: str,
    message: str,
):
    """Take a message for a callback when the right person isn't available.

    Args:
        customer_name: The caller's full name.
        phone: The caller's phone number.
        message: What the message is about, in the caller's words.
    """
    store: BusinessStore = params.app_resources
    entry = store.record_message(customer_name, phone, message)
    logger.info(f"take_message(...) -> {entry}")
    promise = (
        "Quelqu'un rappellera dans un délai d'un jour ouvrable."
        if store.tenant.get("language") == "fr"
        else "Someone will call back within one business day."
    )
    await params.result_callback({"success": True, "message_id": entry["message_id"], "promise": promise})


# cancel_on_interruption=False so the tool call survives interruptions — without
# it, the bot's own farewell audio bleeding back through the mic can register as
# a new turn, cancel the in-flight end_call, and leave the caller saying goodbye
# twice.
@tool_options(cancel_on_interruption=False)
async def escalate_to_staff(
    params: FunctionCallParams,
    reason: str,
    details: str,
    customer_name: str | None = None,
    phone: str | None = None,
):
    """Escalate to the clinical/office team when a call needs a human.

    Use this — never guess — when the caller asks for MEDICAL ADVICE, reports severe
    symptoms or pain, asks about complex insurance/billing cases, makes a complaint,
    or requests something outside the agent's rules. The team receives an urgent task
    with this context and calls the patient back.

    Args:
        reason: Short category, e.g. 'avis médical demandé', 'douleur sévère', 'litige facturation'.
        details: What the caller said, as precisely as possible.
        customer_name: The caller's name, if known.
        phone: The caller's phone number, if known.
    """
    store: BusinessStore = params.app_resources
    entry = store.record_escalation(customer_name, phone, reason, details)
    logger.info(f"escalate_to_staff({reason=}) -> {entry}")
    promise = (
        "Un membre de l'équipe clinique rappelle très rapidement — restez joignable."
        if store.tenant.get("language") == "fr"
        else "A clinical team member will call back very soon — please stay reachable."
    )
    await params.result_callback(
        {"success": True, "message_id": entry["message_id"], "promise": promise}
    )


async def end_call(params: FunctionCallParams):
    """End the call and hang up.

    Use this once the caller is finished — they say goodbye, or their business
    is settled and they need nothing else. Say a short farewell in the same
    turn: the call stays up until that has finished playing.
    """
    logger.info("end_call -> hanging up once the farewell has played")
    # Resolve the call first so the LLM can produce its farewell turn; the
    # EndWorkerFrame then drains the queued frames — the closing TTS among
    # them — before the worker shuts down.
    await params.result_callback(None)
    await params.llm.push_frame(EndWorkerFrame())


TOOLS = [answer_question, search_documents, book_appointment, take_message, escalate_to_staff, end_call]
