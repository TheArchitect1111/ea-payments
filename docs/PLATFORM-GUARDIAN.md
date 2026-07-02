# Platform Guardian™

AI Operations agent for the EA platform. Extends Launch Command Center and Mission Control — does not replace them.

## Components

| Piece | Path |
|-------|------|
| Ops health API | `GET /api/health/ops` |
| Platform Guardian agent | `lib/agents/platform-guardian-agent.ts` |
| Audit engine | `lib/platform-guardian.ts`, `lib/platform-ops.ts` |
| Nightly cron | `GET /api/cron/platform-guardian` (Vercel Cron `0 6 * * *`) |

## Environment variables

```bash
# Required for cron auth on Vercel Production
CRON_SECRET=your-random-secret

# Optional — recipient for daily brief (defaults to ADMIN_NOTIFICATION_EMAIL)
PLATFORM_GUARDIAN_EMAIL=freedom@efficiencyarchitects.online

# Set false to run audit without email on cron
PLATFORM_GUARDIAN_CRON_EMAIL=true

# Set true to HTTP-probe critical routes during audit (slower)
PLATFORM_GUARDIAN_PROBE_ROUTES=false

# Existing ops gates (see launch-readiness)
NEXT_PUBLIC_SENTRY_DSN=
UPTIME_KUMA_DASHBOARD_URL=
BACKUP_DESTINATION_URI=
```

## CLI

```bash
npm run ops:report
npm run backup:verify
LAUNCH_BASE_URL=https://ea-payments.vercel.app npm run ops:report
```

## Invoke agent

Mission Control lists **platform-guardian** in Active AI Agents. Ops health: `/api/health/ops`.

For a daily brief with email: set `RESEND_API_KEY` + `RESEND_FROM_EMAIL`, then trigger cron or pass `sendDailyBrief: true` in agent context.

## Rollback

1. Remove `crons` entry from `vercel.json`
2. Unset `CRON_SECRET` on Vercel
3. Revert agent registration in `lib/agents/registry.ts` if needed
