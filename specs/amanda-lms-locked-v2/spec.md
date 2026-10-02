# Feature Specification: Amanda LMS Locked v2.0
Request: routing and application fixes from the two attached Oct 2 source documents.
Project: Amanda Catherine. Status: implementation.
## Source of truth
SOURCE_OF_TRUTH_v2.1_FINAL.md is the current authority, extracted verbatim from Amanda’s Oct 2 final PDF. SOURCE_OF_TRUTH_v2.0.md and the prior do-not-do list are retained as historical records; v2.1 governs conflicts.
## Protected invariants
Preserve IDs, existing tuition prices, branding, assets, Jane links, other tenants and SECURITY-MODEL.md. No production merge or deployment in this change. No guessed shipping rates, curriculum, quiz questions, CPD hours or readiness.
## Acceptance criteria
1. Only the four explicitly READY certifications permit checkout, fulfillment and assigned learner access. Other courses are waitlist only.
2. Included kit: pickup costs zero; shipping requires address capture, costs $0 for both pickup and shipment, and is recorded in fulfillment. Paid rate logic must remain disabled until new approval.
3. Exact support sentence, approved channels, clock starts at admin-entered class/training date only.
4. Exact approved names; separate tummy and injectables certifications; no accreditation claims.
5. Case study, quiz and practical evidence required; consent for client media; certification requires explicit authorized admin sign-off.
## Verification plan
Meaningful policy tests, existing Amanda gates, lint/type checks and public build. Production paths require later deployment and authenticated checkout/learning/support/admin queue verification on desktop/mobile.
## Rollback
Revert this branch if any protected flow regresses. Baseline ea-payments 947a85ba148f1f25727ded2c46115a81489c87db.
## Known inputs
Shipping is approved FREE for now; no paid rates or invented quiz/curriculum. Jane booking and the existing Gmail account are approved. Authenticated QA and implementation for unsupported menus remain unresolved.

## Oct 2 menu repair acceptance addendum
Robert authorizes temporary pickup $0 CAD, Canada $25 CAD and USA $35 CAD until Amanda supplies final rates; configured rate IDs override these amounts. Robert authorizes https://example.com/schedule as a visibly pending scheduling placeholder. These are owner-provided temporary inputs, not Amanda-approved final inputs.
All course/progress/certification groups use the purchase/readiness helper per course. Operational labels use exact mappings, never substring heuristics. Unsupported workflows remain visible and unavailable, with HOLD evidence rather than invented operations. Existing course authoring and document hub actions remain distinct from administrator certification review.
No merge, push triggering deployment, or deployment authorized. Revert this repair if it regresses tenant, assignment, readiness, free-pickup or certification rules. Authenticated payment and role tests require approved QA access; no credentials in artifacts.

## Oct 2 v2.1 final approval — supersedes temporary v2 shipping/scheduling inputs
Shipping costs $0 for pickup and shipment, ignores obsolete paid rate configuration, retains required shipping address capture, and never retrieves or creates paid Stripe shipping rates. Jane booking uses the existing approved AesthetiKine destination; support email targets Amanda’s existing Gmail account. This supplies email-link wiring but does not prove Gmail OAuth/mailbox integration.
Member Profile reuses signed-in portal identity. Product Ordering reuses existing kit checkout with unchanged kit price. Member Resources reuses purchased READY resource catalog and guarded downloads; no course content or clinical plans are invented. Remaining missing domain workflows remain blocked rather than mapped to unrelated dashboards, staff-only directories or EA sales/referral tools.
Robert authorizes pushing the existing branch for review only. No master modification, merge or production promotion. Git assigns the commit hash; a requested literal hash cannot be chosen.
