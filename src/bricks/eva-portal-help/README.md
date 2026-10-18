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


## Step 4 certification gate (2026-10-18)

**Status: NOT CERTIFIED. Preview integration implemented; authenticated acceptance incomplete. Do not merge or deploy to production.**

### TB3 HQ integration
`app/tarris/future/hq-workspace.tsx` now routes the desktop/mobile Eva chat through authenticated `POST /api/portal/tb3/eva-help` with `credentials: same-origin`, no browser-supplied role, one-step response, direct link, and explicit Next step. Existing non-chat workspace quick-action buttons remain. The generic legacy `/api/ai` endpoint was not removed. A 401 asks users to sign in; a 403 does not fall back to legacy AI or disclose tenant data. Integration commit: `7d8b4b3f476d97fff70a5b51b448372661538782`.

### Onboarding a new portal (target: under 30 minutes, not a service-time guarantee)
1. Audit the real public and authenticated menu inventory, roles, links, controls, and entitlement boundaries. Record source and verification for each entry. Do not guess user-specific actions.
2. Create `knowledge/eva-<portalId>-manifest.json` with `manifestId`, `schemaVersion`, an array of `roles`, and a `menus` map containing arrays of menu entries.
3. Each role policy requires `id`, `allowedMenuPrefixes`; exactly one policy has `leastPrivileged:true`. Optional `aliases`, `allowedIdsByGroup`, `allowedHrefsByGroup`, `requiredAudienceByGroup`, `requiredAnyFieldsByGroup` narrow access. Unknown roles fall back only within the same manifest. Review the implications of wildcards.
4. A menu entry needs a discoverable `label` (or `title`, `button`, `control`, `section`, `id`), `href` (or `ctaDestination`, `path`, `potentialHref`), and a nonempty `steps: string[]`; `location`, `audience`, `roles`, `verification`, `source`, and `behavior` document its provenance. Only vetted links should be used.
5. Register `portalId` in `knowledge/eva-portal-help-registry.json` with `manifestFile`, exact `expectedEntries` and canonical HTTPS `origin`. Do not change the other tenants' content.
6. Provide verified portal identity/session issuance, role mapping and access controls. The help API requires signed `ea_portal_session` with `session.slug === portalId`; do not let the browser choose identity or role.
7. Connect the tenant's Eva surface to the existing endpoint and render `step`, `stepNumber`, `totalSteps`, `link`, `nextStepIndex`. Never switch to unscoped AI if an authorization check fails.
8. Run offline regression, cross-portal leakage checks, then preview signed-in role walkthroughs including restricted controls and logged unknowns. Verify private Blob objects by their IDs/paths and contents before certifying. Refresh by updating only the tenant manifest, checking expected count, redeploying preview, and fetching `GET /api/portal/{portalId}/eva-help/health`.

### Required certification evidence and known limits
- Local sandbox regression on 2026-10-18: Amanda 10/10 PASS, TB3 10/10 PASS, isolation 2/2 PASS, both local health=200. Tests execute the manifest engine directly; they are not signed-in HTTP walkthroughs.
- The preview health endpoints previously returned HTTP 200 for Amanda (207) and TB3 (85) and advertised `logging: private-blob`. That mode field proves configuration detection, not a successful Blob write.
- **Authenticated preview walkthroughs: NOT PROVEN** for Amanda student/owner or TB3 athlete/fan. TB3 HQ layout itself requires an authenticated, active membership or admin session; its HMAC portal help API separately checks session slug. A fan without HQ membership cannot enter the current HQ shell.
- **Role mapping gap:** `lib/rbac.ts` defines platform roles `owner`, `admin`, `manager`, `staff`, `viewer`, `guest`; it does not define manifest roles `student`, `athlete`, `fan`, or `family`. Merely falling back to the manifest's least-privileged role does not certify identity-specific elevated permissions. Do not manufacture preview tokens or upgrade guest roles.
- **Private Blob event creation/read-back: NOT PROVEN** for two unknown questions on each authenticated tenant. The endpoint requires a signed cookie and actual storage write; logs and returned `logged` flags alone are insufficient to claim durable private storage.
- A repository-wide `npx tsc --noEmit` returned nonzero with numerous unrelated project errors; the newly edited TB3 workspace and help modules were absent from the filtered error output. Full repository green status is NOT proven.
- **Certification promotion rule:** mark Certified only after all four authenticated role walkthroughs, four private Blob reads, and full agreed regression/production gates pass in preview. No production promotion without explicit owner approval.
