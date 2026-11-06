# EA Factory release readiness — 2026-11-06

## Latest consolidated dependency repair pass

**Factory dependency errors remaining: 0. Release status: BLOCKED. Real AYF readiness: NO.** This section supersedes the historical 63-error/411-error results below. At verification time, all source changes were uncommitted on `work/ayf-chassis-20261103`. The subsequent user-authorized review permits a local commit of the verified 33 source/test/tooling files and three evidence files only. Existing work was preserved; no push, deployment, publishing, live provider data/payment/email action or promotion-manifest modification occurred.

Portable results and the exact changed-file list: [release-verification.json](release-verification.json). Current zero-error scope and the retained original 63-diagnostic baseline: [release-readiness-types.json](release-readiness-types.json).

| Verification | Status | Exact result |
| --- | --- | --- |
| Consolidated factory/dependency campaign | PASS except root types | **34 PASS jobs, 1 FAIL job** after the one targeted repair. The sole remaining failing job is root TypeScript. Original failed project-state assertion and its successful rerun are retained in history. |
| Factory strict transitive typecheck | PASS | **22 entrypoints, 0 diagnostics**, using the root compiler options and no additional exclusions/casts to suppress errors. `node scripts/check-factory-release-types.mjs`. |
| Root strict typecheck | FAIL | **348 diagnostics**, down from 411. Normalized diagnostic comparison: **63 removed, 0 added**. `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`. These remaining errors are outside the scoped Factory dependency program; repository-wide strict certification remains failing. |
| Screenshot/portal/chassis behavioral acceptance | PASS | **57/57** tests, including synthetic PNG to private website, signed login, actual portal rendering, canonical/ledger persistence and tenant isolation. All nine screenshot scenarios pass in this single group. |
| New dependency boundary behavior | PASS | **4/4**: nullable People metadata and invalid consent-purpose rejection; actual Firecrawl output retains unknown ownership; user-supplied media still requires human approval/rights; absent initial lifecycle evidence is accepted without skipping a stage. Controlled transports only. |
| Amanda affected behavioral regression | PASS | **14/14**, including actual payment/fulfillment handlers against controlled transports, tenant/unpaid rejection and preview separation. No live payments. |
| People offline checks | PASS with explicit skips | **10 passed, 0 failed, 2 skipped**. Live Postgres adversarial certification and service-role negative tests still require an isolated approved database; skips are not passes. |
| Other affected factory/dependency regressions | PASS | Production and registry, orchestrator/context, normal launch/concept/wiring/review, ECE, schema/identity/provider selection, five-org layout, organization overlay, experience registry and security/certification/release gates. Full job/command/log list is in the JSON report. |
| Project State SSOT repair | PASS after targeted rerun | Initial failure was an obsolete source-string check for `Continue Your Project`. The actual Welcome action already says no action is required. Replaced only that assertion with a runtime call checking Progress navigation and `nothingRequired`; client behavior unchanged. Reran only this job, not the passing campaign. |
| Changed-file ESLint / whitespace | PASS with warnings | No lint errors; two existing unused-variable warnings and an ignored vendor-file notice in dependency lint. The subsequently repaired project-state script also has no lint errors and one existing unused-import warning. `git diff --check` passes. Vendor behavior is covered by registry/certification checks and compiler scope; its ignored ESLint file is not counted as lint coverage. |
| Full native low-memory build | PASS | **One attempt**, exit **0**; compiled in **80s**, **171/171** static pages in **2.5s**, one worker. Studio/Create and Amanda checkout emitted successfully. No memory allocation or prerender failure. The only edit after the build started was the project-state test script; no production source changed during or after the build. |
| Sampled build process-tree peaks | RECORDED | Working set **1,389,441,024 bytes (1.29 GiB)**; private memory **4,009,988,096 bytes (3.73 GiB)**. 54 samples; nominal 2-second interval plus collection overhead. Monitor launcher exit field is null; separate Node build result records authoritative exit 0. |
| Promotion and real AYF | BLOCKED | No exact-source preview or seven gate proofs. Four external AYF dependency groups remain as documented below. No preview URL invented; gates and normal approval unchanged. |

