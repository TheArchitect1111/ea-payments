# EA Experience Audit — Pass 1

**Repository:** `TheArchitect1111/ea-payments`  
**Audited branch:** `master`  
**Audited commit:** `545c6251bec86fc692ded933402cde3fb59797f8`  
**Audit date:** 2026-07-23  
**Mode:** Inventory and verification only  
**Implementation status:** No product recommendations implemented; Pass 2 not started.

## 1. Scope and evidence rules

Pass 1 records what exists. It does not redesign, rename, consolidate, remove, or implement.

Evidence is classified as:

- **SV — Source verified:** traced to a file, registry, route component, middleware rule, or rendered control in the audited commit.
- **RV — Runtime verified:** an HTTP response or interactive workflow was actually exercised.
- **UE — User-supplied runtime evidence:** runtime evidence supplied in the audit thread but not independently reproduced by this GitHub-only audit environment.
- **UV — Unverified:** the source exists, but authenticated execution, rendering, data, or interaction was not exercised.

A route file is evidence that an implementation exists; it is not proof that the route renders successfully with production data. A redirect observed while unauthenticated is proof of the gate, not proof of the authenticated destination.

## 2. Mandatory coverage ledger

| Registry / test area | Population identified | SV | RV | UE | UV | Source coverage |
|---|---:|---:|---:|---:|---:|---:|
| Experience surfaces | 14 | 14 | 0 | 2 | 12 | 100% |
| Primary route families | 26 | 26 | 0 | 11 | 15 | 100% |
| Navigation entries | 23 | 23 | 0 | 12 | 11 | 100% |
| Interactive-control families | 38 | 38 | 0 | 0 | 38 | 100% source / 0% interaction |
| Defined user/permission roles | 5 | 5 | 0 | 2 | 3 | 100% |
| Help-system implementations | 5 | 5 | 0 | 0 | 5 | 100% source / 0% interaction |
| Hidden/incomplete/legacy/duplicate findings | 15 | 15 | 0 | 3 | 12 | 100% |
| Directly inspected evidence files | 19 | 19 | 0 | 0 | 0 | 100% |

**Runtime coverage:** authenticated end-to-end coverage is **0% in this pass**. This environment had GitHub repository access but no production admin cookie, client portal session, seeded local checkout, or browser harness attached to those sessions. Runtime claims are therefore limited to the supplied deployment verification identified in Section 10.

## 3. Full surface registry

| ID | Surface | Route / mount | Intended audience | Evidence | State |
|---|---|---|---|---|---|
| S01 | Client Experience shell | CTP-bound `/portal/{slug}/*` | CTP clients | `lib/chassis/PortalShell.tsx`, `lib/chassis/PortalLayout.tsx`, `lib/ctp-client-nav.ts` | SV, runtime UV |
| S02 | Cinematic Journey | `/portal/{slug}/ctp` | CTP clients | `app/portal/[slug]/ctp/page.tsx`, `app/portal/components/ClientExperience.tsx` | SV, runtime UV |
| S03 | Project Guide / Progress | `/portal/{slug}/ctp/progress` | CTP clients | `app/portal/[slug]/ctp/progress/page.tsx` | SV, runtime UV |
| S04 | CTP Documents | `/portal/{slug}/ctp/documents` | CTP clients | `app/portal/[slug]/ctp/documents/page.tsx` | SV, runtime UV |
| S05 | CTP Messages | `/portal/{slug}/ctp/messages` | CTP clients | `app/portal/[slug]/ctp/messages/page.tsx` | SV, runtime UV |
| S06 | CTP Support | `/portal/{slug}/ctp/support` | CTP clients | `app/portal/[slug]/ctp/support/page.tsx` | SV, runtime UV |
| S07 | CTP FAQ drawer | Mounted by `PortalSubpage` when `active === 'ctp'` | CTP clients | `app/portal/components/PortalSubpage.tsx`, `PortalCtpHelpDrawer.tsx`, `lib/ctp-faq.ts` | SV, runtime UV |
| S08 | EA Assistant — portal | All `/portal/{slug}/*` layouts except Simplifi suppression | Portal users | `app/portal/[slug]/layout.tsx`, `app/components/ea-assistant/EAAssistant.tsx` | SV, runtime UV |
| S09 | Executive Workspace shell | Non-CTP portal presentation | Entitled non-CTP clients | `lib/chassis/PortalShell.tsx`, `PortalLayout.tsx` | SV, runtime UV |
| S10 | MCC Operate | `/admin/*`, executive mode | EA operators | `lib/admin-operating-mode.ts` | SV; supplied unauth gate UE |
| S11 | MCC Build | `/admin/*`, builder mode | EA builders/platform | `lib/admin-operating-mode.ts` | SV, runtime UV |
| S12 | MCC home actions/workspaces | `/admin/master` | EA operators | `app/admin/master/ExecutiveShellPhaseOne.tsx` | SV, runtime UV |
| S13 | Command / navigation utilities | Admin chrome, command bar, navigator, tours | EA admins | `app/admin/_components/*`, `lib/admin-command-registry.ts`, `lib/executive-command-bar.ts`, `lib/guided-tours.ts` | SV, runtime UV |
| S14 | Launch Command Center | `/launch` | Authorized EA admins | `app/launch/page.tsx`, `middleware.ts` | SV; gate UE |

