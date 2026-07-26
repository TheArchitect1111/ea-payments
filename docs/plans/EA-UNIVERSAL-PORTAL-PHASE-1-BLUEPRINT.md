# EA Universal Portal — Phase 1 Blueprint

**Status:** Implementation blueprint only — **do not implement from this chat**  
**Scope:** Universal Capability IDs · configurable navigation · IndustryPack schema  
**Out of scope (this phase):** People module, Tasks Inbox, Novu, RJSF runtime, OpenFGA, full NBA engine, industry vertical builds  
**Gap IDs closed by Phase 1:** A-004, A-005, A-006, A-030 (doc dual-map); A-029 (orphan nav disposition); **A-010 as extension-point only** (NBA provider refs, not engine)  
**Companions:** [EA-UNIVERSAL-PORTAL-GAP-AUDIT.md](../audits/EA-UNIVERSAL-PORTAL-GAP-AUDIT.md), [EA-UNIVERSAL-PORTAL-OSS-FIT-AUDIT.md](../audits/EA-UNIVERSAL-PORTAL-OSS-FIT-AUDIT.md)  
**Integration Gate:** [INTEGRATION-GATE.md](../INTEGRATION-GATE.md)  

| Field | Value |
|---|---|
| **Audited / blueprint branch** | `master` |
| **Commit SHA** | `38fa48181389a2f25fa1fba7062fc7087a03974c` |
| **Blueprint date** | 2026-07-25 |

---

## 1. Objectives and non-goals

### Objectives

1. Introduce **canonical universal capability IDs** that sit *above* EA product `ModuleId`s / existing `CapabilityId`s.
2. Define a versioned **IndustryPack** schema that drives labels, nav order, visibility, role filters, stage filters, branding overrides, and future extension refs.
3. Resolve portal navigation from: **entitlements ∩ RBAC ∩ IndustryPack nav rules** (not hardcoded CX-only forever).
4. Make **CTP Client Experience** one named pack (`ctp-client`), not the only architecture.
5. Preserve PortalShell, module registry, entitlements, RBAC, CTP routes, and provisioning.

### Non-goals (Phase 1)

| Explicitly excluded | Notes |
|---|---|
| People / households | Extension slot only (`extensions.people`) |
| Tasks Inbox | Extension slot only (`extensions.tasks`) |
| Novu / notification prefs | Extension slot only (`extensions.notifications`) |
| RJSF form runtime | **Schema references only** (`formSchemaRefs`) |
| Workflow engines (Trigger.dev) | **Workflow references only** (`workflowRefs`) |
| Full NBA / Home engine | Pack may list `nbaProviderId`; no new Guide rewrite |
| Full industry portals (church, school, …) | One **placeholder** sample pack structure only |

---

## 2. Canonical universal capability IDs

### 2.1 New type: `UniversalCapabilityId`

Stable, industry-agnostic IDs (the “ten universals” from the gap audit). These are **not** renames of `ModuleId` and **not** replacements for existing `CapabilityId` in `lib/experience-registry.ts`.

```ts
/** Phase 1 — lib/portal-universal/capability-ids.ts */
export const UNIVERSAL_CAPABILITY_IDS = [
  'home',           // U1 Home / Next Action
  'people',         // U2 People (future module)
  'messages',       // U3 Messages / Requests
  'tasks',          // U4 Tasks & Approvals (future)
  'calendar',       // U5 Calendar & Scheduling
  'documents',      // U6 Documents & Forms
  'programs',       // U7 Programs / Projects / Services
  'progress',       // U8 Progress & Results
  'payments',       // U9 Payments & Financial Activity
  'resources',      // U10 Resources & Support
] as const;

export type UniversalCapabilityId = (typeof UNIVERSAL_CAPABILITY_IDS)[number];
```

### 2.2 Dual map (A-030) — product capabilities remain

| Layer | Type today | File | Phase 1 role |
|---|---|---|---|
| Product module | `ModuleId` | `lib/modules/registry.ts` | **Unchanged** technical routes/RBAC |
| EA Capability Map | `CapabilityId` | `lib/experience-registry.ts` | **Unchanged** Orbie/dashboard zones; keep `displayLabel` |
| Universal | `UniversalCapabilityId` | **new** | Industry labels + nav composition |

### 2.3 Default mapping: Universal → ModuleId[]

Many-to-many: one universal capability may surface multiple modules; one module may map to one primary universal.

