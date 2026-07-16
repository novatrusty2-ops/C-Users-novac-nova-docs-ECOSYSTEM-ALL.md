#!/usr/bin/env python3
"""Client workaround: resolve 4-digit fromAccountId → UUID, then transfer.

Production currently 404s with "Wallet not found" when fromAccountId is an
account number. After the API patch is deployed, this script is unnecessary
but remains useful for debugging.

Usage:
  export BASE=https://nova-bank-api-production-7311.up.railway.app
  export TOKEN=...
  python3 scripts/transfer-by-account-resolve.py \\
    --from 9873 --to 7318 --amount 1 --pin 1234 --reference WALLET-TEST
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid


def api(base: str, method: str, path: str, token: str, body: dict | None = None, idem: bool = False):
    url = base.rstrip("/") + path
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    if idem:
        headers["Idempotency-Key"] = str(uuid.uuid4())
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {"raw": raw}
        return e.code, payload


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--base", default=os.environ.get("BASE", "https://nova-bank-api-production-7311.up.railway.app"))
    p.add_argument("--token", default=os.environ.get("TOKEN", ""))
    p.add_argument("--from", dest="from_account", required=True, help="4-digit account number or UUID")
    p.add_argument("--to", dest="to_account", required=True)
    p.add_argument("--amount", required=True)
    p.add_argument("--pin", default="")
    p.add_argument("--reference", default="WALLET-TEST")
    args = p.parse_args()

    if not args.token:
        print("TOKEN env or --token required", file=sys.stderr)
        return 2

    base = args.base
    from_id = args.from_account.strip()
    if from_id.isdigit() and len(from_id) == 4:
        q = urllib.parse.urlencode({"accountNumber": from_id})
        code, resolved = api(base, "GET", f"/api/v1/accounts/resolve/me?{q}", args.token)
        print("resolve", code, json.dumps(resolved, indent=2))
        if code != 200 or not resolved.get("accountId"):
            return 1
        if not resolved.get("isOwn"):
            print("warning: account is not owned by this token; transfer will likely 404", file=sys.stderr)
        from_id = resolved["accountId"]

    body = {
        "fromAccountId": from_id,
        "toAccountNumber": args.to_account,
        "amount": args.amount,
        "reference": args.reference,
    }
    if args.pin:
        body["pin"] = args.pin

    code, result = api(base, "POST", "/api/v1/transfers/by-account", args.token, body, idem=True)
    print("transfer", code, json.dumps(result, indent=2))
    return 0 if code in (200, 201) else 1


if __name__ == "__main__":
    raise SystemExit(main())
