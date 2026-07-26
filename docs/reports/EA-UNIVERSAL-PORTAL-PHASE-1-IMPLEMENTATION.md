# EA Universal Portal — Phase 1 Implementation Report

**Status:** Implemented (not committed / not deployed)  
**Blueprint:** [docs/plans/EA-UNIVERSAL-PORTAL-PHASE-1-BLUEPRINT.md](../plans/EA-UNIVERSAL-PORTAL-PHASE-1-BLUEPRINT.md)  
**Branch:** `master`  
**Base commit (pre-implementation reference):** `38fa48181389a2f25fa1fba7062fc7087a03974c`  
**Report date:** 2026-07-25  

---

## 1. Files created

| Path | Purpose |
|---|---|
| `lib/portal-universal/capability-ids.ts` | `UniversalCapabilityId`, `UNIVERSAL_TO_MODULES` |
| `lib/portal-universal/industry-pack.ts` | Versioned IndustryPack types |
| `lib/portal-universal/validate-pack.ts` | `validateIndustryPack` / `assertValidIndustryPack` |
| `lib/portal-universal/migrations.ts` | `migrateIndustryPack` |
| `lib/portal-universal/flags.ts` | `isUniversalNavPacksEnabled` (`UNIVERSAL_NAV_PACKS`) |
| `lib/portal-universal/resolve-nav.ts` | `resolveIndustryNav`, `resolvedNavToSidebarGroups` |
| `lib/portal-universal/resolve-pack-for-org.ts` | Pack selection for org/slug |
| `lib/portal-universal/apply-branding.ts` | Pack branding → chrome merge |
| `lib/portal-universal/packs/ea-executive.ts` | Default executive pack |
| `lib/portal-universal/packs/ctp-client.ts` | CTP Client Experience pack |
| `lib/portal-universal/packs/sample-placeholder.ts` | Placeholder sample (not default) |
| `lib/portal-universal/packs/index.ts` | Validated registry |
| `lib/portal-universal/index.ts` | Public exports |
| `scripts/test-industry-pack-contract.mjs` | Contract tests |
| `scripts/test-industry-pack-unit.mts` | Unit + integration checks |
| `scripts/test-industry-pack-provisioning-regression.mjs` | Fulfill untouched regression |
| `docs/reports/EA-UNIVERSAL-PORTAL-PHASE-1-IMPLEMENTATION.md` | This report |

---

## 2. Files modified

| Path | Change |
|---|---|
| `lib/ctp-client-nav.ts` | Flag-gated pack-driven CX nav; legacy path preserved |
| `lib/platform/portal-workspace.ts` | Flag-gated IndustryPack nav + branding merge |
| `lib/experience-registry.ts` | Dual-map documentation (ModuleId / CapabilityId / UniversalCapabilityId) |
| `lib/chassis/portal-nav-config.ts` | Marked `@deprecated` (A-029); behavior unchanged |
| `lib/organizations.ts` | Optional `industryPackId` field + Airtable map/update |
| `.env.example` | `UNIVERSAL_NAV_PACKS`, `INDUSTRY_PACK_BY_SLUG_JSON` |

**Not modified (by design):** `lib/fulfill-paid-client.ts`, Stripe, pretix, Trust/e-sign, `lib/notify-dispatch.ts`, People/Tasks stores, RJSF.

---

## 3. Architecture implemented

```
UniversalCapabilityId (10)
        ↓ UNIVERSAL_TO_MODULES
ModuleId (existing registry) ← entitlements ∩ RBAC (unchanged)
        ↑ preferredModuleId / hideModuleIds
IndustryPack.nav → resolveIndustryNav → PortalShell sidebar (flag ON)
ctp-client pack → buildClientExperienceNavFromPack (flag ON)
```

- **Product modules & Capability Map** remain authoritative for routes, Orbie, hub zones.
- **IndustryPack** only reshapes labels, order, chrome branding, and visibility filters.
- Extension slots (`people`, `tasks`, `notifications`, `formSchemaRefs`, `workflowRefs`, `nba`) are **data only**.

---

## 4. Feature-flag behavior

| `UNIVERSAL_NAV_PACKS` | Behavior |
|---|---|
| unset / `0` / false | **Default.** Legacy `toPortalSidebarNavGroups` + hardcoded CX nav. PortalShell unchanged. |
| `1` / `true` / `on` / `yes` | Pack branding merge; executive nav from `resolveIndustryNav`; CX from `ctp-client` pack. |

Rollback: unset the env var (or set `0`). No entitlement migrations to reverse.

