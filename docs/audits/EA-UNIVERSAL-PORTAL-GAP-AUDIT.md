# EA Universal Portal Capability Gap Audit

**Status:** Read-only audit — no implementation performed  
**Audited branch:** `master`  
**Audited commit:** `38fa48181389a2f25fa1fba7062fc7087a03974c`  
**Audit date:** 2026-07-25  
**Repository:** `ea-payments`  

### Verification boundaries

| Kind | Scope |
|---|---|
| **Source-code verification** | Routes, libs, registries, APIs, schemas cited below |
| **Test verification** | Named where contracts/certs exist; not re-run for this audit |
| **Runtime verification** | **Not performed** for this audit (except prior knowledge that pretix webhook route exists on prod for this SHA) |
| **Assumptions** | Marked explicitly |
| **Unverified claims** | None presented as facts |

**Inspection counts (approximate, this pass):**

| Surface | Count / note |
|---|---|
| Portal `page.tsx` under `app/portal` | ~37 |
| Portal API `route.ts` under `app/api/portal` | ~35 |
| Module IDs in registry | 17 |
| Platform roles | 6 |
| `PLATFORM_CLIENT_CONFIGS` presets | 10 (`ea`, `cpr`, `etfm`, `3hc`, `bob-rumball`, `church`, `coach`, `nonprofit`, `small-business`, `association`) |
| Capability registry entries | 17 |
| Industries in user target list | 22 |

---

## 1. Executive Verdict

**EA today has a partially reusable portal system — not a true Universal Portal Chassis, and not “only a visual shell.”**

### Evidence supporting the verdict

**What is real (chassis foundations):**

1. **Module registry + entitlements + RBAC + slug sessions**  
   - `lib/modules/registry.ts` — 17 `ModuleId`s, package grants, tenant presets  
   - `lib/modules/portal-modules.ts` — `resolvePortalModuleAccess`, `requirePortalModule`, role filter via `roleAtLeast`  
   - `lib/rbac.ts` — `owner|admin|manager|staff|viewer|guest`  
   - HMAC portal sessions + slug isolation (`lib/ea-portal-auth.ts`, `lib/api/portal-route.ts`, `middleware.ts` via `@ea/portal-chassis/middleware`)

2. **Working portal UI shell (local, not vendor HeaderPortalShell)**  
   - `lib/chassis/PortalShell.tsx` / `PortalLayout.tsx`  
   - Dual presentation: Executive workspace vs CTP **Client Experience** (`lib/ctp-client-nav.ts`, `app/portal/components/ClientExperienceNav.tsx`)

3. **Paid provisioning pipeline**  
   - `lib/fulfill-paid-client.ts` → portal access → org → entitlements → Connect → optional website/CTP

4. **Capability map + thin industry presets**  
   - `lib/experience-registry.ts` — EA product capabilities (Simplifi, Amplifi, CTP, …)  
   - `lib/platform/client-configs.ts` — church/coach/nonprofit/small-business/association **terminology stubs** + enable keys (not full industry portals)

**What prevents “Universal Portal Chassis” today:**

1. Modules are **EA product surfaces** (Simplifi, Amplifi, Connect, CTP, Pulse), not the ten universal capabilities (People, Messages as chat, Tasks & Approvals as first-class, etc.).
2. **Industry translation is incomplete** — presets change a few labels (`members`, `startPrompt`); they do not remap navigation to Chapter/Church/School models, roles, or workflows.
3. Several hubs are **launchers / aggregators**, not full systems (Messaging → Update Hub; Event Hub → Calendly/CTP/pretix deep-links; Resources → curated links).
4. **No People / household / member directory** module; Connect relationships are staff-oriented capture, not universal CRM people.
5. **No portal global search, i18n, multi-location, or configurable per-industry nav schema.**
6. Client Experience nav is **hardcoded CTP mental model** (Your Project / Documents / Contact / Help / Journey) — not industry-configurable.

**Verdict label:** **Partially reusable portal system** (strong EA client OS + module chassis; weak universal industry OS).

---

## 2. Existing Capability Inventory

### U1 — Home / Next Action

| Field | Finding |
|---|---|
| **Status** | **PARTIAL** (COMPLETE for CTP Client Experience; PARTIAL for Executive portal) |
| **Routes** | `/portal/[slug]` (`app/portal/[slug]/page.tsx`); CTP Progress `/portal/[slug]/ctp/progress` |
| **Components / APIs** | Guide NBA: `lib/ctp-guide-progress.ts`, `lib/ctp-opportunity-view.ts`, `lib/project-state-engine.ts`; Client Experience: `app/portal/components/ClientExperience.tsx` |
| **Data source** | CTP submissions / project evidence; Pulse for activity |
| **Permissions** | `requirePortalModule` / Client Experience gate via CTP submission |
| **Evidence** | NBA kinds (`meeting`, `upload`, `approval`, `payment`, `celebrate`, …) in `lib/ctp-guide-progress.ts`; `nothingRequired` pattern |
| **Limitations** | NBA is **CTP/Guide-shaped**, not a universal “Home” for churches/schools/creators. Executive dashboard is product pulse, not industry home. |

### U2 — People

| Field | Finding |
|---|---|
| **Status** | **PARTIAL** / largely **MISSING** as universal People |
| **Routes** | Connect public capture `/connect/[slug]`; portal Connect kit `/portal/[slug]/connect` (staff+); no `/people` or `/members` directory module |
| **Components / APIs** | `lib/connect-store.ts` relationships; `lib/memberships.ts` (org membership roles only); `app/api/portal/profile/route.ts` |
| **Data source** | Connect Relationships (Airtable/memory); Memberships table; Client Records |
| **Permissions** | Connect manage ≥ staff; profile = session user |
| **Evidence** | `ConnectRelationship` fields (name, email, status, leadType, …); `Membership` = org role, not member roster |
| **Limitations** | No households, family/authorized-rep links, chapter member status, patient/client panels, or multi-party people graph for industries. |

