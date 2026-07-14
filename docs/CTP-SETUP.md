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

# Optional — override vanity portal hosts (comma-separated). Defaults include:
# portal.efficiencyarchitects.online, portal.efficiencyarchitects.app
# EA_PORTAL_HOSTS=portal.efficiencyarchitects.online
# EA_PORTAL_HOST_PROTOCOL=https
```

## Portal vanity host (client URLs)

Code already rewrites `portal.efficiencyarchitects.online/{client}` → `/portal/{client}` (see `lib/ctp-portal-host.ts` + `middleware.ts`). Welcome email, executive email, admin desk, and reveal CTAs use these vanity URLs.

**Attach the domain so production resolves:**

1. **Vercel** → ea-payments → Settings → Domains  
   - Add `portal.efficiencyarchitects.online` (and optional `portal.efficiencyarchitects.app`)  
   - Point both at the **ea-payments** project (not a separate portal app)

2. **DNS** (Namecheap / registrar)  
   - `portal` CNAME → `cname.vercel-dns.com` (or the target Vercel shows)  
   - Wait for Vercel SSL to show **Valid**

3. **Smoke**  
   - `https://portal.efficiencyarchitects.online/login` → portal login  
   - `https://portal.efficiencyarchitects.online/{slug}/ctp` → that client’s CTP overview  
   - Hub paths `/portal/{slug}/ctp` must keep working

4. **Local / preview**  
   - Without the domain attached, emails still *print* vanity URLs; clicks 404 until DNS/Vercel are live  
   - Hub URLs remain the fallback for internal admin links

```bash
node scripts/test-ctp-portal-host.mjs
```

Launch health also probes the vanity host (non-blocking):

```bash
curl https://ea-payments.vercel.app/api/health/launch | jq '.checks.ctp.portalVanityHost'
```

Set `EA_SKIP_PORTAL_HOST_PROBE=1` in local/CI if DNS is not attached yet.

## Verify

```bash
# Acquisition-spine wiring (deploy subset)
npm run test:ctp:spine

# Full CTP suite (all test-ctp-*.mjs)
npm run test:ctp

curl https://ea-payments.vercel.app/api/health/launch | jq '.checks.airtableSchema.ctpSubmissions'
```

`verify:deploy` includes `test:ctp:spine` before Playwright smoke.

Complete a Discover submission at `/ctp-intake` — confirm a row appears in **CTP Submissions** with `Payload JSON` containing discovery answers.

## Architecture

See `docs/CTP-ARCHITECTURE.md` for full system design and verification checklist.
