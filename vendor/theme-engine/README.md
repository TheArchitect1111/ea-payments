# @ea/theme-engine

Reusable workspace brand themes for the EA Platform.

## Usage

```ts
import {
  getWorkspaceTheme,
  normalizeWorkspaceTheme,
  workspaceThemeToCssVars,
} from '@ea/theme-engine';

const theme = getWorkspaceTheme('cpr-theme');
const cssVars = workspaceThemeToCssVars(theme);
```

Seed themes: EA, Amanda Editorial, CPR, ETFM, 3HC, Bob Rumball.

`amanda-editorial` is a presentation-only Experience Theme. Its tokens live in
`src/themes/amanda-editorial/`; its React presentation components and responsive
CSS live in the EA application. Existing routes, forms, scheduling, payments,
portal modules, and CTA destinations remain owned by the EA Chassis.

Does not replace `@ea/premium-chassis` motion/token CSS — this package owns **tenant brand envelopes** for Workspace Engine assembly.