### U3 — Messages

| Field | Finding |
|---|---|
| **Status** | **PARTIAL** (launcher, not messaging product) |
| **Routes** | `/portal/[slug]/messaging`; CTP `/portal/[slug]/ctp/messages`; `/portal/[slug]/updates` |
| **Components / APIs** | `lib/portal-messaging-hub.ts` — **explicit:** “Update Hub is the real advisor thread (no second store)” |
| **Data source** | Content Requests / Update Hub feed |
| **Permissions** | module `messaging` (guest+) |
| **Evidence** | `listPortalMessagingThreads` maps content requests → “threads” linking to updates |
| **Limitations** | No DMs, group chat, chapter announcements channel, or conversation store. **DUPLICATE surface:** executive messaging vs CTP messages (both contact/help shaped). |

### U4 — Tasks & Approvals

| Field | Finding |
|---|---|
| **Status** | **PARTIAL** |
| **Routes / APIs** | Connect tasks `app/api/portal/connect/tasks/route.ts`, `ConnectTaskBoard`; Amplifi `submit-for-approval`; Trust/e-sign webhooks; Guide NBA approval/payment kinds |
| **Data source** | Connect follow-up tasks; content request status; eSignatures / Trust Engine |
| **Permissions** | Connect tasks ≥ staff; Amplifi approval requires amplifi entitlement |
| **Evidence** | `lib/connect-tasks.ts`; `app/api/portal/amplifi/submit-for-approval/route.ts`; Trust MSA/SOW flows |
| **Limitations** | No universal task inbox for all roles; no committee voting; no generic approval workflow engine across modules. |

### U5 — Calendar & Scheduling

| Field | Finding |
|---|---|
| **Status** | **PARTIAL** |
| **Routes** | `/portal/[slug]/events`; CTP schedule/review; Simplifi calendar (`app/simplifi/calendar/page.tsx` — product, not portal module) |
| **APIs / libs** | `lib/portal-event-hub.ts`, pretix `lib/events/*`, `app/api/webhooks/pretix`, Calendly via `lib/ctp-calendly.ts` |
| **Data source** | pretix shop URLs + env seed; CTP schedule; Connect journey event names |
| **Permissions** | events guest+; pretix staff configure |
| **Evidence** | pretix integration docs `docs/integrations/PRETIX-EVENT-ENGINE.md`; Event Hub lists deep-links |
| **Limitations** | No first-party calendar DB, attendance, rooms, or school bell schedule. Registration = pretix (external). |

### U6 — Documents & Forms

| Field | Finding |
|---|---|
| **Status** | **PARTIAL** |
| **Routes** | `/portal/[slug]/documents`; `/portal/[slug]/ctp/documents`; Trust Center / legal pages |
| **Libs** | `lib/portal-document-hub.ts`, `lib/ctp-documents-view.ts`, Trust Engine (`lib/trust-engine/*`), eSignatures webhook |
| **Data source** | CTP uploads/deliverables; Update Hub attachments; training titles; legal acceptances |
| **Permissions** | documents guest+; legal gates product-specific |
| **Evidence** | Document hub aggregates CTP vault + training + requests; Stripe billing separate |
| **Limitations** | No general form builder, application workflows, versioned DMS ACLs, or industry form packs. E-sign is MSA/SOW-oriented, not arbitrary portal forms. |

### U7 — Programs / Projects / Services

| Field | Finding |
|---|---|
| **Status** | **PARTIAL** (strong for EA CTP/Simplifi/Connect; not universal Programs) |
| **Routes** | CTP tree under `/portal/[slug]/ctp/*`; Simplifi portal workspace; Connect campaigns; Amplifi; member; landing |
| **Libs** | `lib/project-state-engine.ts`, opportunity views, Connect campaigns, Simplifi objects |
| **Data source** | CTP submissions, opportunities, captures, Connect |
| **Permissions** | module + role gated |
| **Evidence** | CTP stages, Simplifi opportunities, Connect journey templates |
| **Limitations** | “Program” ≠ ministry/class/case management. No generic Program entity for nonprofits/schools. |

### U8 — Progress & Results

| Field | Finding |
|---|---|
| **Status** | **PARTIAL** |
| **Routes** | CTP progress; Pulse `/portal/[slug]/pulse`; admin Mission Control (EA ops, not tenant) |
| **Libs** | Guide progress, outcome tracking, Pulse bus, activity events |
| **Evidence** | `lib/ctp-guide-progress.ts`, `lib/pulse-bus.ts`, `@ea/portal-chassis/platform-events` |
| **Limitations** | Impact/reporting for funders, grades, clinical outcomes, creator analytics — **MISSING**. |

### U9 — Payments & Financial Activity

| Field | Finding |
|---|---|
| **Status** | **PARTIAL** |
| **Routes** | `/portal/[slug]/billing` (owner); checkout/fulfillment elsewhere; pretix for event pay |
| **Evidence** | `BillingPortalButton` → Stripe Customer Portal; `lib/fulfill-paid-client.ts`; Stripe webhooks |
| **Limitations** | No dues, donations, tithes, tuition, commissions ledgers inside portal. Billing = Stripe subscription management for EA packages. Event money = pretix. |

### U10 — Resources & Support

| Field | Finding |
|---|---|
| **Status** | **PARTIAL** |
| **Routes** | `/portal/[slug]/resources`, `/learning`, `/ask`, `/ctp/support` |
| **Evidence** | Resources page = curated EA links (`app/portal/[slug]/resources/page.tsx`); Guide/Ask; CTP FAQ/support views; `lib/ea-guide-tours.ts` (tours exist) |
| **Limitations** | Not a tenant knowledge base; many links are EA product URLs. Escalation is Update Hub / email shaped. |

---

### Shared platform inventory (summary)