## 4. Route registry

### 4.1 Client and portal routes

| Route | Purpose | Gate / role | Evidence | Verification |
|---|---|---|---|---|
| `/portal/login` and public auth variants | Portal authentication | Public auth paths | `middleware.ts` | SV; runtime UV |
| `/portal/{slug}` | Workspace home / fallback | Portal session | `middleware.ts`, portal chassis | SV; runtime UV |
| `/portal/{slug}/ctp` | Cinematic Journey | Portal session + CTP module | `app/portal/[slug]/ctp/page.tsx` | SV; runtime UV |
| `/portal/{slug}/ctp/progress` | Project status, NBA, milestones, Design Studio | Portal session + CTP module | `app/portal/[slug]/ctp/progress/page.tsx` | SV; runtime UV |
| `/portal/{slug}/ctp/documents` | Deliverables and uploads | Portal session + CTP module | `app/portal/[slug]/ctp/documents/page.tsx` | SV; runtime UV |
| `/portal/{slug}/ctp/messages` | Contact-oriented actions | Portal session + CTP module | `app/portal/[slug]/ctp/messages/page.tsx` | SV; runtime UV |
| `/portal/{slug}/ctp/support` | Project context, support, contact, scheduling actions | Portal session + CTP module | `app/portal/[slug]/ctp/support/page.tsx` | SV; runtime UV |

### 4.2 MCC Operate routes

All entries are defined by `EXECUTIVE_NAV` in `lib/admin-operating-mode.ts`.

| Label | Route | Source status | Runtime status |
|---|---|---|---|
| Home | `/admin/master` | SV | Unauthenticated redirect UE; authenticated UV |
| Clients | `/admin/delivery` | SV | Unauthenticated redirect UE; authenticated UV |
| CTP | `/admin/ctp` | SV | Unauthenticated redirect UE; authenticated UV |
| Content | `/admin/content-requests` | SV | Unauthenticated redirect UE; authenticated UV |
| Opportunities | `/admin/simplifi` | SV | Unauthenticated redirect UE; authenticated UV |
| Pipeline | `/admin/dashboard` | SV | Unauthenticated redirect UE; authenticated UV |
| Factory | `/admin/factory` | SV | Unauthenticated redirect UE; authenticated UV |

### 4.3 MCC Build routes

All entries are defined by `BUILDER_NAV` in `lib/admin-operating-mode.ts`.

| Label | Route | Source verification | Authenticated runtime |
|---|---|---|---|
| EA Factory | `/admin/ea-factory` | SV | UV |
| Capabilities | `/admin/capability-marketplace` | SV | UV |
| Workspace Preview | `/admin/workspace-preview` | SV | UV |
| Protocols | `/admin/protocol-center` | SV | UV |
| Repositories | `/admin/ea-factory/repo-library` | SV | UV |
| Project Generator | `/admin/ea-factory/project-generator` | SV | UV |
| Skin Factory | `/admin/ea-factory/skin-factory` | SV | UV |
| Codex Builder | `/admin/ea-factory/codex-builder` | SV | UV |
| Chassis Deploy | `/admin/ea-factory/chassis-deployment` | SV | UV |
| Blueprints | `/admin/blueprints` | SV | UV |
| EACP Launches | `/admin/ea-factory/launches` | SV | UV |

