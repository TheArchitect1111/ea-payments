# Eva Portal Help Brick

Existing EA chassis add-on, not a new architecture. Routes and knowledge are tenant-scoped. Amanda is the first registered portal.

## Chassis contracts
- `health(portalId)`: `{status:200,ok:true}` on a valid manifest; `{status:503,ok:false}` on missing, corrupted, or mismatched knowledge.
- `knowledge(portalId)`: portal ID, entry count, last refresh time.
- HTTP: `GET /api/portal/{slug}/eva-help/health`.
- Help: `POST /api/portal/{slug}/eva-help` (same-portal authenticated cookie; JSON `question`, optional `entryKey` and `stepIndex`). A response contains **one** step and a direct page link. Additional steps are requested deliberately with `Next step`.
- Nonmatches return `status:unanswered` and log tenant ID, role, redacted question, reason, time. With `BLOB_READ_WRITE_TOKEN` events are written to private Blob JSON; otherwise the JSON record is emitted to server logs. Blob writes must be configured and observable in the environment.

## Role boundary
Student access is restricted to course catalog and learning controls and student-trainee course menu entries. Admins and owners use their own authenticated portal identity. Do not pass role from the browser. Never share another portal's manifest.

## Refresh and deployment
1. Audit the live navigation and source, then update only the relevant portal JSON manifest.
2. Check `menus` entry count and update the expected count in `knowledge/eva-portal-help-registry.json` when the authoritative inventory changes.
3. Run `node --import tsx scripts/test-eva-portal-help.mts` locally.
4. Restart the server or redeploy the preview. Loader also checks file modification time, but deployed serverless files are immutable until a new deployment.
5. Check `GET /api/portal/{slug}/eva-help/health` for 200, correct count, and refreshed timestamp.
6. Test authorized role access and review unanswered JSON events. No automatic live-site changes, model retraining, or menu hallucination.

## Onboard TB3 next without modifying shared TypeScript
1. Audit TB3 and create `knowledge/eva-tb3-manifest.json` in the same manifest shape, with role-scoped menus, `steps` and hrefs.
2. Register `tb3` under `portals` in `knowledge/eva-portal-help-registry.json` with `manifestFile`, validated entry count, and canonical HTTPS `origin`.
3. Wire a TB3-only entry control to the existing `/api/portal/tb3/eva-help` and existing generic UI pattern. Do **not** embed TB3 rules in `src/bricks/eva-portal-help/`.
4. Restart/redeploy and verify health, tenant isolation, permission filtering, links and unanswered logging.

## Scope and limitations
The Step 1 manifest documents 207 menu/control entries and 30 example unknown questions, including owner routes that were only source-audited, not live authenticated. Guidance labels are audit-derived, not promises of successful account-specific action. The old Amanda `/api/amanda-catherine/eva` course, booking and activity behavior remains unchanged. Some audited menu hrefs point to known broken or obsolete routes; a help response does not certify their runtime behavior. Never mistake an unauthenticated 200 health check for a successfully exercised signed-in student session.


## TB3 Step 3 onboarding verification (2026-10-18)

- Branch: `feature/eva-portal-help-brick-20261018`. Preview only. Production and shared modules other than `roles.ts` unchanged.
- Source audit: `app/tarris/page.tsx`, `app/tarris/future/page.tsx`, `app/tarris/future/hq-workspace.tsx`, `app/tarris/book/booking-form.tsx`. Live authenticated TB3 access was NOT verified.
- Files added: `knowledge/eva-tb3-manifest.json` (85 source-audited controls across 13 groups), `scripts/test-eva-tb3-onboarding.mts`. Files updated: `src/bricks/eva-portal-help/roles.ts` (only shared-code change), `knowledge/eva-amanda-manifest.json` (role declarations only, all 207 entries preserved), `knowledge/eva-portal-help-registry.json`, and this README.
- Shared TypeScript modules changed: **one** (`roles.ts`), as expressly allowed. Other existing brick modules changed: **zero**. The roles module reads permissions from the manifest belonging to the loaded entry and defaults unknown roles to that same manifest's least-privileged role.
- Local tests: `node --conditions=react-server --import tsx scripts/test-eva-portal-help.mts` => PASS (Amanda 10/10; 4 guided, 6 logged unknown). `node --conditions=react-server --import tsx scripts/test-eva-tb3-onboarding.mts` => PASS (TB3 10/10 guided, valid links and one step per response; isolation 2/2; role fallback and entry permissions).
- Onboard time: created and verified during the 2026-10-18 06:35–06:42 UTC execution window (approximately seven minutes, not a precise stopwatch measurement).
- Vercel preview for both API portals: `https://ea-payments-1qsm7yc1h-the-architects-projects-cc813778.vercel.app` (commit `7984328722e13d35f50aef8c465e6fda0a18e2be`). Health check: `/api/portal/amanda-catherine/eva-help/health` => HTTP 200, `portalId=amanda-catherine`, `entryCount=207`. `/api/portal/tb3/eva-help/health` => HTTP 200, `portalId=tb3`, `entryCount=85`. These responses validate manifest loading, not authenticated use.
- TB3 HQ authentication and UI compatibility: **NOT VERIFIED / NOT WIRED**. Existing HQ Eva chat uses `/api/ai` and not `/api/portal/tb3/eva-help`. The generic help POST requires an `EA_PORTAL_COOKIE` signed session whose `slug` is `tb3`; actual issuance to TB3 athlete, fan, admin, family was not demonstrated. The existing `normalizeGuideRole(role)` signature lacks tenant context, so tenant-aware fallback occurs in `canReadEntry` based on the owning manifest. Under the strict no-other-shared-code-change rule, do not claim the existing HQ widget now calls this brick.
- A 200 health response on both portals and passing offline isolation fixtures are **not evidence** that authenticated TB3 HQ end-to-end chat is connected.
