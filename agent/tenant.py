"""Tenant loading for the multi-company product.

Each company that uses the product is a "tenant" with its own agent config: a
folder under tenants/ containing a tenant.json (company profile, FAQ, phone
numbers). One tenant = one AI employee.

The tenant for an inbound call is resolved from the number the caller dialed
(call_data.to_number) against TENANTS_PHONE_MAP, else from TENANT_ID (used when
testing without telephony).
"""

import json
import os
from pathlib import Path

TENANTS_DIR = Path(__file__).parent / "tenants"

DEFAULT_TENANT_ID = os.getenv("TENANT_ID", "french-demo")


def list_tenants() -> list[str]:
    """Return the ids of all configured tenants."""
    if not TENANTS_DIR.is_dir():
        return []
    return [p.name for p in TENANTS_DIR.iterdir() if (p / "tenant.json").is_file()]


def load_tenant(tenant_id: str) -> dict:
    """Load a tenant's profile + FAQ from tenants/<id>/tenant.json."""
    path = TENANTS_DIR / tenant_id / "tenant.json"
    if not path.is_file():
        raise RuntimeError(f"Unknown tenant {tenant_id!r} — no {path}")
    with open(path, encoding="utf-8") as f:
        tenant = json.load(f)
    tenant["id"] = tenant_id
    return tenant


def resolve_tenant_for_call(call_data) -> str:
    """Map the dialed number to a tenant id.

    Order: TENANTS_PHONE_MAP env ("+33123456789:french-demo,+336...:other"),
    then the tenant list in the product database (future), then TENANT_ID.
    """
    phone_map = os.getenv("TENANTS_PHONE_MAP", "")
    if call_data:
        to_number = getattr(call_data, "to_number", None) or getattr(call_data, "from_number", None)
        if to_number:
            for pair in phone_map.split(","):
                if ":" in pair:
                    number, tenant_id = pair.split(":", 1)
                    if number.strip() == to_number.strip():
                        return tenant_id.strip()
    return DEFAULT_TENANT_ID