### 4.4 Operational routes

| Route | Purpose | Evidence | Runtime |
|---|---|---|---|
| `/launch` | Full launch/readiness UI | `app/launch/page.tsx`, `middleware.ts` | Unauthenticated 307 UE; authenticated UV |
| `/api/health/launch` | Minimal public health; authenticated full diagnostic | `app/api/health/launch/route.ts`, `lib/launch-health.ts` | Public minimal response UE; authenticated diagnostic UV |

## 5. Navigation registry

### 5.1 CTP client navigation

Defined in `lib/ctp-client-nav.ts`, rendered by `app/portal/components/ClientExperienceNav.tsx`.

| ID | Display label | Destination | Active rule | Source finding |
|---|---|---|---|---|
| journey | Your Journey | `/portal/{slug}/ctp` | Exact/prefix match; fallback active item | Active |
| progress | Progress | Design Studio / progress path | Exact/prefix match | Active |
| documents | Documents | `/portal/{slug}/ctp/documents` | Exact/prefix match | Active |
| messages | Messages | `/portal/{slug}/ctp/messages` | Exact/prefix match | Active |
| support | Support | `/portal/{slug}/ctp/support` | Exact/prefix match | Active |
| account | Log out | `/api/portal/logout` | N/A | Active |

Client-shell selection is data-dependent. `shouldUseClientExperienceShell` requires a linked CTP submission and returns true for Website + Portal starter/client types or an active/bound CTP workspace.

### 5.2 Journey-local navigation

`app/portal/components/ClientExperience.tsx` adds navigation outside the top client registry:

- Escape links: **Progress**, **Support**
- Seven scene dots: Welcome, Imagine, Insights, Begin, Build, Journey, Next
- Continue / scene transition controls
- Stage-specific links and Design Studio controls

These duplicate destinations already represented in the shell and create a second navigation model inside Journey.

### 5.3 MCC navigation

- **Operate:** 7 entries, listed in Section 4.2.
- **Build:** 11 entries, listed in Section 4.3.
- **Mode persistence:** `ea_operating_mode` in localStorage; only `builder` is accepted as alternate to default `executive`.
- **Additional navigation surfaces:** MCC Quick Actions, More Workspaces, Universal Command Bar, Navigator shell, guided tours, and command registries. These are source present but were not interactively exercised in Pass 1.

## 6. Interactive-control inventory

This inventory counts control families and data-driven control sets, not every repeated row instance produced from runtime data.

### 6.1 Client Experience shell and Journey — 15 families

1. Five top navigation links.
2. Log out link.
3. Progress escape link.
4. Support escape link.
5. Seven scene-dot buttons.
6. Continue scene control.
7. Direct scene-selection controls.
8. Stage next-best-action link/button.
9. Milestone disclosure controls.
10. Common-question disclosure controls.
11. Design Studio form inputs.
12. Design Studio save control.
13. Design Studio completion control.
14. Asset upload controls.
15. Asset gallery item controls.

### 6.2 Client subpages — 10 families

16. Back-to-project link.
17. Document open links.
18. Document/upload empty-state action.
19. Message/contact action links.
20. Support primary action.
21. Support secondary action list.
22. External scheduling/contact links.
23. Help/FAQ floating trigger.
24. FAQ disclosure controls.
25. Help drawer close/backdrop controls.

### 6.3 EA Assistant — 7 families

26. Persistent Help trigger.
27. Assistant close control.
28. Get Guidance control.
29. View Details control.
30. Back-to-brief control.
31. Question input/send flow.
32. Recommended assistant actions.

### 6.4 MCC and operational surfaces — 6 families

33. Operate/Build mode selection.
34. Sidebar navigation links.
35. Quick Action links.
36. More Workspaces disclosure and links.
37. Command Bar / Navigator commands.
38. Launch readiness controls/links.

**Interaction status:** all 38 families are source verified; none were exercised with authenticated production or local browser automation in this pass.

## 7. Role matrix

