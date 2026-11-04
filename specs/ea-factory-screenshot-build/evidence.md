# Local implementation evidence

**Superseded locally by [final-evidence.md](final-evidence.md).** The report below is retained as the original implementation record. The continuation repairs its AYF fixture, portal ledger handoff, stale regression fixtures and missing runnable verifier worker.

Branch: `work/ayf-chassis-20261103`. Starting commit: `cea567f7`.

State: IMPLEMENTED locally; NOT DEPLOYED; NOT production VERIFIED; NOT DONE. No commit, push, deployment, public publishing, customer email, payment or production data mutation was performed. Pre-existing untracked logs and test directories were preserved.

## Files changed

Existing files:

- `app/admin/ea-factory/quick-launch/QuickLaunchClient.tsx`: explicit mode, ordered/classified screenshots, separate durable uploads, approved asset selections, manifest choice, confirmed form/destination bindings, clarifications, private readiness and retries; original name/URL flow retained.
- `app/api/launch/route.ts`: screenshot reuse of canonical projects (including AYF aliases), Control Plane preflight and preservation/remapping of existing attachments.
- `app/api/projects/[id]/route.ts`: mode-specific readiness; no exploratory concept nudge for screenshot projects.
- `lib/factory-launch-request.ts`: validated screenshot intake and required durable image upload.
- `lib/factory-project.ts`, `lib/factory-project-store.ts`: persisted opt-in configuration, results and retry state.
- `lib/factory-orchestrator.ts`, `lib/factory-queue.ts`: private-mode dispatch; skip exploratory generation and automatic notifications; preserve ordinary launch behavior.
- `lib/screenshot-vision.ts`: optional larger structured output, bounded request timeout and opt-in classified failure propagation.
- `package.json`: `test:factory-screenshot-build` command.

New files:

- `lib/factory-screenshot-build.ts`: validated visual contract, safe assembly/renderer, explicit bindings, evidence gate and bounded retries.
- `lib/factory-screenshot-runtime.ts`: actual image bytes/provider, durable interpretation cache/resumption, certified foundation/tenant registry integration, durable private drafts/read-back and readiness receipts.
- `lib/factory-screenshot-submit.ts`: signed-in identity binding and canonical capture/read-back.
- `lib/factory-screenshot-verifier.ts`: signed HTTPS internal browser-runner interface, strict behavioral evidence validation and bounded transient retry.
- `app/api/admin/factory/screenshot-assets/route.ts`: one-file authenticated durable raster intake.
- `app/api/projects/[id]/screenshot-build/route.ts`: authenticated readiness and private retries.
- `app/api/projects/[id]/screenshot-build/preview/[pageId]/route.ts`: authenticated reconstructed private HTML.
- `app/api/projects/[id]/screenshot-build/source/[pageId]/route.ts`: authenticated hash-checked reference screenshot.
- `app/api/projects/[id]/screenshot-build/assets/[index]/route.ts`: authenticated approved draft image.
- `app/api/projects/[id]/screenshot-build/submit/route.ts`: same-origin, portal-member-authorized form persistence.
- `tests/factory-screenshot-build.test.mts`: synthetic image/runtime/HTTP/browser/security/concurrency tests.
- `specs/ea-factory-screenshot-build/{spec.md,plan.md,tasks.md,README.md,evidence.md}`: governance, operating contract and evidence.

## Test commands and outcomes

Windows uses `npm.cmd` because the PowerShell `npm.ps1` shim is blocked by the machine execution policy. Esbuild bundling tests required execution outside the filesystem sandbox because its parent-directory traversal was denied inside it. Chromium ran headless against localhost only.

