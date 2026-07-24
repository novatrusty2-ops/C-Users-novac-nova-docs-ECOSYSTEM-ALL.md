# ADR-001: S3-compatible storage layout

## Status
Accepted (Phase 1)

## Context
Original masters, proxies, thumbnails, and quarantine objects must be separated for lifecycle policies and least privilege.

## Decision
Use one bucket (`artcity-media`) with prefixes:

| Prefix | Purpose |
|--------|---------|
| `quarantine/{tenant_id}/` | In-progress multipart uploads |
| `originals/{tenant_id}/{asset_id}/` | Immutable masters |
| `proxies/{tenant_id}/{asset_id}/` | Browser-playable proxies |
| `thumbs/{tenant_id}/{asset_id}/` | Thumbnails / storyboard stills |
| `temp/{tenant_id}/` | Worker scratch (short TTL later) |

Access only via signed URLs issued by the API. Clients never receive permanent public object URLs.

## Consequences
Lifecycle rules and IAM can target prefixes independently. Phase 2+ may split buckets; object keys remain stable via DB references.