| `UniversalCapabilityId` | Default `ModuleId[]` (primary first) | Default href strategy |
|---|---|---|
| `home` | `dashboard` | `/portal/{slug}` or CX progress when presentation=`client` |
| `people` | _(none yet)_ | Extension — hide until People ships |
| `messages` | `messaging`, `update-hub` | Prefer pack `hrefOverride` or first entitled |
| `tasks` | _(none yet)_ | Extension — may deep-link Connect tasks later |
| `calendar` | `events` | `/portal/{slug}/events` |
| `documents` | `documents`, `ctp` (docs subpath via override) | `/portal/{slug}/documents` |
| `programs` | `ctp`, `simplifi`, `connect`, `amplifi`, `member` | First entitled in pack order |
| `progress` | `pulse`, `ctp` | Pulse or CTP progress per pack |
| `payments` | `billing` | `/portal/{slug}/billing` |
| `resources` | `resources`, `training`, `ask` | First entitled |

**Rule:** Mapping is data in `UNIVERSAL_TO_MODULES` + pack overrides. Enabling a universal item in nav **never** bypasses `resolvePortalModuleAccess` — if no mapped module is entitled + role-allowed, the nav item is **hidden**.

---

## 3. IndustryPack TypeScript schema

### 3.1 Location

| Artifact | Path |
|---|---|
| Schema + types | `lib/portal-universal/industry-pack.ts` |
| Capability IDs + default map | `lib/portal-universal/capability-ids.ts` |
| Nav resolver | `lib/portal-universal/resolve-nav.ts` |
| Pack registry | `lib/portal-universal/packs/index.ts` |
| Sample placeholder pack | `lib/portal-universal/packs/sample-placeholder.ts` |
| Built-in EA packs | `lib/portal-universal/packs/ea-executive.ts`, `ctp-client.ts` |
| Validators | `lib/portal-universal/validate-pack.ts` |
| Migrations | `lib/portal-universal/migrations.ts` |
| Org binding helper | `lib/portal-universal/resolve-pack-for-org.ts` |

### 3.2 Core types (normative)

