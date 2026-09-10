# Feature Specification: [TITLE]

**Request:** [user/client request]
**Project/tenant:** [project]
**Owner:** [owner]
**Status:** Draft

## Intent

Describe the outcome in plain language. Preserve the user's approved language and constraints.

## Scope

### In scope
- [ ] [surface/change]

### Out of scope
- [ ] [explicit exclusions]

## Source of truth

List the authoritative files, records, routes, approved references, assets, or prior decisions.

## Protected invariants

- Existing approved content and assets are preserved unless explicitly changed.
- SECURITY-MODEL.md remains binding.
- Existing working authentication, billing, entitlement, tenancy, legal, and monitoring behavior must not regress.
- Client-facing language remains guided and clear.

## Acceptance criteria

1. [observable production outcome]
2. [observable production outcome]
3. No missing, repeated, or unauthorized visual assets on affected surfaces.
4. Mobile and desktop presentation remain functional for affected surfaces.
5. Production verification confirms the requested outcome.

## Verification plan

- Repository/build checks: [commands/checks]
- Route checks: [routes]
- Interaction checks: [critical actions]
- Visual/content checks: [what must be seen]
- Security/tenant checks: [if applicable]

## Rollback condition

Define what failure requires rollback or blocks completion.

## Completion evidence

Record deployed URL, commit/deployment identifier, verification results, and remaining known limitations. A source edit or successful commit alone is not completion.