| Capability | Status | Key evidence | Limitations |
|---|---|---|---|
| RBAC | **PARTIAL→COMPLETE** for platform ranks | `lib/rbac.ts` | Missing industry roles (parent, volunteer, officer, patient, …) |
| Client / member / employee / admin views | **PARTIAL** | Client Experience vs Executive; admin Command Center | Not multi-persona industry views |
| Configurable navigation | **PARTIAL** | Entitlement-driven nav; Client Experience hardcoded | No industry nav schema; orphan `portal-nav-config.ts` |
| Industry terminology | **PARTIAL** | `PLATFORM_CLIENT_CONFIGS.terminology`; `portal-workspace` chrome labels | Few keys; not full module rename map |
| Module enable/disable | **COMPLETE** | Entitlements + package grants + fail-closed prod | Industry packs not first-class |
| Search | **MISSING** (portal) | Admin has `UniversalCommandBar` | No portal global search |
| Notifications | **PARTIAL** | `NotificationCenter`, `/api/portal/notifications`, Pulse/notify | Not multi-channel industry announcements |
| User profiles/settings | **PARTIAL** | `/api/portal/profile`, password routes | Thin settings; no privacy prefs UI depth |
| Mobile responsiveness | **PARTIAL** | Responsive CSS; `mobile/` Expo app | Mobile ≠ full universal portal |
| Accessibility | **PARTIAL** | Some `aria-*` in Client Experience / login | No a11y audit suite as product gate |
| Localization | **MISSING** | No next-intl / locale routing found | English-only assumption |
| Privacy & security | **PARTIAL** | Sessions, Trust/legal pack, privacy pages | Industry compliance (HIPAA, FERPA, etc.) **not claimed** |
| Activity / audit | **PARTIAL** | Pulse, ActivityEvents, Trust audit timeline | Not universal tenant audit UI |
| Automated reminders | **PARTIAL** | Connect nurture cron; CTP review reminders; Guide | Not generic reminder engine |
| Workflow triggers | **PARTIAL** | Pulse act hooks, Make webhooks, Stripe fulfill | Not configurable industry workflows |
| Reporting | **PARTIAL** / **DISCONNECTED** | Ops/admin reporting; Pulse | No tenant industry reports |
| Integrations | **PARTIAL** | Stripe, Airtable, Resend, Make, Calendly, pretix, eSign, GlitchTip | Documented via Integration Gate |
| Multi-org isolation | **PARTIAL→strong** | slug↔session, orgId entitlements | Synthetic org paths in non-prod |
| Multi-location | **MISSING** | No location entity on org model for portals | — |
| Branding / themes | **PARTIAL** | `@ea/theme-engine`, org `themeId`/`logo`/`brandColors` | Seed themes; Client Experience still EA-marked |
| Onboarding | **PARTIAL→COMPLETE** for EA paid | `fulfillPaidClient`, magic link | Not industry onboarding packs |
| Help / guided tours | **PARTIAL** | `lib/ea-guide-tours.ts`, CTP support | Not tenant-authored tours |
| File permissions | **PARTIAL** / weak | Links + session gates | No ACL matrix on files |
| Data export | **MISSING** (portal self-serve) | — | — |
| Archiving / retention | **PARTIAL** | Simplifi archive, Amplifi retire, EACP archive | No tenant retention policy engine |

---

## 3. Universal Capability Matrix

| Capability | Complete | Partial | Disconnected | Placeholder | Missing | Evidence | Required addition |
|---|---|---|---|---|---|---|---|
| 1 Home / Next Action | | ✓ (CTP) | | | | Guide NBA + Client Experience | Universal Home module + NBA resolver by industry config |
| 2 People | | ✓ (Connect/membership) | | | ✓ (directory/households) | Connect + Memberships | People graph: profiles, households, roles, directory |
| 3 Messages | | ✓ | | | | Messaging hub → Update Hub | Real messaging (channels + DM) or explicit “Requests” rename |
| 4 Tasks & Approvals | | ✓ | | | | Connect tasks, Amplifi approval, e-sign | Universal Tasks inbox + approval workflow |
| 5 Calendar & Scheduling | | ✓ | | | | Event Hub + Calendly + pretix | Calendar entity + attendance; keep pretix as engine |
| 6 Documents & Forms | | ✓ | | | | Document hub + CTP + Trust | Form builder + DMS ACL + templates |
| 7 Programs / Projects / Services | | ✓ | | | | CTP / Simplifi / Connect | Generic Program/Case/Class entity |
| 8 Progress & Results | | ✓ | | | | Guide + Pulse | Outcomes/metrics framework + tenant dashboards |
| 9 Payments & Financial | | ✓ | | | | Stripe billing + pretix | Ledger abstraction (dues/giving/fees) via processors |
| 10 Resources & Support | | ✓ | | | | Resources/Ask/Support | Tenant knowledge base + escalation SLAs |

---

## 4. Shared Platform Matrix

