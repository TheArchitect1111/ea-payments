# Simplifi Launch Readiness — Production Validation Report

**Date:** 2026-07-07  
**Sprint:** Phase 1 — Launch Readiness  
**Production:** https://ea-payments.vercel.app  
**Validator:** `scripts/validate-simplifi-launch-readiness.mjs`

---

## Executive summary

| Verdict | **NO-GO** for full Early Access exit criteria |
|---------|-----------------------------------------------|
| **Reason** | `app.simplifi.ai` DNS does not resolve — exit criterion **DNS works** fails |
| **Conditional** | Core pipeline **GO** on `ea-payments.vercel.app` — capture, Magnifi, guidance, intelligence, auth, health |

---

## Phase 1 checklist

| # | Item | Result | Evidence |
|---|------|--------|----------|
| 1 | Fix CI `verify:deploy` | **Ready locally** | `scripts/start-production.mjs`, `scripts/ensure-production-build.mjs`, `playwright.smoke.config.ts` updated — **must be committed to master** for GitHub CI |
| 2 | Airtable Capture Records on production | **PASS** | `checks.airtableSchema.capture.ok: true`, table `Capture Records` |
| 3 | `products.simplifi = true` | **PASS** | Health endpoint 2026-07-07 |
| 4 | E2E: Capture → Analyze → Persist → Magnifi → Guidance | **PASS** | Record `recNf1zV7SX0AtWFn` — analyze 200, magnifi 200, guidance 200 |
| 5 | `app.simplifi.ai` DNS, SSL, redirects | **FAIL** | NXDOMAIN / fetch failed; middleware on primary host **PASS** (`/capture` → `/simplifi/capture`, `/app` → workspace) |
| 6 | Portal login, Simplifi login, demo provisioning | **PASS** | Portal login → `demo-client`; `/simplifi/login` → 200 |
| 7 | Branding decision | **Recommend A** | Launch with existing Simplifi blue — see below |
| 8 | Tester documentation | **DONE** | `docs/SIMPLIFI-EARLY-ACCESS-TESTER-GUIDE.md` |
| 9 | Decision Intelligence on new captures | **PASS** | `recommendedPath: overlay`, API 200 |

---

## Branding decision (Item 7)

### Recommendation: **Option A — Launch with existing Simplifi blue branding**

| Option | Pros | Cons |
|--------|------|------|
| **A. Simplifi blue** | Zero launch risk; no CSS churn; matches PWA `themeColor`; users already see blue on landing/capture | Differs from EA navy/gold on portal |
| **B. Migrate to EA tokens** | Brand unity with portal | Requires CSS edits across landing, capture, workspace — **violates no-redesign sprint scope**; regression risk before launch |

**Decision:** Ship Early Access on **Option A**. Document the split in tester guide. Schedule EA token alignment for Phase 2 (post-launch), not a launch blocker.

---

## Production validation detail

### Health (`GET /api/health/launch`)

```json
"products": { "simplifi": true },
"airtableSchema": { "capture": { "ok": true, "tableName": "Capture Records" } }
```

### Full pipeline (latest validation run)

| Step | Status |
|------|--------|
| Portal login | ✓ `demo-client` |
| Capture analyze | ✓ 200, status `Routed` |
| Persist | ✓ `recNf1zV7SX0AtWFn` |
| Magnifi | ✓ `/magnifi/recNf1zV7SX0AtWFn` → 200 |
| Guidance | ✓ `/simplifi/guidance/recNf1zV7SX0AtWFn` → 200 |
| Decision intelligence | ✓ `overlay` |

### Middleware (primary host)

| Path | Redirect | Status |
|------|----------|--------|
| `/capture` | `/simplifi/capture` | 307 ✓ |
| `/app` | `/simplifi/workspace` | 307 ✓ |

### app.simplifi.ai

| Check | Result |
|-------|--------|
| DNS resolution | **FAIL** — non-existent domain |
| SSL | N/A |
| Root → workspace | N/A |
| `/capture` alias | N/A |

**Remediation:** Add `app.simplifi.ai` in Vercel project domains → CNAME `cname.vercel-dns.com` (documented in health `manual.simplifiAppDns`).

**Workaround for Early Access:** Use `https://ea-payments.vercel.app/simplifi/*` or `https://www.efficiencyarchitects.online/simplifi/*`.

---

## CI fix (Item 1)

**Root cause:** `playwright.smoke.config.ts` references `scripts/start-production.mjs` which was **untracked** on master → CI `MODULE_NOT_FOUND`.

**Files changed:**

| File | Change |
|------|--------|
| `scripts/start-production.mjs` | Self-healing `next start` wrapper (new, was untracked) |
| `scripts/ensure-production-build.mjs` | Build guard before start (new, was untracked) |
| `playwright.smoke.config.ts` | Use `start-production.mjs`; `reuseExistingServer` in CI |
| `scripts/validate-simplifi-launch-readiness.mjs` | Production validation script (new) |
| `docs/SIMPLIFI-EARLY-ACCESS-TESTER-GUIDE.md` | Tester limitations doc (new) |
| `docs/SIMPLIFI-LAUNCH-READINESS-REPORT.md` | This report (new) |

**Action required:** Commit and push the above to `master` so GitHub Actions `verify:deploy` passes.

---

## Screenshots

Capture with:

```bash
node scripts/capture-simplifi-launch-screenshots.mjs https://ea-payments.vercel.app
```

Output: `docs/screenshots/simplifi/launch-readiness/`

---

## Exit criteria scorecard

| Criterion | Met? |
|-----------|------|
| Capture persists | ✓ |
| Magnifi works | ✓ |
| Guidance works | ✓ |
| Health endpoint passes | ✓ |
| CI passes | ⏳ Local fix ready; **pending commit to master** |
| DNS works | ✗ `app.simplifi.ai` |
| SSL works | ✗ (blocked by DNS) |
| Auth works | ✓ |
| No production blocker remains | ✗ **DNS blocker** |

---

## Remaining blockers

| Priority | Blocker | Owner action |
|----------|---------|--------------|
| **P0** | `app.simplifi.ai` DNS not configured | Vercel Domains + DNS CNAME |
| **P0** | CI scripts not on `master` | Commit `start-production.mjs`, `ensure-production-build.mjs`, `playwright.smoke.config.ts` |
| P2 | Sentry / uptime not set | Not required for Early Access (full launch only) |
| P2 | CTP Submissions schema incomplete | Unrelated to Simplifi capture |

---

## Launch recommendation

### Early Access: **CONDITIONAL NO-GO** until:

1. **`app.simplifi.ai` DNS** is live **OR** launch explicitly uses `ea-payments.vercel.app` / `efficiencyarchitects.online` only (update marketing materials).
2. **CI fix committed** to master and green.

### Core product: **GO**

The Simplifi capture → Magnifi → guidance pipeline is **production-validated**. Testers can begin on the primary URL immediately if DNS deferral is accepted.

### After DNS + CI:

**GO for Early Access** with Option A branding and `docs/SIMPLIFI-EARLY-ACCESS-TESTER-GUIDE.md` distributed to testers.

---

## Validation commands

```bash
node scripts/validate-simplifi-launch-readiness.mjs https://ea-payments.vercel.app
node scripts/test-capture-e2e.mjs https://ea-payments.vercel.app
npm run verify:deploy
```
