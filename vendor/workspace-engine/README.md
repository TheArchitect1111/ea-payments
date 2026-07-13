# @ea/workspace-engine

Assembles a **client-agnostic workspace shell** from:

- theme (`@ea/theme-engine`)
- personality (`@ea/personality-engine`)
- enabled capabilities (`@ea/module-engine` + `@ea/capability-registry`)

## Rule

The Workspace Engine never knows CPR / ETFM / 3HC logic.
It asks: *what capabilities are enabled?* then renders nav, widgets, AI context, and theme.

## Usage

```ts
import { assembleWorkspaceShell } from '@ea/workspace-engine';

const shell = assembleWorkspaceShell({
  organizationId: 'cpr',
  name: 'Canadian Prospects Recruitment',
  workspaceName: 'CPR Team Portal',
  themeId: 'cpr-theme',
  personalityId: 'athletics',
  enabledCapabilityIds: ['documents', 'messaging', 'billing', 'recruiting'],
  terminology: { members: 'Players' },
});
```
