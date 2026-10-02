# Amanda menu wiring audit — locked v2.1 final

Overall: **HOLD / NOT PASS**. The 14 NOT READY menu functions now have public interest waitlists, as explicitly authorized in the latest instruction. Live Gmail, storage and authenticated access verification still block release approval. Review parent: published 959c728; local equivalent tree at 38b14a7. Same existing review branch; no merge or production promotion.

## Current authority and inputs

`SOURCE_OF_TRUTH_v2.1_FINAL.md` is the exact extracted final approval. It supersedes v2.0 shipping/scheduling values. Shipping is FREE for now for both pickup and shipment. No final paid rates are required for this release. Shipping address capture remains required for shipment. Old `AMANDA_KIT_SHIPPING_RATE_IDS_JSON` is ignored; no shipping-rate lookup, creation or paid charge logic remains.

Support uses existing Jane booking (`https://aesthetikine.janeapp.com/`, or a valid Jane URL from `AMANDA_JANE_BOOKING_URL`) and Amanda’s existing Gmail account (`amandacatherinec@gmail.com`). The example scheduling placeholder is removed. Exact support sentence and training-date clock are unchanged. Support email linking remains; waitlist submission now calls a server-side Gmail OAuth sender. No existing Gmail connector was found in code, and plugin discovery confirmed Gmail is not connected. Live notification delivery and scheduling remain Unverified.

## Observed tests and limits

| Check | Result |
|---|---|
| All configured purchased/readiness routes; unknown/non-READY overrides | Runtime policy PASS; logged-in entitlement/unlock Unverified |
| Pickup and shipment $0, address retention, obsolete paid config ignored | Runtime PASS, including real order-recorder validation in preview mode; paid-shipping/unpaid/wrong-total/other-tenant/missing-address fixtures rejected. Live Stripe transaction and production persistence Unverified |
| Jane provider URL validation, Gmail-address link, exact support sentence, class-date end date | Render/policy PASS; actual Jane booking and Gmail integration Unverified |
| Member resource selection | Runtime PASS: no resources for unpurchased or non-READY courses; only purchased READY materials selected; duplicate assignments deduplicated |
| Existing checkout configuration | PASS; no live payment attempted |
| Targeted lint | PASS: 0 errors; 1 existing kit-page image warning |
| New profile logged-out local HTTP | PASS: 307 to `/portal/login?next=%2Fportal%2Famanda-catherine%2Fprofile%3Fview%3Daccount`; path/query preserved |
| Previous purchased course logged-out local HTTP | Observed in prior repair: 307 retained original course path/query; authenticated login still Unverified |
| Repository-wide lint | Unverified: blocked — missing `react-hooks` plugin for `react-hooks/set-state-in-effect`; exit 2 |
| Repository-wide type check | Unverified: blocked by 342 observed type diagnostics; no diagnostics found in changed files in inspected log |
| Tenant safety | Unverified: blocked by observed assertion failure in unchanged `scripts/test-tenant-safety.mjs:86` expects empty production entitlements, shared module returns `withChassisStandardModules([])` |
| Authenticated learner/admin, password/2FA return, payments, mobile, waitlist persistence, all menus | Unverified: no approved QA access supplied; no browser runtime available |

## Three formerly unavailable functions connected

| Label | Actual implementation | Verified boundary / remaining check |
|---|---|---|
| Member Profile | New thin page reuses `requirePortalModule` and signed-in session identity; shows own session email, portal, role | Exact Amanda tenant guard, missing email returns login; authenticated rendering Unverified |
| Product Ordering | Existing `/amanda-catherine/private/practitioner-kit` + KitCheckout + existing public kit checkout API | Existing product/price preserved; free shipment policy tested; live purchase Unverified |
| Member Resources | Thin Amanda resource view reuses durable course assignments, approved resource catalog and existing protected download API | Only purchased READY resources selected. API rechecks access; no new grants. Authenticated file downloads Unverified |

Protocols & Templates also now uses the protected Amanda resource view. Course/progress/certification groups remain per-course purchase/readiness aware for every role. Management/approval actions remain separate from purchased learner access. No “Portal destination established” JSX remains; routing a label somewhere unrelated would not repair its missing function.

