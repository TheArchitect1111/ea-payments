# Integration Gate

**Purpose:** Keep the EA stack small, clean, and capable.  
**When:** Before any new third-party tool is adopted or wired into the product.  
**Companion:** [EA-Core-Technology-Stack.md](./EA-Core-Technology-Stack.md)

---

## Checklist (all must be Yes — or Reject)

Score each question **Yes / No**. One **No** without a written exception = **Reject**.

| # | Question | Yes | No |
|---|---|---|---|
| 1 | **Replace** — Does it replace an existing tool or clearly retire overlapping work? | | |
| 2 | **Reduce work** — Does it reduce meaningful manual work for EA or clients? | | |
| 3 | **Invisible when possible** — Can users avoid seeing the vendor brand/UI (engine behind EA)? | | |
| 4 | **Fit** — Does it plug into an existing extension point (gateway, research providers, module registry, publish facade, ops health)? | | |
| 5 | **Simplify** — Does the platform feel simpler after adoption (not more dashboards, settings, or nav)? | | |

---

## Decision

- **Adopt** — 5× Yes, registered into one existing framework, shipped **disabled until configured**, stack doc updated.  
- **Defer** — Valuable later; add to Future Queue as **Not Installed** only.  
- **Reject** — Increases complexity without substantial user value (examples: Dify, Flowise, second orchestrator, second integrations dashboard).

---

## Forbidden patterns

- Second integration / plugin manager  
- Second settings dashboard for vendors  
- Customer-facing UI for internal tools (Onlook, OpenHands, Anima)  
- Bolting a vendor console into Amplifi/Simplifi/Launch  
- Installing a tool “just in case”

---

## Operating principle

> Build fewer things. Build them exceptionally well.  
> Every new tool must reduce complexity or replace an existing capability.  
> If it adds complexity without significant value, it is not adopted.

---

## Record

For each proposal, note:

- Tool name  
- Proposed extension point  
- Gate scores (1–5)  
- Decision + date  
- Owner  

### pretix (Event Hub™) — Adopted 2026-07-25

| # | Score | Note |
|---|---|---|
| 1 Replace | Yes | Replaces building in-EA ticketing / camp registration |
| 2 Reduce work | Yes | Registration, pay, confirmations stay in pretix |
| 3 Invisible when possible | Partial* | Clients leave to pretix shop for checkout (exception: event engines are checkout destinations) |
| 4 Fit | Yes | Event Hub module + Pulse webhook; no second dashboard |
| 5 Simplify | Yes | One Event Hub surface; disabled until shop URL configured |

\*Exception: checkout UX is intentionally pretix; EA deep-links only.

- **Extension point:** `events` module, `/api/webhooks/pretix`, Pulse `events` product  
- **Docs:** [integrations/PRETIX-EVENT-ENGINE.md](./integrations/PRETIX-EVENT-ENGINE.md)  
- **Owner:** EA platform  

Last updated: 2026-07-25
