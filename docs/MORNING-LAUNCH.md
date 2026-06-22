# Morning Launch Checklist

**Canonical URL:** https://www.efficiencyarchitects.online  
**Demo login:** demo@efficiencyarchitects.online / DemoPulse2026!

Code is deployed. These steps need your hands in Airtable, Vercel, and DNS.

---

## 1. Airtable (15 min)

1. Open https://airtable.com/appv0YoLIMY45fmDA
2. Paste prompt from `ea-operating-system/Prompt Library/Airtable Rename - MARKETING NAMES PROMPT.md`
3. Confirm **8 new columns** exist on Capture Records (Guidance + Active Save fields)
4. Test capture → Active Save → fields populate

---

## 2. app.simplifi.ai DNS (10 min)

1. Vercel → **ea-payments** → Settings → Domains → Add `app.simplifi.ai`
2. DNS host → CNAME `app` → `cname.vercel-dns.com`
3. Wait for SSL → https://app.simplifi.ai should open workspace

Until DNS propagates, use:
- https://www.efficiencyarchitects.online/simplifi/workspace
- https://www.efficiencyarchitects.online/app

---

## 3. Vercel env (if not set)

| Variable | Purpose |
|----------|---------|
| `EA_CAPTURE_API_KEY` | Extension + bookmarklet capture |
| `ONBOARDING_WEBHOOK_URL` | Full launch automation |
| `ESIGN_WEBHOOK_URL` | E-sign flow |
| `ARCHITECT_PORTAL_SLUGS` | CTP gate (optional) |
| `ARCHITECT_EMAILS` | CTP gate (optional) |

Redeploy after changes.

---

## 4. 12-point smoke test

| # | System | URL / action |
|---|--------|--------------|
| 1 | Health | `/api/health/launch` |
| 2 | Tester hub | `/start` |
| 3 | Workspace | `/simplifi/workspace` |
| 4 | Capture | `/simplifi/capture` → URL |
| 5 | Active Save | Purpose + due date after capture |
| 6 | Story drafts | LinkedIn / Email / SMS tabs on success |
| 7 | Magnifi | Auto-opens after capture |
| 8 | Amplifi | `/amplifi/share` |
| 9 | Extension | Screenshot → notification |
| 10 | Update Hub | Submit → admin publish → client feed |
| 11 | Command Center | `/admin/master` Attention Center |
| 12 | GFS modal | First login on portal/capture |

---

## 5. Optional polish

- GitHub rename: `ea-payments` → `simplifi`
- Stripe live E2E test
- `PULSE_EVENTS_TABLE` in Airtable for persistent Pulse bus

---

## What shipped overnight (Phase 2 start)

- **Story Engine v1** — LinkedIn, email, SMS, caption drafts (`lib/story-engine.ts`)
- **Memory Library** — reusable assets on workspace
- **Smart Expiration** — overdue / stale / due-soon in Daily Brief + Snooze 30d
- **Outcome Tracking v1** — Won / In progress / Pass from workspace
- **Pulse in Daily Brief** — recent capture events for your portal
- **Archive from workspace** — clears inbox without portal hop

## Phase 2 continued (latest)

- `POST /api/portal/captures/outcome` — record outcomes + snooze
- `GET /api/portal/captures/[id]/story` — on-demand story drafts
- `capture.completed` + `capture.outcome_recorded` Pulse events

## Phase 2 — Decision + Build Intelligence (latest)

- **Decision Intelligence™** + **Build Intelligence™** on every capture (`lib/intelligence-bundle.ts`)
- `GET /api/portal/captures/[id]/intelligence` — blueprint + Cursor prompt
- Workspace **Build Intelligence** button on inbox items
- Supabase draft: `supabase/migrations/001_simplifi_objects.sql`
- Docs: `docs/SIMPLIFI-INTELLIGENCE.md`

- **Action Center** on workspace — Needs Attention, Recommended, Watchlist
- **Priority Engine** — dynamic scores on inbox items (Critical / High / Medium / Low)
- **Relationship hints** — clusters captures from same domain or save purpose
- **`lib/simplifi-store.ts`** — single load path (Airtable now, Supabase-ready)
