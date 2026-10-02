# Feature Specification: Amanda Kit Checkout Through Domain Rewrite

**Request:** Make Amanda’s public practitioner kit checkout work from the canonical production domain.
**Project/tenant:** Amanda Catherine
**Owner:** Amanda Catherine
**Status:** Implemented, pending production verification

## Intent

Allow the browser origin `https://amandacatherine.ca` through the backend checkout endpoint when the domain router rewrites the request to the shared `ea-payments` deployment. Keep cross-site origins rejected and keep Stripe return URLs on the canonical Amanda domain.

## Scope

### In scope
- Validate either the exact request origin or the exact Amanda production origin.
- Use the validated browser origin for Stripe success and cancel URLs.
- Cover proxy and untrusted-origin cases in the Amanda practitioner-kit checkout test.

### Out of scope
- Payment provider changes, cart behavior, pricing, fulfillment rules, or shipping options.
- Accepting arbitrary forwarded hosts or arbitrary cross-origin requests.

## Source of truth

- `app/api/public/amanda/practitioner-kit/checkout/route.ts`
- `scripts/test-amanda-practitioner-kit.mts`
- `SECURITY-MODEL.md`
- Vercel custom-domain router for `amandacatherine.ca`

## Protected invariants

- Untrusted request origins remain rejected.
- Price, currency, and kit identity remain server-owned.
- Stripe checkout remains hosted by Stripe; this change does not collect card data on Amanda’s site.
- Amanda tenant metadata and existing fulfillment behavior remain unchanged.

## Acceptance criteria

1. A same-origin preview request still creates a hosted checkout session.
2. A request routed from the Amanda production domain through `ea-payments.vercel.app` creates a hosted checkout session.
3. Success and cancel URLs for that proxied request use `https://amandacatherine.ca`.
4. An untrusted origin still receives HTTP 403.
5. The existing Amanda checkout test suite passes and the production browser reaches Stripe checkout without making a charge.

## Verification plan

- Repository check: `npm run test:amanda-checkout`
- Route test: same-origin, exact canonical Amanda origin through the Vercel rewrite, untrusted origin.
- Production: open the kit page on `https://amandacatherine.ca`, select shipping or pickup, continue to Stripe, and stop before payment.

## Rollback condition

Rollback if the route accepts any origin outside the exact request origin and the exact Amanda production origin, or if Stripe return URLs point to an unexpected host.

## Completion evidence

Record the merged commit, deployment ID, production checkout URL reached, and test results before marking VERIFIED.