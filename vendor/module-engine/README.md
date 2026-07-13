# @ea/module-engine

Discovers capabilities and assembles workspace/portal surfaces.

The Workspace Engine should never contain client logic. It asks:

> What capabilities are enabled?

Then renders navigation, widgets, routes, permissions, and AI skills from manifests.

## Quick start

```ts
import {
  assembleFromEnableKeys,
  discoverCapabilities,
} from '@ea/module-engine';

// From workspace clientConfigs (CPR example)
const surface = assembleFromEnableKeys([
  'playerProfiles',
  'recruiting',
  'eligibility',
  'documents',
  'messaging',
  'payments',
  'aiAdvisor',
]);
```

### Bridge live ea-payments registries

```ts
import { discoverCapabilities } from '@ea/module-engine';
import { MODULE_REGISTRY } from '@/lib/modules/registry';
import { CAPABILITY_REGISTRY } from '@/lib/experience-registry';

const registry = discoverCapabilities([
  { type: 'seed' },
  {
    type: 'ea-portal',
    modules: MODULE_REGISTRY,
    capabilities: CAPABILITY_REGISTRY,
  },
]);
```

## API

| Export | Role |
|--------|------|
| `CapabilityRegistry` | Store / query manifests |
| `discoverCapabilities` | Load seed + adapters |
| `adaptEaPortalRegistries` | Bridge MODULE_REGISTRY + experience-registry |
| `assembleFrom*` | Build nav/routes/widgets/AI for enabled set |
| `findMissingDependencies` | Report unmet deps (does not auto-enable) |

## Non-goals (this skeleton)

- No CPR migration
- No hard-coded client navigation
- No payment/document business logic — capabilities own that later

## Depends on

`@ea/capability-registry`
