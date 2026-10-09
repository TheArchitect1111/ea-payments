# Universal HQ deployment fix log

Recorded: 2026-10-09
Target: `https://www.tb3.online`
Repository: `TheArchitect1111/ea-payments`
Vercel project: `ea-payments`
GitHub default branch: `master` (there is no `main` branch)

## Deployment attempts and result

1. Requested Vercel CLI command: `vercel --prod --scope efficiency-architects`
   - Result: exit 127, `/bin/bash: line 1: vercel: command not found`.
2. Git-connected preview deployments for the HQ work.
   - Result: preview builds reached READY and verified the HQ, client routes, and scoreboard assets.
   - Preview deployments do not assign the production domains until promoted.
3. Vercel API deployment-list and promote requests for project `prj_u7zQF9j7rXg9vgogJwDNxW2SxJtW` under team `team_s7mlAoJkDCQYaXiSC8nY`.
   - Result: HTTP 403, `Not authorized: Trying to access resource under scope "team_s7mlAoJkDCQYaXiSC8nY". You must re-authenticate to this scope or use a token with access to this scope.`
   - Fix needed for future API/CLI deploys: grant the Vercel connection or token access to team `team_s7mlAoJkDCQYaXiSC8nY`. Re-authentication without team access will not fix this.
4. Direct Vercel deployment API attempt.
   - Result: first request rejected an invalid `gitSource` payload; retry with the documented Git source schema returned the same team-scope HTTP 403.
5. GitHub Actions EA Production Gate, run #24 (`37903554529`) for master SHA `caa31742088a6c0b371a08f80712ae36bdcf4a14`.
   - Result: dependency install, client-protection contract gate, and Next.js production build passed. The TB3 host-routing regression step failed at `tb3.online/` with `AssertionError: tb3.online/ missing SLOT_TB3_MASK`. The workflow stopped before the desktop/mobile preview gates and production manifest commit.
   - Cause: the current master tree does not contain the TB3 production placeholder page expected by this test.
6. Vercel Dashboard production promotion.
   - Result: succeeded. Promoted the production-candidate preview, Vercel created a new deployment using the production environment, and the deployment reached Ready.
   - Production deployment: `dpl_274aTEhBbS4jHZWCp6XRcd5s8eyL`
   - Source commit: `f4a03d9e5b12b96888ea49c9aa948faa386ddb43`
   - This candidate was based on the existing production tree to preserve the live TB3/Tarris homepage and scoreboard assets.
7. Local `curl -I` verification could not connect to the configured browser-proxy port (`curl: (7) Failed to connect to browser-proxy port 8889`). Production route and asset checks were instead completed with Vercel's production URL fetch.

## Production verification

- `/hq`: HTTP 200. Body contains `My Projects HQ`, `Add New Project`, and `Film 5 Vault`; matched route is `/hq`.
- `/client/tb3`: HTTP 200.
- `/client/amanda`: HTTP 200.
- `/images/tb3-film/scoreboard.jpg`: HTTP 200, `image/jpeg`.
- `/images/tb3-film/scoreboard.webp`: HTTP 200, `image/webp`.
- `/`: HTTP 200 and rewritten to the existing `/tarris` page. It does not contain the requested Drive/Defense/Putback lineup. That homepage was not edited under the explicit no-homepage-edit constraint.
- `/hq` rendered at a 390px viewport: not verified. The code uses 80px minimum-height controls and a 448px maximum-width panel, but no live 390px screenshot was available.
- Vercel dashboard reports the production deployment Ready with production domains assigned.

## Follow-up

- The Vercel API fix needed for future programmatic deploys is team access for the connection/token noted above.
- The requested homepage lineup and a rendered 390px verification remain open; do not record those two checks as passed.
