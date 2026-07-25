# EA Core Technology Stack

**Status:** Frozen for Version 1 launch  
**Product:** Efficiency Architects — Website + Guided Project Experience  
**Principle:** Build fewer things. Build them exceptionally well.

> Every new tool must reduce complexity or replace an existing capability.  
> If it adds complexity without significant value, it is not adopted.

---

## Operating rule

Before adopting any external technology, complete [INTEGRATION-GATE.md](./INTEGRATION-GATE.md).  
Reject anything that fails the gate. Prefer consolidation over expansion.

---

## Core (required for Version 1)

| Technology | Purpose | Where used | Dependencies | Owner |
|---|---|---|---|---|
| **GitHub** | Source control, PRs, CI | Entire monorepo | — | Engineering |
| **Cursor** | Primary development IDE / agents | Local + Agent workflows | GitHub | Engineering |
| **Vercel** | Hosting / deploys | `ea-payments` production | GitHub | Platform |
| **Next.js** | App framework | `app/`, API routes | Vercel | Engineering |
| **Stripe** | Payments / checkout / webhooks | Checkout, fulfill, billing | Vercel env | Commercial |
| **Resend** | Transactional email | Welcome, magic link, notifications | Vercel env | Ops |
| **Airtable** | Tenant + ops data | Clients, orgs, CTP, Creative Studio | API key | Platform |
| **Make.com** | External automation bridges | Onboarding / contract webhooks | Webhook URLs | Ops |
| **OpenAI (via AI Gateway)** | Model calls | `lib/ai/gateway.ts`, agents, Simplifi | `OPENAI_API_KEY` | Engineering |
| **Portal Chassis** | Client portal shell | `@ea/portal-chassis`, module registry | Sessions | Engineering |
| **Guide / Project State Engine** | Client SSOT for project progress | CTP Progress, stages | Airtable CTP | Product |
| **Website Director + Experience Director** | Site compose + publish gate | `lib/website-publish-gate.ts` | Airtable / Puck | Engineering |
| **HMAC portal/admin sessions** | Auth | `lib/ea-portal-auth.ts`, 2FA, magic link | `SESSION_SECRET` | Security |

---

## Optional (configured when needed — disabled until configured)

| Technology | Purpose | Where used | Status | Owner |
|---|---|---|---|---|
| **OmniRoute** | Multi-model AI routing | Behind `lib/ai/gateway.ts` | **Not configured** (registered stub) | Engineering |
| **Scrapling** | Opportunity / web research collection | Factory research providers | **Not configured** (registered stub) | Engineering |
| **Open Design** | Creative experience engine (internal) | `lib/open-design/`, Factory | Architecture present; not customer-facing | Engineering |
| **PraisonAI** | Workforce agents (after-launch depth) | `lib/praison-ai/` | Present; not launch-blocking | Engineering |
| **n8n** | Connect automation (where used) | EA Connect flows | Optional | Ops |
| **Firecrawl** | Existing crawl path (if env set) | Research | Optional | Engineering |
| **Sentry / GlitchTip** | Error monitoring | Ops health | Optional until configured | Platform |
| **Twilio** | SMS (if env set) | Notifications | Optional | Ops |
| **pretix** | Event registration / tickets / payments | Event Hub™ deep-links + webhook → Pulse | Optional — disabled until shop URL / env seed | Platform |

---

## Internal developer tools (never customer-facing)

| Technology | Purpose | Status | Owner |
|---|---|---|---|
| **Onlook** | Visual editing workflow for builders | Documented only — no portal module | Engineering |
| **OpenHands** | Autonomous coding agent (GitHub/Cursor workflow) | Candidate — workflow only, not a product surface | Engineering |
| **Anima** | Design → React accelerator | Candidate — workflow only | Engineering |
| **ChatGPT** | Ideation / ops assist | External; not embedded as a product | Founder |

---

## Future queue (placeholders only — Not Installed)

| Technology | Purpose | Status |
|---|---|---|
| **Postiz** | Invisible publishing engine for future Amplifi Communications | Not Installed |
| **Cal.com** | Scheduling (future module slot) | Not Installed |
| **OpenWA** | WhatsApp campaigns (future Communications) | Not Installed |
| **VoxCPM2** | Voice / narration (future) | Not Installed |
| **MoneyPrinterTurbo** | Short-form video pipeline (future) | Not Installed |
| **LibreChat** | Multi-model chat UI | Not Installed — after launch |
| **ECC Agent Framework** | Expanded autonomous agents | Not Installed — after launch |

Runtime catalog: `lib/platform/launch-provider-catalog.ts` (health via `/api/health/ops`).

---

## Candidate for removal / do not adopt

| Technology | Reason |
|---|---|
| **Dify** | Duplicate orchestration — we already have Factory + AI gateway + Pulse |
| **Flowise** | Same — increases complexity without replacing a Core capability |
| **Second plugin/integrations dashboard** | Forbidden — use Launch Command Center + existing registries |
| **White-label Portal Engine (V2)** | Deferred — not Version 1 |
| **In-app messaging inbox** | Repositioned as Contact your guide — do not expand into Slack clone |

---

## Single extension points (do not fork)

| Concern | Canonical home |
|---|---|
| Portal products | `lib/modules/registry.ts` + capability framework |
| AI models / agents | `lib/ai/gateway.ts` + `lib/agents/registry.ts` |
| Research / opportunity collection | `lib/factory-research/*` |
| Publishing | `lib/publishing/publish.ts` / Amplifi publish facade |
| Health / readiness | `lib/platform-ops.ts`, `/launch`, `/api/health/*` |
| External SaaS secrets | Env vars + thin adapters (Make, Stripe, Resend pattern) |

---

## Amplifi note (deferred product work)

Amplifi **Communications™** (calendar, campaigns, Postiz-backed publishing) is **not** in Version 1 core.  
When built, Postiz must be an invisible engine behind Amplifi — never a bolted-on Postiz UI.  
Until then Postiz remains **Not Installed** in the future queue.

---

## Change control

1. Propose the tool.  
2. Pass [INTEGRATION-GATE.md](./INTEGRATION-GATE.md).  
3. Register into an existing extension point above.  
4. Ship **disabled until configured**.  
5. Update this document in the same change.

Last updated: 2026-07-21
