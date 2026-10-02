# Amanda menu wiring audit — locked v2.1 final

Overall: **HOLD / NOT PASS**. Re-running the audit does not make absent functions or untested access rules pass. Starting local commit: 7a8bb50. Same existing review branch; no merge or production promotion.

## Current authority and inputs

`SOURCE_OF_TRUTH_v2.1_FINAL.md` is the exact extracted final approval. It supersedes v2.0 shipping/scheduling values. Shipping is FREE for now for both pickup and shipment. No final paid rates are required for this release. Shipping address capture remains required for shipment. Old `AMANDA_KIT_SHIPPING_RATE_IDS_JSON` is ignored; no shipping-rate lookup, creation or paid charge logic remains.

Support uses existing Jane booking (`https://aesthetikine.janeapp.com/`, or a valid Jane URL from `AMANDA_JANE_BOOKING_URL`) and Amanda’s existing Gmail account (`amandacatherinec@gmail.com`). The example scheduling placeholder is removed. Exact support sentence and training-date clock are unchanged. Gmail-address email linking is implemented; no Gmail OAuth/mailbox backend is present, so Gmail integration and actual scheduling/delivery are not live-certified.

## Observed tests and limits

| Check | Result |
|---|---|
| All configured purchased/readiness routes; unknown/non-READY overrides | Runtime policy PASS; logged-in entitlement/unlock UNVERIFIED |
| Pickup and shipment $0, address retention, obsolete paid config ignored | Runtime PASS, including real order-recorder validation in preview mode; paid-shipping/unpaid/wrong-total/other-tenant/missing-address fixtures rejected. Live Stripe transaction and production persistence UNVERIFIED |
| Jane provider URL validation, Gmail-address link, exact support sentence, class-date end date | Render/policy PASS; actual Jane booking and Gmail integration UNVERIFIED |
| Member resource selection | Runtime PASS: no resources for unpurchased or non-READY courses; only purchased READY materials selected; duplicate assignments deduplicated |
| Existing checkout configuration | PASS; no live payment attempted |
| Targeted lint | PASS: 0 errors; 1 existing kit-page image warning |
| New profile logged-out local HTTP | PASS: 307 to `/portal/login?next=%2Fportal%2Famanda-catherine%2Fprofile%3Fview%3Daccount`; path/query preserved |
| Previous purchased course logged-out local HTTP | Observed in prior repair: 307 retained original course path/query; authenticated login still UNVERIFIED |
| Repository-wide lint | BLOCKED: missing `react-hooks` plugin for `react-hooks/set-state-in-effect`; exit 2 |
| Repository-wide type check | FAIL: 342 diagnostics; no diagnostics found in changed files in inspected log |
| Tenant safety | FAIL: unchanged `scripts/test-tenant-safety.mjs:86` expects empty production entitlements, shared module returns `withChassisStandardModules([])` |
| Authenticated learner/admin, password/2FA return, payments, mobile, waitlist persistence, all menus | UNVERIFIED: no approved QA access supplied; no browser runtime available |

## Three formerly unavailable functions connected

| Label | Actual implementation | Verified boundary / remaining check |
|---|---|---|
| Member Profile | New thin page reuses `requirePortalModule` and signed-in session identity; shows own session email, portal, role | Exact Amanda tenant guard, missing email returns login; authenticated rendering UNVERIFIED |
| Product Ordering | Existing `/amanda-catherine/private/practitioner-kit` + KitCheckout + existing public kit checkout API | Existing product/price preserved; free shipment policy tested; live purchase UNVERIFIED |
| Member Resources | Thin Amanda resource view reuses durable course assignments, approved resource catalog and existing protected download API | Only purchased READY resources selected. API rechecks access; no new grants. Authenticated file downloads UNVERIFIED |

Protocols & Templates also now uses the protected Amanda resource view. Course/progress/certification groups remain per-course purchase/readiness aware for every role. Management/approval actions remain separate from purchased learner access. No “Portal destination established” JSX remains; routing a label somewhere unrelated would not repair its missing function.

