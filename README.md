# EA Ecosystem Platform

This repository is the current canonical foundation for the EA Ecosystem. Its observed repository and Vercel project name is `ea-payments`; its package name is `simplifi`; product surfaces use EA Platform, Simplifi, Amplifi, Magnifi, Pulse, Connect, and portal branding. These names are intentionally not being changed during stabilization.

## Current stabilization gate

- Baseline: `master` / `origin/master` at `d48f439` on 2026-07-12.
- Safety checkpoint: `checkpoint/ea-ecosystem-preflight-2026-07-12` at `2fd6465`.
- The checkpoint preserves the pre-existing `lib/capture-records.ts` working-tree change.
- No repository rename, major folder move, production configuration change, deployment, or deletion is authorized in this phase.

Start with [docs/NOW.md](docs/NOW.md), then consult [ECOSYSTEM-MAP.md](ECOSYSTEM-MAP.md), [DEPLOYMENT-REGISTRY.md](DEPLOYMENT-REGISTRY.md), [SERVICE-REGISTRY.md](SERVICE-REGISTRY.md), and [SECURITY-MODEL.md](SECURITY-MODEL.md).

## Local verification

```powershell
npm run lint
npm run build
npm run test:tenant-safety
npm run repo:readiness
```

Use `.env.example` as the variable inventory. Never commit `.env.local` or secrets. Production changes and deployment require a separate reviewed checkpoint.
