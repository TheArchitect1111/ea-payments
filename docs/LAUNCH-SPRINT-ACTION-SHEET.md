# Launch sprint — your action sheet

**Live status:** `controlled_paid_launch_ready` (80/100) — revenue + delivery green  
**PR:** https://github.com/TheArchitect1111/ea-payments/pull/18  
**After merge + deploy:** target `full_launch_ready`

---

## Step 1 — Merge & deploy (you)

1. Merge PR #18 when Vercel preview is green (build fix pushed in `9a045df`)
2. If merge conflicts with `master`, merge `master` into the branch in GitHub UI or locally after stashing WIP
3. Vercel Production → **Redeploy** latest

---

## Step 2 — Vercel Production env (paste these)

```env
NEXT_PUBLIC_BASE_URL=https://www.efficiencyarchitects.online
NEXT_PUBLIC_SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
UPTIME_KUMA_DASHBOARD_URL=https://<your-uptime-kuma-url>
BACKUP_DESTINATION_URI=<s3:// or https:// backup destination>
CRON_SECRET=<random-64-char-hex>
RESEND_FROM_EMAIL=noreply@efficiencyarchitects.online
```

Optional:

```env
ESIGNATURES_MSA_TEMPLATE_ID=
ESIGNATURES_SOW_TEMPLATE_ID=
PLATFORM_GUARDIAN_EMAIL=freedom@efficiencyarchitects.online
```

---

## Step 3 — DNS (15 min) — `docs/DNS-THREE-CLICKS.md`

1. Remove `www` + apex from **efficiency-architects** Vercel project  
2. Add domains to **ea-payments** → set `www` as Primary  
3. Namecheap Advanced DNS → CNAME `www` → `cname.vercel-dns.com`  
4. Redeploy after `NEXT_PUBLIC_BASE_URL` is set  

**Fixes:** wrong site on `www`, eSign callback 405 on canonical domain

---

## Step 4 — Live payment test

1. https://ea-payments.vercel.app/checkout (or www after DNS)  
2. Complete one **live** Stripe purchase  
3. Confirm: Airtable client row, welcome email, Make onboarding scenario history  

---

## Step 5 — Verify green

```powershell
cd ea-payments
LAUNCH_BASE_URL=https://ea-payments.vercel.app npm run launch:report
npm run backup:verify
npm run test:smoke
```

**Pass criteria:**

| Check | Target |
|-------|--------|
| `status` | `full_launch_ready` |
| `monitoringReady` | yes |
| `fullLaunchReady` | yes |
| Score | 90+ |

---

## Step 6 — Ecosystem (after ea-payments is green)

| Repo | Action |
|------|--------|
| portal-core / premium-chassis | Commit + sync `vendor/portal-chassis` |
| cpr-site, SisterHub | Uptime monitors + deploy verify |
| efficiency-architects marketing | DNS routes to ea-payments, not stale project |
| Partner Network Airtable | Partner rows for portal logins |

---

## CLI quick links

- Command Center: `/launch`  
- Ops health: `/api/health/ops`  
- Tester hub: `/start`  
- Platform Guardian doc: `docs/PLATFORM-GUARDIAN.md`
