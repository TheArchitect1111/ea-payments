# Feature Specification: Amanda LMS Locked v2.0
Request: routing and application fixes from the two attached Oct 2 source documents.
Project: Amanda Catherine. Status: implementation.
## Source of truth
SOURCE_OF_TRUTH_v2.0.md and DO_NOT_DO_LIST.md are verbatim PDF text extractions.
## Protected invariants
Preserve IDs, existing tuition prices, branding, assets, Jane links, other tenants and SECURITY-MODEL.md. No production merge or deployment in this change. No guessed shipping rates, curriculum, quiz questions, CPD hours or readiness.
## Acceptance criteria
1. Only the four explicitly READY certifications permit checkout, fulfillment and assigned learner access. Other courses are waitlist only.
2. Included kit: pickup costs zero; shipping requires address and server-configured rate added to checkout and recorded in fulfillment.
3. Exact support sentence, approved channels, clock starts at admin-entered class/training date only.
4. Exact approved names; separate tummy and injectables certifications; no accreditation claims.
5. Case study, quiz and practical evidence required; consent for client media; certification requires explicit authorized admin sign-off.
## Verification plan
Meaningful policy tests, existing Amanda gates, lint/type checks and public build. Production paths require later deployment and authenticated checkout/learning/support/admin queue verification on desktop/mobile.
## Rollback
Revert this branch if any protected flow regresses. Baseline ea-payments 947a85ba148f1f25727ded2c46115a81489c87db.
## Known inputs
Shipping rate schedule and approved quiz/curriculum absent. Fail closed rather than invent them.
