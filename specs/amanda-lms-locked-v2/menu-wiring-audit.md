# Menu wiring audit — after menu-aware fixes
Overall: FAIL / HOLD. Source wiring improvements pass the policy tests, but no live-function certification is claimed.
Required unresolved inputs: approved mentorship scheduling URL, shipping rate schedule, approved purchased READY learner for live QA.
## Public navigation
| Label | Expected route | Actual route / component | Source result | Fix or verification needed |
|---|---|---|---|---|
| Amanda Catherine | Page section | `#top` in `app/amanda-catherine/page.tsx` | PASS: section exists | Mobile/browser test |
| Meet Amanda | Page section | `#about` in `app/amanda-catherine/page.tsx` | PASS: section exists | Mobile/browser test |
| Restore | Page section | `#restore` in `app/amanda-catherine/page.tsx` | PASS: section exists | Mobile/browser test |
| Jane | Page section | `#jane` in `app/amanda-catherine/page.tsx` | PASS: section exists | Mobile/browser test |
| Learn | Page section | `#learn` in `app/amanda-catherine/page.tsx` | PASS: section exists | Mobile/browser test |
| Courses | Page section | `#academy` in `app/amanda-catherine/page.tsx` | PASS: section exists | Mobile/browser test |
| Create | Page section | `#create` in `app/amanda-catherine/page.tsx` | PASS: section exists | Mobile/browser test |
| Contact | Page section | `#contact` in `app/amanda-catherine/page.tsx` | PASS: section exists | Mobile/browser test |
| Book | Approved Jane booking | configured Jane URL | UNVERIFIED | External/live test |
Public footer: branding and disclaimer only, no menu links. Separate mobile navigation is not defined in this public page component; mobile render is unverified.
## Course and support wiring
| Label / state | Expected route | Actual route found | PASS/FAIL | Fix needed |
|---|---|---|---|---|
| My Courses / purchased READY | /portal/amanda-catherine/learning/[courseId] | Same; server assignment + readiness check | PASS: policy test | Live learner test |
| View Course / unpurchased READY | /courses/[course-slug] | Same; checkout with kit fields | PASS: policy test | Live checkout test; shipping approval |
| Join Waitlist / non-READY | /courses/[course-slug]#waitlist | Same; waitlist form only | PASS: policy test | Browser + persistence test |
| Portal sign-in | /portal/login?next=[original URL] -> original URL | Middleware + shared login/2FA return policy | UNVERIFIED end-to-end | Smoke tests added; approved test account/browser needed |
| Support | messaging + email + mentorship booking | /portal/amanda-catherine/messaging, mailto, configured booking | FAIL | Supply approved booking URL |
Support wording is exact; clock uses training date. No unlimited phone/text or accreditation claims found in inspected Amanda application surfaces.
## Owner menu
| Menu label | Expected function | Actual destination | PASS/FAIL | Fix needed |
|---|---|---|---|---|
| Dashboard | Dashboard operation | `/portal/amanda-catherine/owner` | UNVERIFIED: placeholder removed | Test entitlement, role and intended function |
| Update Hub | Update Hub operation | `/portal/amanda-catherine/updates` | UNVERIFIED: placeholder removed | Test entitlement, role and intended function |
| Appointments / Jane | Appointments / Jane operation | `/portal/amanda-catherine/calendar` | UNVERIFIED: placeholder removed | Test entitlement, role and intended function |
| Clients | Clients operation | `/portal/amanda-catherine/intake` | UNVERIFIED: placeholder removed | Test entitlement, role and intended function |
| AesthetiKine Academy | AesthetiKine Academy operation | `/portal/amanda-catherine/owner/academy` | UNVERIFIED: placeholder removed | Test entitlement, role and intended function |
| Practitioner Starter Kit | Practitioner Starter Kit operation | `/portal/amanda-catherine/owner/practitioner-kit` | UNVERIFIED: placeholder removed | Test entitlement, role and intended function |
| LIFELINE | LIFELINE operation | `/portal/amanda-catherine/owner/lifeline` | UNVERIFIED: placeholder removed | Test entitlement, role and intended function |
| Empower Art Collective | Empower Art Collective operation | `/portal/amanda-catherine/events` | UNVERIFIED: placeholder removed | Test entitlement, role and intended function |
| Founder Advisory | Founder Advisory operation | `/portal/amanda-catherine/owner/advisory` | UNVERIFIED: placeholder removed | Test entitlement, role and intended function |
| Founder Clarity | Founder Clarity operation | `/portal/amanda-catherine/owner/advisory` | UNVERIFIED: placeholder removed | Test entitlement, role and intended function |
| Speaking & Media | Speaking & Media operation | `/portal/amanda-catherine/owner/speaking` | UNVERIFIED: placeholder removed | Test entitlement, role and intended function |
| The Entrepreneurial Artist | The Entrepreneurial Artist operation | `/portal/amanda-catherine/owner/book` | UNVERIFIED: placeholder removed | Test entitlement, role and intended function |
| RIMAN Canada | RIMAN Canada operation | `https://mall.riman.com/amandacatherine/home?country=CA&lang=en-CA` | UNVERIFIED: placeholder removed | Test entitlement, role and intended function |
| Reviews & Testimonials | Reviews & Testimonials operation | `https://share.google/9Pw2JCYOXwcQeCDtY` | UNVERIFIED: placeholder removed | Test entitlement, role and intended function |
| Documents & Certifications | Documents & Certifications operation | `/portal/amanda-catherine/owner/documents` | UNVERIFIED: placeholder removed | Test entitlement, role and intended function |
| Marketing | Marketing operation | `/portal/amanda-catherine/amplifi` | UNVERIFIED: placeholder removed | Test entitlement, role and intended function |
| Business Insights | Business Insights operation | `/portal/amanda-catherine/reports` | UNVERIFIED: placeholder removed | Test entitlement, role and intended function |
| Eva (AI Assistant) | Eva (AI Assistant) operation | `/portal/amanda-catherine/updates#eva` | UNVERIFIED: placeholder removed | Test entitlement, role and intended function |
| Settings | Settings operation | `/portal/amanda-catherine/settings` | UNVERIFIED: placeholder removed | Test entitlement, role and intended function |
All former placeholders were in app/portal/amanda-catherine/owner/[section]/page.tsx. Destination components are app/portal/[slug]/{module}/page.tsx, existing owner queues, and approved RIMAN/Google links. Founder Clarity uses the existing Founder Advisory queue; confirm this shared function before passing. Settings remains an existing limited preferences surface. Eva remains the existing website update assistant.
## Learner non-course menu inventory
Component: app/portal/[slug]/member/AmandaMemberHome.tsx. Other labels remain from AMANDA_ROLE_DASHBOARDS.
| Audience | Menu label | Actual route | Result |
|---|---|---|---|
| client | private-deliveries | `/portal/amanda-catherine/deliveries` | UNVERIFIED: live function |
| client | appointments | `/portal/amanda-catherine/calendar` | UNVERIFIED: live function |
| client | forms-and-consents | `/portal/amanda-catherine/intake` | UNVERIFIED: live function |
| client | preparation-and-aftercare | `/portal/amanda-catherine/member` | FAIL: generic fallback requires intended function |
| client | wellness-plan | `/portal/amanda-catherine/member` | FAIL: generic fallback requires intended function |
| client | packages-and-sessions | `/portal/amanda-catherine/billing` | UNVERIFIED: live function |
| client | payments-and-receipts | `/portal/amanda-catherine/billing` | UNVERIFIED: live function |
| client | messages | `/portal/amanda-catherine/messaging` | UNVERIFIED: live function |
| client | support-and-mentorship | `/portal/amanda-catherine/support` | UNVERIFIED: live function |
| student-trainee | private-deliveries | `/portal/amanda-catherine/deliveries` | UNVERIFIED: live function |
| student-trainee | training-calendar | `/portal/amanda-catherine/calendar` | UNVERIFIED: live function |
| student-trainee | document-upload | `/portal/amanda-catherine/documents` | UNVERIFIED: live function |
| student-trainee | tuition-and-agreements | `/portal/amanda-catherine/billing` | UNVERIFIED: live function |
| student-trainee | instructor-messages | `/portal/amanda-catherine/messaging` | UNVERIFIED: live function |
| student-trainee | support-and-mentorship | `/portal/amanda-catherine/support` | UNVERIFIED: live function |
| certified-practitioner | private-deliveries | `/portal/amanda-catherine/deliveries` | UNVERIFIED: live function |
| certified-practitioner | protocols-and-templates | `/portal/amanda-catherine/documents` | UNVERIFIED: live function |
| certified-practitioner | mentorship | `/portal/amanda-catherine/support` | UNVERIFIED: live function |
| certified-practitioner | practitioner-directory | `/portal/amanda-catherine/reports` | UNVERIFIED: live function |
| certified-practitioner | referrals | `/portal/amanda-catherine/reports` | UNVERIFIED: live function |
| certified-practitioner | professional-opportunities | `/portal/amanda-catherine/member` | FAIL: generic fallback requires intended function |
| certified-practitioner | product-ordering | `/portal/amanda-catherine/billing` | UNVERIFIED: live function |
| certified-practitioner | support-and-mentorship | `/portal/amanda-catherine/support` | UNVERIFIED: live function |
| member-community-participant | private-deliveries | `/portal/amanda-catherine/deliveries` | UNVERIFIED: live function |
| member-community-participant | member-profile | `/portal/amanda-catherine/member` | FAIL: generic fallback requires intended function |
| member-community-participant | member-resources | `/portal/amanda-catherine/resources` | UNVERIFIED: live function |
| member-community-participant | events | `/portal/amanda-catherine/events` | UNVERIFIED: live function |
| member-community-participant | announcements | `/portal/amanda-catherine/messaging` | UNVERIFIED: live function |
| member-community-participant | community-directory | `/portal/amanda-catherine/reports` | UNVERIFIED: live function |
| member-community-participant | groups-and-discussions | `/portal/amanda-catherine/member` | FAIL: generic fallback requires intended function |
| member-community-participant | mentorship-and-collaboration | `/portal/amanda-catherine/support` | UNVERIFIED: live function |
| member-community-participant | support-and-mentorship | `/portal/amanda-catherine/support` | UNVERIFIED: live function |
| media-guest | private-deliveries | `/portal/amanda-catherine/deliveries` | UNVERIFIED: live function |
| media-guest | media-application | `/portal/amanda-catherine/intake` | UNVERIFIED: live function |
| media-guest | package-and-payment | `/portal/amanda-catherine/billing` | UNVERIFIED: live function |
| media-guest | asset-upload | `/portal/amanda-catherine/documents` | UNVERIFIED: live function |
| media-guest | media-release | `/portal/amanda-catherine/documents` | UNVERIFIED: live function |
| media-guest | interview-schedule | `/portal/amanda-catherine/calendar` | UNVERIFIED: live function |
| media-guest | production-status | `/portal/amanda-catherine/billing` | UNVERIFIED: live function |
| media-guest | media-delivery | `/portal/amanda-catherine/deliveries` | UNVERIFIED: live function |
| media-guest | launch-updates | `/portal/amanda-catherine/member` | FAIL: generic fallback requires intended function |
| media-guest | support-and-mentorship | `/portal/amanda-catherine/support` | UNVERIFIED: live function |
| volunteer | private-deliveries | `/portal/amanda-catherine/deliveries` | UNVERIFIED: live function |
| volunteer | volunteer-application | `/portal/amanda-catherine/intake` | UNVERIFIED: live function |
| volunteer | onboarding-forms | `/portal/amanda-catherine/intake` | UNVERIFIED: live function |
| volunteer | schedule-and-assignments | `/portal/amanda-catherine/calendar` | UNVERIFIED: live function |
| volunteer | policies-and-training | `/portal/amanda-catherine/learning` | UNVERIFIED: live function |
| volunteer | coordinator-messages | `/portal/amanda-catherine/messaging` | UNVERIFIED: live function |
| volunteer | participation-hours | `/portal/amanda-catherine/member` | FAIL: generic fallback requires intended function |
| volunteer | support-and-mentorship | `/portal/amanda-catherine/support` | UNVERIFIED: live function |
| vendor-partner | private-deliveries | `/portal/amanda-catherine/deliveries` | UNVERIFIED: live function |
| vendor-partner | partner-application | `/portal/amanda-catherine/intake` | UNVERIFIED: live function |
| vendor-partner | required-documents | `/portal/amanda-catherine/documents` | UNVERIFIED: live function |
| vendor-partner | agreements | `/portal/amanda-catherine/member` | FAIL: generic fallback requires intended function |
| vendor-partner | event-registration | `/portal/amanda-catherine/events` | UNVERIFIED: live function |
| vendor-partner | invoices-and-payments | `/portal/amanda-catherine/billing` | UNVERIFIED: live function |
| vendor-partner | team-messages | `/portal/amanda-catherine/messaging` | UNVERIFIED: live function |
| vendor-partner | support-and-mentorship | `/portal/amanda-catherine/support` | UNVERIFIED: live function |
| staff | assigned-work | `/portal/amanda-catherine/member` | FAIL: generic fallback requires intended function |
| staff | appointments | `/portal/amanda-catherine/calendar` | UNVERIFIED: live function |
| staff | applications | `/portal/amanda-catherine/intake` | UNVERIFIED: live function |
| staff | courses-and-certifications | `/portal/amanda-catherine/learning` | UNVERIFIED: live function |
| staff | memberships-and-events | `/portal/amanda-catherine/events` | UNVERIFIED: live function |
| staff | messages-and-announcements | `/portal/amanda-catherine/messaging` | UNVERIFIED: live function |
| staff | people-and-leads | `/portal/amanda-catherine/reports` | UNVERIFIED: live function |
| staff | reports | `/portal/amanda-catherine/reports` | UNVERIFIED: live function |
| staff | support-and-mentorship | `/portal/amanda-catherine/support` | UNVERIFIED: live function |
| admin | executive-overview | `/portal/amanda-catherine/member` | FAIL: generic fallback requires intended function |
| admin | users-and-permissions | `/portal/amanda-catherine/member` | FAIL: generic fallback requires intended function |
| admin | crm-and-lead-stages | `/portal/amanda-catherine/reports` | UNVERIFIED: live function |
| admin | appointments | `/portal/amanda-catherine/calendar` | UNVERIFIED: live function |
| admin | applications-and-forms | `/portal/amanda-catherine/intake` | UNVERIFIED: live function |
| admin | payments-and-balances | `/portal/amanda-catherine/billing` | UNVERIFIED: live function |
| admin | courses-progress-and-certifications | `/portal/amanda-catherine/learning` | UNVERIFIED: live function |
| admin | memberships-events-and-media | `/portal/amanda-catherine/events` | UNVERIFIED: live function |
| admin | automations-and-communications | `/portal/amanda-catherine/member` | FAIL: generic fallback requires intended function |
| admin | reports-and-follow-ups | `/portal/amanda-catherine/reports` | UNVERIFIED: live function |
| admin | support-and-mentorship | `/portal/amanda-catherine/support` | UNVERIFIED: live function |
