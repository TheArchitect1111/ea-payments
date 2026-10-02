# Amanda LMS Locked v2.0 — menu-aware review

Branch: fix/amanda-lms-locked-v2-20261002. Base implementation commit: 3ad51f0. Review only; no merge or production deployment.

Overall acceptance: NOT PASS. Scheduling URL and approved shipping prices absent. Authenticated browser tests and all owner function/role checks remain unverified. Repository-wide type checking and tenant-safety gate are blocked. Local HTTP login check did not complete because of local dev-server conflict; no redirect success claimed.

Passed: runtime purchase/readiness matrix for every configured course; support-date boundaries; existing checkout configuration tests; safe return-path policy and integration checks; owner placeholder source removal; whitespace checks. Targeted lint: zero errors, two existing image warnings. No errors reported in changed application files by type checking.

Owner routing uses existing functions. Clients -> intake review, Founder Clarity -> advisory queue, Settings -> existing preferences page, Eva -> website update assistant. These are not newly implemented CRM, scheduling, full settings or general assistant products. Scope-specific behavior must be confirmed before menu certification.

Shipping recommendation: approved flat CAD rates per destination, supplied by Amanda. No amount selected. Free pickup remains $0. Shipping code expects AMANDA_KIT_SHIPPING_RATE_IDS_JSON. Scheduling expects AMANDA_MENTORSHIP_BOOKING_URL.

## Menu-aware changes, file by file

| File | Change |
|---|---|
| `app/amanda-catherine/page.tsx` | Course sales links use /courses/{id}; non-READY links use #waitlist. |
| `lib/amanda-catherine/menu-routing.ts` | Single getCourseMenuRoute policy: READY + assigned purchase -> dedicated learning; READY without purchase -> sales; all non-READY -> waitlist. |
| `app/courses/[courseSlug]/page.tsx` | Public per-course page. READY courses show existing checkout including kit choices; non-READY show only waitlist. |
| `app/portal/amanda-catherine/learning/page.tsx` | Learner listing uses course readiness and durable assignments; administrator authoring retained. |
| `app/portal/amanda-catherine/learning/[courseId]/page.tsx` | Server rechecks course assignment and readiness; redirects unauthorized course requests to sales/waitlist; renders only purchased course. |
| `app/portal/[slug]/member/AmandaMemberHome.tsx` | Removes audience-based learner Courses/Progress/Certification links; adds purchase/readiness-aware course links. Training calendar points to calendar. |
| `app/portal/amanda-catherine/owner/[section]/page.tsx` | Replaces placeholder destinations with existing guarded routes or approved external links; removes placeholder rendering. Founder Clarity shares existing advisory queue. |
| `app/portal/amanda-catherine/owner/page.tsx` | View Orders -> kit orders; Send Message -> messaging; accurate Review Client Intake and Review Certifications labels. |
| `app/portal/components/AmandaSiteUpdateHub.tsx` | Adds actual #eva target for existing website update assistant. |
| `app/components/amanda/AmandaSupport.tsx` | Uses approved HTTPS booking URL when provided; button says Schedule Mentorship Call; exact support sentence and training-date countdown retained. |
| `app/portal/amanda-catherine/support/page.tsx` | Reads AMANDA_MENTORSHIP_BOOKING_URL; no guessed default scheduling URL. |
| `lib/auth/portal-return-path.ts` | Shared same-origin return-path sanitizer; rejects external, protocol-relative, backslash and control-character destinations. |
| `app/portal/login/page.tsx` | Uses tested return-path policy. |
| `app/api/portal/login/route.ts` | Sanitizes original next destination before password or 2FA handoff. |
| `app/api/auth/verify-2fa/route.ts` | Applies return policy after portal 2FA verification. |
| `scripts/test-amanda-lms-locked-v2.ts` | Tests all purchase/readiness states, support dates, login return policy and integration, and owner placeholder removal. |
| `tests/smoke/amanda-menu-return.spec.ts` | Adds logged-out return-URL and approved purchased-learner login smoke tests. Not executed: browser runtime/account unavailable. |

## Original locked v2 implementation inventory

# Amanda LMS Locked v2.0 review

Status: implementation on review branch; not merged or deployed.

Checks: locked policy runtime tests and existing checkout tests passed; lint zero errors (four warnings); diff whitespace check passed. Repository-wide type checking and tenant-safety gate remain blocked. Approved shipping rates are required in AMANDA_KIT_SHIPPING_RATE_IDS_JSON. No rates were invented. Browser/payment end-to-end and production verification remain pending.

