"""Full RAG loop: LLM calls search_documents and answers from the retrieved context."""
import json
import sys
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).parent))
from dotenv import load_dotenv

load_dotenv(override=True)

from business_context import build_system_instruction
from business_tools import BusinessStore, search_documents
from openai import OpenAI
from tenant import load_tenant


def main() -> None:
    tenant = load_tenant("french-demo")
    client = OpenAI(api_key=__import__("os").getenv("OPENAI_API_KEY"), base_url=__import__("os").getenv("LLM_BASE_URL") or None)
    store = BusinessStore(tenant)
    tool_results: list = []

    async def cb(r) -> None:
        tool_results.append(r)

    async def run_tool(name: str, args: dict) -> None:
        if name == "search_documents":
            await search_documents(SimpleNamespace(app_resources=store, result_callback=cb), question=args.get("question", ""))

    messages = [
        {"role": "system", "content": build_system_instruction(tenant)},
        {"role": "user", "content": "(Démarre la conversation.) Accueille brièvement l'appelant."},
        {"role": "user", "content": "Bonjour, combien coûte le remplacement d'une chaudière ? Et est-ce que vous vous occupez des aides ?"}
    ]
    tools = [
        {
            "type": "function",
            "function": {
                "name": "search_documents",
                "description": "Search the company's documents for a precise answer.",
                "parameters": {
                    "type": "object",
                    "properties": {"question": {"type": "string"}},
                    "required": ["question"],
                },
            },
        },
    ]
    answer = ""
    for _ in range(4):
        resp = client.chat.completions.create(model=__import__("os").getenv("OPENAI_MODEL", "mistral-small-latest"), messages=messages, tools=tools, temperature=0, max_tokens=250)
        msg = resp.choices[0].message
        if getattr(msg, "tool_calls", None):
            tc = msg.tool_calls[0]
            args = json.loads(tc.function.arguments or "{}")
            print("TOOL:", tc.function.name, args, flush=True)
            import asyncio
            asyncio.run(run_tool(tc.function.name, args))
            messages.append({"role": "assistant", "content": None, "tool_calls": [{"id": tc.id, "type": "function", "function": {"name": tc.function.name, "arguments": tc.function.arguments}}]})
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": json.dumps(tool_results[-1] if tool_results else {}, ensure_ascii=False)})
        else:
            answer = msg.content or ""
            break
    print("ANSWER:", answer[:300], flush=True)
    print("USED_DOCS:", bool(tool_results and tool_results[0].get("found")), flush=True)


if __name__ == "__main__":
    main()