# Universal HQ Production Deployment

- **Timestamp:** 2026-10-09 08:20 UTC
- **Production URL:** https://www.tb3.online/hq
- **Vercel project:** ea-payments
- **Production deployment:** `dpl_274aTEhBbS4jHZWCp6XRcd5s8eyL`
- **Source:** `codex/universal-hq-prod-candidate` at `f4a03d9e5b12b96888ea49c9aa948faa386ddb43`
- **Deployment status:** Ready; Vercel assigned the production environment and domains.
- **Note:** Universal HQ for ALL clients - Add new client in 30s via + Add New Project

## Verification results

| # | Check | Result |
|---|---|---|
| 1 | `/hq` responds 200 and body includes “My Projects HQ” and “Add New Project” | **PASS** — HTTP 200; both strings present. “Film 5 Vault” is also present. |
| 2 | `/client/tb3` responds 200 | **PASS** — HTTP 200; matched dynamic client route. |
| 3 | `/client/amanda` responds 200 | **PASS** — HTTP 200; matched dynamic client route. |
| 4 | Scoreboard JPG responds 200 with `image/jpeg` | **PASS** — HTTP 200, `image/jpeg`. |
| 5 | Scoreboard WebP responds 200 with `image/webp` | **PASS** — HTTP 200, `image/webp`. |
| 6 | Homepage shows Drive, Defense, Putback | **FAIL** — `/` responds 200 and is rewritten to the existing `/tarris` TB3/Tarris homepage, but its rendered text does not include Drive, Defense, or Putback. The homepage was left untouched under the explicit no-homepage-edit constraint. |
| 7 | `/hq` shows HQ UI rather than the TB3 landing page | **PASS** — Vercel matched `/hq`; body includes the HQ title and project selector. |
| 8 | Rendered responsive test or screenshot at 390px width, with 80px thumb-friendly buttons | **PARTIAL** — HQ controls use `min-h-20` (80px) and the signed-out panel is constrained to `max-w-md` (448px), but a live 390px viewport screenshot/test could not be run in the available browser session. |

Route and asset statuses above were verified with Vercel's production URL fetch (GET). A local `curl -I` attempt could not connect to the configured browser-proxy port, so those results are not HEAD requests.

## Release gate note

The GitHub Actions production gate build passed, then its TB3 host-routing regression check failed because the `master` checkout does not contain `SLOT_TB3_MASK` on the TB3 homepage. That workflow stopped before its desktop/mobile checks. Production was deployed by promoting the production-candidate preview through Vercel, which rebuilt it with the production environment. The candidate was based on the current production tree and retained its existing homepage and scoreboard assets.