## 14 NOT READY functions — public waitlist routing

Each label below now links to `/amanda-catherine/courses/[label]#waitlist`, with its interest auto-filled. Routing to a waitlist does not claim the underlying directory, assignment, administrative or other service is implemented. These pages expose no private data, checkout or entitlement. Runtime interest registration is PASS; complete live submit is Unverified with plan W below.

| Audience | Label | Repository evidence / why an unrelated route is not a fix |
|---|---|---|
| client | preparation-and-aftercare | Only a workflow reference exists in lib/portal-universal/packs/amanda-catherine.ts; no service-specific appointment-care executor/client view. |
| client | wellness-plan | Only a dashboard label; protected practitioner plan templates are not a personalized client plan. |
| certified-practitioner | practitioner-directory | People backend is feature/persistence/ACL guarded; portal People page is a minimal staff shell. Directory application is not a practitioner directory. |
| certified-practitioner | referrals | Connect warm introductions hand prospects to Robert; not Amanda’s practitioner referral workflow. |
| certified-practitioner | professional-opportunities | Pulse captures EA business opportunities, not approved practitioner career opportunities. |
| member-community-participant | community-directory | People backend and staff shell do not implement approved member community directory access. |
| member-community-participant | groups-and-discussions | No group/discussion store, membership rules or conversation workflow implementation found. |
| media-guest | production-status | Private deliveries track delivery/opening; they do not implement media production stages. |
| volunteer | schedule-and-assignments | Shared calendar exists; volunteer assignment workflow is not implemented. |
| volunteer | policies-and-training | Volunteer policy/training material and access workflow not implemented; practitioner course checkout is not a substitute. |
| volunteer | participation-hours | Report name exists in config; no attendance/hour ledger or verification action. |
| staff | assigned-work | Connect board exposes relationship follow-ups; no approved staff assignment workflow. |
| admin | users-and-permissions | Membership library supports finding/creating memberships; no tenant administrator user/permission management flow. |
| admin | automations-and-communications | Workflow references and notifications exist; no tenant automation control surface. |

## Owner labels and actual functions

| Label | Actual destination | Observed function / limitation |
|---|---|---|
| Dashboard | `/portal/amanda-catherine/owner` | Unverified (plan A): Existing owner metrics and actions; live data/roles unverified |
| Update Hub | `/portal/amanda-catherine/updates` | Unverified (plan A): Existing governed requests, publishing and website updates; live operation unverified |
| Appointments / Jane | `/portal/amanda-catherine/calendar` | Unverified (plan A): Jane booking plus shared calendar; Google authorization still required |
| Clients | `/portal/amanda-catherine/intake` | Unverified (plan A): Intake review only; full client relationship management not verified |
| AesthetiKine Academy | `/portal/amanda-catherine/owner/academy` | Unverified (plan A): Existing authoring link to learning plus certification approval queue; admin API guard inspected |
| Practitioner Starter Kit | `/portal/amanda-catherine/owner/practitioner-kit` | Unverified (plan A): Standalone kit checkout and paid-order list; live payment and fulfillment unverified |
| LIFELINE | `/portal/amanda-catherine/owner/lifeline` | Unverified (plan A): Filters existing application queue by approved form/program IDs |
| Empower Art Collective | `/portal/amanda-catherine/events` | Unverified (plan A): Event hub; broader collective operations not verified |
| Founder Advisory | `/portal/amanda-catherine/owner/advisory` | Unverified (plan A): Existing founder-advisory application queue |
| Founder Clarity | `/portal/amanda-catherine/owner/advisory` | Unverified (plan A): Shared advisory queue; dedicated 75-minute session flow not established |
| Speaking & Media | `/portal/amanda-catherine/owner/speaking` | Unverified (plan A): Existing speaking-media inquiry queue |
| The Entrepreneurial Artist | `/portal/amanda-catherine/owner/book` | Unverified (plan A): Existing Amazon and playlist actions; student course action now obeys readiness/purchase policy |
| RIMAN Canada | `https://mall.riman.com/amandacatherine/home?country=CA&lang=en-CA` | Unverified (plan A): Existing approved external destination; external function unverified |
| Reviews & Testimonials | `https://share.google/9Pw2JCYOXwcQeCDtY` | Unverified (plan A): Existing approved external destination; external function unverified |
| Documents & Certifications | `/portal/amanda-catherine/owner/documents` | Unverified (plan A): Existing document-hub link plus admin approval queue; live document/evidence handling unverified |
| Marketing | `/portal/amanda-catherine/amplifi` | Unverified (plan A): Existing content creation/review workspace; live authorization/publishing unverified |
| Business Insights | `/portal/amanda-catherine/reports` | Unverified (plan A): Existing operations metrics/queues; data and access unverified |
| Eva (AI Assistant) | `/portal/amanda-catherine/updates#eva` | Unverified (plan A): Existing website-update assistant; general business-assistant scope not established |
| Settings | `/portal/amanda-catherine/settings` | Unverified (plan A): Branding/notification guidance and business-presence panel; not full self-serve settings |

