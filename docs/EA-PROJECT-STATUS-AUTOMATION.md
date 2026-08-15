# EA Project Status Automation

Phase 7 adds one registry and two scheduled verification paths for all 17 active EA projects.

## What is checked separately

- GitHub repository reachability and archive state
- Vercel project and latest production deployment state
- Public URL response
- Expected page identity marker
- Known ownership or source conflicts that require a human decision

A Vercel `READY` state or HTTP 200 alone cannot produce a green result.

## Schedules

- Vercel calls `/api/cron/project-status` daily at 10:30 UTC.
- GitHub Actions runs `.github/workflows/ea-project-status.yml` daily at 10:15 UTC and stores JSON and Markdown artifacts for 30 days.

## Required credentials

Set these without placing their values in the repository:

- Vercel Production: `EA_STATUS_GITHUB_TOKEN`, `EA_STATUS_VERCEL_TOKEN`, and existing `CRON_SECRET`
- Optional Vercel Production: `EA_STATUS_EMAIL`, `EA_STATUS_SECRET`, `EA_STATUS_PUBLIC=false`
- GitHub Actions secrets: `EA_STATUS_GITHUB_TOKEN`, `EA_STATUS_VERCEL_TOKEN`
- GitHub Actions variable: `EA_STATUS_VERCEL_TEAM_ID=team_s7mlAoJkDCQYaXiSC8nYDNIX`

The GitHub token must be able to read the private EA repositories. The Vercel token needs read access to the EA team only.

## Manual checks

```bash
node scripts/test-ea-project-status.mjs
node scripts/run-ea-project-status.mjs
```

The protected live endpoint is `/api/health/projects`. Send `Authorization: Bearer <EA_STATUS_SECRET or CRON_SECRET>` unless `EA_STATUS_PUBLIC=true` is deliberately configured.