| Capability | Complete | Partial | Disconnected | Placeholder | Missing | Evidence | Required addition |
|---|---|---|---|---|---|---|---|
| Role-based access | | ✓ | | | | `lib/rbac.ts` | Extensible role taxonomy + scoped permissions |
| Multi-persona views | | ✓ | | | | Client vs Executive | View profiles per industry persona |
| Configurable navigation | | ✓ | orphan config | | | Entitlements; hardcoded CX nav; dead `portal-nav-config.ts` | Nav schema: order, labels, visibility, stage |
| Industry terminology | | ✓ | | | | `client-configs.terminology` | Full label map for 10 capabilities |
| Module enablement | ✓ | | | | | Entitlements | Industry packs as entitlement presets |
| Search | | | admin only | | ✓ portal | Admin command bar | Portal search index |
| Notifications | | ✓ | | | | NotificationCenter + Pulse | Announcement + preference center |
| Profiles / settings | | ✓ | | | | profile API | Account & privacy settings module |
| Mobile | | ✓ | | | | CSS + Expo | Portal mobile certification |
| Accessibility | | ✓ | | | | scattered aria | WCAG gate in cert |
| Localization | | | | | ✓ | no i18n framework | Locale pack architecture |
| Privacy / security | | ✓ | | | | sessions, legal, Trust | Industry compliance adapters (evidence-gated) |
| Audit history | | ✓ | | | | Pulse / Trust audit | Tenant-visible activity feed |
| Reminders | | ✓ | | | | nurture / CTP | Generic scheduler |
| Workflow triggers | | ✓ | | | | Pulse / Make / Stripe | Configurable rules |
| Reporting | | | ✓ admin | | ✓ tenant | Mission Control | Tenant report module |
| Integrations | | ✓ | | | | Integration Gate + adapters | Catalog + health |
| Multi-org isolation | | ✓ | | | | slug/orgId | Harden prod-only synthetic bans |
| Multi-location | | | | | ✓ | — | Location entity |
| Branding / themes | | ✓ | | | | theme-engine | White-label builder |
| Onboarding | | ✓ | | | | fulfillPaidClient | Industry onboarding recipes |
| Help / tours | | ✓ | | | | ea-guide-tours | Configurable tours |
| File permissions | | ✓ | | | | session/module | ACL model |
| Data export | | | | | ✓ | — | Export APIs |
| Archiving / retention | | ✓ | | | | product archives | Retention policies |

---

## 5. Industry Coverage Matrix

**Legend for “Config today?”:**  
**No** = needs custom development beyond labels/module toggles.  
**Partial** = some presets/modules help but core industry modules missing.  
**Assumption:** Compliance columns note *considerations*, not repository-proven compliance.

| Industry | Required modules (from desired nav) | Existing support | Missing | Terminology today | Required roles (gap) | Compliance note | Config today? | Custom required? |
|---|---|---|---|---|---|---|---|---|
| Fraternities / sororities | Chapter Home, Calendar, Messages, Chapter Business, Programs, Committees, Members, Dues, Documents, Training | Events (thin), Documents (thin), Training, Messaging (requests), Update Hub | Members directory, committees, voting, dues/giving, chapter business | association-like stub only | officer, committee lead, member, alum | Anti-hazing / safety content expected | No | **Yes** |
| Churches | Church Home, Worship, Events, Groups, Prayer & Care, Serve, Give, Family check-in, Messages, Resources | Events/docs/training presets (`church` in `client-configs`); pretix possible | Worship CMS, prayer, serving schedules, giving, family check-in | `members: Members` stub | pastor, volunteer, member, parent | Pastoral care privacy | No | **Yes** |
| Businesses | Home, Tasks, Clients, Sales, Projects, Calendar, Messages, Documents, Money, Team | Strongest fit: CTP/Simplifi/Connect/Pulse/billing | CRM clients module, sales pipeline as portal-native, expenses | `small-business` stub | staff, manager, client | Commercial data | **Partial** | Some custom |
| Nonprofits | Mission Home, Programs, People Served, Volunteers, Events, Donors, Grants, Impact, Docs, Messages | Events/docs/training stub | Beneficiaries, volunteers hours, grants, impact reports, donors | `nonprofit` stub | volunteer, donor, staff, board | Donor/privacy | No | **Yes** |
| Influencers / creators | Creator Home, Content Calendar, Library, Brand Deals, Messages, Audience, Analytics, Media Kit, Contracts, Links | Amplifi/Magnifi/Simplifi **adjacent** | Brand deals CRM, media kit, creator analytics, affiliate links | none | creator, manager, brand | Platform ToS | **Partial** (content) | **Yes** for deals/analytics |
| Schools | Classes, Assignments, Grades, Calendar, Attendance, Messages, Resources, Activities, Payments | Learning module thin; events thin | SIS-like classes/grades/attendance | none | student, parent, teacher, admin | **FERPA** (not evidenced) | No | **Yes** |
| Real estate agents | Listings, clients, showings, docs, transactions | Connect + documents + Simplifi capture | MLS/listings, transaction desk | none | agent, client, TC | Agency disclosures | No | **Yes** |
| Healthcare practices | Patients, appointments, forms, messages, billing | Calendly/events thin; forms thin | PHI workflows, charting | none | patient, clinician, front desk | **HIPAA** (not evidenced) | No | **Yes** |
| Financial advisors | Clients, planning, docs, calendar, compliance | ETFM preset thin; Trust/docs | Households, IPS, suitability | `etfm` stub | advisor, client, compliance | Securities/privacy | **Partial** | **Yes** |
| Law firms | Matters, clients, docs, time, billing | Documents + Trust e-sign adjacent | Matter management, privilege controls | none | attorney, client, staff | Privilege / ethics | No | **Yes** |
| Coaches / consultants | Clients, sessions, programs, resources | `coach` preset; CTP/Simplifi fit | Session packs, client outcomes library | `coach` stub | coach, client | — | **Partial** | Some custom |
| Sports organizations | Athletes, events, eligibility, family | **CPR preset richest** (`playerProfiles`, `recruiting`, …) | Many enable keys may not map to live portal modules | CPR terminology | coach, athlete, parent | Eligibility | **Partial** | Harden mapping |
| Professional associations | Members, events, dues, CE, docs | association stub + events/docs | Membership status, CE credits, dues | association stub | member, staff, board | — | No | **Yes** |
| Home-service companies | Jobs, schedule, invoices, customers | Simplifi/Connect adjacent | Job board, dispatch | none | tech, dispatcher, customer | — | No | **Yes** |
| Property managers | Units, tenants, maintenance, payments | — | Entire vertical | none | tenant, owner, PM | Local housing rules | No | **Yes** |
| Event organizers | Events, registration, staff, docs | **pretix Event Hub** + Connect event QR | Full event OS still pretix | none | organizer, attendee, volunteer | Ticketing tax | **Partial** | pretix config + light custom |
| Hospitality | Reservations, guests, events | — | Entire vertical | none | guest, staff | — | No | **Yes** |
| Government / community | Cases, services, announcements | — | Entire vertical | none | resident, caseworker | Public records | No | **Yes** |
| Youth programs | Participants, guardians, attendance, safety | Connect/events thin | Guardianship, check-in, safety certs | none | youth, guardian, staff | Child protection | No | **Yes** |
| Senior-care | Residents, family, care plans | — | Entire vertical | none | resident, family, caregiver | Health privacy | No | **Yes** |
| Creative agencies | Projects, assets, approvals, clients | Amplifi approvals + Creative Studio adjacent | Agency PM + DAM | none | creative, client, PM | — | **Partial** | Some custom |
| Membership communities | Members, content, events, billing | member module + events + Stripe | Community feed, membership tiers UX | none | member, admin | — | **Partial** | Some custom |