```ts
import type { ModuleId } from '@/lib/modules/registry';
import type { PlatformRole } from '@/lib/rbac';
import type { GuideLifecycleStage } from '@/lib/project-state-engine';
import type { UniversalCapabilityId } from './capability-ids';

/** Semver string encoded in pack — validated by validateIndustryPack */
export type IndustryPackVersion = `${number}.${number}.${number}`;

export type IndustryPackId = string; // e.g. 'ea-executive' | 'ctp-client' | 'sample-placeholder'

export type PortalPresentationMode = 'workspace' | 'experience' | 'client';
// Mirrors PortalShell Props.presentation — lib/chassis/PortalShell.tsx

export type NavVisibility =
  | { kind: 'always' }
  | { kind: 'never' } // structural hide (capability reserved / not ready)
  | { kind: 'when_entitled' }; // default: show iff mapped modules entitled

export type IndustryNavItem = {
  /** Stable id within pack */
  id: string;
  universalCapabilityId: UniversalCapabilityId;
  /** Industry-facing label */
  label: string;
  /** Optional short label for mobile */
  shortLabel?: string;
  /** Sort key ascending (0 = first) */
  order: number;
  visibility?: NavVisibility;
  /** Minimum PlatformRole (ANDed with module.requiredRole) */
  minRole?: PlatformRole;
  /** If set, show only when Guide stage is one of these (CTP-bound portals) */
  stagesInclude?: GuideLifecycleStage[];
  /** If set, hide when Guide stage is one of these */
  stagesExclude?: GuideLifecycleStage[];
  /**
   * Optional path under /portal/{slug}/… or absolute external URL.
   * If omitted, resolver picks first entitled ModuleId from mapping + moduleHref.
   */
  hrefOverride?: string;
  /** Prefer this ModuleId when multiple modules map to the universal capability */
  preferredModuleId?: ModuleId;
  /** Icon key consumed by existing portal-nav-mapping (optional) */
  iconKey?: string;
};

export type IndustryPackBranding = {
  /** Overrides Organization.themeId when set */
  themeId?: string;
  /** Overrides Organization.personalityId when set */
  personalityId?: string;
  workspaceName?: string;
  brandName?: string;
  /** Keys merge onto PortalWorkspaceChrome terminology-like fields */
  terminology?: Partial<{
    members: string;
    home: string;
    startPrompt: string;
    focus: string;
    attention: string;
    start: string;
  }>;
  /** Logo path or URL — does not replace org.logo if org.logo set (org wins) */
  logoSrc?: string;
};

/** Extension points — Phase 1 stores refs only; no runtime People/Tasks/Novu/RJSF */
export type IndustryPackExtensions = {
  people?: { enabled: false } | { enabled: true; schemaVersion: string; notes?: string };
  tasks?: { enabled: false } | { enabled: true; schemaVersion: string; notes?: string };
  notifications?: {
    enabled: false;
  } | {
    enabled: true;
    /** Future Novu trigger/workflow keys — not wired in Phase 1 */
    providerHint?: 'novu' | 'ea-native';
    topicKeys?: string[];
  };
  /** Future RJSF — JSON Schema document ids, not schemas themselves */
  formSchemaRefs?: Array<{
    id: string;
    universalCapabilityId: UniversalCapabilityId;
    title: string;
    /** Opaque ref: airtable id, file path, or content hash — resolver TBD Phase 2+ */
    schemaRef: string;
  }>;
  /** Future workflows — Make/Trigger keys */
  workflowRefs?: Array<{
    id: string;
    purpose: string;
    providerHint?: 'make' | 'trigger' | 'cron' | 'pulse';
    envKeyOrSlug?: string;
  }>;
  /** Future NBA — provider id string only */
  nba?: {
    providerId: string; // e.g. 'ctp-guide' | 'pack-static' | 'none'
    staticHeadline?: string;
  };
};

export type IndustryPack = {
  id: IndustryPackId;
  version: IndustryPackVersion;
  /** Human title for admin/ops */
  title: string;
  description?: string;
  /** Default PortalShell presentation when pack applied */
  presentation: PortalPresentationMode;
  /**
   * Module ids this pack *expects*. Entitlements remain source of truth;
   * this list is used for validation warnings + optional provision hints (Phase 4).
   */
  suggestedModuleIds: ModuleId[];
  /**
   * Modules to force-hide from nav even if entitled (rare).
   * Does NOT revoke entitlements — only nav chrome.
   */
  hideModuleIds?: ModuleId[];
  nav: IndustryNavItem[];
  branding?: IndustryPackBranding;
  extensions?: IndustryPackExtensions;
  /**
   * When true, use Client Experience chrome paths (ctp-client-nav compatible).
   * presentation should be 'client'.
   */
  useClientExperienceChrome?: boolean;
  /** Pack supersedes PLATFORM_CLIENT_CONFIGS.id when org.industryPackId set */
  legacyPlatformClientId?: string;
};
```

### 3.3 Org binding

Extend organization resolution (Phase 1 may use **env/JSON fallback** before Airtable column lands):

| Field | Source | Priority |
|---|---|---|
| `industryPackId` | New optional Airtable field **or** `Organization` metadata / env map | Highest |
| Fallback | `Organization.platformClientId` → pack `legacyPlatformClientId` | Medium |
| Fallback | CTP Client Experience active → pack `ctp-client` | Medium |
| Fallback | `ea-executive` | Default |

**Existing fields reused** (`lib/organizations.ts`): `platformClientId`, `themeId`, `personalityId`, `workspaceName`, `logo`, `brandColors`, `industry` (free-text; **not** pack id).

**Proposed (Phase 1 implementers):** add optional `industryPackId?: string` to `Organization` + Airtable “Industry Pack Id” when durable; until then `resolvePackForOrg` may read `process.env.INDUSTRY_PACK_BY_SLUG_JSON`.

---

## 4. Navigation labels and ordering

### 4.1 Resolution algorithm (`resolveIndustryNav`)

Inputs:

- `slug: string`
- `access: PortalModuleAccess` from `resolvePortalModuleAccess` (`lib/modules/portal-modules.ts`)
- `role: PlatformRole` from session (`normalizeRole`)
- `pack: IndustryPack`
- `guideStage?: GuideLifecycleStage` (optional; from CTP submission when available)
- `presentation: PortalPresentationMode`

Steps:

