# Name-to-Experience Phase 2 — Cert report

**Date:** 2026-07-27  
**Merged:** [PR #210](https://github.com/TheArchitect1111/ea-payments/pull/210) → `master` @ `e43c4c88`  
**Production deploy:** `e43c4c8` (2026-07-27T19:46:11Z)  
**Golden path:** Amanda Catherine  
**Launch impact:** Unblocks name → real website/portal previews → gated provision.

## Scope completed

| Slice | Outcome |
|-------|---------|
| 2A | Branch from `origin/master` @ PR #209 merge (`b9425216`); Steps 1–4 artifacts present |
| 2B | `concept → OrganizationStoryInput` adapter + `composeDirectedWebsite` previews |
| 2C | Selected concept → portal provision + `publishWebsiteThroughDirectorGate` |
| 2D | ED **Approved** (overall 85); wire + quarantine held; logged-in chassis walkthrough still needs operator portal OTP |

## Artifacts / surfaces

- Adapter: `lib/factory-concept-to-director.ts`
- Preview compose + selection persistence: `lib/factory-concept-previews.ts`
- Selected wire: `lib/factory-publish-selected-concept.ts`
- Admin UI: `/admin/ea-factory/concepts/[projectId]`
- Website preview: `/preview/factory/[projectId]/[conceptId]`
- Portal preview: `/preview/factory/[projectId]/[conceptId]/portal`
- APIs: `/api/admin/factory/concept-previews`, `select-concept`, `publish-selected-concept`
- Evidence: `docs/audits/runtime-evidence-name-to-experience-phase2d/`

## Functional checklist

- [x] Three concepts compose to real puck HTML previews (not OIB PNG mockups)
- [x] Portal shell preview uses concept tokens / continuity (preview only)
- [x] Admin can select a concept without auto-publish
- [x] Publish path reuses Experience Director gate (`provisionWebsitePortalSite`)
- [x] Session 3 wire: portal provision + member home + draft Experience page + `draft_only` when quarantined
- [x] Session 3 wire contract: `npm run test:factory-wire-selected` PASS
- [x] Automatic production publishing remains off until selection + ED Approved
- [x] Amanda `/sites/amanda-catherine` stays quarantined unless `EA_AMANDA_SITE_LIVE=1`
- [x] Production deploy of PR #210 live (`e43c4c8`); Phase 2 APIs present (unauth → 401, not 404)
- [x] Prod probe: `/sites/amanda-catherine` → **404** (quarantine held)
- [x] Prod probe: `/portal/login` → **200**
- [x] Prod probe: unauthenticated wire/select/preview APIs → **401**
- [x] Live wire + surfaces smoke (`proj-ms3s6sg1-5404f1` / `wo-amanda-concept-b` / portal `amanda-catherine-afd57f`)
- [x] Quarantine family hotfix (PR #212) — hashed Amanda `/sites` also 404
- [x] Experience Director **Approved** (overall **85**, canPublish true) — evidence `ed-approve-portal-smoke.json`
- [x] Portal chassis routes exist and gate to login (307 → `/portal/login`) while unauthenticated
- [ ] Production smoke: Factory launch Amanda → full research artifacts via OpenAI (optional; seeded path used for cert)
- [ ] Logged-in portal chassis walkthrough (OTP) — local portal HMAC secret ≠ production
- [ ] Apply/contact form smoke when present on composed site
- [ ] Client preview links shared from admin-authenticated sessions only
- [ ] Set `EA_AMANDA_SITE_LIVE=1` only after logged-in walkthrough

## Security checklist

- [x] No secrets in client preview routes
- [x] Quarantine enforced by default for Amanda public site (**prod 404 confirmed**)
- [x] Publish gate denies non-Approved director reviews
- [x] Concept selection does not publish
- [x] Unauthenticated admin mutation routes deny (**401**)
- [x] CPR look/feel untouched; Experience Director v1 not extended

## Session 4 — Certify and launch (status)

**Automated:** `PASS_ED_APPROVED_QUARANTINE_HELD`  
Evidence: `runtime-evidence-name-to-experience-phase2d/ed-approve-portal-smoke.json`

| Check | Result |
|-------|--------|
| Experience Director | **Approved** · overall **85** · canPublish true |
| Project | `proj-ms3s6sg1-5404f1` · concept `wo-amanda-concept-b` |
| Portal slug | `amanda-catherine-afd57f` |
| Public sites | `/sites/amanda-catherine*` → **404** (held) |
| Unauth chassis | home/CTP/updates/resources/ask → **307** login |
| Logged-in chassis | Blocked — production portal HMAC ≠ local secret (need OTP login) |

**Do not set `EA_AMANDA_SITE_LIVE=1` yet** — complete logged-in portal walkthrough first.

### Operator checklist (remaining)

1. Portal OTP login as Amanda tenant → smoke chassis nav + mobile
2. Share client preview links from admin-auth only
3. Then: Vercel Production `EA_AMANDA_SITE_LIVE=1` → redeploy → confirm `/sites/amanda-catherine*` live
4. Record final SHA + ED scores in this folder

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

**Code status:** Merged via PR #210; live on production deploy `e43c4c8`.

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
7. Leave `EA_AMANDA_SITE_LIVE` unset until operator checklist above completes

**Contract test:** `npm run test:factory-wire-selected`

## Verification commands

```bash
npm run test:factory-concept-previews
npm run test:factory-wire-selected
npm run test:amanda-editorial-theme
npm run test:factory-production
```

## Explicit non-goals (honored)

- No Experience Director v1 rewrite
- No CPR site/portal look-and-feel changes
- No People flag / Client Record backfill enablement
- OIB PNG mockups are not treated as real previews