**Coverage summary (industries):**

| Metric | Value |
|---|---|
| Supportable primarily by configuration today | **0** of 22 (none fully) |
| Partial configuration + existing products | ~**6** (business/coach/creator-content/sports-CPR/event-organizer/membership) |
| Require material custom development | ~**16+** |
| Industry packs that are terminology stubs only | church, coach, nonprofit, small-business, association |

---

## 6. Navigation and Labeling Model

### Can the portal…?

| Capability | Status | Evidence |
|---|---|---|
| Rename universal modules by industry | **PARTIAL** | `terminology` + capability `displayLabel` / `navLabel` in registry & workspace chrome — **not** a full industry label pack for Chapter/Church/School |
| Reorder navigation | **PARTIAL** | Entitlement-driven groups via `resolvePortalSidebarNav` / workspace chrome; **no** tenant drag-order schema |
| Hide unused modules | **COMPLETE** | Entitlements + fail-closed empty set in prod |
| Change navigation by role | **PARTIAL** | Module `requiredRole` + RBAC filter; no persona-specific nav trees |
| Change navigation by journey stage | **PARTIAL** | CTP Guide/NBA stage-aware; Client Experience still fixed 5 links |
| Preserve consistent underlying capability model | **PARTIAL** | `lib/experience-registry.ts` Capability Map exists — maps to **EA products**, not the ten universal capabilities |

### Client Experience freeze (important)

- `lib/ctp-client-nav.ts` hardcodes: Your Project, Documents, Contact, Help, Journey.  
- Rule/docs treat CTP Client Experience as a distinct, frozen product surface.  
- **Must not** become the universal industry nav without a configuration layer above it.

### What must be added

1. **Universal Nav Schema** — ordered items keyed by universal capability IDs, with `label`, `visibleWhen`, `roles`, `stageRules`.  
2. **Industry Packs** — JSON/config mapping capability → label/icon/href pattern (Chapter Business → Tasks+Documents aggregation, etc.).  
3. **Deprecate or wire** orphan `lib/chassis/portal-nav-config.ts` (currently unused).  
4. Keep Client Experience as one **pack** (`ctp-client`), not the only shell.

---

## 7. Role and Permission Matrix

### Platform roles that exist (`lib/rbac.ts`)

| Role | Portal read | Portal write | Org manage | Billing | Typical use today |
|---|---|---|---|---|---|
| guest | ✓ (module-gated) | ✗ | ✗ | ✗ | Client portal visitor |
| viewer | ✓ | ✗ | ✗ | ✗ | Read-only |
| staff | ✓ | ✓ | ✗ | ✗ | Connect kits, pretix staff, Simplifi |
| manager | ✓ | ✓ | ✗ | ✗ | Rank only — few unique gates |
| admin | ✓ | ✓ | ✓ | ✗ | Org admin (platform sense) |
| owner | ✓ | ✓ | ✓ | ✓ | Billing module |

### Desired industry personas vs reality

| Desired persona | Mapped today? | Gap / risk |
|---|---|---|
| Public visitor | Partial (public Connect, Magnifi links, legal pages) | Not a portal role inside `[slug]` |
| Client / member / participant | Partial (`guest` + entitlements) | No member status / dues standing |
| Family / authorized representative | **MISSING** | Data exposure risk if parents share client login |
| Employee / volunteer | Partial (`staff`) | Volunteer ≠ staff permissions |
| Committee / team leader | **MISSING** | — |
| Manager | Rank exists; little unique UX | — |
| Organization administrator | `admin`/`owner` | — |
| EA administrator | Separate admin session / Command Center | OK as EA ops — not tenant admin |

### Missing permission boundaries / risks

1. **No household / guardian scoping** — family access would overshare if bolted on without ACLs.  
2. **File ACLs missing** — document links often capability-gated, not object-ACL-gated.  
3. **Magnifi public-by-link** — intentional product choice; risk if sensitive captures shared (documented in Amplifi policy).  
4. **Connect relationships** visible to staff — good; no client-facing directory privacy model.  
5. **Synthetic org IDs in non-prod** — production fulfillment rejects synthetic; keep fail-closed discipline (P0).

---

## 8. Data-Model Assessment

