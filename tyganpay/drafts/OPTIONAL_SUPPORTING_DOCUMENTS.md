# Optional Supporting Documents — Index

**Slot:** `OPTIONAL_SUPPORTING_DOCUMENTS`  
Use this index when bundling extras for TyganPay review.

## Suggested attachments (if available)

1. Nova Bank OpenAPI / institution integration cover (`/api/v1/openapi.json`)
2. Ecosystem whitepaper extract (`docs/ecosystem.md` / public docs slug `ecosystem`)
3. Screenshot or export of live `GET /api/v1/global/status` showing Malta entity + OpenPayd EMI partner
4. Hybx/Fineract settlement architecture note from `docs/whitepaper.md` §2
5. Anaka Connect / infrastructure note only if relevant to the rail under review

## Live evidence snapshot

```bash
curl -sS https://nova-bank-api-production-7311.up.railway.app/api/v1/global/status \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(json.dumps({"name":d["name"],"malta":d["features"]["malta"]}, indent=2))'
```

Do not upload secrets, admin keys, member PINs, or passport images in this optional bundle unless TyganPay explicitly requests them in this slot.
