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

Seed themes: EA, CPR, ETFM, 3HC, Bob Rumball.

Does not replace `@ea/premium-chassis` motion/token CSS — this package owns **tenant brand envelopes** for Workspace Engine assembly.