## Complete member menu inventory

| Audience | Label | Actual destination | Evidence |
|---|---|---|---|
| client | private-deliveries | `/portal/amanda-catherine/deliveries` | Source function inspected; live action / role Unverified |
| client | appointments | `/portal/amanda-catherine/calendar` | Source function inspected; live action / role Unverified |
| client | forms-and-consents | `/portal/amanda-catherine/intake` | Source function inspected; live action / role Unverified |
| client | preparation-and-aftercare | Public `/amanda-catherine/courses/[label]#waitlist` (label is the row slug) | PASS registration and routing; Unverified live submission (plan W) |
| client | wellness-plan | Public `/amanda-catherine/courses/[label]#waitlist` (label is the row slug) | PASS registration and routing; Unverified live submission (plan W) |
| client | packages-and-sessions | `/portal/amanda-catherine/billing` | Source function inspected; live action / role Unverified |
| client | payments-and-receipts | `/portal/amanda-catherine/billing` | Source function inspected; live action / role Unverified |
| client | messages | `/portal/amanda-catherine/messaging` | Source function inspected; live action / role Unverified |
| client | support-and-mentorship | `/portal/amanda-catherine/support` | Source function inspected; live action / role Unverified |
| student-trainee | private-deliveries | `/portal/amanda-catherine/deliveries` | Source function inspected; live action / role Unverified |
| student-trainee | courses | Per-course `getCourseMenuRoute(course, user)` | POLICY PASS; authenticated function Unverified |
| student-trainee | training-calendar | `/portal/amanda-catherine/calendar` | Source function inspected; live action / role Unverified |
| student-trainee | assignments-and-assessments | Per-course `getCourseMenuRoute(course, user)` | POLICY PASS; authenticated function Unverified |
| student-trainee | document-upload | `/portal/amanda-catherine/ctp/documents` | Source function inspected; live action / role Unverified |
| student-trainee | tuition-and-agreements | `/portal/amanda-catherine/billing` | Source function inspected; live action / role Unverified |
| student-trainee | progress | Per-course `getCourseMenuRoute(course, user)` | POLICY PASS; authenticated function Unverified |
| student-trainee | certification | Per-course `getCourseMenuRoute(course, user)` | POLICY PASS; authenticated function Unverified |
| student-trainee | instructor-messages | `/portal/amanda-catherine/messaging` | Source function inspected; live action / role Unverified |
| student-trainee | support-and-mentorship | `/portal/amanda-catherine/support` | Source function inspected; live action / role Unverified |
| certified-practitioner | private-deliveries | `/portal/amanda-catherine/deliveries` | Source function inspected; live action / role Unverified |
| certified-practitioner | protocols-and-templates | `/portal/amanda-catherine/resources` | Source function inspected; live action / role Unverified |
| certified-practitioner | advanced-training | Per-course `getCourseMenuRoute(course, user)` | POLICY PASS; authenticated function Unverified |
| certified-practitioner | mentorship | `/portal/amanda-catherine/support` | Source function inspected; live action / role Unverified |
| certified-practitioner | certificates | Per-course `getCourseMenuRoute(course, user)` | POLICY PASS; authenticated function Unverified |
| certified-practitioner | practitioner-directory | Public `/amanda-catherine/courses/[label]#waitlist` (label is the row slug) | PASS registration and routing; Unverified live submission (plan W) |
| certified-practitioner | referrals | Public `/amanda-catherine/courses/[label]#waitlist` (label is the row slug) | PASS registration and routing; Unverified live submission (plan W) |
| certified-practitioner | professional-opportunities | Public `/amanda-catherine/courses/[label]#waitlist` (label is the row slug) | PASS registration and routing; Unverified live submission (plan W) |
| certified-practitioner | product-ordering | `/amanda-catherine/private/practitioner-kit` | Source function inspected; live action / role Unverified |
| certified-practitioner | support-and-mentorship | `/portal/amanda-catherine/support` | Source function inspected; live action / role Unverified |
| member-community-participant | private-deliveries | `/portal/amanda-catherine/deliveries` | Source function inspected; live action / role Unverified |
| member-community-participant | member-profile | `/portal/amanda-catherine/profile` | Source function inspected; live action / role Unverified |
| member-community-participant | member-resources | `/portal/amanda-catherine/resources` | Source function inspected; live action / role Unverified |
| member-community-participant | events | `/portal/amanda-catherine/events?tab=events` | Source function inspected; live action / role Unverified |
| member-community-participant | announcements | `/portal/amanda-catherine/messaging` | Source function inspected; live action / role Unverified |
| member-community-participant | community-directory | Public `/amanda-catherine/courses/[label]#waitlist` (label is the row slug) | PASS registration and routing; Unverified live submission (plan W) |
| member-community-participant | groups-and-discussions | Public `/amanda-catherine/courses/[label]#waitlist` (label is the row slug) | PASS registration and routing; Unverified live submission (plan W) |
| member-community-participant | mentorship-and-collaboration | `/portal/amanda-catherine/support` | Source function inspected; live action / role Unverified |
| member-community-participant | support-and-mentorship | `/portal/amanda-catherine/support` | Source function inspected; live action / role Unverified |
| media-guest | private-deliveries | `/portal/amanda-catherine/deliveries` | Source function inspected; live action / role Unverified |
| media-guest | media-application | `/portal/amanda-catherine/applications` | Source function inspected; live action / role Unverified |
| media-guest | package-and-payment | `/portal/amanda-catherine/billing` | Source function inspected; live action / role Unverified |
| media-guest | asset-upload | `/portal/amanda-catherine/ctp/documents` | Source function inspected; live action / role Unverified |
| media-guest | media-release | `/portal/amanda-catherine/documents` | Source function inspected; live action / role Unverified |
| media-guest | interview-schedule | `/portal/amanda-catherine/calendar` | Source function inspected; live action / role Unverified |
| media-guest | production-status | Public `/amanda-catherine/courses/[label]#waitlist` (label is the row slug) | PASS registration and routing; Unverified live submission (plan W) |
| media-guest | media-delivery | `/portal/amanda-catherine/deliveries` | Source function inspected; live action / role Unverified |
| media-guest | launch-updates | `/portal/amanda-catherine/messaging` | Source function inspected; live action / role Unverified |
| media-guest | support-and-mentorship | `/portal/amanda-catherine/support` | Source function inspected; live action / role Unverified |
| volunteer | private-deliveries | `/portal/amanda-catherine/deliveries` | Source function inspected; live action / role Unverified |
| volunteer | volunteer-application | `/portal/amanda-catherine/applications` | Source function inspected; live action / role Unverified |
| volunteer | onboarding-forms | `/portal/amanda-catherine/intake` | Source function inspected; live action / role Unverified |
| volunteer | schedule-and-assignments | Public `/amanda-catherine/courses/[label]#waitlist` (label is the row slug) | PASS registration and routing; Unverified live submission (plan W) |
| volunteer | policies-and-training | Public `/amanda-catherine/courses/[label]#waitlist` (label is the row slug) | PASS registration and routing; Unverified live submission (plan W) |
| volunteer | coordinator-messages | `/portal/amanda-catherine/messaging` | Source function inspected; live action / role Unverified |
| volunteer | participation-hours | Public `/amanda-catherine/courses/[label]#waitlist` (label is the row slug) | PASS registration and routing; Unverified live submission (plan W) |
| volunteer | support-and-mentorship | `/portal/amanda-catherine/support` | Source function inspected; live action / role Unverified |
| vendor-partner | private-deliveries | `/portal/amanda-catherine/deliveries` | Source function inspected; live action / role Unverified |
| vendor-partner | partner-application | `/portal/amanda-catherine/applications` | Source function inspected; live action / role Unverified |
| vendor-partner | required-documents | `/portal/amanda-catherine/documents` | Source function inspected; live action / role Unverified |
| vendor-partner | agreements | `/portal/amanda-catherine/documents` | Source function inspected; live action / role Unverified |
| vendor-partner | event-registration | `/portal/amanda-catherine/events?tab=events` | Source function inspected; live action / role Unverified |
| vendor-partner | invoices-and-payments | `/portal/amanda-catherine/billing` | Source function inspected; live action / role Unverified |
| vendor-partner | team-messages | `/portal/amanda-catherine/messaging` | Source function inspected; live action / role Unverified |
| vendor-partner | support-and-mentorship | `/portal/amanda-catherine/support` | Source function inspected; live action / role Unverified |
| staff | assigned-work | Public `/amanda-catherine/courses/[label]#waitlist` (label is the row slug) | PASS registration and routing; Unverified live submission (plan W) |
| staff | appointments | `/portal/amanda-catherine/calendar` | Source function inspected; live action / role Unverified |
| staff | applications | `/portal/amanda-catherine/applications` | Source function inspected; live action / role Unverified |
| staff | courses-and-certifications | Per-course `getCourseMenuRoute(course, user)` | POLICY PASS; authenticated function Unverified |
| staff | memberships-and-events | `/portal/amanda-catherine/events?tab=events` | Source function inspected; live action / role Unverified |
| staff | messages-and-announcements | `/portal/amanda-catherine/messaging` | Source function inspected; live action / role Unverified |
| staff | people-and-leads | `/portal/amanda-catherine/reports` | Source function inspected; live action / role Unverified |
| staff | reports | `/portal/amanda-catherine/reports` | Source function inspected; live action / role Unverified |
| staff | support-and-mentorship | `/portal/amanda-catherine/support` | Source function inspected; live action / role Unverified |
| admin | amplifi | `/portal/amanda-catherine/amplifi` | Source function inspected; live action / role Unverified |
| admin | executive-overview | `/portal/amanda-catherine/owner` | Source function inspected; live action / role Unverified |
| admin | users-and-permissions | Public `/amanda-catherine/courses/[label]#waitlist` (label is the row slug) | PASS registration and routing; Unverified live submission (plan W) |
| admin | crm-and-lead-stages | `/portal/amanda-catherine/reports` | Source function inspected; live action / role Unverified |
| admin | appointments | `/portal/amanda-catherine/calendar` | Source function inspected; live action / role Unverified |
| admin | applications-and-forms | `/portal/amanda-catherine/applications` | Source function inspected; live action / role Unverified |
| admin | payments-and-balances | `/portal/amanda-catherine/billing` | Source function inspected; live action / role Unverified |
| admin | courses-progress-and-certifications | Per-course `getCourseMenuRoute(course, user)` | POLICY PASS; authenticated function Unverified |
| admin | memberships-events-and-media | `/portal/amanda-catherine/events?tab=events` | Source function inspected; live action / role Unverified |
| admin | automations-and-communications | Public `/amanda-catherine/courses/[label]#waitlist` (label is the row slug) | PASS registration and routing; Unverified live submission (plan W) |
| admin | reports-and-follow-ups | `/portal/amanda-catherine/reports` | Source function inspected; live action / role Unverified |
| admin | support-and-mentorship | `/portal/amanda-catherine/support` | Source function inspected; live action / role Unverified |

