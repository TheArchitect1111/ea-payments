# EA Universal Portal — OSS Fit Audit

**Status:** Read-only evaluation — no installs, no product-code changes  
**Companion:** [EA-UNIVERSAL-PORTAL-GAP-AUDIT.md](./EA-UNIVERSAL-PORTAL-GAP-AUDIT.md)  
**Integration Gate:** [INTEGRATION-GATE.md](../INTEGRATION-GATE.md)  
**Audited branch:** `master`  
**Audited commit:** `38fa48181389a2f25fa1fba7062fc7087a03974c`  
**Audit date:** 2026-07-25  
**Repository:** `ea-payments`  

### Verification boundaries

| Kind | Scope |
|---|---|
| **Source-code verification** | EA files, routes, schemas cited below |
| **OSS license / product claims** | Public GitHub/docs as of audit date — **not legal advice**; counsel should confirm before ADOPT |
| **Runtime verification** | Not performed for OSS projects |
| **Installs** | None |

### EA stack anchors (verified)

| Layer | Evidence |
|---|---|
| App | Next.js `16.2.9`, React `19.2.4` (`package.json`) |
| Payments | `stripe` ^22.2.1; portal billing `app/portal/[slug]/billing/page.tsx` |
| Auth / sessions | HMAC portal sessions; `lib/ea-portal-auth.ts`; `@ea/portal-chassis/middleware` |
| RBAC | `lib/rbac.ts` — `owner\|admin\|manager\|staff\|viewer\|guest` |
| Modules / entitlements | `lib/modules/registry.ts`, `lib/modules/portal-modules.ts` |
| Shell | `lib/chassis/PortalShell.tsx` |
| Provisioning | `lib/fulfill-paid-client.ts` |
| Activity | `lib/pulse-bus.ts`, `lib/notify-dispatch.ts` (comment: “Novu can plug in here later”) |
| Notifications UI | `lib/chassis/NotificationCenter.tsx`, `app/api/portal/notifications/route.ts` |
| Messaging (launcher) | `lib/portal-messaging-hub.ts` → Update Hub |
| Tasks (partial) | `lib/connect-tasks.ts`, `app/api/portal/connect/tasks/route.ts` |
| E-sign | `app/api/webhooks/esignatures/route.ts`, `lib/trust-engine/*` |
| Events | pretix (`lib/events/*`, `/api/webhooks/pretix`) — already gated Adopt |
| Automation | Make webhooks (`lib/make-webhooks.ts`); Vercel crons (`vercel.json`) |

### Decision vocabulary (this report)

| Label | Meaning |
|---|---|
| **BUILD INTERNALLY** | Implement inside EA chassis; do not adopt this OSS as a product |
| **ADOPT DIRECTLY** | Library/SDK in-repo (npm), behind existing modules; disabled until configured where applicable |
| **INTEGRATE AS A SERVICE** | Separate deployable; EA calls API / webhooks; vendor UI not bolted into PortalShell |
| **STUDY ONLY** | Learn model/patterns; do not install |
| **REJECT** | Fails Integration Gate and/or replaces protected EA systems / dangerous license for white-label SaaS |

---

## 1. Executive recommendation

**Do not adopt a second “operating system” (NocoBase, Twenty, Plane, Lago as platform replacements).**  
EA already has PortalShell, module registry, entitlements, RBAC, CTP, Stripe fulfillment, Pulse, and product modules.

**Smallest OSS combination that closes the most important verified gaps without replacing those systems:**

| Priority | Project | Decision | Gap IDs primarily helped |
|---|---|---|---|
| 1 | **React JSON Schema Form (RJSF)** | **ADOPT DIRECTLY** | A-012 Forms |
| 2 | **Novu** (Cloud or self-host MIT core) | **INTEGRATE AS A SERVICE** (later; hook already noted) | A-015 Notifications; supports A-008/A-010 delivery |
| 3 | **Trigger.dev** | **INTEGRATE AS A SERVICE** (optional; when Make/cron insufficient) | Reminders / durable workflows (shared platform) |
| 4 | **OpenFGA** | **STUDY ONLY** now → possible later service after internal ACL | A-002, A-003 |
| — | Chatwoot, Documenso, Twenty, NocoBase, Plane, Lago | **REJECT** as portal chassis / product replacements (details below); some **STUDY ONLY** for patterns |

