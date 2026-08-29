"""Quick RAG retrieval test (no server needed)."""
import asyncio
import sys
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).parent))
from dotenv import load_dotenv

load_dotenv(override=True)

from business_tools import BusinessStore, search_documents
from tenant import load_tenant


def main() -> None:
    store = BusinessStore(load_tenant("french-demo"))
    results: list = []

    async def cb(r) -> None:
        results.append(r)

    async def go() -> None:
        await search_documents(
            SimpleNamespace(app_resources=store, result_callback=cb),
            "Combien coûte l'entretien annuel d'une chaudière ?",
        )

    asyncio.run(go())
    print("RESULT:", str(results[0])[:500])


if __name__ == "__main__":
    main()