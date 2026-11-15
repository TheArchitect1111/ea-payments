# Implementation Plan: TB3 Canonical Printful Catalog

## Constitution check

- Approved source and exact 14/82 mapping source verified locally.
- Protected invariants: Coming Soon, disabled checkout/Printful, no invented provider identifiers, tenant/auth protections, unrelated work untouched.
- Rollback: revert only this local commit on the existing TB3 commerce branch; no production deployment occurs.
- Production verification remains explicitly out of scope.
- Visual verification uses existing exact Printful mockups and browser asset requests.

## Architecture

Use the preserved Printful mapping as the single public JSON source. Import it through a client-safe shared catalog module in storefront, booking, checkout, cart validation, and HQ report enrichment. Restore only artwork files whose exact paths and PNG bytes are present in the preserved local Git ref. Store fulfillment verification as false until live provider data is checked. The production cart resolver must require both an available product and verified mapping; test-only provider fixtures may exercise the existing ID map without changing canonical readiness. Do not send fabricated SKU values to PayPal.

## Execution sequence

1. Confirm branch/worktree status and exact manifest/asset provenance.
2. Update this specification, plan, and tasks before implementation.
3. Restore the verified mockup files and converge the canonical manifest.
4. Replace duplicate imports with the shared catalog module; make cart and HQ read through it.
5. Add fail-closed verification gating without changing PayPal or Printful production settings.
6. Run focused catalog/integration tests, Playwright browser tests, and affected build checks.
7. Review the diff for unrelated files and commit only verified TB3 changes locally.

## Risk and rollback

- Risks: catalog display changes to match the pre-existing mapped Printful collection; import/asset regressions; tests that assumed unverified products could be purchased.
- Rollback trigger: loss of Coming Soon or checkout blocking, identifier/price drift, missing artwork, or access-control regression.
- Rollback: revert the local commit only; do not switch branches or touch production.

## Production proof

Not authorized in this task. Preview deployment, live store verification, and actual provider availability remain separate gates.