**Everything else in the gap audit (nav schema, IndustryPacks, People, Tasks inbox, NBA providers, capability map) should be BUILD INTERNALLY** on existing EA foundations.

---

## 2. Per-project evaluation

### 2.1 React JSON Schema Form (RJSF)

| # | Answer |
|---|---|
| **1. Gaps solved** | **A-012** Forms engine (FormDefinition + submissions UI). Helps industry packs that need applications/permission forms without rebuilding CTP intake. |
| **2. Overlaps** | CTP intake / assessment forms; Update Hub request forms; Trust acceptance checkboxes — **not** a second form product if scoped as a **renderer** for stored JSON Schema. |
| **3. Decision** | **ADOPT DIRECTLY** (`@rjsf/core` + theme adapter). |
| **4. Compatibility** | React 19 / Next App Router — use client components; prefer `@rjsf/core` + custom EA theme (not Bootstrap default). Compatible with existing portal CSS tokens. |
| **5. Auth / tenant / data** | Schemas + submissions must live in EA data layer scoped by `organizationId` / `portalSlug` (same as `requirePortalModule`). RJSF itself is UI-only — **no** identity store. |
| **6. Hosting** | None (library). |
| **7. License** | **Apache-2.0** — permits commercial, client-facing, white-labeled use with attribution. |
| **8. Difficulty** | **Low–Medium.** Schema store + submit API + one portal surface. Deps: npm packages only. |
| **9. Risks** | Schema injection / XSS if HTML widgets enabled; validate server-side; don’t let tenants run arbitrary JS. Migration: none for CTP — keep CTP forms as-is. |
| **10. Affected areas** | New: `lib/forms/*`, `app/api/portal/forms/*`, portal Documents/Resources routes; optionally CTP later. **Do not** rewrite `lib/ctp-*` intakes first. |

**Integration Gate:** Replace thin custom form UIs (Yes); reduce work (Yes); invisible in EA skin (Yes); fits Documents/Forms module (Yes); simplifies if one renderer (Yes) → **Adopt candidate**.

---

### 2.2 OpenFGA

| # | Answer |
|---|---|
| **1. Gaps solved** | **A-002** object ACL; **A-003** guardian/family scoped access; future document/file permissions. |
| **2. Overlaps** | `lib/rbac.ts` ranks; module `requiredRole` in `lib/modules/registry.ts`; session slug checks in `lib/api/portal-route.ts` / `requirePortalModule`. OpenFGA is **ReBAC**, not a replacement for module entitlements. |
| **3. Decision** | **STUDY ONLY** for Phase 0–1. After a thin internal ACL, reconsider **INTEGRATE AS A SERVICE**. **Do not** replace `lib/rbac.ts` or entitlements. |
| **4. Compatibility** | Separate Go service + Postgres/MySQL; Node SDK callable from Next route handlers. Fits beside EA, not inside Vercel serverless as the only DB. |
| **5. Auth / tenant / data** | Map EA `organizationId`, person IDs, document IDs into FGA tuples. Session still HMAC; OpenFGA answers `Check(user, relation, object)`. Risk: dual source of truth if not carefully synced from Memberships/People. |
| **6. Hosting** | Always-on OpenFGA + datastore; ops burden **High** vs current Vercel + Airtable. |
| **7. License** | **Apache-2.0** (CNCF) — commercial / white-label OK for the engine. |
| **8. Difficulty** | **High** (model design, sync, latency, fail-closed defaults). |
| **9. Risks** | Mis-modeled tuples → data exposure (P0). Migration from “link if module enabled” is non-trivial. |
| **10. Affected areas** | `lib/rbac.ts` (keep ranks); new ACL gateway used by `lib/portal-document-hub.ts`, future People APIs; admin tooling. |

**Gate:** Does not replace an existing tool cleanly yet (No unless ACL already decided); adds dashboard/ops (No on Simplify) → **Reject install now**; **Study** model.

---

### 2.3 Novu

