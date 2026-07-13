# @ea/capability-registry

Capability Framework foundation for the EA Platform.

## What this package owns

- **Metadata schema** (`CapabilityManifest`) — what every capability must expose
- **Status model** — Planning → Development → Testing → Certified → Deprecated
- **ID map** — bridges portal `ModuleId`, experience `CapabilityId`, workspace `enableKey`, and CPR `hubModuleId`
- **Seed catalog** — initial manifests with consumers, AI skills, and extraction priority

## Canonical rule

Applications enable **canonical capability ids** (kebab-case).  
The Workspace Engine resolves navigation, widgets, routes, and AI skills from manifests — no hard-coded client nav.

## Usage

```ts
import {
  enableKeysToCapabilityIds,
  listCapabilityManifests,
  resolveCanonicalCapabilityId,
  validateIdMapIntegrity,
} from '@ea/capability-registry';

// CPR clientConfigs enable keys → platform ids
const ids = enableKeysToCapabilityIds([
  'playerProfiles',
  'recruiting',
  'eligibility',
  'documents',
  'messaging',
  'payments',
]);

const certified = listCapabilityManifests({ certifiedOnly: true });
const errors = validateIdMapIntegrity();
```

## Certification rule

`Certified` requires reuse evidence (≥2 real consumers or clear multi-tenant use).  
Vertical packs (CPR recruiting, ETFM blueprint) may be reusable packs but are not core engines.

## Related

- `@ea/module-engine` — discovery + assembly over this registry
- `docs/CAPABILITY-FRAMEWORK.md`
- `docs/CHASSIS-SYNC.md`
