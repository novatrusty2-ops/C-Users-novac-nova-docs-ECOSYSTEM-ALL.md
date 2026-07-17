#!/usr/bin/env python3
"""Probe TyganPay client-onboarding invite status (does not submit)."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TOKEN = "nova-660c3e14ec7fbc9b7f57ed68a7046b0dd759d466b3a876f2"
HOSTS = (
    "https://api.tyganpay.com",
    "https://test.tyganpay.com",
)


def probe(host: str, token: str) -> dict:
    url = f"{host}/api/public/client-onboarding/{token}"
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "nova-ecosystem-check-tyganpay/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            body = json.loads(res.read().decode())
            return {"host": host, "httpStatus": res.status, "body": body}
    except urllib.error.HTTPError as err:
        raw = err.read().decode(errors="replace")
        try:
            body = json.loads(raw)
        except json.JSONDecodeError:
            body = {"raw": raw[:500]}
        return {"host": host, "httpStatus": err.code, "body": body}
    except Exception as err:  # noqa: BLE001
        return {"host": host, "httpStatus": None, "body": {"error": str(err)}}


def main() -> int:
    token = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_TOKEN
    results = [probe(host, token) for host in HOSTS]
    print(json.dumps({"token": token, "results": results}, indent=2))

    pack_path = ROOT / "tyganpay" / "nova-onboarding-pack.json"
    if pack_path.exists():
        pack = json.loads(pack_path.read_text())
        status = results[0]
        body = status.get("body") or {}
        pack.setdefault("source", {})["inviteStatus"] = {
            "httpStatus": status.get("httpStatus"),
            "error": body.get("error"),
            "reason": body.get("reason"),
            "ok": body.get("ok"),
            "actionRequired": (
                "Invite usable — submit form-payload.json in one session."
                if status.get("httpStatus") == 200 and body.get("ok")
                else "Request TyganPay admin/Sylvain to reset or re-issue the invite."
            ),
        }
        pack_path.write_text(json.dumps(pack, indent=2) + "\n")
        print(f"Updated {pack_path}", file=sys.stderr)

    blocked = any(
        (r.get("body") or {}).get("error") == "onboarding_link_view_limit_blocked"
        for r in results
    )
    return 2 if blocked else 0


if __name__ == "__main__":
    raise SystemExit(main())
