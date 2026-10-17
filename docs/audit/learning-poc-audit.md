# Amanda V3.1: Frappe Learning Phase 1 Audit
**Audit only. Owner approval required before PoC.** Branch: `audit/amanda-v31-frappe-learning-20261017`.

## Current Portal
Repository `app/portal/amanda-catherine/` contains dashboard `page.tsx`, `layout.tsx`, `learning/page.tsx`, `learning/[courseId]/page.tsx`, `owner/`, `resources/`, `enroll/`, `waitlist/`, `test-enrollments/`, `support/`, `profile/`, `billing/`, and `(engagement)/` including `hub/`, `foundry/`, `calendar/`, `eva/`, `apply/`, `book/`. Other `app/portal/` groups include `[slug]/`, `amanda/`, `components/`, `login/`, `register/`, `sign-in/`, and recovery routes. The GitHub tree contains 239 entries below `app/portal/`; full file inventory remains viewable at https://github.com/TheArchitect1111/ea-payments/tree/master/app/portal .

**Identity:** `requirePortalModule` in `lib/modules/portal-modules.ts` verifies the EA portal cookie/session, roles, module access. `app/portal/amanda-catherine/page.tsx` enforces dashboard auth and redirects administrators. `PortalSubpage` renders the branded shell; it does not independently authenticate students. `AmandaMemberHome` uses assigned course IDs for navigation, not authorization. `learning/[courseId]/page.tsx` requires the session and invokes `getAmandaAssignedCourseIds`/`getAmandaCourseAccessDecision`; `lib/amanda-catherine/client-access.ts` implements individual course access and trial expiry.

**Payment → access:** `app/api/webhooks/square-amanda/route.ts` checks Square HMAC signature and order/payment correlation, writes/updates Airtable `Client Records`, calls `provisionAmandaClientAccess`, and dispatches confirmation/receipt emails. This is source-code mapping, not a real-payment end-to-end certification. Class availability in Creative Studio Airtable Payload JSON is independent of learner entitlement. Square and Jane remain unchanged.

**Assets:** `lib/amanda-catherine/course-resources.ts` lists PDFs, DOCX and VIDEO pathnames. This is an existing catalog, not evidence of a self-serve course uploader. `app/api/portal/content/upload/route.ts` is authenticated and role-gated but only supports small PDF/text/image files up to 120 KB; it is unsuitable for videos. `app/api/internal/amanda-reset-upload-url/route.ts` may handle a specialized asset. Some asset metadata references Vercel Blob and public assets. No verified evidence that course files reside in Google Drive; verify individual asset locations before moving them.

## Frappe Research
Official repo https://github.com/frappe/lms; README reviewed through connected GitHub (develop README blob `0c33058e037cd31c7e75b51f723394c9a08c14b2`). An attempted local clone failed due to DNS restrictions; **no local clone or Docker instance exists yet**. Deeper implementation inspection remains pending.

Frappe Learning is a separate Frappe Framework (Python) app with Vue/Frappe UI, MariaDB and Redis services. It implements courses → chapters → lessons; live batches, quizzes, assignments, progress and certificates. Official development instructions use `develop/docker/docker-compose.yml` and `docker compose up -d`, accessible at `http://lms.localhost:8000/lms`. Never expose default development credentials publicly. Production uses self-hosted images or Frappe Cloud. Official source: https://github.com/frappe/lms .

Frappe Framework supports OAuth2/OIDC social login providers via Social Login Key: https://docs.frappe.io/framework-git/security/social-login-oidc . **Existing EA portal cookie is not an OIDC identity token.** Student email alone, query parameters or unauthenticated allowlists must not authenticate the learner. A standards-compliant identity broker/provider and separate Frappe-side enrollment enforcement require proof.

## Licensing (AGPL-3.0)
1. Preserve the license and copyright notices.
2. Modified AGPL-covered code offered via a network must provide interacting users access to Corresponding Source.
3. Source obligations can also arise when conveying a covered derivative.
4. A separately hosted Next.js site using APIs may remain a separate work, but that depends on actual integration details, not merely hostnames.
5. Review modifications, extensions, branding and disclosure plans with counsel before any externally accessible deployment; never disclose passwords or private student data.
Official license: https://www.gnu.org/licenses/agpl-3.0.en.html .

## Integration Options
| Approach | Advantage | Risk | Decision |
|---|---|---|---|
| iframe Frappe | Quick embedded demonstration | Cookies, frame security/CSP, inconsistent UX and accessibility | Reject for student production |
| Branded LMS subdomain + verified OIDC SSO | Native learning engine, EA website untouched | Requires trusted identity broker, user mapping and entitlement sync | **Recommended conditional candidate** |
| Frappe APIs with custom Next.js learner UI | Full visual control | Rebuilds lessons/quiz/progress presentation; violates no-drift rule | Reject |

Suggested journey: EA My Learning → authenticated entitled student → trustworthy login redirect to private Frappe → Frappe separately checks learner/course rights → lessons/video/PDF/quiz/progress → return to EA portal. Identity, course mapping, logout and access revocation must be proved. Do not modify current portal authentication or Square.

## Recommendation
**CONDITIONAL GO** for a privately hosted proof of feasibility for *Wood Therapy Certification*, only after audit approval. **NO-GO** for production or Phase 2 code now. Test one synthetic instructor and student: authorized material view; unauthorized file/data request rejected; progress persisted; instructor upload; brand consistency. If EA auth cannot be bridged without major changes, stop and audit CourseLit as fallback. No real Square enrollments, Airtable schema writes, student notifications or public LMS server.

No production, webhook, authentication, payment, manifest or wrapper code was changed during this audit.
