# GlitchTip setup (`ea-payments`)

Efficiency Architects standardizes on **GlitchTip** for error and performance monitoring.

GlitchTip speaks the **Sentry protocol**. This app keeps `@sentry/nextjs` and points it at your GlitchTip DSN. No second SDK.

## What is already wired

| Layer | Path |
|-------|------|
| Shared options / scrubbing | `lib/monitoring/` |
| Browser init | `instrumentation-client.ts` |
| Node / Edge init | `sentry.server.config.ts`, `sentry.edge.config.ts` |
| Boot gate | `instrumentation.ts` |
| React boundary | `app/global-error.tsx` |
| Ops capture helper | `lib/ops-error.ts` → `reportOpsError` |
| Launch / Mission Control | `monitoringConfigured()` (Pass 1 id still `sentry` for API stability) |

If GlitchTip is down or the DSN is missing, the app continues normally. Init and capture are wrapped so monitoring never crashes requests.

## Environment variables

Set on **Vercel Production** (and Preview if desired):

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_GLITCHTIP_DSN` | **Yes** (preferred) | GlitchTip project DSN — required for browser + server |
| `GLITCHTIP_DSN` | Optional alias | Server-only; prefer also setting the `NEXT_PUBLIC_` form |
| `APP_ENV` | Recommended | Overrides `VERCEL_ENV` / `NODE_ENV` for event environment |
| `APP_RELEASE` | Recommended | Release label (falls back to `APP_VERSION` then `VERCEL_GIT_COMMIT_SHA`) |
| `APP_VERSION` | Optional | Alias for release when `APP_RELEASE` unset |
| `NEXT_PUBLIC_APP_NAME` | Optional | Tag `application` (default `ea-payments`) |

### Legacy (still accepted)

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_SENTRY_DSN` | Still works if you have not migrated the DSN yet |
| `SENTRY_DSN` | Server-only legacy alias |

Do **not** commit DSN values to git.

## Install / deploy

1. Create or open a GlitchTip project (self-hosted or hosted).
2. Copy the project **DSN** (Sentry-compatible).
3. Vercel → **ea-payments** → Environment Variables:
   - `NEXT_PUBLIC_GLITCHTIP_DSN` = DSN
   - Optionally `APP_ENV=production`, `APP_RELEASE=<git sha or semver>`
4. **Redeploy** Production (public env vars require a new build).
5. Verify:
   - `GET /api/health/launch` → `checks.controls.sentryDsn` / `glitchtipDsn` = `true`
   - Launch Command Center → GlitchTip item **complete**
   - Trigger a safe test error (or use GlitchTip UI) and confirm the event

## Testing locally

Add to `.env.local`:

```bash
NEXT_PUBLIC_GLITCHTIP_DSN=https://<key>@<your-glitchtip-host>/<project>
APP_ENV=development
APP_RELEASE=local-dev
```

Restart `npm run dev`. Prefer a non-production GlitchTip project for local noise.

## Source maps (optional)

GlitchTip can accept Sentry CLI uploads when configured against your instance.

| Variable | Purpose |
|----------|---------|
| `SENTRY_AUTH_TOKEN` | Auth token for your GlitchTip instance |
| `SENTRY_ORG` / `SENTRY_PROJECT` | Org/project slugs |
| `SENTRY_URL` | GlitchTip base URL (not sentry.io) |

`next.config` does not currently wrap `withSentryConfig`. Runtime capture works without source maps; enable upload later if you need file/line mapping in production.

## Adding future EA applications

1. Install `@sentry/nextjs` (or reuse this package’s monitoring helpers).
2. Set `NEXT_PUBLIC_GLITCHTIP_DSN` (+ `APP_ENV` / `APP_RELEASE`).
3. Tag events with `application` / `ea.product` (see `lib/monitoring/options.ts`).
4. Call `reportOpsError` from backend failure paths.
5. Point each product at the **same GlitchTip org**, separate projects if preferred.

Architecture notes for a future **EA Operations Center**: `lib/monitoring/ops-center.ts` (types only — no dashboard yet).

## Viewing errors

Open your GlitchTip UI → Issues. Filter by:

- Environment (`APP_ENV` / `VERCEL_ENV`)
- Release (`APP_RELEASE` / git SHA)
- Tags: `application`, `ea.scope`, `ea.product`

## Security

`beforeSend` scrubs passwords, tokens, Authorization headers, cookies, Stripe-like keys, and oversized payloads. Never log payment card data or secrets in `reportOpsError` extras.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `sentryDsn: false` on `/api/health/launch` | DSN not set or deploy not rebuilt after adding `NEXT_PUBLIC_*` |
| Browser events missing, server events present | Set `NEXT_PUBLIC_GLITCHTIP_DSN` (not only `GLITCHTIP_DSN`) |
| Events go to wrong place | Confirm DSN host is your GlitchTip URL, not `ingest.sentry.io`, unless intentional legacy |
| App errors but monitoring throws | Should not happen — capture is try/catch; check server logs for `[scope]` console errors |

## Related docs

- Former Sentry-only notes: `docs/sentry-setup.md` (redirects here)
- Operator Pass 1: `docs/SIMPLIFI-GOAL-B-OPERATOR.md`
- Launch model: `docs/LAUNCH-READINESS-MODEL.md`