1. Start with `pack.nav` sorted by `order` ascending, stable by `id`.
2. Drop items where `visibility.kind === 'never'`.
3. Drop items failing `minRole` via `roleAtLeast(role, minRole)` (`lib/rbac.ts`).
4. Drop items failing stage include/exclude when `guideStage` provided; if `guideStage` missing, **ignore** stage rules (fail open for stage, not security).
5. For each remaining item, compute `moduleCandidates` = preferredModuleId ∪ `UNIVERSAL_TO_MODULES[universalCapabilityId]`.
6. Intersect candidates with `access.enabledModuleIds` and not in `pack.hideModuleIds`.
7. If intersection empty and visibility is `when_entitled` (default) → **hide**.
8. Build `href`: `hrefOverride` if set (resolve `{slug}`); else `moduleHref(slug, preferredOrFirst)` from `lib/modules/registry.ts`.
9. Apply `label` / `shortLabel` from pack (industry labels win over `CapabilityDefinition.displayLabel` for this nav surface).
10. Return `ResolvedNavItem[]` for shell consumers.

### 4.2 Output type

```ts
export type ResolvedNavItem = {
  id: string;
  universalCapabilityId: UniversalCapabilityId;
  label: string;
  shortLabel?: string;
  href: string;
  moduleId?: ModuleId;
  order: number;
};
```

### 4.3 Client Experience special case

When `pack.useClientExperienceChrome === true` (pack `ctp-client`):

- Keep mental model of `buildClientExperienceNav` (`lib/ctp-client-nav.ts`) but **drive labels/order/hrefs from pack.nav** mapped to existing `ClientExperienceNavId` via a fixed bridge table:

| `ClientExperienceNavId` | Default universal | Notes |
|---|---|---|
| `progress` | `home` or `progress` | Pack chooses |
| `documents` | `documents` | |
| `messages` | `messages` | |
| `support` | `resources` | Maps to Help |
| `journey` | `programs` | Quiet secondary |

Phase 1 implementation: `buildClientExperienceNavFromPack(slug, pack)` replaces direct hardcoding **inside** `buildClientExperienceNav` while preserving exports and href helpers (`designStudioPath`, `portalCtpPath`, `opportunityDashboardPath` from `lib/ctp-opportunity-routes.ts`).

---

## 5. Module enablement and hiding

| Concern | Owner | Phase 1 behavior |
|---|---|---|
| Entitlement grant/revoke | Existing Airtable entitlements + `defaultModulesForPackage` | **Unchanged** |
| Role gate per module | `ModuleDefinition.requiredRole` + `roleCanAccessModule` | **Unchanged** |
| CTP module filter | `applyCtpPortalModuleFilter` | **Unchanged** |
| Nav hide despite entitlement | `IndustryPack.hideModuleIds` + item visibility | **New** — chrome only |
| Suggested modules | `suggestedModuleIds` | Warnings in validate; **no auto-entitle** in Phase 1 (provision apply = Phase 4 / A-021) |

**Forbidden:** IndustryPack must not call entitlement writers or bypass `requirePortalModule`.

---

## 6. Role-based navigation

- Pack item `minRole` ANDed with module `requiredRole` (stricter wins via sequential checks).
- Example: billing universal with `minRole: 'owner'` remains hidden for `guest` even if somehow entitled (billing module already `requiredRole: 'owner'` in registry).
- Do **not** invent industry roles (officer, parent) in Phase 1 — still `PLATFORM_ROLES` only (`lib/rbac.ts`).

---

## 7. Journey-stage navigation

- Use `GuideLifecycleStage` from `lib/ctp-guide-stage-engine.ts` (re-exported by `lib/project-state-engine.ts`).
- Stage rules only apply when resolver receives a stage (CTP portals).
- Executive / non-CTP portals: omit stage → stage filters skipped.
- NBA provider remains extension (`extensions.nba.providerId: 'ctp-guide'`) — **no** change to `lib/ctp-guide-progress.ts` in Phase 1.

---

## 8. Branding configuration

Merge order for chrome (highest last wins unless noted):

1. `EA_DEFAULT_CHROME` in `lib/platform/portal-workspace.ts`
2. `PLATFORM_CLIENT_CONFIGS` / `resolveWorkspaceShellForPortal` (`lib/platform/workspace-bridge.ts`)
3. Organization fields (`themeId`, `personalityId`, `workspaceName`, `logo`)
4. **`IndustryPack.branding`** (new) — terminology + theme/personality defaults when org fields empty
5. Org logo **always wins** over pack `logoSrc` when org.logo set

Wire into `resolvePortalWorkspaceChrome` without removing existing theme-engine / personality-engine behavior.

---

## 9. Form-schema references (RJSF extension only)

