"""Build the document index for a tenant (RAG).

Usage:  python index_docs.py <tenant_id>
Reads tenants/<id>/docs/*.txt|*.md, chunks the text, embeds it with Mistral,
and writes tenants/<id>/faq_index.json.
"""

import json
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(override=True)

ROOT = Path(__file__).resolve().parent
TENANTS_DIR = ROOT / "tenants"
CHUNK_SIZE = 800
CHUNK_OVERLAP = 120


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    paras = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: list[str] = []
    cur = ""
    for p in paras:
        if len(cur) + len(p) + 2 <= size:
            cur = (cur + "\n\n" + p).strip()
        else:
            if cur:
                chunks.append(cur)
            cur = p[:size]
    if cur:
        chunks.append(cur)
    if len(chunks) > 1 and overlap:
        out = [chunks[0]]
        for i in range(1, len(chunks)):
            out.append(chunks[i - 1][-overlap:] + "\n" + chunks[i])
        return out
    return chunks


def embed(texts: list[str]) -> list[list[float]]:
    from openai import OpenAI

    import os

    client = OpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("EMBED_BASE_URL") or "https://api.mistral.ai/v1",
    )
    resp = client.embeddings.create(
        model=os.getenv("EMBED_MODEL", "mistral-embed"), input=texts
    )
    return [d.embedding for d in resp.data]


def main(tenant_id: str) -> int:
    docs_dir = TENANTS_DIR / tenant_id / "docs"
    if not docs_dir.is_dir():
        print(f"No docs dir for tenant {tenant_id}")
        return 1
    chunks: list[dict] = []
    for f in sorted(docs_dir.iterdir()):
        if f.suffix.lower() not in (".txt", ".md"):
            continue
        text = f.read_text(encoding="utf-8", errors="replace")
        for i, c in enumerate(chunk_text(text)):
            chunks.append({"source": f.name, "chunk": c})
    if not chunks:
        print(f"No text docs for tenant {tenant_id}")
        return 1
    embs = embed([c["chunk"] for c in chunks])
    index = {
        "tenant": tenant_id,
        "chunks": [{**c, "embedding": e} for c, e in zip(chunks, embs)],
    }
    out = TENANTS_DIR / tenant_id / "faq_index.json"
    out.write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")
    sources = sorted({c["source"] for c in chunks})
    print(f"Indexed {len(chunks)} chunks from {len(sources)} docs -> {out.name}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python index_docs.py <tenant_id>")
        sys.exit(1)
    sys.exit(main(sys.argv[1]))