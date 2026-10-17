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


## Phase 2B: Preview-only contract mock, 2026-10-17

**Mock implemented, NOT real OAuth2/OIDC or Frappe authorization.** In the `poc/amanda-v31-identity-bridge` branch only:
- `lib/amanda-catherine/frappe-bridge-mock.ts`: HS256 HMAC JWT with `iss`, `aud`, `email`, `courseId`, `role`, `iat`, `exp` (300 seconds), random `jti`, timing-safe signature comparison and a development allowlist.
- `app/api/frappe-bridge/token/route.ts`: POST only; requires verified EA portal session with exact Amanda tenant, synthetic `test@amandacatherine.ca`, Preview environment and secret.
- `app/api/frappe-bridge/verify/route.ts`: POST only; returns courseAccess on successful verification; fails closed.
- `app/portal/amanda-catherine/classroom-test/page.tsx`: private Preview-only branded placeholder and restricted-access display.
- All endpoints disabled outside `VERCEL_ENV=preview` or when `FRAPPE_BRIDGE_SECRET` is absent or under 32 characters. Never copy real session signing secrets into this mock.

### Important security gaps: cannot call this working OIDC
1. This is a direct JWT contract mock, **not** a standards-compliant OIDC issuer. Real OIDC needs authorization-code exchange, state/nonce, redirect URI verification, ID token issuer/JWKS discovery and broker configuration. Frappe's native social-login provider compatibility is unproven.
2. In-memory `jti` map is **process-local**. Across Vercel serverless instances a replay can be accepted by another instance. A persistent shared atomic consume-once store (e.g., database unique insert with TTL) is required for actual replay protection. Never deploy this mock as real student authentication.
3. No authenticated synthetic EA cookie is available in this tool runtime. A real authorized Preview browser test cannot be claimed without user-provided test session and approved isolated environment.
4. Placeholder video, PDF and progress are **not** Frappe lesson playback, uploads or persisted learning.
5. The verify endpoint should be private service-to-service in a real integration; a publicly callable mock exposes only synthetic identity and uses no real learner or payment data.

### New verification outcome
Five-test success matrix still **NOT RUN** against authenticated Preview:
- authorized synthetic test student: pending isolated Preview secret and authenticated test session;
- unauthorized user: mock code rejects non-allowlisted identities;
- tampered JWT: mock code validates HS256 signature before any access;
- expired or replayed JWT: code checks expiration and in-memory `jti`, but this is not globally reliable;
- premium branded classroom: route is a placeholder only; no claim of working Frappe learning functionality.

**Decision remains HOLD / NO-GO for real SSO integration until shared replay storage and actual OIDC interoperability are proven.**
