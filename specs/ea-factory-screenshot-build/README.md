# Screenshot Build Mode

This is an opt-in Factory launch path. Quick Launch retains ordinary name/URL research and three-concept approval. Screenshot mode reconstructs one ordered set of website/portal pages and automatically saves authenticated private drafts. It never calls the exploratory concept selector, public publisher, payment activation or customer notification worker.

## Intake and interpretation

Quick Launch uploads each raster image independently (2MB each, at most 24 new files), then submits the ordered metadata as JSON to `/api/launch`. Multipart launch remains supported. Every layout page has a stable ID, attachment index, reading order, title and website/portal classification. Separate approved logos/photos can be bound to visible image components.

The existing `describeScreenshotBase64` provider receives actual uploaded bytes with a structured layout prompt, an 8,000-token output budget and a bounded timeout. Missing credentials, unsupported images, invalid JSON, invalid geometry and unavailable storage fail safely. The screenshot path does not fall back to generic business branding or filenames. Interpretation is cached durably by project, page set and image content; changing confirmed backend bindings reuses the visual interpretation. One uncached image is processed per orchestration tick. Durable progress lets the existing queue/cron resume interrupted runs.

The visual specification retains geometry, layout, colors, visible text, images, navigation, CTAs, form fields, portal sections, candidate brick requirements and ambiguities. Candidate brick requirements do not grant entitlements. Backend behavior comes from explicit form/link/image bindings and approved assembly manifests. Clarifications are recorded separately from the original visual evidence.

## Private wiring

Existing portal slugs resolve through the persisted Organizations store. Both certification authority and the durable tenant install must admit every requested module. Form submission uses the canonical capture-family and durable read-back, with the real `guardBrick` session, role, active membership, module and exact-tenant guards. A submission's email must match its signed-in member. Forms with no confirmed binding or missing name/email fields remain disabled. Intake/application submissions persist only; they do not trigger routing emails or payment.

Optional `assembly.manifest` selects the existing certified foundation:

- `starter`: Website + Portal Starter, explicitly requested module IDs and validated provider configs.
- `ayf`: the canonical `config/chassis-manifests/ayf.json`, only for the AYF project and canonical slug. AYF selections cannot silently override the manifest's module IDs.

Provider readiness is checked by the existing foundation before organization writes. Existing installed tenants are reused. No identity, owner membership, business rule, entitlement or provider credential is invented from a screenshot. An assembly receipt does not prove that a customer can log in; behavioral login acceptance remains required. AYF's People module still requires its enabled durable Postgres runtime.

Screenshot launches match existing projects regardless of age and ignore force-new duplication. AYF aliases resolve to the canonical existing client. Existing attachments and project history are preserved, and new page/asset indexes are remapped after merging references. A cancelled project is never restarted implicitly. Canonical Control Plane registration remains required before execution.

## Routes

All preview/source/asset/readiness routes require the existing Factory admin or action-key authentication. Drafts are not anonymous links. The form handler additionally requires an active portal member in the bound tenant and same-origin POST; Factory admin access alone cannot impersonate a portal member.

- `POST /api/admin/factory/screenshot-assets`: one authenticated durable raster upload.
- `GET /api/projects/{id}/screenshot-build`: readiness, blockers and required acceptance checks.
- `POST /api/projects/{id}/screenshot-build`: explicit private retry, optionally with an updated `screenshotBuild` configuration. Never publishes.
- `GET /api/projects/{id}/screenshot-build/preview/{pageId}`: escaped semantic HTML reconstructed from the interpreted geometry; desktop layout and mobile stacking.
- `GET /api/projects/{id}/screenshot-build/source/{pageId}`: authenticated hash-checked original image for visual comparison.
- `GET /api/projects/{id}/screenshot-build/assets/{index}`: authenticated raster asset bound to this draft.
- `POST /api/projects/{id}/screenshot-build/submit`: confirmed form → canonical capture → durable read-back. Wrong tenant, stale revision, unauthorized member, invalid fields, conflicting replay or failed persistence cannot return success.

Preview responses use private/no-store caching, noindex, escaped content, a restrictive CSP and same-origin form actions. Configuration hashes prevent serving a stale draft after rebinding. Source hashes prevent using a changed attachment as the old reference.

## Behavioral verifier interface

The existing vision credentials (`ANTHROPIC_API_KEY` or `CLAUDE_API_KEY`) and durable Creative Studio storage are required for real image processing. They were not exercised against production in this task.

An internal browser runner can be configured with `EA_SCREENSHOT_VERIFIER_URL` (HTTPS) and `EA_SCREENSHOT_VERIFIER_SECRET`. The Factory POSTs the project, revision, authenticated preview/reference paths, tenant, required checks, timestamp and explicit private/test-only constraints. `x-ea-signature` is the HMAC-SHA256 of the exact request body. The included worker verifies signature/timestamp, deduplicates in-flight requests, uses explicitly configured test sessions and exercises the actual private routes. It never sends customer email, activates payments or publishes. Worker source is included; no service was started or deployed by this task.

