# Feature Specification: EA Factory Screenshot Build Mode

**Request:** Implement the reusable screenshot-to-private-preview factory described in the 2026-11-03 user request.
**Project/tenant:** Factory; synthetic acceptance first, AYF later
**Owner:** EA
**Status:** Specified; local implementation only

## Intent
Ordered website and portal images define reconstructed pages rather than three exploratory concepts. Assemble admitted existing bricks, expose uncertainty, and deliver authenticated drafts with evidence.

## Scope
Intake, validated visual specifications, private assembly, tenant-bound navigation and capture forms, readiness/retry records, Quick Launch, behavioral tests. Public publishing, billing activation, email, deployment, commits and destructive changes are excluded.

## Source of truth
The explicit user request; SECURITY-MODEL.md; factory launch/orchestrator; module assembly and certification authority; capture-family; config/chassis-manifests/ayf.json. Pixels establish visual evidence only, never business rules or authorization. No AYF screenshots supplied; do not invent them or create an AYF project.

## Protected invariants
Normal launches retain concept approval. Persisted tenant identity, active membership, module admission and durable read-back remain required. No public preview bearer URLs. No screenshot worker notifications, public publish, payments or customer email. Preserve untracked work.

## Acceptance criteria
1. Explicit screenshot mode accepts multiple ordered, classified images with stable page IDs.
2. Actual image bytes reach the existing vision provider; unavailable or malformed interpretation blocks safely.
3. Validated geometry, text, components, navigation, forms, portal sections, module requirements and ambiguities drive page rendering.
4. Only certified installed modules and explicitly approved form bindings are wired; unknown destinations and backend semantics block readiness.
5. Drafts are automatic and authenticated without exploratory selection; normal approval is unchanged.
6. Form submission uses canonical durable capture with read-back; no fabricated success. Tenant and membership guards reject unauthorized use.
7. Readiness records distinguish draft availability from behavioral acceptance. COMPLETE requires matching recorded rendering, links, login, persistence, authorization, isolation and visual evidence.
8. Bounded recoverable retries reuse deterministic draft identities. Failed writes and verification never produce COMPLETE.
9. Quick Launch retains name/URL flow and exposes image ordering/classification.
10. Synthetic image-to-preview behavioral integration exercises HTTP rendering, navigation, login denial/acceptance, durable test-store persistence and tenant rejection; comprehensive relevant regression checks run locally.

## Verification plan
Local Node/tsx behavioral tests, factory regression suite, certification/tenant gates, scoped lint and TypeScript checks. Production proof later requires authorized deployment, desktop/mobile visual comparison against supplied images, live tenant login/capture/read-back and Scrapling where covered. No production operations in this task.

## Rollback condition
Any approval bypass, unauthorized read/write, false completion or public exposure blocks release. Roll back this opt-in mode and retain normal launch behavior.

## Completion evidence
Record commands/results in evidence.md. Production status remains NOT DEPLOYED / NOT VERIFIED.

## Continuation acceptance (2026-11-03)

Repair the AYF regression fixture using the real People Postgres adapter against controlled transport, including missing-runtime/schema and cross-tenant failures. Preserve production readiness gates. Screenshot submissions must appear in the existing tenant/member-scoped portal intake/application ledger, with durable replay/read-back and no email/payment side effects. Exercise actual portal page rendering, signed-session login, private asset/source routes and permissions locally. Run a consolidated report-producing suite once after repairs; distinguish local code/test defects from unavailable services and missing AYF acceptance inputs. Rollback any bridge on tenant mismatch, false persistence success or duplicate/review-reset replay.
