# Launch today — Simplifi, Magnifi, Amplifi (June 2026)

Use this guide to get **real-world phone testing** working today. Every step explains **what**, **why**, and **where to click**.

**Canonical testing URL (new platform):** https://ea-payments.vercel.app

**Do not use for testing yet:** https://www.efficiencyarchitects.online — that domain still points at the **old** Create React App site (different Vercel project). If your phone bookmark or autocomplete opens `.online`, you will see the legacy site even though `ea-payments.vercel.app` is correct.

---

## Product links you can send (name in URL)

| Product | Link to send | Why this link |
|---------|--------------|---------------|
| **Simplifi capture (phone FAB)** | https://ea-payments.vercel.app/simplifi/capture | Mobile page with gold **Capture** floating button |
| **Simplifi marketing** | https://ea-payments.vercel.app/simplifi | Product landing page |
| **Magnifi demo (no login)** | https://ea-payments.vercel.app/consider/selena | Full shareable opportunity experience |
| **Magnifi short path** | https://ea-payments.vercel.app/magnifi | Redirects to Selena demo |
| **Amplifi** | https://ea-payments.vercel.app/amplifi | Login → demo Amplifi hub |
| **Pulse** | https://ea-payments.vercel.app/products/pulse | Login → demo Pulse dashboard |
| **Portal login** | https://ea-payments.vercel.app/portal/login | All authenticated products |

**Path-based product URLs (work today, no extra Vercel projects):**

- `/products/simplifi` → capture page  
- `/products/magnifi` → consider demo  
- `/products/amplifi` → Amplifi hub  
- `/products/pulse` → Pulse dashboard  

---

## Optional: `ea-simplifi.vercel.app` style subdomains

Vercel gives each **project** one default `*.vercel.app` name. The main platform is `ea-payments.vercel.app`.

To get **product name in the hostname** (e.g. `ea-simplifi.vercel.app`):

1. Open https://vercel.com/the-architects-projects-cc813778  
2. **Add New → Project** → import the **same GitHub repo** as ea-payments  
3. Name the project **`ea-simplifi`** (repeat for `ea-magnifi`, `ea-amplifi`, `ea-pulse`)  
4. Use the **same env vars** as ea-payments (especially `AIRTABLE_API_KEY`)  
5. Deploy — Vercel assigns `ea-simplifi.vercel.app` automatically  
6. Middleware in the repo already routes each host’s `/` to the right product entry  

**Why:** Testers see the product name in the link. Each project can be redeployed independently later.

---

## Step 1 — Airtable setup (required for real captures)

### What this does

Simplifi **captures** (URL paste, photo upload) are saved in Airtable **Capture Records**. Magnifi reads those records to build `/magnifi/{id}`. Without this table, capture may analyze but **not persist** — links break after refresh.

### Why you need it

- **Simplifi** = save opportunity  
- **Magnifi** = cinematic story from saved record  
- **Pulse** = list of captures in portal  

Login and `/consider/selena` work without Airtable; **live capture → Magnifi** does not.

### How (about 5 minutes)

1. Create an Airtable token: https://airtable.com/create/tokens  
   - Scopes: `data.records:read`, `data.records:write`, `schema.bases:read`, `schema.bases:write`  
   - Access: **Airtable Payments** base (`appv0YoLIMY45fmDA`)

2. On your PC, open folder:  
   `C:\Users\brick\ea-launch-audit\ea-payments\scripts`

3. Double-click **`run-airtable-setup.bat`**

4. Paste token when prompted (starts with `pat...`)

5. Wait for three steps to finish:
   - **[1/3]** Client Records fields (portal login, demo user)  
   - **[2/3]** Capture Records table (Simplifi + Magnifi storage)  
   - **[3/3]** Demo client + sample Magnifi record (prints URLs)

6. Copy the **Magnifi V2** URL printed at the end — that is your backup demo link.

### Add token to Vercel (production)

