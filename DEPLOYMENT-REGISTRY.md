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
