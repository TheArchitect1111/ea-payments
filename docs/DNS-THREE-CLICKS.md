# DNS in 3 steps — stop the old website on phones

**Goal:** `www.efficiencyarchitects.online` serves **ea-payments** (new site) — not the legacy `efficiency-architects` Vercel project.

**Critical:** Two Vercel projects currently claim the domain. Remove domains from **efficiency-architects** first, then add to **ea-payments** and set `www` as **Primary**.

**Time:** ~15 minutes + wait for DNS (up to 24 hours, often faster)

---

## Step 1 — Tell Vercel you own the domain

1. Open https://vercel.com/the-architects-projects-cc813778/ea-payments/settings/domains  
2. Click **Add**  
3. Type: `www.efficiencyarchitects.online` → Add  
4. Type: `efficiencyarchitects.online` → Add  
5. Vercel shows **DNS records** (copy them — you need them in Step 2)

**Why:** Vercel needs permission to serve your domain.

---

## Step 2 — Paste records at Namecheap (your domain registrar)

1. Open https://ap.www.namecheap.com/domains/list/  
2. Click **Manage** next to `efficiencyarchitects.online`  
3. Go to **Advanced DNS**  
4. Add the records Vercel gave you (usually a **CNAME** for `www` and **A** record for `@`)  
5. Save  
6. Optional: set TTL to **5 min** for faster switch

**Why:** The internet uses DNS like a phone book — this points the name to Vercel.

---

## Step 3 — Update one setting on Vercel, then redeploy

1. Open https://vercel.com/the-architects-projects-cc813778/ea-payments/settings/environment-variables  
2. Set **`NEXT_PUBLIC_BASE_URL`** = `https://www.efficiencyarchitects.online` (Production)  
3. Redeploy: Deployments → latest → **Redeploy**

**Test:** Open https://www.efficiencyarchitects.online — headline **DISCOVER THE POSSIBILITIES.**

**Rollback:** Change DNS back at Namecheap to old targets if something breaks.

Full plan: `docs/dns-cutover-plan.md`