## Public navigation and live acceptance

Public anchors and approved branding/assets/prices remain unchanged. Existing per-course sales/waitlist and server assignment/readiness guards remain. Public/mobile interactions and external Jane actions require browser verification. The four READY approvals, separate certifications, exact support sentence and administrator evidence approval remain mandatory.

PASS requires approved implementations or requirements for the 14 missing workflows, Gmail integration details/access, approved purchased READY learner and administrator QA access, resolved shared verification blockers and observed authenticated/payment/mobile menu behavior. No credentials in reports or commits. Review push is authorized; merge and production promotion are not.

## Waitlist implementation and observed evidence

- Dedicated Airtable table `amanda_waitlist` created and schema returned successfully in verified configured base `appv0YoLIMY45fmDA`: table `tblIgxYkeHnuvg6eK`. Fields: student_name, student_email, student_phone, course_name, course_slug, student_message, course_url, portal_slug, submitted_at. Table provisioning PASS; live application persistence Unverified (no runtime Airtable credentials in this workspace).
- `scripts/test-amanda-waitlist.ts`: PASS mocked request pipeline, all 14 registered interests, every configured menu label covered, READY/unknown/cross-origin rejection, durable-save requirement, Gmail MIME destination/subject, and explicit failure response when storage or notification is unavailable. No live student record or email created.
- Logged-out local HTTP: `/amanda-catherine/courses/groups-and-discussions` returned 200 with course-interest input and `id="waitlist"`, no login redirect or checkout. Browser submit/mobile remain Unverified (plan W).
- `scripts/test-amanda-lms-locked-v2.ts`: PASS readiness/purchase policy and support-clock regression tests with new public NOT READY URL.
- Targeted ESLint on all changed TypeScript/TSX: PASS, zero errors; four existing public-page image/anchor warnings.
- Tenant-safety command re-run: Unverified release safety, blocked by unchanged assertion at line 86 (expected empty production entitlement return). No shared tenant ACL code altered or assertion weakened.
- Sender follows Gmail messages.send MIME/base64url API: https://developers.google.com/workspace/gmail/api/guides/sending. Requires securely configured `AMANDA_GMAIL_CLIENT_ID`, `AMANDA_GMAIL_CLIENT_SECRET`, `AMANDA_GMAIL_REFRESH_TOKEN`, authorized by Amanda with gmail.send scope. A ChatGPT Gmail connection alone does not configure the deployed server. No secrets belong in reports or commits.
- Template source was the attached `Amanda-Waitlist-Email-Templates.pdf`; `/mnt/data/amanda-waitlist-email-templates.md` was absent. Text notification adapted from its supplied snippet. User's exact subject requirement takes precedence over PDF's student-name suffix. The PDF's invented owner waitlist URL is omitted because no matching admin view exists.

### Unverified test plans

**W — Waitlist:** Configure authorized runtime Airtable and Amanda Gmail credentials securely. Submit one approved test per registered NOT READY interest as a logged-out user, confirm all five fields in the dedicated table, Amanda recipient and exact subject, and exact confirmation. Verify Gmail/save errors never show success. Confirm no Stripe session, purchase assignment or learning access is created; test mobile keyboard/labels.

**A — Existing destination/access:** Use approved learner, administrator and other audience QA accounts to open each row's destination and exercise the label's action with tenant-owned fixtures. Check original login return URL, purchased READY unlock, unpurchased READY checkout, NOT READY waitlist, class-date countdown and administrator-only evidence review. Verify cross-tenant access denied. External Jane/RIMAN/review links require live provider checks. Founder Clarity, Eva and Settings retain the stated limited existing functions; do not claim broader completion.

**Repository checks:** Resolve the existing shared lint/type/tenant-safety blockers in their authorized scope, then run full lint, type check and tenant suite. Overall remains HOLD until all required access and live functions are verified.

Latest repository type-check re-run exited nonzero with 342 diagnostics; no diagnostics referenced this change’s waitlist, Gmail, menu or public-page files. Full type safety remains Unverified (Repository checks plan).
