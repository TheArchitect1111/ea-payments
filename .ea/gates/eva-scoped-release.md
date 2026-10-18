# EA Scoped Production Release: Eva Portal Help Brick

**Status:** Proposed policy, not a deployment authorization or passing certification.
**Policy version:** 1.0 (2026-10-18).
**Applies to:** Promotion commit containing only `.ea/gates/latest.json` and, optionally, this exact policy file; source commit immediately preceding the promotion.

## Strict source allowlist

A scoped release must prove that **every file changed since the last approved release's source commit** belongs to the Eva change set. Only these paths qualify:

- `src/bricks/eva-portal-help/**`
- `knowledge/eva-*-manifest.json`, `knowledge/eva-portal-help-registry.json`
- `knowledge/eva-menu-sources/**`
- `app/api/portal/[slug]/eva-help/**` (including health and refresh)

The shared watcher itself is under `src/bricks/eva-portal-help/**`. No wildcard matches `src/bricks/**` broadly. UI integration, generic Next.js configuration, independent cron routes, GitHub workflows and cross-client modifications are **not** silently exempt: they require a separately reviewed source release or explicit additional authorization for those exact paths.

**Explicitly excluded:** billing, catalog, checkout, payments/Stripe/Square, entitlement, email delivery, other bricks, shared authentication, unrelated UI and site configuration. If **any** changed file is outside the allowlist, refuse the scoped release and retain the full 14-brick live certification requirement.

## Required independent, verifiable evidence

The scoped manifest must contain:

- `type: "eva-scoped"`, `verificationType: "eva-scoped"`, `status: "PASS"`, `productionEligible: true`, `completedAt`, `previewUrl`.
- `sourceCommit` equal to the production promotion commit's **immediate parent SHA**, with a source compare baseline pinned to the prior approved release.
- `gates.sourceIdentity`, `gates.build`, `gates.functional`, `gates.previewHealth` each status PASS and **real** evidence references.
- Functional proof: Amanda 10/10 and TB3 10/10, cross-tenant isolation 2/2, no unauthorized roles leaked.
- Preview health proof: GET Amanda and TB3 `/api/portal/{slug}/eva-help/health`, each HTTP 200 and `ok:true`, timestamp, URL and entry count from the exact source deploy.
- Build proof tied to source SHA; a successful contract-only test is not a substitute for live authenticated checks.
- The author must not mark PASS on the strength of fixtures, test doubles, placeholder screenshots, absent Blob writes or future intentions.

## Enforced promotion boundaries

The promotion commit must change **only** `.ea/gates/latest.json` and `.ea/gates/eva-scoped-release.md`. The gate verifies immediate parent, source range and all allowed changed paths, then emits an explicit `[EA Production Gate] MODE=EVA-SCOPED PASS` decision. Any missing evidence, unknown baseline, SHA mismatch, or unauthorized source file must fail closed.

Other promotions still follow the **unchanged full chassis 14-brick process** and existing seven proof gates. No implicit override is allowed. In particular, a promotion containing only the documentation and manifest does not excuse unrelated earlier source commits.

## Current source block (2026-10-18)

Source candidate `922a72311a844d896ca7d245c06b70a82c46d942` contains changes beyond Eva since the old approved source `b59c046de62cebae9d0cfc00052046b7e7df2db3`, including checkout, identity bridge, middleware and classroom work. **Do not issue a scoped PASS manifest for this source.**

The existing verifier cannot both be modified and remain in the previous source SHA. Enabling this policy requires a separately reviewed verifier commit; the eventual promotion `sourceCommit` must match its actual parent, **not** stale `922a7231`.

## Production verification after a valid deployment

Both production health endpoints must be HTTP 200 `ok:true`; authenticated owner/admin `mode=live` refreshes for each tenant must yield persisted private-Blob diff logs and confirmed timestamps; verify `0 2 * * *` cron in Vercel. On failure, roll back to the prior healthy deployment and report the exact failing gate.