1. Open https://vercel.com/the-architects-projects-cc813778/ea-payments/settings/environment-variables  
2. Set **`AIRTABLE_API_KEY`** = your `pat...` token (Production)  
3. Redeploy: https://vercel.com/the-architects-projects-cc813778/ea-payments → Deployments → Redeploy latest  

**Why:** Local setup fixes Airtable schema; Vercel needs the same key so **production** captures save.

---

## Step 2 — Phone testing: Simplifi floating Capture button

### What testers get

- Gold **Capture** button fixed at bottom-right (FAB)  
- Sheet: Paste URL · Photo/screenshot · Use current link  
- After capture: **Consider**, **Magnifi**, **Simplifi guidance** links  

### Link to send

https://ea-payments.vercel.app/simplifi/capture

### Demo login (required for capture)

| Field | Value |
|-------|-------|
| Email | `demo@efficiencyarchitects.online` |
| Password | `DemoPulse2026!` |

### Add to Home Screen (iPhone / Android)

1. Open **Safari** or **Chrome** → go to `/simplifi/capture`  
2. Sign in with demo credentials  
3. **Share → Add to Home Screen**  
4. Open from home screen — Capture button stays at bottom like an app  

**Why:** Mobile browsers do not allow a floating button on *other* websites without a browser extension. The home-screen shortcut opens Simplifi capture full-screen with the FAB.

### Floating AI Guide (different feature)

The **Ask Simplifi Guide** button appears on **Simplifi Guidance** pages (`/simplifi/guidance/{id}`), not on the capture page. That is the advisor Q&A panel after Magnifi analysis.

---

## Step 3 — Magnifi testing (share without login)

Send: https://ea-payments.vercel.app/consider/selena

Tester flow:

1. Scroll through scores and narrative  
2. Tap **Take Assessment** (tracks in Pulse when Airtable is wired)  
3. Tap **Book Discovery** (Calendly)  

After Step 1 Airtable setup, captures from Simplifi also produce:

- `/magnifi/{captureId}` — cinematic  
- `/simplifi/guidance/{captureId}` — guided journey + floating Guide  

---

## Step 4 — Amplifi testing

Send: https://ea-payments.vercel.app/amplifi

1. Sign in with demo credentials  
2. Lands on **Amplifi hub** — journey, stats, links to latest Magnifi  

---

## Step 5 — Fix “homepage buttons do nothing”

Previously **Learn More** on Unifi/Fortifi only scrolled the same page. **Explore Pulse** jumped to Assessment instead of Pulse.

**Fixed in latest deploy:**

- **Explore Amplifi** → portal login → Amplifi hub  
- **Explore Pulse** → portal login → Pulse  
- **Explore Fortifi** → portal login → Updates  
- **Explore Unifi** → Capacity Assessment  

If buttons still feel dead, hard-refresh or clear cache — you may be on the old `.online` site.

---

## Step 6 — Copy/paste message for friends

```
Test Efficiency Architects (preview):

Simplifi on phone (capture button):
https://ea-payments.vercel.app/simplifi/capture
Login: demo@efficiencyarchitects.online / DemoPulse2026!
Add to Home Screen, tap Capture, paste any business URL.

Magnifi demo (no login):
https://ea-payments.vercel.app/consider/selena

Amplifi hub:
https://ea-payments.vercel.app/amplifi

Use ea-payments.vercel.app only — NOT efficiencyarchitects.online
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Old website on phone | Bookmark/DNS to `.online` | Use `ea-payments.vercel.app` link above |
| Capture fails after login | No Airtable Capture Records | Run `run-airtable-setup.bat` + Vercel env |
| “Simplifi Early Access required” | Client not on Simplifi package | Demo login auto-provisions Simplifi on first sign-in |
| Magnifi 404 | No capture id / Airtable empty | Use `/consider/selena` or seed script URL |
| Buttons on homepage dead | Cached old build or wrong domain | Hard refresh on ea-payments.vercel.app |

---

## Feedback

Email **freedom@efficiencyarchitects.online** with device, browser, exact URL, screenshot.
