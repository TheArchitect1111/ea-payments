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