| # | Answer |
|---|---|
| **1. Gaps solved** | **A-015** notification preferences / multi-channel delivery; improves delivery for Home NBA, Tasks, Messages announcements without building inbox infra. |
| **2. Overlaps** | `lib/notify-dispatch.ts`, `lib/pulse-bus.ts`, `NotificationCenter`, Resend email, Make webhooks. **Explicit extension point already documented in code:** `dispatchNotification` comment “Novu can plug in here later.” |
| **3. Decision** | **INTEGRATE AS A SERVICE** (Novu Cloud **or** MIT self-host core), **disabled until configured**. Do **not** replace Pulse as activity SSOT. |
| **4. Compatibility** | TypeScript SDKs; works with Next API routes. Embeddable Inbox optional — prefer headless API → existing `NotificationCenter`. |
| **5. Auth / tenant / data** | Subscriber IDs = portal user/email + `tenantId`/`portalSlug`. Keep Pulse events in EA; Novu = delivery fan-out. |
| **6. Hosting** | Cloud (simplest) or multi-service self-host (Redis, etc.) — **Medium–High** if self-hosted. |
| **7. License** | **Open-core:** MIT core; `/enterprise` and EE UI folders under commercial license. Self-host MIT core OK for commercial product use; EE features need commercial license. White-label via API (avoid bolting Novu dashboard into portal). |
| **8. Difficulty** | **Medium** if Cloud + `dispatchNotification` adapter; High if full self-host. |
| **9. Risks** | Second notification UI (Gate fail); preference sync drift; PII in Novu cloud. |
| **10. Affected areas** | `lib/notify-dispatch.ts`, `lib/chassis/NotificationCenter.tsx`, `app/api/portal/notifications/route.ts`, env catalog / ops health. |

**Gate:** Can replace fragmented email/push glue (Yes); reduce work (Yes); invisible if API-only (Yes); fits notify dispatch (Yes); simpler only if Pulse stays canonical (conditional Yes) → **Adopt as service when notification load justifies**.

---

### 2.4 Chatwoot

| # | Answer |
|---|---|
| **1. Gaps solved** | Partial **A-008** (support inbox / live chat), omnichannel agent desk — **not** chapter/group messaging. |
| **2. Overlaps** | `lib/portal-messaging-hub.ts`, Update Hub, CTP messages/support, Ask/Guide. Would create a **second** customer conversation store. |
| **3. Decision** | **REJECT** as Universal Portal messaging module. Optional **INTEGRATE AS A SERVICE** only for **EA-operated support desk** (ops), not client PortalShell IA — and only if Update Hub cannot scale. Prefer **BUILD INTERNALLY** “Requests” rename + thin tickets first. |
| **4. Compatibility** | Ruby/Rails + Sidekiq + Postgres — **alien** to Next/Vercel monolith. Widget embed possible. |
| **5. Auth / tenant / data** | Separate Chatwoot accounts per tenant or inbox tags; SSO bridging required. High isolation risk if multi-tenant misconfigured. |
| **6. Hosting** | 4–8 GB RAM typical self-host; or Chatwoot Cloud. **High** ops. |
| **7. License** | Community **MIT**; Enterprise folder proprietary. MIT CE allows commercial derivatives; do not ship EE without license. Widget white-label feasible on CE. |
| **8. Difficulty** | **High** (identity bridge, branding, dual inbox UX). |
| **9. Risks** | Violates Integration Gate “invisible” / “no second dashboard”; duplicates Update Hub; support agents leave EA OS. |
| **10. Affected areas** | Messaging routes, CTP support, notify — **should not** become primary. |

---

### 2.5 Trigger.dev

| # | Answer |
|---|---|
| **1. Gaps solved** | Shared **automated reminders**, durable workflows, long-running jobs beyond Vercel limits; supports Guide reminders, Connect nurture, future NBA digests. |
| **2. Overlaps** | Vercel Cron (`vercel.json`), Make (`lib/make-webhooks.ts`), Pulse act hooks. Complements rather than replaces if scoped to **job runtime**. |
| **3. Decision** | **INTEGRATE AS A SERVICE** when job durability needs exceed cron/Make. **Do not** replace Make for founder automations overnight. |
| **4. Compatibility** | TypeScript-first; strong Next.js fit; Cloud or self-host Apache stack. |
| **5. Auth / tenant / data** | Pass `organizationId`/`portalSlug` in task payloads; secrets in Trigger env. |
| **6. Hosting** | Cloud (low ops) or Docker/K8s self-host. |
| **7. License** | **Apache-2.0** — commercial / white-label orchestration OK. |
| **8. Difficulty** | **Medium**. |
| **9. Risks** | Second orchestrator if Make + Trigger + cron all grow unchecked (Gate “Simplify”). Pick one primary durable runner for new work. |
| **10. Affected areas** | Cron routes under `app/api/cron/*`, nurture/reminders, Factory/Praison long jobs — **not** PortalShell. |