```ts
extensions: {
  formSchemaRefs: [
    {
      id: 'sample-intake',
      universalCapabilityId: 'documents',
      title: 'Placeholder intake',
      schemaRef: 'schema:placeholder/sample-intake@1',
    },
  ],
}
```

- Phase 1: validate shape only; **do not** install `@rjsf/core`; **do not** render forms.
- Future Phase 2+: load schema by `schemaRef`, render under Documents.

---

## 10. Workflow references

```ts
extensions: {
  workflowRefs: [
    {
      id: 'sample-reminder',
      purpose: 'Placeholder reminder workflow',
      providerHint: 'cron',
      envKeyOrSlug: 'CRON_SECRET', // illustrative only
    },
  ],
}
```

- No Trigger.dev / Make wiring changes in Phase 1.
- Existing Make paths (`lib/make-webhooks.ts`) stay authoritative for current automations.

---

## 11. Default / fallback behavior

| Scenario | Behavior |
|---|---|
| Unknown `industryPackId` | Log warning; use `ea-executive` |
| Pack validation fails at boot | Refuse to register pack; fallback `ea-executive` |
| Empty `nav` array | Invalid pack — reject in validator |
| No entitled modules for all items | Shell may show home-only or empty secondary nav — still allow dashboard if entitled |
| CTP shell without pack | Resolve `ctp-client` when `shouldUseClientExperienceShell(slug)` |
| Missing guide stage | Skip stage filters |
| `hrefOverride` 404 | Not validated at resolve-time (acceptance: links use known helpers) |
| Orphan `lib/chassis/portal-nav-config.ts` | **Do not** use for live nav; mark deprecated in comment or delete in Phase 1 PR if unused (A-029) |

---

## 12. Validation rules (`validateIndustryPack`)

Must fail (throw or `ok: false`) when:

1. `id` empty or not kebab-case (`/^[a-z][a-z0-9-]*$/`).
2. `version` not semver `X.Y.Z`.
3. `nav.length === 0`.
4. Duplicate `nav[].id` or duplicate `order` **warning** (orders should be unique; allow ties with stable `id` sort).
5. `universalCapabilityId` not in `UNIVERSAL_CAPABILITY_IDS`.
6. `preferredModuleId` / `suggestedModuleIds` / `hideModuleIds` not in `MODULE_IDS`.
7. `minRole` not in `PLATFORM_ROLES`.
8. `stagesInclude` / `stagesExclude` values not in `GUIDE_LIFECYCLE_STAGES`.
9. `presentation === 'client'` but `useClientExperienceChrome !== true` → **warning** (or error if strict mode).
10. `extensions.people|tasks.enabled === true` in Phase 1 packs shipped in-repo → **error** (force `enabled: false` until Phase 2) — sample pack must keep extensions disabled or enabled:false.
11. `formSchemaRefs` / `workflowRefs` entries missing `id` → error.
12. `hideModuleIds` intersecting empty entitlements is fine.

Export `assertValidIndustryPack(pack): IndustryPack` for registry load.

---

## 13. Versioning and migrations

| Mechanism | Behavior |
|---|---|
| Pack `version` | Semver on each pack object |
| Registry | `PACK_REGISTRY: Record<IndustryPackId, IndustryPack>` |
| Migrations | `migrateIndustryPack(raw: unknown): IndustryPack` in `migrations.ts` |
| v1 → v1.x | Additive fields optional with defaults (`visibility: { kind: 'when_entitled' }`) |
| Breaking | Bump major; keep old pack id with `-v1` suffix if needed; org pin by id+version optional later |
| Org storage | Store **pack id** only in Phase 1; always load latest registered version for that id (document this); pin-by-version is Phase 4+ |

Migration function must be pure and covered by unit tests with fixture JSON.

---

## 14. Compatibility matrix

