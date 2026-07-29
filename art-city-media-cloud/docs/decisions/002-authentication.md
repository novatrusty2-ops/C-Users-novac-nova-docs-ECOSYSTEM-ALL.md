# ADR-002: Authentication and tenancy

## Status
Accepted (Phase 1)

## Context
The platform needs multi-tenant identity with RBAC. SSO/OIDC is required later but would delay the vertical slice.

## Decision
- Email/password authentication with bcrypt password hashes
- JWT access tokens + refresh tokens
- Claims: `sub` (user id), `tenant_id`, `role`, `email`
- Roles: `tenant_admin`, `archivist`, `editor`, `contributor`, `reviewer`
- Every tenant-scoped query filters by `tenant_id` from the token

SSO / OIDC enterprise directory integration is deferred to enterprise expansion.

## Consequences
Simple local and pilot onboarding. Adapter-ready auth layer can later validate external IdP tokens without rewriting asset APIs.
