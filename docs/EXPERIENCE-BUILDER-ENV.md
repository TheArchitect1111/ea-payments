# Experience Builder — Environment Setup

Required configuration for local development and staging validation of the Experience Builder (RC1).

## Minimum (local validation without Airtable)

When `AIRTABLE_API_KEY` is unset and you run `npm run dev`, the platform uses an **approved local demo fallback** for `demo-client` only:

- Portal login via shared demo credentials
- Creative Studio / experience pages in **in-memory** storage (lost on server restart)

```env
# Session signing — dev fallback works when SESSION_SECRET is empty under `next dev`
SESSION_SECRET=

# Do not set VERCEL_ENV=production in .env.local for local work unless SESSION_SECRET is set.
# (The app auto-handles empty SESSION_SECRET under next dev.)

# Optional — override demo credentials
DEMO_CLIENT_EMAIL=demo@efficiencyarchitects.online
DEMO_CLIENT_PASSWORD=DemoPulse2026!
```

Start dev server:

```bash
npm run dev -- --port 3456
```

Run validation:

```bash
node scripts/validate-experience-builder-rc1.mjs http://localhost:3456
```

## Recommended (persistent data + production parity)

Add to `.env.local` (see `.env.example` for full platform list):

```env
# Portal auth + client records
AIRTABLE_API_KEY=pat_...
AIRTABLE_PAYMENTS_BASE_ID=appv0YoLIMY45fmDA

# Creative Studio — experience page persistence
AIRTABLE_CREATIVE_STUDIO_TABLE=Creative Studio
CREATIVE_STUDIO_PORTAL_SLUG=demo-client

# Session signing (required for staging/production)
SESSION_SECRET=your-64-char-hex-secret-here
```

Create the Creative Studio table (includes `Experience` record type). See [CREATIVE-STUDIO-SETUP.md](./CREATIVE-STUDIO-SETUP.md).

## Variable reference

| Variable | Required | Purpose |
|----------|----------|---------|
| `SESSION_SECRET` | Staging/prod | Signs `ea_portal_session` cookie |
| `AIRTABLE_API_KEY` | Staging/prod | Portal login, client records, Creative Studio |
| `AIRTABLE_PAYMENTS_BASE_ID` | With Airtable | Payments base containing Client Records |
| `AIRTABLE_CREATIVE_STUDIO_TABLE` | With Airtable | Experience page JSON storage (default: `Creative Studio`) |
| `CREATIVE_STUDIO_PORTAL_SLUG` | Optional | Maps internal org to portal slug for publish |
| `DEMO_CLIENT_EMAIL` | Optional | Demo login email (default: `demo@efficiencyarchitects.online`) |
| `DEMO_CLIENT_PASSWORD` | Optional | Demo login password |

## Routes to verify (no 404)

| Route | Auth |
|-------|------|
| `/portal/{slug}/experience-builder` | Portal session + `landing` module |
| `/portal/{slug}/experience-builder/{pageId}` | Portal session + `landing` module |
| `/preview/experience/{slug}/{pageId}` | Public |
| `GET/POST /api/portal/experience-pages` | Portal session |
| `GET/PUT /api/portal/experience-pages/{pageId}` | Portal session |
| `POST /api/portal/experience-pages/{pageId}/publish` | Portal session |

## Verify persistence

1. Sign in at `/portal/login` (demo account or magic link).
2. Create an experience at `/portal/demo-client/experience-builder`.
3. Edit and wait for "Saved" in the Puck header.
4. Reload the editor — content should match.
5. With Airtable configured, restart the dev server and reload — content should still load.

## Staging deploy

Experience Builder ships with the `ea-payments` app. Deploy the branch containing:

- `app/portal/[slug]/experience-builder/**`
- `app/preview/experience/**`
- `app/api/portal/experience-pages/**`
- `lib/experience-builder/**`
- `lib/creative-studio/persistence.ts` (experience record type)
- `@measured/puck` dependency

After deploy, re-run:

```bash
node scripts/validate-experience-builder-rc1.mjs https://<staging-url>
```
