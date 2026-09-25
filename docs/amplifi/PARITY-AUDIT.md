# Amplifi Branch Parity Audit

Canonical integration branch: `canonical/amplifi-20260924`

## Run 1 verification

Verified against the three historical Amplifi branches before release-candidate freeze.

### Analytics and attribution
Canonical contains the required analytics implementation and contract:
- `lib/creative-studio/campaign-analytics.ts`
- `app/r/amplifi/[campaignId]/[assetId]/route.ts`
- `app/api/creative-studio/campaigns/[id]/analytics/route.ts`
- `scripts/test-amplifi-analytics.mjs`

The analytics API and test contract are byte-identical to the historical analytics branch. Other canonical analytics files have newer content and must not be replaced by the older branch.

### Approval and scheduling
Canonical contains:
- `lib/creative-studio/campaign-workflow.ts`
- `lib/creative-studio/campaign-scheduler.ts`
- `app/api/cron/amplifi-publish/route.ts`
- `scripts/test-amplifi-approval-scheduling-phase5.mjs`
- publishing lifecycle, media validation, campaign workflow and scheduling support

Core workflow, scheduler and cron files are byte-identical to the historical phase-5 branch. Canonical publishing/test files contain later revisions and must not be replaced wholesale.

### Durable social connections
Canonical contains:
- `lib/amplifi-connection-store.ts`
- `supabase/migrations/011_amplifi_social_connections.sql`
- `scripts/test-amplifi-durable-connections.mjs`

Canonical uses the newer connection-store implementation. Do not merge the historical durable-connections branch wholesale.

## Branch comparison warning
The historical branches remain numerically ahead because they diverged hundreds of commits ago. Ahead/behind counts are not a safe merge instruction. Required Amplifi capabilities were verified at the file/capability level on canonical.

## Run 1 decision
- Do not merge historical branches wholesale.
- Preserve the newer canonical publishing gateway.
- Freeze this branch as the Amplifi release candidate.
- Build and visual gates must pass on the exact candidate deployment.
- After those gates pass, proceed to Run 2: real-account E2E lifecycle certification.