Consolidated command:

```text
node scripts/test-factory-screenshot-acceptance.mjs --dependency-release --local-build-monitor=C:/Users/brick/AppData/Local/Temp/ea-low-memory-monitor.ps1
```

Raw campaign: `C:/Users/brick/AppData/Local/Temp/ea-screenshot-consolidated-1794004674685/report.json`. Single build: `C:/Users/brick/AppData/Local/Temp/ea-factory-build-1794004767001/{build.log,result.json}`. Memory: `C:/Users/brick/AppData/Local/Temp/ea-low-memory-1794004766793/{memory.jsonl,result.json}`. The build wrapper suppresses credentials and blocks outbound Node services. The monitor checks for an existing development/build process before starting. Generated layout fixtures were redirected to the campaign's Temp directory instead of overwriting existing prototypes.

### Repairs and protected behavior

- Added precise builder, discovery, planning and deliverable contracts at JavaScript/TypeScript boundaries. Existing runtime validation, mandatory execution contracts and review gates remain intact.
- Corrected missing deep-crawl provider IDs, media completeness lookup, and optional website fetch arguments. Nullable crawl metadata maps to `undefined`; missing ownership is explicitly `unknown`, never subject-owned.
- Temporary preview assets now include required source/quality metadata, conservatively use unclear rights, remain preview-only and publication-ineligible. User-supplied usage is accepted by the shared type but still rejected for publishing without explicit human approval and acceptable rights.
- Aligned existing portal/settings, shared-calendar, organization Nylas overlay, Puck root, protocol identity and registry metadata with their contracts. Applications use the supported `act` lifecycle tag; invalid `contact` evidence scope was removed without admitting new evidence scopes. No tenant/module/auth/payment gate was relaxed.
- People null external reference/timestamp values become empty metadata strings (no timestamp invented); unknown stored consent purposes fail closed. Tenant headers, gateway/app JWT, query/RLS and persistence flags are unchanged.
- Retained the prior two project typing repairs. Added a repeatable diagnostic scope, dependency campaign option, behavioral regression tests, and isolated layout-test output. The full root typecheck still runs separately and remains failing.

### Exact next release actions

1. Address the **348 root diagnostics** through their owning projects if whole-repository strict certification is required; do not represent the scoped Factory pass as a root pass. They do not block the configured native build because the unchanged Next config already skips type validation.
2. Supply the four genuine AYF groups: approved vision credential; scoped approved Airtable base access; dedicated People schema/gateway/app-JWT configuration and authorized flags; approved real AYF screenshot/assets/mobile/binding/role/test-session packet. Verify provider/schema/table access rather than assuming supplied credentials are sufficient.
3. In a separately authorized private environment, activate the signed HTTPS worker with scoped same-tenant and other-tenant sessions, reuse canonical `are-you-fundable`, and obtain all eight real behavioral/visual receipts. No duplicate tenant or mock evidence may substitute.
4. Obtain an authorized exact-source protected preview, run all seven promotion proofs, and use the existing gate-only promotion contract. The stale manifest is untouched. The verification run prohibited deployment, commits and publishing; the subsequent review authorizes only a local implementation/evidence commit, not a promotion or deployment.

Commit review checked all 36 intended files, matched all job records to the raw campaign and logs, confirmed the separate native build exit 0, and found no credential patterns or configured secret values in the intended files. Generated raw logs, temporary directories and older build-inspection reports are excluded. No passing tests or builds were repeated for commit preparation.

## Previous readiness pass (historical evidence)

Reviewed branch `work/ayf-chassis-20261103`, HEAD `59e5ea7e82871fb529921edd79b2478d40a207b1`. This pass made local, uncommitted type-only repairs. No commit, deployment, publishing, provider request, email or payment action was performed. Existing untracked work was preserved.

**Release readiness: BLOCKED. Real AYF readiness: NO.** Local packaging passed previously; neither production promotion nor actual AYF end-to-end acceptance has been verified.

