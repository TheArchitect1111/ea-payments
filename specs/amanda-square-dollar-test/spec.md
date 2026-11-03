# Feature Specification: Add a CAD $1 Square test option
Request: Add one reusable test option to Wood Therapy; retain the CAD $997 regular Square purchase.
Scope for this implementation step: button, own-name/email form, fresh sandbox checkout, durable test signup/order correlation. Fulfillment integration and end-to-end payment/email/access proof are separate next stages.
Source: user correction and approved plan; existing Square checkout and square-amanda webhook; live domain serves ea-payments e5e190bf.
Invariants: do not modify live Square payment/webhook behavior, normal prices, other courses, auth, or other tenant routes. No Stripe. No production deploy in this step. Test credentials never fallback to live credentials.
Acceptance: exactly one added test option; existing normal purchase uses registry Square URL; own email per attempt; fresh registration/idempotency key per attempt; fixed CAD 100 cents; sandbox-only host and credentials; test signup/order marked is_test.
Checks: mocked Square checkout behavior (missing configuration, invalid identity, amount, fresh sessions, test records); build/targeted TypeScript; source diff.
Rollback: revert feature commit before production release; source branch isolated from the abandoned Stripe work.

## Stage 3: verified sandbox fulfillment
Add isolated signed sandbox webhook and bearer-protected return verification. Retrieve payment from Square Sandbox; validate completed status, CAD 100 cents, configured location, and durable test-order identity before side effects. Use existing tracking/email/access stores. Never call live Square endpoints. Test grants expire after 72 hours; new verified tests can renew test grants without downgrading permanent access. New users get secure password setup; never store plaintext credentials. Persist delivery state for retries. Browser success query parameters never grant access.