The response is `{ "evidence": [...] }`. Each receipt requires `check`, `passed`, `method` (`browser`, `http` or `visual-comparison`), `detail`, `artifact`, `runId`, matching `revision`, and ISO `checkedAt`. All eight checks are required: rendering, links, login, form persistence, authorization, tenant isolation, desktop visual comparison and mobile visual comparison. Rendering requires browser execution; visual checks require actual visual-comparison evidence. Source-string receipts, stale revisions, stale timestamps, missing artifacts and failures cannot produce acceptance. Provider errors retry only within a bounded budget.

Without the configured runner, a wired draft stays `draft_ready` / `UNDER_REVIEW`, with behavioral acceptance pending. COMPLETE is only set after recorded matching acceptance evidence. This private acceptance is not a claim of production deployment or production verification.

## Local acceptance

`npm.cmd run test:factory-screenshot-build` creates actual synthetic PNG fixtures, tests multipart and JSON intake, exercises resumable runtime and retry behavior, tests the signed verifier boundary, verifies AYF project reuse and attachment preservation, runs 50 concurrent tenant assemblies, and launches headless Chromium against the actual private preview/submission handlers with controlled identity/vision/storage providers. Canonical capture persistence is read back from a local disk-backed fixture; failed writes, conflicting replay and cross-tenant requests are rejected.

The test prints an evidence directory containing source PNGs, desktop/mobile browser screenshots, persisted capture records, draft JSON and an evidence report. It deliberately does not report reference-image fidelity or real provider login as passed. See evidence.md for results and repository-wide blockers.

## Continuation: existing portal handoff and runnable worker

Screenshot forms now require both canonical capture persistence and a matching durable entry in the existing Portal Form Submissions ledger. They use the same stable capture identity that staff review consumes. Replay preserves reviewed status; dropped ledger writes or failed read-back cannot report success. Native browser submissions redirect into the existing intake/applications portal. JSON clients receive the canonical ID, portal submission ID and destination. No notification or commerce handlers are invoked by this bridge.

`npm.cmd run factory:screenshot-verifier` starts the optional dedicated Node/Chromium worker on loopback. Its required configuration is `EA_SCREENSHOT_PREVIEW_ORIGIN`, `EA_SCREENSHOT_TEST_ORGANIZATION_ID`, `EA_SCREENSHOT_TEST_PORTAL_SLUG`, `EACP_CHATGPT_ACTION_KEY`, `EA_SCREENSHOT_TEST_SESSION`, `EA_SCREENSHOT_OTHER_TENANT_SESSION`, `EA_SCREENSHOT_VERIFIER_SECRET` and `EA_SCREENSHOT_TEST_FORMS_JSON`. These are explicit test-tenant scopes, a Factory action key, pre-issued member sessions for two distinct tenants, a dedicated signing secret of at least 24 characters and approved per-form field fixtures. The worker does not issue passwords or trigger password/2FA email. Its login check proves existing test-session access to protected portal content; the local acceptance suite separately exercises the actual login handler and HMAC issuance.

Form fixture JSON is an array of `{pageId, componentId, fields}`. Every wired form needs explicit test data including its signed-in member's email/name. Mobile reference JSON (`EA_SCREENSHOT_MOBILE_REFERENCES_JSON`) maps page IDs to approved local reference raster paths. Missing fixtures/references produce BLOCKED, never a fabricated pass. Desktop comparison downloads the authenticated source image and compares actual browser pixels. Geometry mismatch or pixel difference above 0.005 fails; the library only permits explicitly selected tolerances up to 0.02.

The worker enforces the configured test tenant, private project/portal navigation, bounded request size, HMAC authentication, timestamp freshness and retry deduplication. It rejects bad signatures before launching a browser. Authenticated contexts are restricted to the configured origin. The dedicated service requires Chromium and the repository's Playwright/sharp dependencies. Production/preview caller URLs still require HTTPS. A local, non-production/non-Vercel-preview process can explicitly set `EA_SCREENSHOT_ALLOW_LOCAL_VERIFIER=1` and use `http://127.0.0.1:4141/verify`; the production and Vercel-preview rejection paths are tested. No TLS/public hosting was provisioned.

`npm.cmd run test:factory-screenshot-acceptance` runs the consolidated offline regression campaign and saves per-job logs plus JSON evidence in Temp. `--resume <report directory> --only=<job names>` reruns only repaired jobs while preserving earlier passing results and failure history. A `--test-name-pattern=<pattern>` further limits behavioral repair runs. No security/release gate is skipped in the initial campaign; its repository typecheck remains a failing release gate until the unrelated diagnostics are repaired.
