# Trust Center & Legal Governance

Builds on the Legal Document Pack (`docs/TRUST-ENGINE-LEGAL-PACK.md`) without replacing it.

## Persistence (production)

| Table | Env override | Purpose |
|-------|--------------|---------|
| Legal Acceptances | `AIRTABLE_LEGAL_ACCEPTANCES_TABLE` | Append-only acceptances |
| Legal Audit Events | `AIRTABLE_LEGAL_AUDIT_EVENTS_TABLE` | Append-only audit timeline |

Local `.data/trust-engine/` is **dev-only** when `TRUST_ENGINE_DEV_FALLBACK=1`. Production requires Airtable.

Migration: `npm run migrate:trust-engine -- --dry-run` then `npm run migrate:trust-engine`.

## Surfaces

| Surface | Route |
|---------|-------|
| Trust Center (public) | `/trust` |
| Client Legal Status | Portal Document Hub (`/portal/{slug}/documents`) |
| Executive Legal Dashboard | `/admin/legal` |
| Canonical legal docs | `/legal/*` |

## Trust Engine modules (additive)

| Module | Role |
|--------|------|
| `lib/trust-engine/status.ts` | `getClientLegalStatus` / document rows |
| `lib/trust-engine/governance.ts` | `publishLegalVersion`, reacceptance, MSA/SOW events |
| `lib/trust-engine/audit.ts` | Append-only audit timeline |
| `lib/trust-engine/client-store.ts` | Client profiles + acceptance history |
| `lib/trust-engine/version-overlay.ts` | Publish new versions without rewriting pack |
| `lib/trust-engine/journey.ts` | Legal milestones on client journey |
| `lib/trust-engine/notifications.ts` | Pulse / email hooks via `dispatchNotification` |
| `lib/trust-engine/api.ts` | Cross-product API facade |

## APIs

- `GET /api/trust/client-status`
- `GET /api/trust/documents-requiring-acceptance`
- `GET /api/trust/product-pack`
- `GET /api/trust/audit`
- `POST /api/trust/accept`
- `GET /api/admin/legal/dashboard`
- `GET /api/admin/legal/clients/[clientId]`
- `POST /api/admin/legal/publish-version`

Programmatic: import from `@/lib/trust-engine` — `getClientLegalStatus`, `getProductLegalPack`, `getDocumentsRequiringAcceptance`, `publishLegalVersionApi`, `getLegalAuditHistory`.

## Governance rules

1. Acceptance history is **append-only** — never overwritten.
2. Publishing a version marks stale clients `requiresReacceptance`.
3. Checkbox docs gate onboarding / reacceptance; MSA/SOW remain eSign.
4. Project State Engine still advances Agreement→Design on **payment**; MSA/SOW appear as journey milestones.

## Local persistence

`.data/trust-engine/` (gitignored) until Airtable Client Records field is wired.

## Notifications (Pulse)

`trust.legal.*`, `trust.msa.*`, `trust.sow.*`, `trust.support.updated`
