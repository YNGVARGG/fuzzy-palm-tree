"""End-to-end test for the Company Phone Agent (no mic needed).

Simulates a full call headlessly:
  1. servers up (dashboard :3000, agent :7860)
  2. brain answers in French (Groq/Mistral via .env config)
  3. booking tool fires (real business_tools handler + BusinessStore)
  4. the booking is visible through the dashboard API

Run:  scripts\run-e2e-test.ps1   (or: python e2e_test.py from agent/)
"""

import json
import os
import sys
import urllib.request
from datetime import datetime
from types import SimpleNamespace

from dotenv import load_dotenv

load_dotenv(override=True)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG_FILE = os.path.join(ROOT, "agent", "call-activity.jsonl")
DASH_URL = "http://127.0.0.1:3000"
AGENT_URL = "http://127.0.0.1:7860"

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from business_context import build_system_instruction  # noqa: E402
from business_tools import TOOLS, BusinessStore  # noqa: E402
from tenant import load_tenant  # noqa: E402

PASSED = []
FAILED = []


def check(name: str, ok: bool, detail: str = "") -> None:
    (PASSED if ok else FAILED).append(name)
    print(("  PASS " if ok else "  FAIL ") + name + (" — " + detail if detail else ""), flush=True)


def http_get(url: str, timeout: float = 4.0):
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return r.status, r.read().decode("utf-8")


def main() -> int:
    tenant = load_tenant("french-demo")
    print(f"== Phase 1: servers ({tenant['name']})", flush=True)

    for name, url in [("dashboard", DASH_URL), ("agent", AGENT_URL)]:
        try:
            status, _ = http_get(url)
            check(f"{name} responds", status == 200, f"HTTP {status}")
        except Exception as e:
            check(f"{name} responds", False, repr(e))

    print("== Phase 2: brain + booking tool (simulated call)", flush=True)

    from openai import OpenAI

    api_key = os.getenv("OPENAI_API_KEY", "")
    base_url = os.getenv("LLM_BASE_URL") or None
    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
    if not api_key:
        check("LLM key configured", False, "OPENAI_API_KEY empty in .env")
        return 1
    client = OpenAI(api_key=api_key, base_url=base_url)

    # Tool schemas mirroring business_tools (the bot uses the same functions)
    tools = [
        {
            "type": "function",
            "function": {
                "name": "book_appointment",
                "description": "Book an appointment once the caller's name, phone number, service, date, and time are all known.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "customer_name": {"type": "string"},
                        "phone": {"type": "string"},
                        "service": {"type": "string"},
                        "date": {"type": "string"},
                        "time": {"type": "string"},
                    },
                    "required": ["customer_name", "phone", "service", "date", "time"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "answer_question",
                "description": "Answer a question about the company.",
                "parameters": {
                    "type": "object",
                    "properties": {"question": {"type": "string"}},
                    "required": ["question"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "take_message",
                "description": "Take a message for a callback.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "customer_name": {"type": "string"},
                        "phone": {"type": "string"},
                        "message": {"type": "string"},
                    },
                    "required": ["customer_name", "phone", "message"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "end_call",
                "description": "End the call and hang up.",
                "parameters": {"type": "object", "properties": {}},
            },
        },
    ]

    store = BusinessStore(tenant)
    tool_results: list[dict] = []

    async def result_callback(result):
        tool_results.append(result)

    class FakeLLM:
        async def push_frame(self, frame):
            tool_results.append({"__frame__": type(frame).__name__})

    import asyncio
    loop = asyncio.new_event_loop()

    messages = [
        {"role": "system", "content": build_system_instruction(tenant)},
        {"role": "user", "content": "(Démarre la conversation.) Accueille brièvement l'appelant et demande comment tu peux l'aider."},
        {"role": "user", "content": "Bonjour, je voudrais un rendez-vous pour une fuite d'eau demain à 10h. Mon nom est Jean Dupont, mon téléphone est le 0612345678."},
    ]

    booked = False
    final_reply = ""
    for _turn in range(6):
        resp = client.chat.completions.create(
            model=model,
            messages=messages,
            tools=tools,
            temperature=0,
            max_tokens=300,
        )
        msg = resp.choices[0].message
        if getattr(msg, "tool_calls", None):
            for tc in msg.tool_calls:
                fn = tc.function.name
                args = json.loads(tc.function.arguments or "{}")
                print(f"  tool call: {fn} {args}", flush=True)
                params = SimpleNamespace(app_resources=store, result_callback=result_callback, llm=FakeLLM())
                handler = {"book_appointment": None, "answer_question": None, "take_message": None, "end_call": None}
                import business_tools as bt

                handler = {
                    "book_appointment": bt.book_appointment,
                    "answer_question": bt.answer_question,
                    "take_message": bt.take_message,
                    "end_call": bt.end_call,
                }
                if fn == "end_call":
                    loop.run_until_complete(handler[fn](params))
                    messages.append({"role": "assistant", "content": None, "tool_calls": [{"id": tc.id, "type": "function", "function": {"name": fn, "arguments": tc.function.arguments}}]})
                    messages.append({"role": "tool", "tool_call_id": tc.id, "content": "null"})
                    continue
                loop.run_until_complete(handler[fn](params, **args))
                result = tool_results[-1] if tool_results else {}
                if fn == "book_appointment":
                    booked = bool(result.get("success"))
                messages.append({"role": "assistant", "content": None, "tool_calls": [{"id": tc.id, "type": "function", "function": {"name": fn, "arguments": tc.function.arguments}}]})
                messages.append({"role": "tool", "tool_call_id": tc.id, "content": json.dumps(result, ensure_ascii=False)})
        else:
            final_reply = msg.content or ""
            print(f"  assistant: {final_reply[:120]}", flush=True)
            if booked:
                break
            # Model asked for something — provide the details once more
            messages.append({"role": "user", "content": "Voici tout : Jean Dupont, 0612345678, fuite d'eau, demain à 10h. Réserve s'il te plaît."})
            continue

    check("French reply", bool(final_reply) and any(c in final_reply for c in "éèàêç"), final_reply[:80])
    check("booking tool fired", booked)
    check("booking stored", len(store.appointments) == 1)
    if store.appointments:
        a = store.appointments[0]
        services = tenant["services"]
        ok_service = a["service"] in services or "fuite" in a["service"]
        check("booking details", ok_service, str(a.get("service")))
        check("booking confirmed by brain", "réserv" in final_reply or "confirm" in final_reply or a["reference"] in final_reply, final_reply[:100])

    print("== Phase 3: dashboard sees the booking", flush=True)

    if booked and store.appointments:
        event = {
            "kind": "appointment_booked",
            "at": datetime.now().isoformat(),
            "tenant": "french-demo",
            **store.appointments[0],
        }
        before = b""
        if os.path.exists(LOG_FILE):
            with open(LOG_FILE, "rb") as f:
                before = f.read()
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(event, ensure_ascii=False) + "\n")
        try:
            status, body = http_get(f"{DASH_URL}/api/tenants/french-demo/activity")
            data = json.loads(body)
            visible = any(b.get("reference") == str(event["reference"]) for b in data.get("bookings", []))
            check("dashboard API shows the booking", status == 200 and visible, f"HTTP {status}")
        finally:
            if before:
                with open(LOG_FILE, "wb") as f:
                    f.write(before)
            elif os.path.exists(LOG_FILE):
                os.remove(LOG_FILE)

    print(f"\n== RESULT: {len(PASSED)} passed, {len(FAILED)} failed", flush=True)
    return 1 if FAILED else 0


if __name__ == "__main__":
    sys.exit(main())
