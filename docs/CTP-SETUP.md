# CTP Submissions — Production Setup

## Create the Airtable table

**Option A — setup API (after deploy):**

```bash
curl -X POST -H "x-launch-setup-key: $LAUNCH_SETUP_KEY" \
  https://ea-payments.vercel.app/api/health/setup-schema
```

Check `schema.ctpSubmissions.ok` and `setup.ctpSubmissions` in the response.

**Option B — local script:**

```bash
node scripts/ops-airtable-ctp-submissions.mjs
```

Requires `AIRTABLE_API_KEY` in `.env.local`.

## Environment

```env
AIRTABLE_CTP_SUBMISSIONS_TABLE=CTP Submissions
ARCHITECT_PORTAL_SLUGS=demo-client
ARCHITECT_EMAILS=freedom@efficiencyarchitects.online
```

## Verify

```bash
curl https://ea-payments.vercel.app/api/health/launch | jq '.checks.airtableSchema.ctpSubmissions'
```

Complete a Discover submission at `/ctp-intake` — confirm a row appears in **CTP Submissions** with `Payload JSON` containing discovery answers.

## Architecture

See `docs/CTP-ARCHITECTURE.md` for full system design and verification checklist.
