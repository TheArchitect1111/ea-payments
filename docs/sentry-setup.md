# Sentry setup (`ea-payments`)

Sentry is wired in code and **activates only when a DSN is set**.

## Vercel environment variables

Set in **Production** (and Preview if desired):

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SENTRY_DSN` | Yes | From Sentry project → Settings → Client Keys (DSN) |

Optional:

| Variable | Purpose |
|----------|---------|
| `SENTRY_AUTH_TOKEN` | Source map upload in CI (optional) |
| `SENTRY_ORG` / `SENTRY_PROJECT` | Required only if using source map upload |

## Verify

1. Add DSN in Vercel Production.
2. Redeploy.
3. Trigger a test error in a non-customer route or use Sentry's "Send test event" after first deploy.
4. Confirm events appear in Sentry dashboard.

CTP / PraisonAI failures also call `lib/ops-error.ts` → `Sentry.captureException` when the DSN is set.

Acceptance:

- `/api/health/launch` → `checks.controls.sentryDsn` = true
- Launch Command Center → Sentry item = complete

## References

- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry React](https://docs.sentry.io/platforms/javascript/guides/react/)
- Manual checklist: `docs/FULL-LAUNCH-MANUAL-SETUP.md`