| Role | Primary surfaces | Expected visibility | Source evidence | Runtime |
|---|---|---|---|---|
| Unauthenticated visitor | Portal/admin login; public health summary | No protected portal/admin/launch content | `middleware.ts`, launch-health gate | Partial UE |
| CTP client | Client shell, Journey, Progress, Documents, Messages, Support, assistant | No Executive Workspace modules | `shouldUseClientExperienceShell`, `PortalShell` coercion | UV |
| Non-CTP entitled client | Executive Workspace shell and entitled modules | Config-driven sidebar modules | `PortalShell.tsx`, workspace chrome resolver | UV |
| EA operator/admin | MCC Operate and protected launch UI | Seven Operate destinations, admin utilities | `EXECUTIVE_NAV`, admin middleware | Gate UE; destination UV |
| EA builder/platform | MCC Build | Eleven Build tools | `BUILDER_NAV`, local operating mode | UV |

## 8. Permission matrix

| Resource | Authentication | Authorization | Failure behavior | Evidence |
|---|---|---|---|---|
| `/portal/*` protected routes | Portal session cookie | Portal chassis + module requirement | Redirect to portal login or portal home when CTP submission absent | `middleware.ts`, `requirePortalModule` calls |
| CTP pages | Portal session | `ctp` module plus matching submission | Redirect to `/portal/{slug}` if no submission | CTP page files |
| `/admin/*` | `ea_admin_session` | Normalized role must satisfy `admin:access` | Redirect to admin login; unauthorized error query | `middleware.ts` |
| `/launch` | Admin session | `admin:access` | Redirect to admin login | `middleware.ts` |
| Public launch health | None | Summary only | Returns `ok` and `status` | launch-health implementation; UE deployment check |
| Full launch diagnostics | Valid admin credential | Admin authorization | Invalid/malformed credentials receive summary only | `lib/launch-health.ts`; local tests UE |

No role-specific runtime session was available to prove that every displayed action is rejected for every unauthorized role. That remains Pass 1 runtime debt, not a passed control.

## 9. Help-system registry

| ID | Help system | Mount | Capability | Evidence | Finding |
|---|---|---|---|---|---|
| H01 | Support navigation page | `/portal/{slug}/ctp/support` | Project context, NBA, contact/scheduling actions | support page | Active |
| H02 | Messages page | `/portal/{slug}/ctp/messages` | Filters support actions to message/contact-like actions | messages page | Active; functional overlap with H01 |
| H03 | FAQ drawer | CTP `PortalSubpage` | Static CTP FAQs in modal drawer | `PortalCtpHelpDrawer.tsx`, `ctp-faq.ts` | Active; overlaps H01/H05 |
| H04 | Page-local common questions | Progress page | Stage-dependent disclosure answers | progress page | Active; overlaps H03 |
| H05 | EA Assistant | Global portal layout | Page brief, details, question flow, escalation hint | portal layout, `EAAssistant.tsx`, assistant constants | Active; overlaps H01/H03/H04 |

### Help trigger behavior verified from source

- FAQ drawer opens from a fixed button or `#faq`; Escape and backdrop close are implemented.
- Assistant uses pathname, portal slug, workspace AI context, and live capture signals.
- Assistant auto-opens on explicit Discovery events; no equivalent general portal hesitation/error trigger was found.
- FAQ drawer is not mounted by the cinematic Journey page because Journey renders `PortalShell` directly rather than `PortalSubpage`.
- The global Assistant remains mounted on Journey through `app/portal/[slug]/layout.tsx`.
- Simplifi routes suppress the assistant.

### Accessibility source findings

Present: dialog role, `aria-modal`, labelled title, Escape handling, scene button labels, `aria-current`, semantic nav labels.  
Not established: focus trap, initial dialog focus, focus restoration to trigger, screen-reader announcement of async assistant responses, complete keyboard traversal, contrast validation, touch-target measurement.

## 10. Hidden, incomplete, legacy, and duplicate registry

