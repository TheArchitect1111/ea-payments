# Amanda V3.1 — Identity bridge PoC decision

**Decision: NO-GO FOR DEPLOYMENT; technical PoC BLOCKED, not a finding that Frappe is unsuitable.**

## Scope performed
- Approved audit branch inherited onto isolated `poc/amanda-v31-identity-bridge`.
- Verified Frappe's official Docker Compose and init scripts through connected GitHub.
- Identified current runtime blockers: `docker` not installed; local GitHub DNS unavailable.
- No instance launched; no private test course created; no JWT or OIDC login issued.
- No existing portal authentication, enrollment, payment, Jane, or Airtable data changed.

## Why SSO has not been proven
Frappe accepts supported OAuth/OIDC identity providers, but EA's signed session cookie is not an external OIDC identity provider. Creating a new Preview-only issuer without validating relying-party configuration, state/nonce, code exchange, token signature, replay prevention, logout and entitlement enforcement would be insecure. The no-drift requirement expressly rules out rewriting core EA authentication.

## Five acceptance criteria
| Test | Result | Evidence |
|---|---|---|
| Authorized synthetic student accesses video/PDF | NOT RUN | Frappe runtime unavailable |
| Unauthorized identity gets 403 from protected resource | NOT RUN | Frappe runtime unavailable |
| Instructor uploads video and PDF | NOT RUN | Frappe runtime unavailable |
| Progress persisted and displayed in EA My Learning | NOT RUN | No Frappe database |
| Brand-neutral premium shell mobile/desktop | NOT RUN | No authenticated Frappe session |

**Five passing screenshots: 0/5.** No fabricated evidence.

## AGPL-3.0 compliance plan
1. Inventory upstream Frappe version, license and all modifications.
2. Preserve copyright/license notices and provenance.
3. If modified AGPL Frappe is accessed over a network, provide Corresponding Source to interacting users under AGPL terms.
4. Keep EA independent services/secrets out of any AGPL source disclosure; have counsel assess integration boundary.
5. Record attribution, source URL and compliance instructions before any external/production release.

## Next execution gate
Requires an isolated machine with Docker and network access plus a secure, compatible OIDC identity provider/broker approved for synthetic users. Once available, execute the five checks and collect screenshots. If integration needs a core EA auth rewrite or Frappe cannot be presented under an acceptable branded shell, **STOP** and audit CourseLit as fallback. Do not connect live Square or real learners.

**No changes to production branches or rollback tags authorized.**
