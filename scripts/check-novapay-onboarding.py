#!/usr/bin/env python3
"""Probe NovaPay client-onboarding invite status (does not submit).

If no invite URL/token is configured, report awaiting_provider and exit 0.
When NOVAPAY_ONBOARDING_URL or NOVAPAY_ONBOARDING_TOKEN is set, GET the invite
and refresh novapay/nova-onboarding-pack.json inviteStatus.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACK_PATH = ROOT / "novapay" / "nova-onboarding-pack.json"


def probe_url(url: str) -> dict:
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json, text/html;q=0.9,*/*;q=0.8",
            "User-Agent": "nova-ecosystem-check-novapay/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            raw = res.read().decode(errors="replace")
            try:
                body = json.loads(raw)
            except json.JSONDecodeError:
                body = {"raw": raw[:500], "contentType": res.headers.get("Content-Type")}
            return {"url": url, "httpStatus": res.status, "body": body}
    except urllib.error.HTTPError as err:
        raw = err.read().decode(errors="replace")
        try:
            body = json.loads(raw)
        except json.JSONDecodeError:
            body = {"raw": raw[:500]}
        return {"url": url, "httpStatus": err.code, "body": body}
    except Exception as err:  # noqa: BLE001
        return {"url": url, "httpStatus": None, "body": {"error": str(err)}}


def resolve_invite_url() -> str | None:
    direct = os.environ.get("NOVAPAY_ONBOARDING_URL", "").strip()
    if direct:
        return direct
    token = os.environ.get("NOVAPAY_ONBOARDING_TOKEN", "").strip()
    if not token:
        return None
    base = os.environ.get("NOVAPAY_ONBOARDING_BASE", "").rstrip("/")
    if not base:
        print(
            "NOVAPAY_ONBOARDING_TOKEN set but NOVAPAY_ONBOARDING_BASE missing",
            file=sys.stderr,
        )
        return None
    # Common pattern: {base}/client-onboarding/{token} or {base}/{token}
    if "{token}" in base:
        return base.replace("{token}", token)
    return f"{base}/client-onboarding/{token}"


def write_invite_status(status: dict) -> None:
    if not PACK_PATH.exists():
        return
    pack = json.loads(PACK_PATH.read_text())
    pack.setdefault("source", {})["inviteStatus"] = status
    if status.get("inviteUrl"):
        pack["source"]["novaPayInviteUrls"] = [status["inviteUrl"]]
    if status.get("token"):
        pack["source"]["novaPayInviteToken"] = status["token"]
    PACK_PATH.write_text(json.dumps(pack, indent=2) + "\n")
    print(f"Updated {PACK_PATH}", file=sys.stderr)


def main() -> int:
    url = resolve_invite_url()
    if not url:
        status = {
            "httpStatus": None,
            "error": "awaiting_provider",
            "reason": (
                "No NOVAPAY_ONBOARDING_URL or NOVAPAY_ONBOARDING_TOKEN configured. "
                "External NovaPay onboarding portal has not been issued."
            ),
            "ok": False,
            "actionRequired": (
                "Stand up or contract NovaPay as a provider, then set "
                "NOVAPAY_ONBOARDING_URL (or TOKEN+BASE) and re-run this script."
            ),
        }
        write_invite_status(status)
        print(json.dumps({"inviteStatus": status, "results": []}, indent=2))
        print("NovaPay onboarding: awaiting_provider", file=sys.stderr)
        return 0

    result = probe_url(url)
    body = result.get("body") or {}
    http = result.get("httpStatus")
    ok = http == 200 and (body.get("ok") is True or body.get("error") in (None, ""))
    if http == 200 and "error" not in body and not isinstance(body.get("ok"), bool):
        # HTML/portal page without JSON ok flag — treat 200 as reachable
        ok = True
    status = {
        "httpStatus": http,
        "error": body.get("error"),
        "reason": body.get("reason") or body.get("message"),
        "ok": ok,
        "inviteUrl": url,
        "token": os.environ.get("NOVAPAY_ONBOARDING_TOKEN") or None,
        "actionRequired": (
            "Invite reachable — submit novapay/form-payload.json in one session."
            if ok
            else "Invite not usable — ask NovaPay admin to reset or re-issue."
        ),
    }
    write_invite_status(status)
    print(json.dumps({"inviteStatus": status, "results": [result]}, indent=2))
    return 0 if ok else 2


if __name__ == "__main__":
    raise SystemExit(main())