| Domain | Represented today? | Where | Hardcoded assumptions | Schema change needed |
|---|---|---|---|---|
| Organizations | ✓ | `lib/organizations.ts` (industry free-text, themeId, personalityId) | EA portal slug model | Industry enum/pack id; locations |
| People | Partial | Client Records, Connect relationships, Memberships | “Client” / “Player” product language | Universal Person + PersonOrgRole |
| Relationships | Partial | Connect | Recruiting/sales shaped | Household, guardian, referral types |
| Roles | Partial | Memberships + PlatformRole | 6 platform ranks | Industry role catalog |
| Programs | Partial | CTP / Simplifi opportunities / Connect campaigns | EA journey | Program/Case/Class entity |
| Projects | Partial | CTP project state | Consulting delivery | Generic Project |
| Services | Partial | Package entitlements | EA SKUs | Service catalog |
| Tasks | Partial | Connect tasks, Guide NBA | Staff follow-ups | Universal Task |
| Events | Partial | pretix store, Connect journey events, Calendly | External shop | Event metadata + attendance |
| Messages | Weak | Content requests as “threads” | Advisor Update Hub | Conversation + Channel |
| Documents | Partial | CTP uploads, requests, training | Delivery vault | Document + FormDefinition + ACL |
| Forms | Weak | Assessments, CTP intake, legal accept | Fixed forms | Form builder schema |
| Payments | Partial | Stripe customers/subscriptions; pretix | EA packages | PaymentIntent ledger by purpose (dues/gift/fee) |
| Outcomes | Partial | Guide stages, Simplifi outcomes | Product KPIs | MetricDefinition + Observation |
| Resources | Weak | Static resource lists | EA URLs | Tenant ResourceNode |
| Support requests | Partial | Update Hub / Ask | EA guide | Ticket with SLA |

---

## 9. CTP and Provisioning Assessment

| Requirement | Status | Evidence | Missing connection |
|---|---|---|---|
| Identify client industry | **PARTIAL** | Org `industry?: string`; presets by `platformClientId` | No CTP answer → industry pack resolver |
| Select required portal modules | **PARTIAL** | Package grants + entitlements; CTP filter hides `ctp` without submission | Industry pack → entitlement set |
| Apply industry terminology | **PARTIAL** | `PLATFORM_CLIENT_CONFIGS.terminology` + chrome | CTP does not write terminology |
| Create role definitions | **MISSING** | Default owner membership | Industry roles not provisioned |
| Configure navigation | **MISSING** as industry | CX nav hardcoded; entitlement nav EA-shaped | Nav pack apply step |
| Apply branding | **PARTIAL** | themeId/personalityId/logo on org; website provision | Auto from CTP brand bridge incomplete for all industries |
| Generate forms and workflows | **PARTIAL** | CTP studio/campaigns; not arbitrary forms | Form/workflow templates by industry |
| Provision portal idempotently | **COMPLETE** for EA paid path | `fulfillPaidClient`, `ensureOrganizationForPortal`, `ensurePackageEntitlements` | Extend idempotent industry pack apply |
| Preserve config through updates | **PARTIAL** | Entitlements durable in Airtable when configured | Pack versioning / migration |

**CTP today** optimizes **Website + Portal / Consider journey**, not multi-industry chassis generation.

---

## 10. Exact Additions Required

| ID | Capability | Problem | Evidence | Required addition | Dependencies | Affected areas | Priority | Effort | Risk | Scope |
|---|---|---|---|---|---|---|---|---|---|---|
| A-001 | Multi-org isolation | Synthetic org fallbacks confuse durability | `tenant-context`, fulfill guards | Certify prod fail-closed; document only | — | auth, fulfill | **P0** | S | Med | Universal |
| A-002 | File / data ACL | Links without object ACL | Document hubs | Object ACL model + checks | People, Documents | documents, API | **P0** | L | High | Universal |
| A-003 | Guardian / family access | No scoped family role | RBAC gap | Authorized-representative role + scope | People | rbac, portal | **P0** | L | High | Universal |
| A-004 | Universal capability IDs | Registry is EA-product shaped | `experience-registry.ts` | Map 10 universal capabilities ↔ modules | Nav | registry, chassis | **P1** | M | Med | Universal |
| A-005 | Nav schema | Cannot reorder/rename/hide by industry/stage/role | CX hardcoded; orphan nav config | `PortalNavSchema` + pack applicator | A-004 | PortalShell, ctp-client-nav | **P1** | L | Med | Universal |
| A-006 | Industry packs | Presets are terminology stubs | `client-configs.ts` | Versioned IndustryPack (modules, labels, roles, home) | A-004, A-005 | platform configs | **P1** | L | Med | Universal |
| A-007 | People module | No directory/households | No people routes | People + Relationship + Household schemas + UI | A-002 | new module, Airtable/platform store | **P1** | XL | High | Universal |
| A-008 | Messaging product | Messaging is Update Hub launcher | `portal-messaging-hub.ts` | Decide: rename to Requests **or** add Channels/DM | Notifications | messaging | **P1** | L | Med | Universal |
| A-009 | Tasks inbox | Tasks siloed in Connect/Guide | connect-tasks, NBA | Universal Task store + role inbox | A-004 | tasks API/UI | **P1** | L | Med | Universal |
| A-010 | Home / NBA engine | NBA CTP-only | `ctp-guide-progress.ts` | Pluggable NBA providers per pack | A-006 | home page | **P1** | M | Med | Universal |
| A-011 | Calendar entity | Event Hub is aggregator | `portal-event-hub.ts`, pretix | First-party Event metadata + attendance; pretix remains engine | pretix | events | **P1** | L | Med | Universal |
| A-012 | Forms engine | Fixed intakes only | CTP/assessment | FormDefinition + submissions | Documents | forms | **P1** | XL | High | Universal |
| A-013 | Payments ledger | Only Stripe portal + pretix | billing page | Purpose-tagged payment records (dues/gift/fee) | Stripe/pretix | billing module | **P1** | L | High | Universal |
| A-014 | Portal search | Missing | — | Search index over tenant objects | People, Docs, Messages | search API/UI | **P2** | L | Low | Universal |
| A-015 | Notification prefs | Thin | NotificationCenter | Announcements + preferences | A-008 | notify | **P2** | M | Low | Universal |
| A-016 | Tenant reporting | Admin-only | Mission Control | Tenant dashboards / export | Outcomes | reports | **P2** | L | Med | Universal |
| A-017 | i18n | Missing | — | Locale architecture | Nav labels | i18n | **P2** | L | Med | Universal |
| A-018 | Multi-location | Missing | org model | Location entity | Orgs | orgs | **P2** | M | Low | Universal |
| A-019 | Data export | Missing | — | Self-serve export | ACL | API | **P2** | M | Med | Universal |
| A-020 | Retention policies | Ad hoc archives | Simplifi/Amplifi | Tenant retention config | ACL | ops | **P2** | M | Med | Universal |
| A-021 | CTP → pack provision | CTP doesn’t select industry packs | fulfill/CTP | Idempotent `applyIndustryPack` in provision | A-006 | fulfill, CTP | **P1** | L | Med | Universal |
| A-022 | Accessibility cert | Partial aria only | scattered | Portal a11y checklist in cert | — | UI | **P2** | M | Low | Universal |
| A-023 | Church pack | No worship/prayer/give/check-in | church stub | Church IndustryPack + modules | A-006–A-013 | industry | **P3** | XL | High | Industry |
| A-024 | Chapter / Greek pack | No committees/dues/voting | — | Chapter IndustryPack | A-006–A-013 | industry | **P3** | XL | High | Industry |
| A-025 | School pack | No SIS features | — | School IndustryPack (or integrate SIS) | A-006–A-013 | industry | **P3** | XL | High | Industry |
| A-026 | Nonprofit pack | No beneficiaries/grants/impact | nonprofit stub | Nonprofit IndustryPack | A-006–A-013 | industry | **P3** | XL | High | Industry |
| A-027 | Creator pack | Deals/analytics missing | Amplifi adjacent | Creator IndustryPack on content OS | Amplifi/Simplifi | industry | **P3** | L | Med | Industry |
| A-028 | Healthcare pack | PHI not designed | — | **Do not** ship without compliance program | Legal/security | industry | **P3** | XL | **Critical** | Industry |
| A-029 | Consolidate orphan nav | Dead config | `portal-nav-config.ts` | Delete or wire after schema | A-005 | chassis | **P2** | S | Low | Universal |
| A-030 | Capability naming clarity | Product vs universal confusion | registry | Document dual map; avoid rename storm | A-004 | docs | **P1** | S | Low | Universal |

