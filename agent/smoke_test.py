"""Smoke test: tenant loading + prompt building (no API keys, no pipecat needed).
Run:  python smoke_test.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from business_context import build_system_instruction
from tenant import list_tenants, load_tenant, resolve_tenant_for_call


def main() -> None:
    tenants = list_tenants()
    print(f"tenants: {tenants}")
    assert "french-demo" in tenants, "french-demo tenant missing"

    t = load_tenant("french-demo")
    assert t["language"] == "fr", "tenant should be French"

    fr = build_system_instruction(t)
    assert "standardiste" in fr, "French prompt missing"
    assert "AAAA-MM-JJ" in fr, "French date format missing"

    en = build_system_instruction({**t, "language": "en"})
    assert "receptionist" in en, "English prompt missing"

    tid = resolve_tenant_for_call(None)
    assert tid == "french-demo", f"default tenant wrong: {tid}"

    print("FR prompt starts:", fr.splitlines()[0])
    print("EN prompt starts:", en.splitlines()[0])
    print(f"lengths: fr={len(fr)} en={len(en)}")
    print("SMOKE OK")


if __name__ == "__main__":
    main()