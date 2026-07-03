# Ops Runbook — July 2026

Quick operational tasks for production readiness after Phase 3.

## 1. Creative Studio Airtable table

**Automated (recommended):**

```bash
node scripts/ops-airtable-creative-studio.mjs
```

Requires `AIRTABLE_API_KEY` (or `AIRTABLE_PAT`) in `.env.local`. Creates the **Creative Studio** table and fields in the Payments base.

**Via deployed API** (after merge + deploy):

```bash
curl -X POST -H "x-launch-setup-key: $LAUNCH_SETUP_KEY" \
  https://ea-payments.vercel.app/api/health/setup-schema
```

Check `schema.creativeStudio.ok` and `setup.creativeStudio` in the response.

**Verify on launch health:**

```bash
curl https://ea-payments.vercel.app/api/health/launch | jq '.checks.airtableSchema.creativeStudio'
```

## 2. Vercel environment variables

Set in **Vercel → ea-payments → Settings → Environment Variables → Production**:

| Variable | Purpose | Status |
|----------|---------|--------|
| `AIRTABLE_CREATIVE_STUDIO_TABLE` | Table name override (default: `Creative Studio`) | Set if not using default |
| `CREATIVE_STUDIO_PORTAL_SLUG` | Portal slug for internal org publish | e.g. `demo-client` |
| `NEXT_PUBLIC_SENTRY_DSN` | Error monitoring | **Required for full monitoring readiness** |
| `UPTIME_KUMA_DASHBOARD_URL` | Ops dashboard link in health checks | **Required for full monitoring readiness** |

`NEXT_PUBLIC_SENTRY_DSN` — create a Sentry project for `ea-payments`, copy the DSN from **Settings → Client Keys (DSN)**.

`UPTIME_KUMA_DASHBOARD_URL` — URL to your Uptime Kuma status page (or use `UPTIME_MONITORING_URL`).

After setting vars, **redeploy** Production (Vercel picks up env on next deploy).

## 3. Health check targets

| Endpoint | Expected |
|----------|----------|
| `/api/health/launch` | `ok: true`, `monitoringReady` becomes true after Sentry + uptime URL |
| `/api/health/ops` | `ok: true` when monitoring subsystem healthy |
| `/api/health/setup-schema` | `schema.creativeStudio.ok: true` |

## 4. Smoke test Creative Studio

1. Open `/admin/creative-studio`
2. Create a campaign → confirm it survives a page refresh (Airtable persistence)
3. Add media at `/admin/creative-studio/media`
4. Set logo URL on `/admin/creative-studio/brand`