---

### 2.6 Documenso

| # | Answer |
|---|---|
| **1. Gaps solved** | Broader e-sign / forms signing (Documents & Forms). |
| **2. Overlaps** | **Hard duplicate** of eSignatures.io + Trust Engine (`app/api/webhooks/esignatures/route.ts`, `lib/trust-engine/*`, MSA/SOW). |
| **3. Decision** | **REJECT** for now (keep eSignatures + Trust). **STUDY ONLY** if leaving eSignatures later. |
| **4. Compatibility** | Next/TS/Postgres sibling stack — technically close, product-duplicate. |
| **5. Auth / tenant / data** | Separate signing tenancy; webhook remap similar to esignatures route. |
| **6. Hosting** | Self-host Docker or Documenso Cloud. |
| **7. License** | **AGPL-3.0** CE + commercial EE. Network use of **modified** Documenso in SaaS typically needs EE or AGPL compliance (source offer). **Poor fit** for proprietary white-label without EE. |
| **8. Difficulty** | **High** migration from current Trust/eSign path. |
| **9. Risks** | AGPL; dual signing systems; breaks Make contract-signed scenarios. |
| **10. Affected areas** | Trust Engine, esignatures webhook, legal admin — **leave alone** for launch. |

---

### 2.7 Twenty (CRM)

| # | Answer |
|---|---|
| **1. Gaps solved** | **A-007** People / CRM-shaped contacts, custom objects. |
| **2. Overlaps** | Connect relationships (`lib/connect-store.ts`), Client Records, Memberships (`lib/memberships.ts`), Simplifi opportunities — would become a **second CRM OS**. |
| **3. Decision** | **REJECT** as integrated portal CRM. **STUDY ONLY** for People/relationship schema inspiration. **BUILD INTERNALLY** People module on EA stores. |
| **4. Compatibility** | NestJS/React/GraphQL/Postgres — parallel platform, not a library. |
| **5. Auth / tenant / data** | Separate identity; sync hell with portal slug sessions. |
| **6. Hosting** | Full CRM stack — **High**. |
| **7. License** | **AGPL-3.0** (+ commercial for some enterprise features). White-label SaaS on modified Twenty → AGPL/network obligations or commercial deal. |
| **8. Difficulty** | **Very High** to embed invisibly. |
| **9. Risks** | Replaces Connect philosophy; Gate fail (second dashboard, complexity). |
| **10. Affected areas** | Connect, People (future), Mission Control — do not merge. |

---

### 2.8 NocoBase

| # | Answer |
|---|---|
| **1. Gaps solved** | Would appear to solve nav config, forms, apps-as-config — i.e. entire Universal Chassis. |
| **2. Overlaps** | **Replaces** PortalShell, module registry, entitlements, CTP, Experience Director — forbidden by architecture gate and gap audit “WHAT EA SHOULD NOT REBUILD.” |
| **3. Decision** | **REJECT**. |
| **4. Compatibility** | Separate low-code platform; not an extension of `lib/modules/registry.ts`. |
| **5. Auth / tenant / data** | NocoBase multi-app model ≠ EA slug/HMAC entitlements. |
| **6. Hosting** | Full app platform — **High**. |
| **7. License** | Core moved toward **Apache-2.0** (2026), but **NocoBase License Agreement** restricts providing public no-code/low-code/AI **SaaS/PaaS** products on original/modified software without commercial license; branding retention rules apply. **Not acceptable** as white-labeled EA Universal Portal chassis without paid commercial terms — and even then it replaces EA OS. |
| **8. Difficulty** | N/A — strategic reject. |
| **9. Risks** | Platform abandonment of EA investment; license/SaaS restrictions. |
| **10. Affected areas** | Entire portal — **do not touch**. |