| System | File(s) | Compatibility rule |
|---|---|---|
| PortalShell | `lib/chassis/PortalShell.tsx` | Keep `presentation`, `chrome`, `clientNavActive`; feed resolved nav into layout |
| Module registry | `lib/modules/registry.ts` | No ModuleId renames; dual map only |
| Entitlements | `lib/modules/portal-modules.ts` `resolvePortalModuleAccess` | Still sole enablement authority |
| RBAC | `lib/rbac.ts` | `roleAtLeast` / `normalizeRole` only |
| Experience registry | `lib/experience-registry.ts` | Keep `CapabilityId`; document dual map (A-030) |
| CTP Client nav | `lib/ctp-client-nav.ts` | Implement via pack; preserve function names |
| Client Experience freeze | `.cursor/rules/client-experience-freeze.mdc` (if present) | Visual/UX freeze ≠ forbidding config-driven labels; **do not** add Executive modules to CX |
| Provisioning | `lib/fulfill-paid-client.ts` | Phase 1: optional read of pack for chrome only; **no** entitlement mutation |
| Org presets | `lib/platform/client-configs.ts` | Bridge via `legacyPlatformClientId`; do not delete presets |
| Workspace chrome | `lib/platform/portal-workspace.ts` | Merge pack branding |
| HMAC / middleware | `@ea/portal-chassis`, `middleware.ts` | Untouched |
| Stripe / fulfill | billing + fulfill | Untouched |
| pretix / events | `lib/portal-event-hub.ts` | Untouched beyond nav label |

---

## 15. Exact files to create or modify

### Create

| File | Purpose |
|---|---|
| `lib/portal-universal/capability-ids.ts` | Universal IDs + `UNIVERSAL_TO_MODULES` |
| `lib/portal-universal/industry-pack.ts` | Types |
| `lib/portal-universal/validate-pack.ts` | Validator |
| `lib/portal-universal/migrations.ts` | migrate helpers |
| `lib/portal-universal/resolve-nav.ts` | `resolveIndustryNav` |
| `lib/portal-universal/resolve-pack-for-org.ts` | Pack selection |
| `lib/portal-universal/packs/index.ts` | Registry |
| `lib/portal-universal/packs/ea-executive.ts` | Default executive pack |
| `lib/portal-universal/packs/ctp-client.ts` | CX pack (labels match current CX defaults) |
| `lib/portal-universal/packs/sample-placeholder.ts` | Placeholder sample only |
| `scripts/test-industry-pack-contract.mjs` | Contract tests |
| `docs/plans/EA-UNIVERSAL-PORTAL-PHASE-1-BLUEPRINT.md` | This document |

### Modify (minimal)

| File | Change |
|---|---|
| `lib/ctp-client-nav.ts` | Delegate label/order/href to `ctp-client` pack |
| `lib/platform/portal-workspace.ts` | Merge pack branding; attach resolved shell nav from pack when flag on |
| `lib/modules/portal-modules.ts` | Optional: expose helper to build sidebar from `ResolvedNavItem` **or** keep `toPortalSidebarNavGroups` and map resolved items → groups |
| `lib/chassis/PortalShell.tsx` / `PortalLayout.tsx` | Consume resolved nav if needed (prefer chrome already carries `shellNavGroups`) |
| `lib/organizations.ts` | Optional `industryPackId?: string` mapping |
| `lib/chassis/portal-nav-config.ts` | Deprecate (comment + no imports) or delete if confirmed unused |
| `lib/experience-registry.ts` | Doc comment: dual map with UniversalCapabilityId |
| `docs/EA-Core-Technology-Stack.md` | Note IndustryPack (config layer) — docs only when implementing |

### Do not modify in Phase 1

- `lib/fulfill-paid-client.ts` entitlement logic  
- `lib/ctp-guide-progress.ts` NBA engine  
- `lib/portal-messaging-hub.ts`, Connect/People/Tasks stores  
- `lib/notify-dispatch.ts` (Novu)  
- Stripe / pretix / Trust e-sign routes  

---

## 16. Existing code to reuse

| Reuse | Why |
|---|---|
| `resolvePortalModuleAccess` | Entitlement ∩ role |
| `moduleHref` / `getModuleDefinition` | Path segments |
| `roleAtLeast`, `normalizeRole` | Role gates |
| `shouldUseClientExperienceShell` | Pack selection signal |
| `designStudioPath`, `portalCtpPath`, `opportunityDashboardPath` | CX hrefs |
| `resolvePortalWorkspaceChrome` | Branding pipeline |
| `PLATFORM_CLIENT_CONFIGS.terminology` | Seed branding terminology |
| `GUIDE_LIFECYCLE_STAGES` | Stage filters |
| `PortalWorkspaceChrome.shellNavGroups` | Shell rendering |

---

## 17. Existing behavior that must remain unchanged