## 14 remaining unavailable workflows — blocking PASS

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
| Dashboard | `/portal/amanda-catherine/owner` | HOLD: Existing owner metrics and actions; live data/roles unverified |
| Update Hub | `/portal/amanda-catherine/updates` | HOLD: Existing governed requests, publishing and website updates; live operation unverified |
| Appointments / Jane | `/portal/amanda-catherine/calendar` | HOLD: Jane booking plus shared calendar; Google authorization still required |
| Clients | `/portal/amanda-catherine/intake` | HOLD: Intake review only; full client relationship management not verified |
| AesthetiKine Academy | `/portal/amanda-catherine/owner/academy` | HOLD: Existing authoring link to learning plus certification approval queue; admin API guard inspected |
| Practitioner Starter Kit | `/portal/amanda-catherine/owner/practitioner-kit` | HOLD: Standalone kit checkout and paid-order list; live payment and fulfillment unverified |
| LIFELINE | `/portal/amanda-catherine/owner/lifeline` | HOLD: Filters existing application queue by approved form/program IDs |
| Empower Art Collective | `/portal/amanda-catherine/events` | HOLD: Event hub; broader collective operations not verified |
| Founder Advisory | `/portal/amanda-catherine/owner/advisory` | HOLD: Existing founder-advisory application queue |
| Founder Clarity | `/portal/amanda-catherine/owner/advisory` | HOLD: Shared advisory queue; dedicated 75-minute session flow not established |
| Speaking & Media | `/portal/amanda-catherine/owner/speaking` | HOLD: Existing speaking-media inquiry queue |
| The Entrepreneurial Artist | `/portal/amanda-catherine/owner/book` | HOLD: Existing Amazon and playlist actions; student course action now obeys readiness/purchase policy |
| RIMAN Canada | `https://mall.riman.com/amandacatherine/home?country=CA&lang=en-CA` | HOLD: Existing approved external destination; external function unverified |
| Reviews & Testimonials | `https://share.google/9Pw2JCYOXwcQeCDtY` | HOLD: Existing approved external destination; external function unverified |
| Documents & Certifications | `/portal/amanda-catherine/owner/documents` | HOLD: Existing document-hub link plus admin approval queue; live document/evidence handling unverified |
| Marketing | `/portal/amanda-catherine/amplifi` | HOLD: Existing content creation/review workspace; live authorization/publishing unverified |
| Business Insights | `/portal/amanda-catherine/reports` | HOLD: Existing operations metrics/queues; data and access unverified |
| Eva (AI Assistant) | `/portal/amanda-catherine/updates#eva` | HOLD: Existing website-update assistant; general business-assistant scope not established |
| Settings | `/portal/amanda-catherine/settings` | HOLD: Branding/notification guidance and business-presence panel; not full self-serve settings |

## Complete member menu inventory

