# Full Launch Manual Setup

These items require account access or a business decision. The repo is ready to accept the values once they exist.

## Monitoring Setup

### Sentry

Required value:

- `NEXT_PUBLIC_SENTRY_DSN`

Steps:

1. Create or open the Sentry project for `ea-payments`.
2. Copy the browser/client DSN.
3. Add it to Vercel Production as `NEXT_PUBLIC_SENTRY_DSN`.
4. Redeploy production.
5. Trigger a safe test event.
6. Confirm event appears in Sentry.

Acceptance:

- `/api/health/launch` reports monitoring missing list no longer includes `NEXT_PUBLIC_SENTRY_DSN`.

### Uptime

Required value:

- `UPTIME_KUMA_DASHBOARD_URL` or `UPTIME_MONITORING_URL`

Minimum monitors:

- `/`
- `/start`
- `/simplifi/capture`
- `/simplifi/workspace`
- `/consider/selena`
- `/api/health/launch`
- `/checkout`

Acceptance:

- Dashboard URL is set in Vercel Production.
- `/api/health/launch` reports uptime dashboard configured.

## Backup Destination

Required value:

- `BACKUP_DESTINATION_URI`

Recommended backup scope:

- Airtable schema snapshots.
- Capture Records export.
- Client Records export.
- Proposals export.
- Assessments export.
- Operational docs.

Acceptance:

- Backup destination is provisioned.
- URI is stored in Vercel Production.
- Operator can explain where recovery data lives.

## DNS

Optional value:

- `app.simplifi.ai`

Steps:

1. Add `app.simplifi.ai` to the Vercel project domains.
2. Add CNAME in DNS provider to `cname.vercel-dns.com`.
3. Wait for SSL.
4. Confirm root redirects to `/simplifi/workspace`.
5. Confirm `/capture` maps to `/simplifi/capture`.

Acceptance:

- `https://app.simplifi.ai` opens the Simplifi workspace shell.

## Setup Key Cleanup

Manual cleanup:

- Remove `LAUNCH_SETUP_KEY` from Vercel Production after schema setup is complete.

Acceptance:

- `/api/health/setup-schema` returns 401 without a setup key.
- `/api/health/launch` remains healthy.

## eSignatures Templates

Required values when document automation is finalized:

- `ESIGNATURES_MSA_TEMPLATE_ID`
- `ESIGNATURES_SOW_TEMPLATE_ID`

Steps:

1. Upload final MSA and SOW templates to eSignatures.
2. Copy template IDs.
3. Add to Vercel Production.
4. Trigger a dry-run or controlled onboarding path.
5. Confirm callback route receives signed events.

Acceptance:

- Onboarding can request documents without manual document assembly.

## Business Decisions Needed

- Approve public/private link rules in `docs/SHARE-ACCESS-ANALYTICS-POLICY.md`.
- Approve demo library subjects in `docs/DEMO-LIBRARY.md`.
- Assign named owners for support, monitoring, triage, and client success.
- Decide whether Magnifi public links should move from public-by-link to portal-protected for sensitive captures.