## Consolidated results

| Item | Status | Evidence and exact next action |
| --- | --- | --- |
| Screenshot implementation and controlled acceptance | PASS, retained | Committed `final-evidence.md` and curated `evidence/*.json`: 21 passing campaign jobs, actual browser/HTTP persistence, authorization and tenant checks. Intentional visual mismatch rejection is negative-test evidence, not AYF visual approval. No unchanged broad campaign was rerun. |
| Full local native packaging | PASS, retained | Committed `low-memory-build.md`: one full low-memory Turbopack build, exit 0, 171/171 static pages, Studio/Amanda routes emitted successfully. No build repeated here. This artifact predates the current type-only repair; no rebuilt artifact for the dirty tree is claimed. |
| Factory project type repairs | PASS | `lib/factory-project-context.mjs` now types the existing pipeline-status parameter; `lib/factory-project.ts` checks failure activities with `satisfies FactoryActivity[]` before slicing. Existing values, persistence, error handling and guards are unchanged. No compiler or release settings relaxed. |
| Project context lifecycle regression | PASS, fresh | `node scripts/test-factory-project-context.mjs`: exit 0. |
| Affected screenshot runtime acceptance | PASS, fresh | `node --require ./tests/fixtures/network-offline.cjs --import tsx --test --test-name-pattern=runtime tests/factory-screenshot-build.test.mts`: 1/1 pass, exit 0. Covers resumable image interpretation, retry, certified foundation and private readiness without notifications. Initial sandbox attempt failed because esbuild could not read parent directory metadata; the same offline command outside the sandbox passed. |
| Scoped lint and patch whitespace | PASS, fresh | `node node_modules/eslint/bin/eslint.js lib/factory-project.ts lib/factory-project-context.mjs` and `git diff --check`: exit 0. |
| Root strict TypeScript | FAIL, fresh | `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`: exit 2, **411** diagnostics, down from 413. Normalized baseline comparison shows exactly two intended errors removed, zero added. Log: `C:/Users/brick/AppData/Local/Temp/ea-factory-release-types.log`. These are code/type failures, not credential failures. |
| Factory transitive strict TypeScript | FAIL, fresh | Diagnostic-only 22-entrypoint program: **63** diagnostics, all matching previous baseline file/line/code. Zero diagnostics in screenshot implementation/routes or the repaired project files. Of the 63, **25** are in other factory/EA-factory files and **38** in shared dependencies. These cannot all be dismissed as unrelated monorepo errors. See `release-readiness-types.json` for every path, line, code and message. |
| Production promotion gate | BLOCKED, fresh | `node scripts/verify-production-gate.mjs`: exit 2, `manifest missing previewUrl`. Do not patch in a historical or localhost URL. Obtain authorized exact-source private preview evidence, satisfy every gate, then follow the existing gate-only promotion-commit contract in a separately authorized release. |
| Real AYF provider-backed acceptance | BLOCKED | Four external dependency groups below remain unavailable or unverified. All eight matching-revision receipts are required: rendering, links, login, form persistence, authorization, isolation, desktop and mobile visual comparison. No AYF project created or mutated. |

## Which TypeScript diagnostics affect Factory?

The strict dependency program starts from 22 screenshot/factory implementation entrypoints and their imports. It reduced from 65 to 63 after the two project repairs. The full program reduced from 413 to 411. Counts are different scopes, not conflicting measurements.

The remaining 25 factory dependency errors involve builder/registry JavaScript inference, capability output/provenance types, Quick Launch research output inference, website-provider argument completeness, deep-crawl provenance/media contracts and an EA-factory protocol identity. The remaining 38 involve organizations, People repository, media/research, layout/chassis, project-state and vendor contracts. They remain local type debt requiring focused owner review and applicable behavioral coverage; schema or identity contracts must not be weakened or fields fabricated to silence them. Passing runtime fixtures does not demonstrate those static contracts are correct.

