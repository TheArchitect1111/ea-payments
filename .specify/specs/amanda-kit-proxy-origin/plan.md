# Implementation Plan: Amanda Kit Checkout Through Domain Rewrite

## Constitution check

- Approved intent: live customer audit identified checkout rejection on Amanda’s canonical production domain.
- Source of truth: the checkout route and current canonical Vercel domain.
- Security boundary: exact origin comparison remains; one exact approved production origin is added for the external Vercel rewrite.
- Rollback: revert the route and test changes if the exact-origin contract fails.
- Production proof: browser must reach Stripe hosted checkout without submitting payment.
- Visual checks: the existing kit page remains unchanged.

## Architecture

The Amanda domain router rewrites requests to the shared `ea-payments` Vercel deployment. The browser’s Origin header is therefore the Amanda canonical domain while the backend request URL may use the shared deployment origin. Accept only either the exact request URL origin or `https://amandacatherine.ca`; use that validated origin for Stripe return URLs.

## Execution sequence

1. Inspect current production failure and authoritative checkout route.
2. Add the exact canonical Amanda origin alongside same-origin requests.
3. Extend the checkout regression test and run it from the checkout test script.
4. Run Vercel preview build and inspect the diff.
5. Merge only after checks pass.
6. Verify the production kit purchase flow through Stripe’s hosted checkout, stopping before payment.

## Risk and rollback

- Primary risk: an overly broad origin allowance could weaken CSRF protection.
- Mitigation: compare against an exact fixed origin; preserve 403 behavior for all other origins.
- Rollback trigger: the route accepts an untrusted origin or Stripe return URLs use an unexpected host.
- Rollback method: revert the merge commit and redeploy the previous production version.

## Production proof

Record preview check results, the production deployment ID, final browser URL, and direct checkout result.