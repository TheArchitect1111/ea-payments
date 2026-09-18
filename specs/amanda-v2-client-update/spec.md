# Feature Specification: Amanda V2 client-requested update pass

**Request:** September 18 Amanda WhatsApp brief and Robert's execution prompt.
**Project/tenant:** amanda-catherine
**Owner:** Robert Brickey / Amanda Catherine
**Status:** Implementation

## Intent
Surgical content and commerce additions to the approved Restore → Learn → Create page, preview only.

## Scope
Create offerings, supplied proof/social links, Canadian RIMAN CTA, and private $499 CAD practitioner kit checkout. No production deployment, redesign, or Portal V2 edits.

## Source of truth
Approved snapshot 62a09f43e9cd581906006fe49658346244998dbb; integration baseline d7639b9437beb97c3826c822cf29a277a467eda3; supplied screenshots 1000048070–1000048168; supplied kit artwork; existing Amanda offer catalog; Amanda project record. Latest screenshot text controls Founder Clarity duration (75 minutes), without inventing a price.

## Protected invariants
Preserve baseline page sections, imagery, Jane, course catalog/prices, enrollment, login, LMS, tenant/security boundaries, and frozen portal. Commerce must not grant course access for a physical product. No real payment during QA. No unrequested shipping/tax/pricing assumptions. No invented clinical consultation or testimonial URL.

## Acceptance criteria
1. Four CREATE offerings have purpose, source-grounded details and functioning inquiry/media actions.
2. Supplied kit artwork and $499 CAD appear; CTA opens noindex purchase page and Stripe hosted checkout.
3. RIMAN retains country=CA and lang=en-CA and the actual destination is inspected.
4. Source proof and Google business link are present; social tracking parameters removed.
5. Jane and Academy/enrollment links and images remain intact; desktop/mobile have no missing images or unintended overflow.
6. Preview deployment is visually inspected and every new CTA checked. No production or frozen portal change.

## Verification plan
Targeted lint/type checks, existing Amanda commerce/learning tests, mock payment validation, browser desktop/mobile inspection, external destination checks, preview checkout without payment, source diff of protected paths.

## Rollback condition
Build/security/payment regressions or changes outside scope block completion. Revert this pass on integration branch to d7639b9; approved snapshot remains intact. Never promote to production.

## Completion evidence
Recorded after preview QA. Third-party access barriers and genuinely missing exact destinations remain explicitly unresolved.
