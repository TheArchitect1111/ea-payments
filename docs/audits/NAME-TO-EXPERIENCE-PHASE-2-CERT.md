# Name-to-Experience Phase 2 — Cert report

**Date:** 2026-07-27  
**Branch:** `feat/name-to-experience-phase-2`  
**Golden path:** Amanda Catherine  
**Launch impact:** Unblocks name → real website/portal previews → gated provision.

## Scope completed

| Slice | Outcome |
|-------|---------|
| 2A | Branch from `origin/master` @ PR #209 merge (`b9425216`); Steps 1–4 artifacts present |
| 2B | `concept → OrganizationStoryInput` adapter + `composeDirectedWebsite` previews |
| 2C | Selected concept → portal provision + `publishWebsiteThroughDirectorGate` |
| 2D | Cert checklist + Amanda public site remains gated until `EA_AMANDA_SITE_LIVE=1` |

## Artifacts / surfaces

- Adapter: `lib/factory-concept-to-director.ts`
- Preview compose + selection persistence: `lib/factory-concept-previews.ts`
- Selected wire: `lib/factory-publish-selected-concept.ts`
- Admin UI: `/admin/ea-factory/concepts/[projectId]`
- Website preview: `/preview/factory/[projectId]/[conceptId]`
- Portal preview: `/preview/factory/[projectId]/[conceptId]/portal`
- APIs: `/api/admin/factory/concept-previews`, `select-concept`, `publish-selected-concept`

## Functional checklist

- [x] Three concepts compose to real puck HTML previews (not OIB PNG mockups)
- [x] Portal shell preview uses concept tokens / continuity (preview only)
- [x] Admin can select a concept without auto-publish
- [x] Publish path reuses Experience Director gate (`provisionWebsitePortalSite`)
- [x] Session 3 wire: portal provision + member home + draft Experience page + `draft_only` when quarantined
- [x] Session 3 wire contract: `npm run test:factory-wire-selected` PASS
- [x] Automatic production publishing remains off until selection + ED Approved
- [x] Amanda `/sites/amanda-catherine` stays quarantined unless `EA_AMANDA_SITE_LIVE=1`
- [ ] Production smoke: Factory launch Amanda → artifacts `prospect_profile`, `creative_direction`, `experience_concepts` with `selectionStatus: awaiting_review` (requires live `OPENAI_API_KEY` + admin session)
- [ ] Experience Director review status **Approved** on selected composed blueprint
- [ ] Live wire via admin: surfaces checklist (login, CTP, draft, chassis) returns for Amanda project
- [ ] Portal login + chassis nav + mobile viewport smoke on activated tenant
- [ ] Apply/contact form smoke when present on composed site
- [ ] Client preview links shared from admin-authenticated sessions only

## Security checklist

- [x] No secrets in client preview routes
- [x] Quarantine enforced by default for Amanda public site
- [x] Publish gate denies non-Approved director reviews
- [x] Concept selection does not publish
- [x] CPR look/feel untouched; Experience Director v1 not extended

## Unquarantine / deploy Amanda (controlled)

1. Select concept in admin → `selectionStatus: awaiting_certify`
2. Run Experience Director until **Approved**
3. `POST /api/admin/factory/publish-selected-concept` (portal may activate; website skips while quarantined)
4. Complete functional checklist above
5. Set production env `EA_AMANDA_SITE_LIVE=1`
6. Re-run publish selected (or activate-experience) so `/sites/amanda-catherine` can go live
7. Record deploy SHA + ED scores in this folder

**Do not** remove the slug from quarantine code without the env gate unless a follow-up cert explicitly retires the flag.

## Session 3 — Wire selected experience (operator checklist)

**Code status:** Wire path is implemented in this branch (not yet merged to production).

| Surface | Path / action |
|---------|----------------|
| Admin concepts | `/admin/ea-factory/concepts/{projectId}` → **Wire selected experience** |
| API | `POST /api/admin/factory/publish-selected-concept` `{ projectId }` |
| Lib | `lib/factory-publish-selected-concept.ts` |

**What wire does (in order):**
1. Requires `selectedConceptId` + selectionStatus beyond `awaiting_review`
2. Ensures composed concept previews exist
3. Provisions portal tenant via `provisionExperiencePortalTenant` (fulfill + CTP + chassis)
4. Saves member home + draft Experience Builder page
5. If slug quarantined (Amanda default) → returns `websiteStatus: draft_only` (no public `/sites`)
6. If unquarantined → `provisionWebsitePortalSite` through Experience Director gate

**Live Amanda wire (admin session required in prod):**
1. Open Factory project that has `experience_concepts` with a selected concept
2. Generate real previews if needed → Select concept
3. Run Experience Director until **Approved** (required before public site; draft/portal still wire while quarantined)
4. Click **Wire selected experience** (or POST the API with admin cookie)
5. Confirm surfaces checklist: portal login, CTP, draft preview, chassis modules, quarantine = true
6. Smoke portal login + chassis nav on the returned slug
7. Leave `EA_AMANDA_SITE_LIVE` unset until Step 4 (certify) completes

**Contract test:** `npm run test:factory-wire-selected`

## Verification commands

```bash
npm run test:factory-concept-previews
npm run test:factory-wire-selected
npm run test:factory-production
```

## Explicit non-goals (honored)

- No Experience Director v1 rewrite
- No CPR site/portal look-and-feel changes
- No People flag / Client Record backfill enablement
- OIB PNG mockups are not treated as real previews