1. **Slug session isolation** — `session.slug !== slug` redirects / 403.  
2. **Fail-closed entitlements** in production when no Airtable entitlements (`portal-modules.ts`).  
3. **CTP Client Experience** must not gain Pulse/Simplifi/Amplifi Executive modules.  
4. **Module `requiredRole`** enforcement in `requirePortalModule`.  
5. **HMAC portal auth** and cookie names.  
6. **Stripe fulfillment** and package → module grants.  
7. **Update Hub as messaging backend** (no Chatwoot).  
8. **pretix** as event registration engine.  
9. Visual Client Experience freeze (structure/UX) — labels may become pack-driven but IA stays Progress/Documents/Contact/Help/Journey unless product explicitly changes CX.  
10. Experience Director v1 closed — do not reopen.

---

## 18. Sample IndustryPack (placeholders only)

File: `lib/portal-universal/packs/sample-placeholder.ts`

```ts
import type { IndustryPack } from '../industry-pack';

/**
 * PLACEHOLDER ONLY — not a shipped industry portal.
 * Demonstrates schema shape for future packs (e.g. chapter/church).
 */
export const SAMPLE_PLACEHOLDER_PACK: IndustryPack = {
  id: 'sample-placeholder',
  version: '1.0.0',
  title: 'Sample Placeholder Industry Pack',
  description: 'Schema demo with placeholder labels. Not for production tenants.',
  presentation: 'workspace',
  suggestedModuleIds: ['dashboard', 'events', 'documents', 'messaging', 'resources', 'ask'],
  hideModuleIds: ['simplifi', 'amplifi'], // chrome hide example only
  useClientExperienceChrome: false,
  nav: [
    {
      id: 'home',
      universalCapabilityId: 'home',
      label: 'Chapter Home', // placeholder industry wording
      order: 10,
      preferredModuleId: 'dashboard',
    },
    {
      id: 'calendar',
      universalCapabilityId: 'calendar',
      label: 'Calendar & Events',
      order: 20,
      preferredModuleId: 'events',
    },
    {
      id: 'messages',
      universalCapabilityId: 'messages',
      label: 'Messages',
      order: 30,
      preferredModuleId: 'messaging',
      minRole: 'guest',
    },
    {
      id: 'documents',
      universalCapabilityId: 'documents',
      label: 'Documents & Forms',
      order: 40,
      preferredModuleId: 'documents',
    },
    {
      id: 'resources',
      universalCapabilityId: 'resources',
      label: 'Training & Support',
      order: 50,
      preferredModuleId: 'resources',
    },
    {
      id: 'people',
      universalCapabilityId: 'people',
      label: 'Members',
      order: 60,
      visibility: { kind: 'never' }, // Phase 1: no People module
    },
    {
      id: 'tasks',
      universalCapabilityId: 'tasks',
      label: 'Chapter Business',
      order: 70,
      visibility: { kind: 'never' }, // Phase 1: no Tasks inbox
    },
  ],
  branding: {
    workspaceName: 'Sample Chapter Portal',
    terminology: {
      members: 'Members',
      home: 'Chapter Home',
      startPrompt: 'What should the chapter advance this week?',
    },
  },
  extensions: {
    people: { enabled: false },
    tasks: { enabled: false },
    notifications: { enabled: false },
    formSchemaRefs: [
      {
        id: 'placeholder-application',
        universalCapabilityId: 'documents',
        title: 'Placeholder application form',
        schemaRef: 'schema:placeholder/application@1',
      },
    ],
    workflowRefs: [
      {
        id: 'placeholder-dues-reminder',
        purpose: 'Future dues reminder',
        providerHint: 'cron',
      },
    ],
    nba: {
      providerId: 'none',
      staticHeadline: 'Placeholder next action — not wired',
    },
  },
};
```

**Do not** bind real production slugs to `sample-placeholder` without an explicit ops decision.

---

## 19. Built-in packs (behavioral targets)

### `ea-executive`

- `presentation: 'workspace'`
- Nav mirrors current executive entitlement nav labels (Dashboard, Pulse, …) via universal map
- `legacyPlatformClientId: 'ea'`

### `ctp-client`

- `presentation: 'client'`, `useClientExperienceChrome: true`
- Nav items align to current `buildClientExperienceNav` defaults (Your Project, Documents, Contact, Help, Journey)
- Stage filters optional no-ops initially
- `extensions.nba.providerId: 'ctp-guide'` (reference only)

---

## 20. Tests

### Unit

