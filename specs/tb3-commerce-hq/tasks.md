# Tasks: TB3 Canonical Printful Catalog

## Preparation
- [x] T001 Confirm existing commerce worktree, branch, current HEAD, client identity, and clean status.
- [x] T002 Read constitution, security model, and existing TB3 commerce specification.
- [x] T003 Compare the preserved 14/82 Printful manifest with the checkout mapping and verify source artwork files.
- [x] T004 Record Coming Soon, disabled payment/fulfillment, no credentials, and no production changes as invariants.

## Implementation
- [x] T010 Restore exact referenced mockup artwork from the preserved Printful asset ref.
- [x] T011 Make the canonical Printful mapping the only catalog source for storefront, booking, checkout, and HQ.
- [x] T012 Preserve all 14 products and 82 variants without adding IDs or SKUs.
- [x] T013 Mark live fulfillment verification pending and reject purchases until a product mapping is verified.
- [x] T014 Enrich HQ order item rendering from the canonical catalog while preserving historical fallback data.
- [x] T015 Allow the exact isolated codex Preview branch in the existing Printful and sandbox-ledger diagnostic guards without widening branch scope or changing auth/database protections.

## Verification
- [x] T020 Run catalog and asset-contract tests.
- [x] T021 Run focused PayPal/Printful integration regression tests using isolated fixtures.
- [x] T022 Run TB3 Playwright browser checks for products/artwork/Coming Soon/checkout/access and desktop/mobile layouts.
- [x] T023 Run affected TypeScript/build checks and inspect final diff for unrelated changes.
- [x] T024 Add exact-branch tests for Printful token authorization and read-only ledger/RLS diagnostics; retain Production and other-branch denial tests.

## Completion
- [x] T030 Confirm no environment, credential, database, Vercel, PayPal, or Printful mutations occurred.
- [x] T031 Commit only verified TB3 catalog, code, assets, tests, and specification files on the existing branch.
- [x] T032 Report commit, test evidence, and live Printful checks still requiring authorized provider access.
- [x] T033 Record Preview environment inspection failures and provider/HQ checks that remain blocked by Vercel access, missing local credentials, or unavailable authenticated HQ session.
