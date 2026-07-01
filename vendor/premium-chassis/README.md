# EA Premium Chassis™

Shared **brand tokens, typography, and UI primitives** for Pulse ecosystem sites (ea-payments, CPR, SisterHub, hubs).

Part of the Pulse platform — not a separate product.

## Install (vendored — recommended)

From a site repo:

```bash
npm run sync-premium
```

Add to `package.json`:

```json
"@ea/premium-chassis": "file:./vendor/premium-chassis"
```

## Use in Next.js

`app/globals.css`:

```css
@import '@ea/premium-chassis/presets/ea-pulse.css';
```

Includes **Instant Feel Standard™** utilities (`pc-tap`, `pc-skeleton`, `pc-save-badge`) via `motion.css` + `instant-feel.css`.

TypeScript theme (optional):

```ts
import { eaPulseTheme } from '@ea/premium-chassis/theme';
```

## CSS classes

| Class | Use |
|-------|-----|
| `.pc-page` | Page shell (cream background) |
| `.pc-container` | Max-width content |
| `.pc-card` / `.pc-card-accent` | Elevated surfaces |
| `.pc-btn-primary` / `.pc-btn-secondary` | CTAs |
| `.pc-eyebrow` / `.pc-display-md` | Headlines |
| `.pc-callout` | Required-field banners |
| `.pc-input` / `.ea-input` | Form fields |

## CSS variables

Use `var(--pc-navy)`, `var(--pc-gold)`, `var(--pc-gold-bright)`, `var(--pc-cream-alt)` in components instead of hardcoded hex.

Portal chassis tokens (`--color-brand`, etc.) are aliased automatically.

## Tenant overrides

Copy `presets/ea-pulse.css` to your site as `presets/my-brand.css` and override `:root` variables only.

## Related packages

| Package | Role |
|---------|------|
| `premium-chassis` | Brand + UI primitives (this package) |
| `portal-chassis` | Auth, layout, integrations |
| `landing-chassis` | Marketing page sections |