**Effort key:** S ≤ 1 sprint, M 1–2, L 2–4, XL multi-sprint.

---

## 11. Recommended Build Sequence

### Phase 0 — Security and data boundaries
- **Do:** A-001, A-002, A-003  
- **Accept:** Prod isolation cert; no cross-tenant document leakage; family scope design reviewed  
- **Deps:** None  

### Phase 1 — Universal chassis
- **Do:** A-004, A-005, A-006, A-010, A-030, A-029  
- **Accept:** One shell; industry pack can rename/reorder/hide nav; CTP Client Experience becomes one pack  
- **Deps:** Phase 0 ACL design  

### Phase 2 — Core modules
- **Do:** A-007, A-008, A-009, A-011, A-012, A-013  
- **Accept:** People + Tasks + Calendar metadata + Forms + Payments ledger usable without EA product jargon  
- **Deps:** Phase 1 nav/capability IDs  

### Phase 3 — Configuration and industry translation
- **Do:** Label packs, role catalogs, chrome terminology completion, theme white-label gaps  
- **Accept:** Church/business/nonprofit stubs become real packs (labels+modules) even if deep features wait  
- **Deps:** Phase 1–2  

### Phase 4 — CTP and automatic provisioning
- **Do:** A-021 — industry detection → `applyIndustryPack` idempotent  
- **Accept:** New paid client gets correct modules/nav/labels without manual Airtable edits  
- **Deps:** Phase 3 packs  

### Phase 5 — Industry expansion
- **Do:** A-023–A-027 prioritized by revenue; **defer A-028** until compliance program exists  
- **Accept:** One vertical certified end-to-end (prefer sports/CPR harden or events+business first)  
- **Deps:** Phase 4  

### Phase 6 — Validation and certification
- **Do:** A-014–A-022 as needed; portal cert matrix across packs; a11y; isolation regression  
- **Accept:** Written cert like Amplifi/Magnifi portal-ready for Universal Chassis v1  
- **Deps:** Phase 5 first vertical  

---

## 12. Reuse and Consolidation Opportunities

| Opportunity | Action |
|---|---|
| Module registry + entitlements + RBAC | **Keep as foundation** — do not rebuild |
| `PortalShell` / Client Experience | Extract nav to schema; keep CX as `ctp-client` pack |
| `@ea/portal-chassis` HMAC/middleware/events | Keep infra; do not force vendor HeaderPortalShell as UI |
| Update Hub as “messaging” | Either rename capability to Requests or add real messaging — avoid second silent store |
| Event Hub + pretix | Keep pretix as registration engine; add EA calendar metadata only |
| Connect relationships | Promote toward universal People/CRM with caution |
| Pulse / ActivityEvents | Shared activity bus for all packs |
| Trust / e-sign | Reuse for agreements; generalize beyond MSA/SOW later |
| `PLATFORM_CLIENT_CONFIGS` | Evolve into IndustryPacks; stop treating stubs as “portals” |
| Orphan `portal-nav-config.ts` | Consolidate away |
| Dual messaging routes (executive vs CTP) | Unify behind capability + pack labels |
| Admin Mission Control reporting | Do not fork; add tenant report module that reuses metrics patterns |
| Experience Director / website publish | Keep for web; not a substitute for portal People/Tasks |

**Legacy — do not make foundation:** separate CPR/BrotherHub/SisterHub portals as the universal model; Magnifi cinematic templates as portal IA; static resource link lists as “knowledge base.”

---

## 13. Coverage Ledger

### Universal capabilities (10)

| Status | Count | % |
|---|---|---|
| Complete | 0 | 0% |
| Partial | 10 | 100% |
| Disconnected | 0 | 0% |
| Placeholder | 0 | 0% |
| Missing (as full universal) | 0* | — |

