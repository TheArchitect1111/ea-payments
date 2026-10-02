# Tasks: Amanda Kit Checkout Through Domain Rewrite

## Preparation

- [x] T001 Confirm the canonical Amanda domain and production source.
- [x] T002 Read the project constitution and security model.
- [x] T003 Define accepted origins, protected invariants, and rollback conditions.

## Implementation

- [x] T010 Allow the exact Amanda canonical origin when a Vercel rewrite changes the request URL origin.
- [x] T011 Add proxy-origin and untrusted-origin regression assertions.
- [x] T012 Preserve existing pricing, currency, metadata, and fulfillment checks.

## Production verification

- [ ] T020 Confirm Vercel preview build and checks pass.
- [ ] T021 Confirm live browser reaches Stripe hosted checkout.
- [ ] T022 Confirm success/cancel paths remain on `amandacatherine.ca`.
- [ ] T023 Record deployment and evidence.

## Convergence

- [ ] T030 Fix and re-verify any failed acceptance criterion.
- [ ] T031 Complete only when production browser evidence passes.

## Completion

- [ ] T040 Confirm no unresolved checkout regression remains.