---

### 2.9 Plane

| # | Answer |
|---|---|
| **1. Gaps solved** | **A-009** Tasks / projects / sprints. |
| **2. Overlaps** | Connect tasks, Guide NBA, CTP progress, Factory queues — second work OS. |
| **3. Decision** | **REJECT** as portal module. **STUDY ONLY** for task UX patterns. **BUILD INTERNALLY** universal Task inbox. |
| **4. Compatibility** | Separate product; AGPL Community Edition. |
| **5. Auth / tenant / data** | Separate workspaces; poor fit for portal slug model. |
| **6. Hosting** | Full PM stack — **High**. |
| **7. License** | Community **AGPL-3.0**; Commercial closed-source. Embedding modified CE in client-facing SaaS → AGPL issues. |
| **8. Difficulty** | **Very High** to hide behind PortalShell. |
| **9. Risks** | Gate “Simplify” fail; duplicates Guide/Connect. |
| **10. Affected areas** | Tasks, CTP progress — keep EA-owned. |

---

### 2.10 Lago

| # | Answer |
|---|---|
| **1. Gaps solved** | **A-013** usage metering / complex billing ledger; subscription entitlements engine. |
| **2. Overlaps** | **Stripe** checkout + Customer Portal (`app/portal/[slug]/billing`), `lib/fulfill-paid-client.ts`, package entitlements in `lib/modules/*`, pretix for event pay. Lago markets as Stripe **Billing** alternative (payments still via Stripe). |
| **3. Decision** | **REJECT** for Universal Portal v1 / launch. **STUDY ONLY** if EA later needs usage-based metering beyond Stripe Price objects. Do **not** replace Stripe or entitlement grants. |
| **4. Compatibility** | Separate billing API stack; Next would call Lago API. |
| **5. Auth / tenant / data** | Customers mirrored to Lago; risk of dual entitlement systems vs `ensurePackageEntitlements`. |
| **6. Hosting** | Significant (API, workers, DB) or Lago Cloud (costly at scale). |
| **7. License** | **AGPL-3.0** — same SaaS/modification caution; commercial offering exists. |
| **8. Difficulty** | **Very High** vs keeping Stripe. |
| **9. Risks** | Breaks fulfillment chain; Gate Replace is No (Stripe works). |
| **10. Affected areas** | Billing, fulfill, Stripe webhooks — **preserve**. |

---

## 3. Integration Gate scorecard (summary)

| Project | Replace | Reduce work | Invisible | Fit extension | Simplify | Gate outcome |
|---|---|---|---|---|---|---|
| RJSF | Yes (thin forms) | Yes | Yes | Forms/Documents | Yes | **Adopt (library)** |
| OpenFGA | Later (ACL) | Yes if ACL hard | Yes (API) | AuthZ beside RBAC | No (ops) now | **Defer / Study** |
| Novu | Partial (notify glue) | Yes | Yes if API | `notify-dispatch` | Conditional | **Adopt service later** |
| Chatwoot | No (Update Hub exists) | Maybe | Hard | Messaging | No | **Reject (portal)** |
| Trigger.dev | Partial (cron/Make) | Yes for long jobs | Yes | Cron/jobs | Conditional | **Adopt service optional** |
| Documenso | No (eSign exists) | No | Hard | Trust | No | **Reject** |
| Twenty | No | No | No | — | No | **Reject** |
| NocoBase | No (replaces chassis) | No | No | — | No | **Reject** |
| Plane | No | No | No | — | No | **Reject** |
| Lago | No (Stripe) | No now | Hard | Billing | No | **Reject (v1)** |

---

## 4. Smallest combination — what to BUILD vs buy

### BUILD INTERNALLY (no OSS product)

From gap audit Phase 0–2 — **not solved by the evaluated OSS set**:

| Gap | Build on |
|---|---|
| A-001 isolation cert | `lib/tenant-context.ts`, fulfill guards |
| A-002/A-003 ACL + family (v1) | Extend `lib/rbac.ts` + object ACL table; study OpenFGA for v2 |
| A-004–A-006, A-010, A-030 | `lib/experience-registry.ts`, `lib/modules/registry.ts`, `lib/ctp-client-nav.ts`, `lib/platform/client-configs.ts`, PortalShell |
| A-007 People | New module; evolve `lib/connect-store.ts` / Memberships — **not Twenty** |
| A-008 Messaging honesty | Rename/clarify `lib/portal-messaging-hub.ts` / Update Hub — **not Chatwoot** |
| A-009 Tasks inbox | Elevate `lib/connect-tasks.ts` + Guide NBA — **not Plane** |
| A-011 Calendar metadata | `lib/portal-event-hub.ts` + pretix (already Adopt) |
| A-013 Payment purposes | Thin ledger beside Stripe/pretix — **not Lago** |
| A-021 Pack provision | `lib/fulfill-paid-client.ts` |

### ADOPT DIRECTLY

1. **RJSF** — forms renderer for A-012.

### INTEGRATE AS A SERVICE (disabled until configured)

1. **Novu** — wire through `lib/notify-dispatch.ts` only.  
2. **Trigger.dev** — only when durable TS jobs are required beyond Vercel cron/Make.

### STUDY ONLY

1. **OpenFGA** — ReBAC model for later ACL.  
2. **Twenty** — People/custom-object modeling ideas.  
3. **Plane** — task UX patterns.  
4. **Lago** — usage metering patterns if commercial model changes.  
5. **Documenso** — only if exiting eSignatures.

### REJECT (as portal / chassis)

**NocoBase, Twenty (product), Plane (product), Chatwoot (as portal messages), Documenso (now), Lago (v1).**

---

## 5. Recommended sequence (aligned to gap audit phases)

| Phase | Action |
|---|---|
| **0** | BUILD internal ACL sketch; STUDY OpenFGA docs; no OpenFGA deploy |
| **1** | BUILD nav schema + IndustryPacks on existing registry/shell |
| **2** | **ADOPT RJSF**; BUILD People/Tasks; pretix already for events |
| **2b** | **INTEGRATE Novu** when notification channels/preferences become P2 blockers |
| **2c** | **INTEGRATE Trigger.dev** only if cron/Make fail durability needs |
| **Never (as chassis)** | NocoBase / Twenty / Plane / Lago replacing Stripe/entitlements |

---

## 6. Coverage vs gap ledger

| Gap ID | Best OSS from this list | Preferred EA action |
|---|---|---|
| A-002 / A-003 | OpenFGA | Study → maybe service; build thin ACL first |
| A-007 | Twenty | Reject product; study; build People |
| A-008 | Chatwoot | Reject as portal; clarify Requests |
| A-009 | Plane | Reject product; build Tasks |
| A-012 | **RJSF** | **Adopt library** |
| A-013 | Lago | Reject v1; thin ledger + Stripe/pretix |
| A-015 | **Novu** | **Integrate service later** |
| Reminders / durable jobs | **Trigger.dev** | Optional service |
| Chassis / packs / NBA | None | **Build internally** |
| E-sign | Documenso | Reject; keep Trust/eSignatures |

---

## 7. Final lists

### WHAT TO ADOPT / INTEGRATE (smallest set)

1. **RJSF** — ADOPT DIRECTLY for forms.  
2. **Novu** — INTEGRATE AS A SERVICE via `dispatchNotification` when ready.  
3. **Trigger.dev** — INTEGRATE AS A SERVICE only if needed for durable jobs.

### WHAT TO STUDY ONLY

OpenFGA, Twenty (schema), Plane (UX), Lago (metering), Documenso (if eSign exit).

### WHAT TO REJECT

NocoBase; Twenty/Plane/Chatwoot/Lago/Documenso as replacements for PortalShell, Connect, Guide, Stripe, Trust/eSignatures, or Update Hub.

### WHAT TO BUILD INTERNALLY

Universal capability map, nav/IndustryPacks, People, Tasks inbox, thin ACL, NBA providers, purpose-tagged payment records, CTP pack provisioning — on **existing** CTP, PortalShell, registry, entitlements, RBAC, Stripe, Pulse, pretix.

---

*End of OSS fit audit. No packages installed; no product code modified.*