The current Next configuration has long skipped type validation; it was not changed to obtain the passing build. Consequently these diagnostics do **not** block the configured native packaging step, but they **do** prevent strict factory-dependency type certification. No new screenshot-source diagnostic or new runtime release regression was found. Do not call the whole release type-clean.

## Promotion preview investigation

`.ea/gates/latest.json` was last changed by `285503e7` and describes source `d1fd77c0967da7aa5ceb67e0dad5c0a04e026d58` with an October 22 timestamp. It is older chassis evidence, not current screenshot-release certification. Besides `previewUrl`, required `status`, `completedAt`, and the complete seven-entry `gates` object are absent. Its source does not equal current HEAD's parent, and current HEAD changes implementation/evidence files instead of only the gate manifest.

`scripts/ea-preview-gate.mjs` consumes `EA_PREVIEW_URL`, `VERCEL_URL` or `VERCEL_PREVIEW_URL`; all are absent locally. `.ea/dispatch/production-gate.json` references an October 11 master-branch Amanda preview, and an older Amanda evidence file contains an October deployment ID. Neither establishes an exact-source preview for this factory branch. No URL was copied, invented, contacted or written to the promotion manifest. Linking the Vercel project alone would not prove deployment source identity.

Next action: authorize/use an actual protected preview of the intended release source; verify build identity and all seven required gate proofs (`sourceIdentity`, `build`, `assets`, `functional`, `desktopVisual`, `mobileVisual`, `creativeCritic`). The existing preview-gate script may fall back to localhost when source identity is unavailable; local fallback evidence must not be represented as an authorized remote private preview. No such script was run here.

## Genuine external dependencies: 4 groups

Presence was checked with `@next/env` using the local execution configuration; only booleans were printed. Missing credentials are confirmed locally, not globally across external secret stores. No provider call or schema mutation was attempted.

| ID | Observed requirement | Exact action required |
| --- | --- | --- |
| E1 | Both `ANTHROPIC_API_KEY` and `CLAUDE_API_KEY` absent. Screenshot vision uses that existing provider. | Supply an approved scoped provider credential to the private runner; interpret actual approved AYF image bytes, validate output and resolve ambiguities. An OpenAI key is not required by this implementation. |
| E2 | `AIRTABLE_API_KEY` and `AIRTABLE_PAT` absent. Base override absent; code already has a default base, so the missing override is not a separate blocker. | Confirm the approved base and supply scoped access to Creative Studio, organizations/memberships/entitlements, identity and Portal Form Submissions stores. Verify durable canonical and portal-ledger read-back with authorized test data. Table existence/permissions are unverified, not independently claimed missing. |
| E3 | No People URL, gateway API key, or app JWT/secret; `UNIVERSAL_PEOPLE` and `UNIVERSAL_PEOPLE_PERSIST` off. | Configure the approved dedicated `people` PostgREST schema, gateway key and `people_app` JWT contract; verify schema exposure/readiness and existing tenant/RLS protections before enabling both flags in the authorized private environment. No memory or service-role substitute. |
| E4 | No approved real AYF reference/binding/role/test-session packet established by the saved checkpoint or this review. Synthetic fixtures are present. | Provide/approve ordered website/portal references and assets, mobile references, navigation/form/backend semantics and role expectations, plus active same-tenant and independent second-tenant test identities. Reuse the existing canonical `are-you-fundable` tenant/AYF manifest; obtain all eight real preview receipts. Do not create a duplicate project. |

Worker URL/secret are also unset. Runnable worker source and local execution have passing saved acceptance. It needs authorized activation and scoped test sessions (HTTPS outside local development); this is a deployment/configuration prerequisite, not an additional missing vendor implementation. Promotion authorization and exact-source preview evidence are separate release prerequisites, not a fifth AYF credential group.

## Changes and limits

Changed source: `lib/factory-project-context.mjs`, `lib/factory-project.ts` (type-only). Added this report and `release-readiness-types.json`. No public/auth/payment behavior changed. Existing passing broad security, visual-negative, browser and release-regression results were retained rather than repeated. No production verification or full clean release certification is claimed.
