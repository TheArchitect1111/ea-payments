# Repository Readiness

EA launch readiness must maximize existing repositories before creating new work.

## Rule

Before adding a new product surface, workflow, script, or SOP, check whether an existing EA repository, chassis package, vendor folder, or template already solves the problem.

Prefer reuse in this order:

1. `ea-payments` for revenue, Simplifi, Magnifi, Amplifi, Pulse, portal, and launch command center work.
2. `ea-operating-system/portal-core` for shared portal auth, layout, Airtable, email, and webhook patterns.
3. `ea-operating-system/premium-chassis` for shared brand tokens and premium UI primitives.
4. `cpr-site`, `SisterHub`, and `BrotherHub` as vertical or overlay references before greenfielding.
5. The marketing site only for public brand/product routing and message consistency.

## Command

```bash
npm run repo:readiness
```

This command inventories the active EA repo ecosystem and flags:

- missing repo paths
- missing expected scripts
- uncommitted source/doc changes
- generated/cache noise
- origin remote presence
- local package/runtime signals

## Launch Interpretation

- `launch-critical`: must be stable before paid launch.
- `shared-critical`: must be stable before scaling reuse across products.
- `brand-critical`: must not contradict product links or public positioning.
- `ecosystem-important`: should be aligned before broad campaigns.
- `reuse-candidate`: use as a pattern or overlay source when it accelerates delivery.

Repository readiness does not replace product readiness. It prevents duplicate work, stale surfaces, and hidden dependency risk.
