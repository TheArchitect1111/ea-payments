# Deployment Registry

| Field | Observed value | Confidence | Change policy |
|---|---|---|---|
| GitHub | `TheArchitect1111/ea-payments` | verified from `origin` | Do not rename during stabilization. |
| Default branch | `master` | verified locally | Protect and review before changing. |
| Vercel project | `ea-payments` | verified from `.vercel/project.json` | No production configuration changes in this phase. |
| Vercel project ID | `prj_u7zAr2vz8bLLC4s77xlU5FnB8VTM` | verified locally | Identifier only; no credentials recorded. |
| Vercel team ID | `team_s7mlAoJkDCQYaXiSC8nYDNIX` | verified locally | Identifier only; no credentials recorded. |
| Public domains | See `vercel.json` and current Vercel dashboard | partially observed | Dashboard is authoritative; verify before cutover. |

## Approved Client Surfaces

### Amanda Catherine V2 Portal
- Canonical name: `Amanda Catherine V2 Portal`
- Status: `APPROVED V2 PORTAL`
- Approved/frozen: `2026-09-18`
- Canonical public URL: `https://thearchitect1111.github.io/ea-payments/amanda-v2-portal/`
- Public host: GitHub Pages
- Public artifact branch: `gh-pages`
- Public artifact path: `amanda-v2-portal/index.html`
- Approved source branch: `approved/amanda-portal-v2-2026-09-18`
- Approved source route: `/amanda-visual-qa`
- Retrieval rule: When asked for Amanda's approved V2 portal, return the canonical public URL above first. Do not reconstruct a Vercel deployment URL or search deployment history unless this canonical URL fails verification.
- Change rule: Do not replace this registry entry when creating a later preview. A newer portal becomes canonical only after explicit approval and this record is intentionally updated.

Do not place tokens, API keys, webhook secrets, or `.env.local` values in this registry. Every deployment requires a clean checkpoint, passing checks, an approved change record, and post-deploy verification.