| Test | Asserts |
|---|---|
| `validateIndustryPack` happy path | sample + ea-executive + ctp-client pass |
| Invalid pack | bad id, empty nav, unknown module → fail |
| `resolveIndustryNav` hide when not entitled | messaging hidden if module not in `enabledModuleIds` |
| Role filter | `minRole: 'staff'` hidden for guest |
| Stage filter | item with `stagesInclude: ['Agreement']` hidden at `Welcome` |
| hideModuleIds | entitled simplifi still omitted from resolved nav |
| hrefOverride | slug interpolation |
| migrateIndustryPack | fixture without `visibility` gets default |
| Pack registry | all packs unique ids; sample not default |

### Integration

| Test | Asserts |
|---|---|
| `shouldUseClientExperienceShell` → `ctp-client` pack | resolvePackForOrg returns ctp-client |
| Chrome merge | pack terminology appears in chrome when org theme empty |
| Sidebar/CX | Snapshot or contract: CX still 5 destinations; no pulse/simplifi links |
| `requirePortalModule` | Still 403/redirect when module not entitled regardless of pack nav |

### Provisioning

| Test | Asserts |
|---|---|
| `fulfillPaidClient` | Unchanged entitlements for demo fixture (regression) |
| Phase 1 pack bind (if env map) | Slug → pack id resolution only; no entitlement writes |

### Contract script

`scripts/test-industry-pack-contract.mjs` — file existence, dual-map comment in experience-registry, packs validate, no `@rjsf` / `novu` imports in `lib/portal-universal/**`.

---

## 21. Acceptance criteria

Phase 1 is **done** when:

1. `UniversalCapabilityId` and default module map exist and are documented (A-004, A-030).  
2. `IndustryPack` type + validator + registry ship with `ea-executive`, `ctp-client`, `sample-placeholder`.  
3. Executive portal nav labels/order can be changed **only** by editing pack data (not PortalShell hardcoding) for at least one test override.  
4. CTP Client Experience still renders the same five destinations; labels driven by `ctp-client` pack.  
5. Entitlements/RBAC still hide routes via `requirePortalModule`; pack cannot reveal unauthorized modules.  
6. Branding merge respects org logo > pack > defaults.  
7. `formSchemaRefs` / `workflowRefs` / `extensions.people|tasks|notifications` present as **data only**; no RJSF/Novu/People/Tasks runtime.  
8. Orphan `portal-nav-config.ts` deprecated or removed (A-029).  
9. Contract + unit tests green.  
10. Rollback procedure below verified once (feature flag or pack fallback).

---

## 22. Rollback strategy

1. **Feature flag:** `UNIVERSAL_NAV_PACKS=0` (default off until cert) → resolver returns legacy `toPortalSidebarNavGroups` / hardcoded `buildClientExperienceNav` paths.  
2. **Pack fallback:** corrupt pack → `ea-executive` or pre-flag behavior.  
3. **No entitlement migrations** in Phase 1 → rollback is code/flag only.  
4. If Airtable `Industry Pack Id` added, leave field unused on rollback (ignored when flag off).  
5. Do not delete old nav helpers until one stable release with flag default **on**.

---

## 23. Ordered implementation sequence

1. Add `lib/portal-universal/capability-ids.ts` + dual-map doc comment on `lib/experience-registry.ts`.  
2. Add `industry-pack.ts` types + `validate-pack.ts` + unit tests.  
3. Add `ea-executive` + `ctp-client` packs matching **current** production labels.  
4. Add `sample-placeholder` pack (never default).  
5. Implement `resolve-pack-for-org.ts` + `resolve-nav.ts` behind `UNIVERSAL_NAV_PACKS`.  
6. Wire `ctp-client-nav.ts` to pack when flag on (behavior parity tests).  
7. Wire `portal-workspace.ts` branding merge + shell nav when flag on.  
8. Deprecate `portal-nav-config.ts`.  
9. Optional org `industryPackId` field + env JSON map.  
10. Contract script + flag-off/on cert on `demo-client`.  
11. Default flag **on** only after acceptance criteria met.  
12. Stop — do **not** start People, Tasks, Novu, or RJSF.

---

## 24. Launch filter note

Phase 1 increases **platform capacity** for multi-industry configuration without replacing CTP or EA products. It is architecture-enabling for launch flexibility; full industry packs remain backlog (P3). Ship **disabled until configured** (feature flag) per Integration Gate.

---

*End of Phase 1 blueprint. No product code was modified to produce this document beyond creating this file.*