| Audience | Label | Actual destination | Evidence |
|---|---|---|---|
| client | private-deliveries | `/portal/amanda-catherine/deliveries` | Source function inspected; live action / role UNVERIFIED |
| client | appointments | `/portal/amanda-catherine/calendar` | Source function inspected; live action / role UNVERIFIED |
| client | forms-and-consents | `/portal/amanda-catherine/intake` | Source function inspected; live action / role UNVERIFIED |
| client | preparation-and-aftercare | Visible unavailable label; no invented destination | HOLD: existing matching implementation not found |
| client | wellness-plan | Visible unavailable label; no invented destination | HOLD: existing matching implementation not found |
| client | packages-and-sessions | `/portal/amanda-catherine/billing` | Source function inspected; live action / role UNVERIFIED |
| client | payments-and-receipts | `/portal/amanda-catherine/billing` | Source function inspected; live action / role UNVERIFIED |
| client | messages | `/portal/amanda-catherine/messaging` | Source function inspected; live action / role UNVERIFIED |
| client | support-and-mentorship | `/portal/amanda-catherine/support` | Source function inspected; live action / role UNVERIFIED |
| student-trainee | private-deliveries | `/portal/amanda-catherine/deliveries` | Source function inspected; live action / role UNVERIFIED |
| student-trainee | courses | Per-course `getCourseMenuRoute(course, user)` | POLICY PASS; authenticated function UNVERIFIED |
| student-trainee | training-calendar | `/portal/amanda-catherine/calendar` | Source function inspected; live action / role UNVERIFIED |
| student-trainee | assignments-and-assessments | Per-course `getCourseMenuRoute(course, user)` | POLICY PASS; authenticated function UNVERIFIED |
| student-trainee | document-upload | `/portal/amanda-catherine/ctp/documents` | Source function inspected; live action / role UNVERIFIED |
| student-trainee | tuition-and-agreements | `/portal/amanda-catherine/billing` | Source function inspected; live action / role UNVERIFIED |
| student-trainee | progress | Per-course `getCourseMenuRoute(course, user)` | POLICY PASS; authenticated function UNVERIFIED |
| student-trainee | certification | Per-course `getCourseMenuRoute(course, user)` | POLICY PASS; authenticated function UNVERIFIED |
| student-trainee | instructor-messages | `/portal/amanda-catherine/messaging` | Source function inspected; live action / role UNVERIFIED |
| student-trainee | support-and-mentorship | `/portal/amanda-catherine/support` | Source function inspected; live action / role UNVERIFIED |
| certified-practitioner | private-deliveries | `/portal/amanda-catherine/deliveries` | Source function inspected; live action / role UNVERIFIED |
| certified-practitioner | protocols-and-templates | `/portal/amanda-catherine/resources` | Source function inspected; live action / role UNVERIFIED |
| certified-practitioner | advanced-training | Per-course `getCourseMenuRoute(course, user)` | POLICY PASS; authenticated function UNVERIFIED |
| certified-practitioner | mentorship | `/portal/amanda-catherine/support` | Source function inspected; live action / role UNVERIFIED |
| certified-practitioner | certificates | Per-course `getCourseMenuRoute(course, user)` | POLICY PASS; authenticated function UNVERIFIED |
| certified-practitioner | practitioner-directory | Visible unavailable label; no invented destination | HOLD: existing matching implementation not found |
| certified-practitioner | referrals | Visible unavailable label; no invented destination | HOLD: existing matching implementation not found |
| certified-practitioner | professional-opportunities | Visible unavailable label; no invented destination | HOLD: existing matching implementation not found |
| certified-practitioner | product-ordering | `/amanda-catherine/private/practitioner-kit` | Source function inspected; live action / role UNVERIFIED |
| certified-practitioner | support-and-mentorship | `/portal/amanda-catherine/support` | Source function inspected; live action / role UNVERIFIED |
| member-community-participant | private-deliveries | `/portal/amanda-catherine/deliveries` | Source function inspected; live action / role UNVERIFIED |
| member-community-participant | member-profile | `/portal/amanda-catherine/profile` | Source function inspected; live action / role UNVERIFIED |
| member-community-participant | member-resources | `/portal/amanda-catherine/resources` | Source function inspected; live action / role UNVERIFIED |
| member-community-participant | events | `/portal/amanda-catherine/events?tab=events` | Source function inspected; live action / role UNVERIFIED |
| member-community-participant | announcements | `/portal/amanda-catherine/messaging` | Source function inspected; live action / role UNVERIFIED |
| member-community-participant | community-directory | Visible unavailable label; no invented destination | HOLD: existing matching implementation not found |
| member-community-participant | groups-and-discussions | Visible unavailable label; no invented destination | HOLD: existing matching implementation not found |
| member-community-participant | mentorship-and-collaboration | `/portal/amanda-catherine/support` | Source function inspected; live action / role UNVERIFIED |
| member-community-participant | support-and-mentorship | `/portal/amanda-catherine/support` | Source function inspected; live action / role UNVERIFIED |
| media-guest | private-deliveries | `/portal/amanda-catherine/deliveries` | Source function inspected; live action / role UNVERIFIED |
| media-guest | media-application | `/portal/amanda-catherine/applications` | Source function inspected; live action / role UNVERIFIED |
| media-guest | package-and-payment | `/portal/amanda-catherine/billing` | Source function inspected; live action / role UNVERIFIED |
| media-guest | asset-upload | `/portal/amanda-catherine/ctp/documents` | Source function inspected; live action / role UNVERIFIED |
| media-guest | media-release | `/portal/amanda-catherine/documents` | Source function inspected; live action / role UNVERIFIED |
| media-guest | interview-schedule | `/portal/amanda-catherine/calendar` | Source function inspected; live action / role UNVERIFIED |
| media-guest | production-status | Visible unavailable label; no invented destination | HOLD: existing matching implementation not found |
| media-guest | media-delivery | `/portal/amanda-catherine/deliveries` | Source function inspected; live action / role UNVERIFIED |
| media-guest | launch-updates | `/portal/amanda-catherine/messaging` | Source function inspected; live action / role UNVERIFIED |
| media-guest | support-and-mentorship | `/portal/amanda-catherine/support` | Source function inspected; live action / role UNVERIFIED |
| volunteer | private-deliveries | `/portal/amanda-catherine/deliveries` | Source function inspected; live action / role UNVERIFIED |
| volunteer | volunteer-application | `/portal/amanda-catherine/applications` | Source function inspected; live action / role UNVERIFIED |
| volunteer | onboarding-forms | `/portal/amanda-catherine/intake` | Source function inspected; live action / role UNVERIFIED |
| volunteer | schedule-and-assignments | Visible unavailable label; no invented destination | HOLD: existing matching implementation not found |
| volunteer | policies-and-training | Visible unavailable label; no invented destination | HOLD: existing matching implementation not found |
| volunteer | coordinator-messages | `/portal/amanda-catherine/messaging` | Source function inspected; live action / role UNVERIFIED |
| volunteer | participation-hours | Visible unavailable label; no invented destination | HOLD: existing matching implementation not found |
| volunteer | support-and-mentorship | `/portal/amanda-catherine/support` | Source function inspected; live action / role UNVERIFIED |
| vendor-partner | private-deliveries | `/portal/amanda-catherine/deliveries` | Source function inspected; live action / role UNVERIFIED |
| vendor-partner | partner-application | `/portal/amanda-catherine/applications` | Source function inspected; live action / role UNVERIFIED |
| vendor-partner | required-documents | `/portal/amanda-catherine/documents` | Source function inspected; live action / role UNVERIFIED |
| vendor-partner | agreements | `/portal/amanda-catherine/documents` | Source function inspected; live action / role UNVERIFIED |
| vendor-partner | event-registration | `/portal/amanda-catherine/events?tab=events` | Source function inspected; live action / role UNVERIFIED |
| vendor-partner | invoices-and-payments | `/portal/amanda-catherine/billing` | Source function inspected; live action / role UNVERIFIED |
| vendor-partner | team-messages | `/portal/amanda-catherine/messaging` | Source function inspected; live action / role UNVERIFIED |
| vendor-partner | support-and-mentorship | `/portal/amanda-catherine/support` | Source function inspected; live action / role UNVERIFIED |
| staff | assigned-work | Visible unavailable label; no invented destination | HOLD: existing matching implementation not found |
| staff | appointments | `/portal/amanda-catherine/calendar` | Source function inspected; live action / role UNVERIFIED |
| staff | applications | `/portal/amanda-catherine/applications` | Source function inspected; live action / role UNVERIFIED |
| staff | courses-and-certifications | Per-course `getCourseMenuRoute(course, user)` | POLICY PASS; authenticated function UNVERIFIED |
| staff | memberships-and-events | `/portal/amanda-catherine/events?tab=events` | Source function inspected; live action / role UNVERIFIED |
| staff | messages-and-announcements | `/portal/amanda-catherine/messaging` | Source function inspected; live action / role UNVERIFIED |
| staff | people-and-leads | `/portal/amanda-catherine/reports` | Source function inspected; live action / role UNVERIFIED |
| staff | reports | `/portal/amanda-catherine/reports` | Source function inspected; live action / role UNVERIFIED |
| staff | support-and-mentorship | `/portal/amanda-catherine/support` | Source function inspected; live action / role UNVERIFIED |
| admin | amplifi | `/portal/amanda-catherine/amplifi` | Source function inspected; live action / role UNVERIFIED |
| admin | executive-overview | `/portal/amanda-catherine/owner` | Source function inspected; live action / role UNVERIFIED |
| admin | users-and-permissions | Visible unavailable label; no invented destination | HOLD: existing matching implementation not found |
| admin | crm-and-lead-stages | `/portal/amanda-catherine/reports` | Source function inspected; live action / role UNVERIFIED |
| admin | appointments | `/portal/amanda-catherine/calendar` | Source function inspected; live action / role UNVERIFIED |
| admin | applications-and-forms | `/portal/amanda-catherine/applications` | Source function inspected; live action / role UNVERIFIED |
| admin | payments-and-balances | `/portal/amanda-catherine/billing` | Source function inspected; live action / role UNVERIFIED |
| admin | courses-progress-and-certifications | Per-course `getCourseMenuRoute(course, user)` | POLICY PASS; authenticated function UNVERIFIED |
| admin | memberships-events-and-media | `/portal/amanda-catherine/events?tab=events` | Source function inspected; live action / role UNVERIFIED |
| admin | automations-and-communications | Visible unavailable label; no invented destination | HOLD: existing matching implementation not found |
| admin | reports-and-follow-ups | `/portal/amanda-catherine/reports` | Source function inspected; live action / role UNVERIFIED |
| admin | support-and-mentorship | `/portal/amanda-catherine/support` | Source function inspected; live action / role UNVERIFIED |

## Public navigation and live acceptance

Public anchors and approved branding/assets/prices remain unchanged. Existing per-course sales/waitlist and server assignment/readiness guards remain. Public/mobile interactions and external Jane actions require browser verification. The four READY approvals, separate certifications, exact support sentence and administrator evidence approval remain mandatory.

PASS requires approved implementations or requirements for the 14 missing workflows, Gmail integration details/access, approved purchased READY learner and administrator QA access, resolved shared verification blockers and observed authenticated/payment/mobile menu behavior. No credentials in reports or commits. Review push is authorized; merge and production promotion are not.
