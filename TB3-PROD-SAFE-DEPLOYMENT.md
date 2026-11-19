# TB3 Production based OAuth diagnostic release plan

Base: Production commit `4c4ef1418c3d395009f3b0a16812bba8a161fa3e`.

## Exact code manifest

- `app/api/tb3/paypal/oauth-diagnostic/route.ts`
- `lib/tb3/paypal-oauth-config.ts`
- `lib/tb3/paypal-oauth-diagnostic.ts`
- `lib/tb3/paypal-oauth-token.ts`
- `tests/tb3-paypal-oauth-diagnostic.test.mts`

Only these five implementation/test files are ported from the diagnostic source. This production based change does not include storefront, checkout, HQ, or platform source changes.

## Deployment procedure

1. Review and approve the exact commit from this production based branch. Deploy it to a Vercel Preview first and verify the diagnostic route is unavailable while its flag is unset, unauthorized requests are rejected before provider access, and non-Production environments are blocked.
2. Obtain separate approval for Production deployment to the existing `ea-payments` project. Keep `TB3_PAYPAL_OAUTH_DIAGNOSTIC_ENABLED` unset and `TB3_PAYPAL_ENABLED` false/unset. Do not change Production variables during code deployment.
3. Verify the deployed commit and that storefront behavior, HQ authorization, and checkout state match the existing Production baseline.
4. Obtain separate approval to set `TB3_PAYPAL_OAUTH_DIAGNOSTIC_ENABLED=true` temporarily. Call once with an authorized `admin:manage` session. Retain only sanitized status, HTTP status, and fixed category, then disable/remove the flag.
5. Confirm checkout remains disabled and no transaction or fulfillment occurred.

## Rollback

Disable or remove the diagnostic flag if enabled, then use Vercel's approved rollback procedure to restore the exact prior Production deployment recorded immediately before release. Confirm the diagnostic route is disabled/unavailable and checkout remains disabled. Do not alter credentials or ledger data during rollback.

## Evidence limits

Local mocked OAuth tests, tenant safety, and a Production build passed. Repository-wide TypeScript exited 2 due errors outside this port. No Production OAuth request, deployment, setting change, or financial action occurred.