\*Each row is Partial; sub-features within rows are often Missing (e.g., People directory).

### Shared platform capabilities (~24 audited)

| Status | Approx count |
|---|---|
| Complete | 1 (module enablement) |
| Partial | ~18 |
| Disconnected | ~1 (tenant reporting) |
| Missing | ~4 (portal search, i18n, multi-location, data export) |

### Industries (22)

| Status | Count |
|---|---|
| Supportable by configuration alone | 0 |
| Partial product adjacency | ~6 |
| Require custom development | ~16+ |

### Inspection ledger

| Item | Count |
|---|---|
| Routes inspected (portal pages) | ~37 |
| Portal APIs inspected | ~35 (+ webhooks/integrations sampled) |
| Components / libs sampled | Module registry, chassis, CTP nav, hubs, RBAC, orgs, client-configs, experience-registry, fulfill, pretix, Trust, Pulse, Connect |
| Schemas / stores sampled | Organizations, Memberships, Connect, CTP submissions, pretix events, content requests, Pulse |
| Tests / certs referenced | Amplifi/Magnifi portal certs; pretix contract; (not re-executed this audit) |
| Docs sampled | Integration Gate, pretix engine, Skin/Chassis constitution, Amplifi portal-ready |

---

## Final lists

### 1. WHAT EA ALREADY HAS

- Module registry, package entitlements, fail-closed enablement  
- Platform RBAC ranks and module `requiredRole`  
- Slug-scoped portal sessions + API guards  
- Local PortalShell with Executive vs CTP Client Experience presentations  
- Capability map (`experience-registry`) tied to EA products  
- Paid fulfillment → org → entitlements → Connect → optional site/CTP  
- Theme/personality engines + org branding fields  
- Working EA products usable inside portal: CTP Guide/NBA, Simplifi, Amplifi/Magnifi, Connect, Update Hub, Pulse, Learning, Documents aggregator, Event Hub (+ pretix), Billing (Stripe portal), Ask/Guide, Trust/legal  
- Integration Gate pattern and pretix as event registration engine  
- Thin industry **presets** (church, coach, nonprofit, small-business, association, CPR-rich)

### 2. WHAT EA MUST ADD

- Universal capability model (10) mapped above EA products  
- Configurable nav schema (labels, order, role, stage) + IndustryPacks  
- People / households / directory with ACLs  
- Real messaging **or** honest Requests positioning  
- Universal tasks & approvals inbox  
- Calendar metadata + attendance (pretix stays checkout)  
- Forms engine + document ACLs  
- Payments ledger beyond EA subscriptions  
- CTP/provisioning → apply IndustryPack idempotently  
- Portal search, export, stronger notifications, i18n, multi-location (P2)  
- Industry expansions only after chassis (church/chapter/school/nonprofit/etc.)  
- Healthcare (and similar regulated) only with explicit compliance program  

### 3. WHAT EA SHOULD NOT REBUILD

- HMAC sessions / slug isolation / entitlement gating  
- PortalShell dual presentation mechanism (extend via packs)  
- Pulse / ActivityEvents bus  
- Stripe fulfillment chain  
- pretix as ticketing/payment engine for events  
- CTP Client Experience as a dedicated consulting journey pack  
- Connect capture kit (evolve, don’t replace wholesale)  
- Airtable-backed org/entitlement model without migration plan  
- Separate portal codebase per industry  
- A second integration/plugin manager or vendor settings dashboard  

---

## Appendix A — Desired industry nav → current EA mapping (sample)

### Fraternity / sorority chapter

| Desired | Closest EA today | Gap |
|---|---|---|
| Chapter Home | Dashboard / CX Progress | Not chapter-shaped NBA |
| Calendar & Events | Event Hub + pretix | No chapter calendar |
| Messages | Messaging → Update Hub | No chapter channels |
| Chapter Business | — | Missing agendas/votes |
| Programs & Service | CTP/Connect weak fit | Missing impact |
| Committees | — | Missing |
| Members | Memberships ≠ directory | Missing |
| Dues & Giving | Stripe billing | Missing dues/giving |
| Documents & Forms | Documents hub | Missing bylaws workflow |
| Training & Support | Learning + Ask | Missing compliance packs |

### Church

| Desired | Closest EA today | Gap |
|---|---|---|
| Church Home | Dashboard | Missing |
| Worship & Sermons | — | Missing |
| Events | Event Hub / pretix | Partial |
| Groups & Ministries | — | Missing |
| Prayer & Care | — | Missing |
| Serve | Connect tasks weak | Missing |
| Give | Stripe / pretix | Missing giving ledger |
| Family & Check-In | — | Missing |
| Messages | Update Hub launcher | Missing |
| Resources & Support | Resources/Ask | Partial |

### Business / Nonprofit / Creator / School

Same pattern: **Home/docs/events/messages/resources** partially coverable; **domain systems** (CRM, grants, SIS, brand deals, grades) missing. Creator content loop is the strongest adjacency via Simplifi/Amplifi/Magnifi.

---

## Appendix B — Shared “platform chrome” checklist (user-provided)

| Item | Status |
|---|---|
| Global search | **MISSING** (portal) |
| Notifications | **PARTIAL** |
| User profile | **PARTIAL** |
| Account settings | **PARTIAL** |
| Privacy and security | **PARTIAL** (legal/Trust/sessions) |
| Accessibility controls | **MISSING** as product control; some aria |
| Language selection | **MISSING** |
| Guided onboarding | **PARTIAL** (tours + fulfill) |
| Contact and emergency help | **PARTIAL** (CTP support / Ask) |
| Mobile document upload | **PARTIAL** (CTP uploads; mobile app separate) |
| E-signatures | **PARTIAL** (Trust/eSignatures MSA/SOW) |
| Role-based permissions | **PARTIAL** (platform ranks) |

---

*End of audit. No code was modified beyond creating this document.*
