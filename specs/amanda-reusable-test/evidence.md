# Verification evidence — November 3, 2026

## Implemented
One Wood Therapy button, dedicated CAD $1 Stripe TEST session, per-student email, verified fulfillment and secure password setup. Legacy URL redirects to working test page. Prior route protection restored from 8cc2c4cf.

## Checks
- New reusable-flow tests: 4/4 pass (mocked Stripe/email/storage transports).
- Existing Amanda dollar-flow tests: 6/6 pass.
- Tenant safety: pass.
- Production build: pass.
- Checkout configuration: pass.
- Function trace sizes: pass.
- Full TypeScript: 377 diagnostics across baseline repository; not a pass. Existing optional grant diagnostic in affected access file corrected.
- Existing practitioner-kit script: fails because an expected engagement classes source path does not exist; no claim of a green full suite.

## Deployed preview
Commit f618ed39f94263cf1951a40f5a29cfa51ec8ec00, deployment dpl_ExbDh3ae7ZPeBK5mgJonYtubY389, READY.
https://ea-payments-l4vpu0bm1-the-architects-projects-cc813778.vercel.app/amanda-catherine
Browser observed Wood Therapy CAD $997 with exactly one TEST - $1 Full Workflow (Amanda + Brick) button. Actual click on test page reaches API and displays the test-key guard.

## Blocking configuration
`Test checkout blocked: STRIPE_SECRET_KEY is not a test key. Will not use live key.`
This means the configured key is absent or does not start with sk_test_; no stronger assertion is possible without reading configuration. Vercel denied environment metadata access (403). No live key fallback or live payment was attempted.

## Pending
Valid Stripe test key on preview; actual test-card purchase; receipt/welcome delivery; student login and course access; repeat purchase; mobile visual evidence; production release and final domain verification. Do not label VERIFIED or DONE.