| ID | Type | Finding | Evidence |
|---|---|---|---|
| D01 | Duplicate | Support page, FAQ drawer, page-local FAQs, and Assistant all present as help destinations | H01–H05 |
| D02 | Duplicate | Messages is implemented by filtering the Support action model | messages page + support view |
| D03 | Duplicate | Journey escape links repeat Progress and Support top-nav destinations | `ClientExperience.tsx` |
| D04 | Terminology | Shell labels `Progress`; the destination page calls itself `Your Project` | nav registry vs progress page |
| D05 | Terminology | FAQ says “Messages & Support,” while current nav separates Messages and Support | `lib/ctp-faq.ts` |
| D06 | Terminology | FAQ refers to “Overview,” absent from current CTP nav | `lib/ctp-faq.ts` |
| D07 | Discoverability | FAQ refers to Scheduling “in this workspace,” but no Scheduling top-nav entry exists | `lib/ctp-faq.ts`, client nav |
| D08 | Conditional/hidden | Executive modules are intentionally hidden for CTP-bound clients | shell coercion |
| D09 | Conditional/hidden | Assistant hidden on Simplifi routes | `EAAssistant.tsx` |
| D10 | Conditional/hidden | FAQ drawer absent from cinematic Journey | direct shell rendering |
| D11 | Incomplete verification | Notification/legacy executive modules were not proven reachable in this pass | route/session unavailable |
| D12 | Complexity | Build navigation exposes 11 peer destinations plus nested Factory relationships | `BUILDER_NAV` |
| D13 | Legacy-alignment risk | Navigator shell exists but is described in prior deployment evidence as legacy/not layout-mounted | supplied Phase 1 deploy report |
| D14 | Runtime gap | Route existence and middleware gates do not prove successful authenticated rendering | coverage ledger |
| D15 | Accessibility gap | Drawer dialog focus management is not established from source | `PortalCtpHelpDrawer.tsx` |

## 11. Runtime verification report

### Independently executed in this Pass 1

None. The connected GitHub surface supported repository inspection but did not provide:

- a local checkout that could run Next.js;
- seeded environment variables or Airtable data;
- a production portal session;
- a production admin session;
- an authenticated browser context.

Attempts to treat public URLs as a substitute would not validate protected workflows and were not counted.

### User-supplied deployment/runtime evidence tied to audited commit

The audit thread supplied the following results for commit `545c6251bec86fc692ded933402cde3fb59797f8`:

| Check | Supplied result | Classification |
|---|---|---|
| Public `/api/health/launch` returns only `ok`, `status` | Pass | UE |
| Expansion attempts with query/detail headers/bad Bearer remain minimal | Pass | UE |
| Unauthenticated `/launch` redirects to admin login | Pass | UE |
| MCC Operate targets redirect to admin login rather than public 404 | Pass | UE, gate only |
| Authenticated production `/launch` | Not verified | UV |
| Authenticated MCC routes | Not verified | UV |
| Authenticated CTP routes and controls | Not verified | UV |
| CI lint | Failed with 175 reported problems, described as mostly pre-existing | UE; unresolved project condition |

### Required runtime harness for later completion

Pass 1 runtime debt can only be closed with a real test matrix containing:

- one unauthenticated browser;
- one CTP client session with representative submission/stages;
- one non-CTP entitled client;
- one EA operator/admin;
- one EA builder/platform role;
- desktop and mobile viewports;
- keyboard-only and screen-reader checks;
- network/error injection for uploads, messages, assistant, and form saves.

This requirement is recorded only; Pass 2 has not begun.

## 12. Pass 1 findings — no implementation recommendation executed

1. The repository contains two portal presentation systems: CTP Client Experience and non-CTP Executive Workspace.
2. CTP clients are source-coerced away from executive module navigation.
3. The current CTP shell exposes five primary options plus logout.
4. The project-status destination is labelled `Progress` in navigation but `Your Project` on-page.
5. Five separate help/guidance implementations or surfaces overlap.
6. Help is context-aware in source, but general portal confusion detection was not found.
7. MCC Operate has seven source-defined entries after the navigation-hardening commit.
8. MCC Build has eleven source-defined peer entries.
9. Public launch-health minimization and `/launch` gating are present in source and supported by supplied deployment evidence.
10. No authenticated end-to-end experience can be certified from this Pass 1 environment.

## 13. Pass boundary

Pass 1 is complete as an evidence registry with explicit runtime debt. No recommendation was implemented. No application code was changed by this audit. Pass 2 — evaluation, prioritization, redesign judgment, or implementation — has not started.
