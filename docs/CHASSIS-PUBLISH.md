# Chassis publish — GitHub Packages

## Portal Chassis (`@ea/portal-chassis`)

1. `cd ea-operating-system/portal-core`
2. `npm run build`
3. `npm publish` (requires `NODE_AUTH_TOKEN` with `write:packages` on GitHub)
4. In `ea-payments/package.json` replace:
   ```json
   "@ea/portal-chassis": "npm:@TheArchitect1111/portal-chassis@^0.1.2"
   ```
5. Remove `vendor/portal-chassis` vendoring after CPR + SisterHub consume the package.

## Landing Chassis

Until npm publish: `npm run sync-landing` in ea-payments copies from `ea-operating-system/landing-chassis`.

## CPR + SisterHub

Repeat package dependency swap; delete local `vendor/portal-chassis` copies.