| File | Change |
|---|---|
| `app/amanda-catherine/page.tsx` | Routing, learning, navigation or wording aligned with locked policy. |
| `app/amanda-catherine/private/practitioner-kit/KitCheckout.tsx` | READY checkout guard and/or pickup versus configured shipping selection and fulfillment. |
| `app/amanda-catherine/private/practitioner-kit/page.tsx` | READY checkout guard and/or pickup versus configured shipping selection and fulfillment. |
| `app/api/portal/amanda/certificate/route.ts` | Evidence review, explicit administrator approval, and training-date support records. |
| `app/api/portal/amanda/checkout/route.ts` | READY checkout guard and/or pickup versus configured shipping selection and fulfillment. |
| `app/api/portal/amanda/progress/route.ts` | Evidence review, explicit administrator approval, and training-date support records. |
| `app/api/portal/amanda/resources/[resourceId]/route.ts` | Routing, learning, navigation or wording aligned with locked policy. |
| `app/api/public/amanda/enrollment/checkout/route.ts` | READY checkout guard and/or pickup versus configured shipping selection and fulfillment. |
| `app/api/public/amanda/practitioner-kit/checkout/route.ts` | READY checkout guard and/or pickup versus configured shipping selection and fulfillment. |
| `app/portal/[slug]/billing/AmandaPayments.tsx` | READY checkout guard and/or pickup versus configured shipping selection and fulfillment. |
| `app/portal/[slug]/learning/AmandaLearningCenter.tsx` | Routing, learning, navigation or wording aligned with locked policy. |
| `app/portal/[slug]/member/AmandaMemberHome.tsx` | Routing, learning, navigation or wording aligned with locked policy. |
| `app/portal/amanda-catherine/enroll/AmandaEnrollmentForm.tsx` | READY checkout guard and/or pickup versus configured shipping selection and fulfillment. |
| `app/portal/amanda-catherine/enroll/page.tsx` | Routing, learning, navigation or wording aligned with locked policy. |
| `app/portal/amanda-catherine/owner/[section]/page.tsx` | Routing, learning, navigation or wording aligned with locked policy. |
| `app/portal/amanda-catherine/page.tsx` | Routing, learning, navigation or wording aligned with locked policy. |
| `lib/amanda-catherine/client-access.ts` | Assignment-based access and READY-only purchase fulfillment. |
| `lib/amanda-catherine/config.ts` | Official names, separate certifications and compliant copy. |
| `lib/amanda-catherine/course-content.ts` | Routing, learning, navigation or wording aligned with locked policy. |
| `lib/amanda-catherine/payment-fulfillment.ts` | Assignment-based access and READY-only purchase fulfillment. |
| `lib/amanda-catherine/practitioner-kit-orders.ts` | READY checkout guard and/or pickup versus configured shipping selection and fulfillment. |
| `lib/amanda-catherine/progress-store.ts` | Evidence review, explicit administrator approval, and training-date support records. |
| `lib/amanda-catherine/site-content.ts` | Official names, separate certifications and compliant copy. |
| `middleware.ts` | Routing, learning, navigation or wording aligned with locked policy. |
| `app/api/portal/amanda/certifications/route.ts` | Evidence review, explicit administrator approval, and training-date support records. |
| `app/api/public/amanda/waitlist/route.ts` | Waitlist-only path without checkout or access provisioning. |
| `app/components/amanda/AmandaSupport.tsx` | Routing, learning, navigation or wording aligned with locked policy. |
| `app/components/amanda/CertificationEvidence.tsx` | Routing, learning, navigation or wording aligned with locked policy. |
| `app/components/amanda/KitFulfillmentFields.tsx` | READY checkout guard and/or pickup versus configured shipping selection and fulfillment. |
| `app/portal/amanda-catherine/owner/CertificationQueue.tsx` | Routing, learning, navigation or wording aligned with locked policy. |
| `app/portal/amanda-catherine/support/page.tsx` | Exact support wording, READY policy and class-date support window. |
| `app/portal/amanda-catherine/waitlist/WaitlistForm.tsx` | Waitlist-only path without checkout or access provisioning. |
| `app/portal/amanda-catherine/waitlist/page.tsx` | Waitlist-only path without checkout or access provisioning. |
| `lib/amanda-catherine/admin-access.ts` | Assignment-based access and READY-only purchase fulfillment. |
| `lib/amanda-catherine/course-access.ts` | Assignment-based access and READY-only purchase fulfillment. |
| `lib/amanda-catherine/kit-fulfillment.ts` | READY checkout guard and/or pickup versus configured shipping selection and fulfillment. |
| `lib/amanda-catherine/lms-policy.ts` | Exact support wording, READY policy and class-date support window. |
| `scripts/test-amanda-lms-locked-v2.ts` | Readiness, assignment access and support-date boundary tests. |
| `specs/amanda-lms-locked-v2/DO_NOT_DO_LIST.md` | Locked source, constraints and review plan. |
| `specs/amanda-lms-locked-v2/SOURCE_OF_TRUTH_v2.0.md` | Locked source, constraints and review plan. |
| `specs/amanda-lms-locked-v2/plan.md` | Locked source, constraints and review plan. |
| `specs/amanda-lms-locked-v2/spec.md` | Locked source, constraints and review plan. |
| `specs/amanda-lms-locked-v2/tasks.md` | Locked source, constraints and review plan. |
