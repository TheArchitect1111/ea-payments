# Ops Runbook — July 2026

Quick operational tasks for production readiness after Phase 3.

## 1. Creative Studio + CTP Airtable tables

**Automated (recommended):**

```bash
node scripts/ops-airtable-creative-studio.mjs
node scripts/ops-airtable-ctp-submissions.mjs
```

Or POST `/api/health/setup-schema` with `LAUNCH_SETUP_KEY` (creates both tables).

**Verify:**

```bash
curl https://ea-payments.vercel.app/api/health/launch | jq '.checks.airtableSchema.creativeStudio, .checks.airtableSchema.ctpSubmissions'
```

See also `docs/CTP-SETUP.md` and `docs/CTP-ARCHITECTURE.md`.

## 2. Vercel environment variables

Set in **Vercel → ea-payments → Settings → Environment Variables → Production**:

| Variable | Purpose | Status |
|----------|---------|--------|
| `AIRTABLE_CREATIVE_STUDIO_TABLE` | Table name override (default: `Creative Studio`) | Set if not using default |
| `CREATIVE_STUDIO_PORTAL_SLUG` | Portal slug for internal org publish | e.g. `demo-client` |
| `NEXT_PUBLIC_GLITCHTIP_DSN` | Error monitoring (GlitchTip) | **Required for full monitoring readiness** |
| `UPTIME_KUMA_DASHBOARD_URL` | Ops dashboard link in health checks | **Required for full monitoring readiness** |

`NEXT_PUBLIC_GLITCHTIP_DSN` — GlitchTip project DSN (Sentry-compatible). Guide: `docs/GLITCHTIP-SETUP.md`. Legacy `NEXT_PUBLIC_SENTRY_DSN` still works.

`UPTIME_KUMA_DASHBOARD_URL` — URL to your Uptime Kuma status page (or use `UPTIME_MONITORING_URL`).

After setting vars, **redeploy** Production (Vercel picks up env on next deploy).

## 3. Health check targets

| Endpoint | Expected |
|----------|----------|
| `/api/health/launch` | `ok: true`, `monitoringReady` becomes true after GlitchTip DSN + uptime URL |
| `/api/health/ops` | `ok: true` when monitoring subsystem healthy |
| `/api/health/setup-schema` | `schema.creativeStudio.ok: true` |

## 4. Smoke test Creative Studio

1. Open `/admin/creative-studio`
2. Create a campaign → confirm it survives a page refresh (Airtable persistence)
3. Add media at `/admin/creative-studio/media`
4. Set logo URL on `/admin/creative-studio/brand`