Optional: `INDUSTRY_PACK_BY_SLUG_JSON={"slug":"pack-id"}` for slug→pack binding without Airtable.

---

## 5. Backward-compatibility evidence

- Unit test: flag OFF → `buildClientExperienceNav` returns the same five ids (`progress`, `documents`, `messages`, `support`, `journey`) with legacy hrefs.
- Flag ON → same five ids; no `/simplifi`, `/pulse`, or `/amplifi` hrefs in CX.
- `portal-workspace` only replaces sidebar groups when flag ON **and** pack is not `useClientExperienceChrome` (CX continues to use Client Experience nav, not executive sidebar rewrite).
- Orphan `portalNavItems` still exported for any stray callers; deprecated.

---

## 6. Entitlement and RBAC evidence

- `resolveIndustryNav` requires `enabledModuleIds` (from `resolvePortalModuleAccess` / CTP filter) for every visible item.
- `hideModuleIds` only affects chrome, not entitlement stores.
- `minRole` uses `roleAtLeast` (`lib/rbac.ts`); billing item uses `minRole: 'owner'` and module `requiredRole` double-check.
- Unit tests: messaging hidden when not entitled; payments hidden for guest; stage include hides at Welcome.
- `requirePortalModule` untouched — route guards unchanged.
- Provisioning regression: `lib/fulfill-paid-client.ts` has no IndustryPack imports.

---

## 7. Tests added

| Script | Covers |
|---|---|
| `scripts/test-industry-pack-contract.mjs` | File presence, flag/CX/chrome wiring, dual-map comment, no RJSF/Novu in portal-universal |
| `scripts/test-industry-pack-unit.mts` | Validate/migrate/resolve/role/stage/href/branding/CX parity/extensions disabled |
| `scripts/test-industry-pack-provisioning-regression.mjs` | Fulfill path isolation |

---

## 8. Verification results

| Check | Result |
|---|---|
| `node scripts/test-industry-pack-contract.mjs` | **PASS** |
| `node scripts/test-industry-pack-provisioning-regression.mjs` | **PASS** |
| `npx tsx scripts/test-industry-pack-unit.mts` | **PASS** |
| ESLint on Phase 1 paths | **PASS** (exit 0) |
| `tsc` filtered to Phase 1 paths | **PASS** (no errors in portal-universal / ctp-client-nav / portal-workspace / portal-nav-config / organizations) |

### Pre-existing failures (not caused by Phase 1)

| Check | Result | Notes |
|---|---|---|
| Full-repo `tsc --noEmit` | Exit 2 | Unrelated errors remain (e.g. `lib/executive-command-bar.ts` `relatedOrganizations` on `KnowledgeAsset`) |
| GitHub Actions lint on master | Known red historically | Not re-run as deploy; Phase 1 paths eslint clean |

---

## 9. Remaining limitations

1. Flag defaults **OFF** — ops must set `UNIVERSAL_NAV_PACKS=1` after cert.
2. Airtable column `Industry Pack Id` is optional; absent field simply leaves `industryPackId` undefined.
3. Executive pack nav is a flat `core` group (not full NavGroup taxonomy) when flag ON.
4. Pack version pinning (org stores id only; always latest registered version).
5. NBA / People / Tasks / Novu / RJSF not implemented — refs only.
6. `sample-placeholder` must not be bound to production tenants without an explicit decision.
7. Phase 4 `applyIndustryPack` entitlement provisioning not started.

---

## 10. Confirmation: later-phase capabilities not implemented

| Capability | Status |
|---|---|
| People module / households | **Not implemented** (`visibility: never` + `extensions.people.enabled: false`) |
| Tasks Inbox | **Not implemented** |
| Novu / notification prefs runtime | **Not implemented** |
| RJSF form renderer | **Not implemented** (`formSchemaRefs` opaque ids only) |
| Industry-specific portals (church, school, …) | **Not implemented** (placeholder pack only) |
| OpenFGA / object ACL | **Not implemented** |
| Trigger.dev workflows | **Not implemented** (`workflowRefs` only) |
| Replacing CTP / PortalShell / Stripe / registry | **Not done** |

---

## 11. How to enable (local / staging)

```bash
# .env.local
UNIVERSAL_NAV_PACKS=1
# optional:
# INDUSTRY_PACK_BY_SLUG_JSON={"demo-client":"ea-executive"}
```

Then restart `npm run dev` and verify executive sidebar labels vs entitlements and CX five-destination parity.

---

*No commit, push, or deploy was performed as part of this implementation.*