| Command | Result |
| --- | --- |
| `node --import tsx --test tests/factory-screenshot-build.test.mts` / `npm.cmd run test:factory-screenshot-build` | 8 tests pass; includes actual PNG fixtures, durable resumable runtime, private browser workflow, failure injection and 50 concurrent synthetic tenant assemblies. |
| `node --import tsx --test tests/capture-family.test.mts tests/capture-customer-routes.test.mts tests/chassis-autowire.test.mts tests/blockers-certified.test.mts` | 46 pass / 1 fail. Existing chassis AYF fixture lacks required durable People runtime. Blockers-certified's AYF test with a mocked Postgres runtime passes. |
| `node scripts/test-production-protection.mjs` | PASS |
| `node scripts/test-tenant-release-safety.mjs` | PASS |
| `node scripts/test-release-guardrails.mjs` | PASS |
| `node scripts/test-master-guard-contract.mjs` | PASS |
| `node scripts/test-system-registry.mjs` | PASS |
| `node scripts/test-lego-strict-authority.mjs` | PASS |
| `node scripts/test-lego-final-acceptance.mjs` | PASS: 23 certified, 0 false certifications |
| `node scripts/test-airtable-read-hardening.mjs` | PASS |
| `node scripts/test-factory-run2-torture-certification.mjs` | PASS: 12 tenants, 60 jobs, injected permanent failure isolated, transient retry recovered; production untouched |
| `node scripts/test-tenant-safety.mjs` | PASS |
| `node scripts/test-universal-quick-launch.mjs` | PASS |
| `node scripts/test-factory-orchestrator.mjs` | PASS |
| `node scripts/test-factory-project-context.mjs` | PASS |
| `npm.cmd run test:uxg-launch-suite` | Stops at pre-existing identity-concept-pack wording assertion: expects “ready for review”, implementation says “Ready to review”. Earlier universal launch/orchestrator/context/URL tests pass. |
| `npm.cmd run test:factory-concept-previews` | PASS |
| `npm.cmd run test:factory-durable-concept-previews` | PASS |
| `npm.cmd run test:factory-preview-links-must-render` | PASS |
| `npm.cmd run test:factory-content-quality-gate` | PASS |
| `npm.cmd run test:factory-evidence-quality` | PASS |
| `npm.cmd run test:factory-quick-launch-review` | PASS |
| `npm.cmd run test:factory-quick-launch-one-page` | PASS |
| `npm.cmd run test:factory-wire-selected` | PASS |
| `npm.cmd run test:factory-research` | PASS |
| `npm.cmd run test:factory-production` | Existing failure: stale website-only builder expectations; reproduced against untouched HEAD snapshot. |
| `npm.cmd run test:factory-capability-registry` | Existing failure: production dispatch/idle expectations; reproduced against untouched HEAD snapshot. |
| `npm.cmd run test:experience-creation-engine` | Existing assertion failure at line 150; reproduced against untouched HEAD snapshot. |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false` | FAIL: 413 repository diagnostics. No diagnostics in the new screenshot files, screenshot routes, Quick Launch, launch parser or vision changes. The first repository check also reported 413 diagnostics. Full application build/release is not certified. |
| Scoped ESLint over all screenshot files/routes/tests plus changed launch/UI/vision files | Exit 0, no errors; one existing Quick Launch draft-restoration effect warning. |
| `git diff --check` | PASS |

The pre-existing failing production/capability/identity/ECE tests were reproduced using a `git archive HEAD` snapshot under Temp, with a node_modules junction to the existing installation. The unchanged chassis AYF test also reproduces the People-runtime failure there. Existing tests/gates were not weakened to make these pass.

## Demonstrated synthetic workflow

1. Generate actual website and portal PNGs from synthetic layout fixtures.
2. Pass the PNG bytes through a controlled image interpretation provider and validate the structured geometry/components.
3. Classify/order both pages, resolve the controlled persisted tenant and admitted modules, bind the intake form and real private page/login destinations, and save drafts.
4. Run a real localhost HTTP server dispatching the actual Next preview and submission handlers. Headless Chromium opens the reconstructed desktop draft, follows page links and completes the controlled login redirect.
5. Submit the form through the browser. The actual canonical capture-family writes to the disk-backed fixture and reads back the saved tenant/identity/payload. Same-row replay works; conflicting replay, stale revisions, different submitted identities and failed writes cannot claim success.
6. Verify anonymous preview denial, missing portal login, cross-tenant submission denial and cross-origin rejection. Render at mobile width, check overflow and save desktop/mobile screenshots.
7. Leave reference visual fidelity and external portal-module link acceptance pending. No source-string assertion is accepted as aggregate behavioral proof. The synthetic result remains `draft_ready`, not COMPLETE.

Vision, identity, provider/storage transport and foundation provisioning use controlled fixtures. Canonical submission, durable read-back behavior, private route rendering and tenant/role guards are exercised as implementation code. The test does not establish real provider login, real external portal-module readiness or reference-image fidelity.

Final run: `C:/Users/brick/AppData/Local/Temp/ea-screenshot-dYXYh2/evidence.json` (8/8 tests pass). The same directory contains `0.png`, `1.png`, `desktop.png`, `mobile.png`, `draft.json` and disk-backed capture records. The report records five controlled behavioral receipts; aggregate external-link and desktop/mobile reference-fidelity acceptance remain pending. Result: `draft_ready`, never COMPLETE.

## Blockers and AYF answer

Safe configuration-presence inspection (no secret values printed, no provider calls) found: existing vision credentials absent; durable Airtable credentials absent; private browser verifier unconfigured; People and People persistence flags disabled. No AYF screenshot fixtures or AYF public asset set were found locally; its existing approved manifest is reused, and any existing project attachments are preserved. No real AYF project was created or modified.

**Can AYF currently be assembled and accepted without manual wiring? NO.** The reusable private assembly path and approved AYF-manifest adapter are implemented, but real AYF screenshots, backend clarifications/bindings, required provider/runtime readiness and end-to-end behavioral/visual acceptance remain unproven. The implementation does not fabricate these inputs or bypass their gates.

Production deployment and Scrapling production inspection were not performed because the user expressly prohibited production changes/deployment. Future production acceptance must still satisfy the specification and existing release gates.
