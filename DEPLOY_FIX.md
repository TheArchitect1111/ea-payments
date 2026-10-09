# Universal HQ deployment fix log

Recorded: 2026-10-09
Target: `https://www.tb3.online`
Repository: `TheArchitect1111/ea-payments`
Production branch: `master` (GitHub default branch; there is no `main` branch)

## Deployment attempts

1. Requested Vercel CLI command: `vercel --prod --scope efficiency-architects`
   - Result: exit 127, `/bin/bash: line 1: vercel: command not found`.
   - Fix needed: the CLI must be installed and authenticated to the correct Vercel team before this path can run.
2. Git-connected preview deployment for commit `594565a2d8e5b81184c6cc7a1d2457d1f47841ca`.
   - Result: Vercel deployment reached `READY` at `ea-payments-6zzcab45b-the-architects-projects-cc813778.vercel.app`.
   - Production was not promoted by this preview.
   - The `EA Amplifi Auto Gate` workflow failed at `Require explicit Amplifi production candidate` with `Not an Amplifi production candidate. Stop safely.` That guard is scoped to Amplifi and is not a Universal HQ promotion path.
3. Vercel API deployment-list request for `ea-payments` under team `team_s7mlAoJkDCQYaXiSC8nY`.
   - Result: HTTP 403, `Not authorized: Trying to access resource under scope "team_s7mlAoJkDCQYaXiSC8nY". You must re-authenticate to this scope or use a token with access to this scope.`
   - Fix needed: grant the Vercel connection access to that team, or provide an authenticated Vercel CLI/token with deployment permission for the team.
4. Direct Vercel deployment API attempt using the Git source payload.
   - Result: tool validation rejected `requestBody.gitSource` as invalid; no deployment was created.
   - Fix needed: use the Vercel Git deployment schema or a valid authenticated CLI/Dashboard deployment path.

## Production baseline observed before the Universal HQ promotion

- `/hq`: HTTP 200, but the response was the existing TB3 page and did not contain `My Projects HQ` or `Add New Project`.
- `/client/tb3`: HTTP 404.
- `/client/amanda`: HTTP 404.
- `/images/tb3-film/scoreboard.jpg`: HTTP 200.
- `/images/tb3-film/scoreboard.webp`: HTTP 200.
- `/`: HTTP 200 and TB3 content present.
- 390px phone viewport: not yet verified.

No Universal HQ production deployment has been confirmed. Do not treat the READY preview as production proof.
