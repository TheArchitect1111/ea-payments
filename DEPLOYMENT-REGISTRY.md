# Deployment Registry

| Field | Observed value | Confidence | Change policy |
|---|---|---|---|
| GitHub | `TheArchitect1111/ea-payments` | verified from `origin` | Do not rename during stabilization. |
| Default branch | `master` | verified locally | Protect and review before changing. |
| Vercel project | `ea-payments` | verified from `.vercel/project.json` | No production configuration changes in this phase. |
| Vercel project ID | `prj_u7zAr2vz8bLLC4s77xlU5FnB8VTM` | verified locally | Identifier only; no credentials recorded. |
| Vercel team ID | `team_s7mlAoJkDCQYaXiSC8nYDNIX` | verified locally | Identifier only; no credentials recorded. |
| Public domains | See `vercel.json` and current Vercel dashboard | partially observed | Dashboard is authoritative; verify before cutover. |

Do not place tokens, API keys, webhook secrets, or `.env.local` values in this registry. Every deployment requires a clean checkpoint, passing checks, an approved change record, and post-deploy verification.

## Amanda Catherine

| Component | Project | Verified source SHA | Rollback deployment |
|---|---|---|---|
| Shared Amanda app | `ea-payments` / `prj_u7zAr2vz8bLLC4s77xlU5FnB8VTM` | `ac6cbfce826a3316d6e646ed733e6e98db44bd5e` (observed production before wiring release) | `dpl_Currj9yjKP9zTD2C1zoYADaYU6Fy` |
| `amandacatherine.ca` routing | `amanda-catherine-4` / `prj_x53IeeX3G9inkYUg87NJTHaXT9nw` | `ad6a0a3804be0d47a1cec432e6151f53e581876b` (observed production before routing fix) | `dpl_GMLStCxUVytE4hqmp1GzsHnsHY8J` |

Amanda app changes use the existing EA Production Gate. The current certified source SHA, preview, screenshots and completion time are recorded in `.ea/gates/latest.json`; a manifest-only promotion commit must retain that source as its parent. Routing PR: `TheArchitect1111/amanda-catherine#18`. Post-release evidence must verify both projects and the custom domain.

### Verified Amanda wiring release — 2026-10-11

| Component | Deployed SHA | Certified implementation/source SHA | READY deployment |
|---|---|---|---|
| Shared app (PR #559) | `cd9bd4521f6be08a6fd9bc8d1682921c94824ce2` | `66cbc97e4cc88c240a3f46a8fde610f96632363c` | `dpl_Gs8HE7kxY6bpuASTzpicgxJWjDWv` |
| Amanda domain routing (PR #18) | `652a776f320956137bc3c9181249824414c376bc` | `2182bf4ad8f5e1374d122383f90d31577ff2f6d6` | `dpl_HrUmca195Ah79k9xcv95sjHsY55n` |

EA Production Gate run `38165946175` passed source identity, build, assets, functional, desktop, mobile and creative critic checks. Subsequent Amanda HQ handoff changes require a new exact-source gate; `.ea/gates/latest.json` remains authoritative for the latest promotion. The rollback table above retains the pre-release snapshots.
