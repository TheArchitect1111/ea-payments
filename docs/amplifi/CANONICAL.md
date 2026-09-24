# Amplifi Canonical Source

This branch is the single integration source for Amplifi.

## Canonical UI
- `app/amplifi/`

## Canonical Amplifi APIs
- `app/api/amplifi/`
- `app/api/portal/amplifi/`

## Publishing and connections
- `lib/amplifi-publishing-gateway.ts`
- `lib/amplifi-publish.ts`
- `lib/amplifi-native-social.ts`
- `lib/amplifi-connection-store.ts`

## Campaign persistence and analytics
- `lib/amplifi-portfolio-persistence.ts`
- `lib/creative-studio/campaign-analytics.ts`
- `app/r/amplifi/[campaignId]/[assetId]/route.ts`

## Rule
New Amplifi work must integrate here first. Older `agent/amplifi-*`, `feat/amplifi-*`, and `feature/amplifi-*` branches are historical/reference branches until their unique changes are audited and deliberately merged.

Do not delete historical branches until parity is verified.
