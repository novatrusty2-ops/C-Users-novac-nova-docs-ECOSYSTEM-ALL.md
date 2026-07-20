#!/usr/bin/env python3
"""Verify Nova Bank Malta Ltd / OpenPayd metadata in ECOSYSTEM.json (+ optional live API)."""

from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ECO = ROOT / "ECOSYSTEM.json"
ENV_EXAMPLE = ROOT / ".env.example"
SETUP_DOC = ROOT / "docs" / "OPENPAYD-NOVA-BANK-MALTA-SETUP.md"
STATUS_URL = "https://nova-bank-api-production-7311.up.railway.app/api/v1/global/status"
INTEGRATIONS_URL = (
    "https://nova-bank-api-production-7311.up.railway.app/api/v1/international/integrations"
)


def fail(msg: str) -> None:
    print(f"FAIL: {msg}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    eco = json.loads(ECO.read_text())
    products = eco.get("products") or {}
    nova = products.get("novaBankOnline") or {}
    openpayd = products.get("openpayd") or {}

    if nova.get("legalEntity") != "Nova Bank Malta Ltd":
        fail(f"novaBankOnline.legalEntity unexpected: {nova.get('legalEntity')!r}")
    if nova.get("emiPartner") != "openpayd":
        fail(f"novaBankOnline.emiPartner unexpected: {nova.get('emiPartner')!r}")
    if nova.get("vfaLicensed") is not True:
        fail(f"novaBankOnline.vfaLicensed unexpected: {nova.get('vfaLicensed')!r}")
    if openpayd.get("novaConfigHint") != "EMI_OPENPAYD_API_KEY":
        fail(f"openpayd.novaConfigHint unexpected: {openpayd.get('novaConfigHint')!r}")
    if openpayd.get("secretsInThisRepo") is not False:
        fail("openpayd.secretsInThisRepo must be false")

    if not ENV_EXAMPLE.exists():
        fail(".env.example missing")
    env_text = ENV_EXAMPLE.read_text()
    for key in (
        "EMI_OPENPAYD_API_KEY",
        "OPENPAYD_USERNAME",
        "OPENPAYD_PASSWORD",
        "OPENPAYD_ACCOUNT_HOLDER_ID",
        "OPENPAYD_BASE_URL",
    ):
        if key not in env_text:
            fail(f".env.example missing {key}")

    if not SETUP_DOC.exists():
        fail("docs/OPENPAYD-NOVA-BANK-MALTA-SETUP.md missing")

    print("OK: ECOSYSTEM.json Malta/OpenPayd metadata + .env.example + setup doc")

    if "--live" in sys.argv:
        with urllib.request.urlopen(STATUS_URL, timeout=15) as resp:
            status = json.loads(resp.read().decode("utf-8"))
        malta = (status.get("features") or {}).get("malta") or {}
        if malta.get("emiPartner") != "openpayd":
            fail(f"live features.malta.emiPartner={malta.get('emiPartner')!r}")
        if malta.get("entityName") != "Nova Bank Malta Ltd":
            fail(f"live features.malta.entityName={malta.get('entityName')!r}")

        with urllib.request.urlopen(INTEGRATIONS_URL, timeout=15) as resp:
            catalog = json.loads(resp.read().decode("utf-8"))
        item = next((i for i in catalog.get("items", []) if i.get("id") == "openpayd"), None)
        if not item:
            fail("live international/integrations missing id=openpayd")
        if item.get("configHint") != "EMI_OPENPAYD_API_KEY":
            fail(f"live openpayd configHint={item.get('configHint')!r}")
        print("OK: live Nova Bank API still names OpenPayd for Nova Bank Malta Ltd")


if __name__ == "__main__":
    main()
