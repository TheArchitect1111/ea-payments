# EA — external testing guide

**Share this URL with testers:** https://ea-payments.vercel.app

Do **not** send people to `www.efficiencyarchitects.online` yet — that domain still shows a legacy site. All preview testing uses the Vercel URL above.

---

## What to test

| # | Flow | URL | What good looks like |
|---|------|-----|----------------------|
| 1 | **Homepage** | `/` | Hero: “What would become possible…” · sections for Unifi™, Fortifi™, Amplifi™, Pulse™ · CTAs scroll or link to assessment |
| 2 | **Simplifi landing** | `/simplifi` | “Never Lose An Opportunity Again” · Start Simplifi buttons |
| 3 | **Capacity Assessment** | `/assessment` | Form loads · logo returns to homepage · submit reaches thank-you (if backend env is set) |
| 4 | **Scorecard** | `/scorecard` | Download `.docx` works |
| 5 | **Client portal** | `/portal/login` | Login form loads (test credentials provided separately) |
| 6 | **Unsubscribe** | `/unsubscribe` | Page loads · mailto link works |

### Optional (admin / payments)

| Flow | URL | Notes |
|------|-----|--------|
| Admin login | `/admin/dashboard` | Requires admin password |
| Simplifi checkout | `/checkout?package=simplifi_early_access` | Requires Stripe test/live keys in Vercel |
| Master Control | `/admin/master` | Internal only — do not share widely |

---

## Tester checklist (copy/paste)

```
Homepage
[ ] Loads on phone and laptop
[ ] “Take The Assessment” works
[ ] Product sections scroll smoothly

Simplifi
[ ] /simplifi loads
[ ] “Start Simplifi” opens checkout (or shows clear error if Stripe not configured)

Assessment
[ ] Form is readable on mobile
[ ] Logo goes back to homepage (not old .online site)
[ ] Submit completes OR shows a clear message

Scorecard
[ ] Download starts

General
[ ] No broken images (EA logo visible)
[ ] Footer links work
```

---

## Known limitations (preview)

- **Marketing domain** — DNS cutover to `.online` is pending; use `ea-payments.vercel.app` only.
- **Assessment submit** — needs Airtable + Resend configured in Vercel Production; if unset, submit may fail silently or show an error.
- **Payments** — checkout requires Stripe env vars; use test mode for external payment tests.
- **Portal** — requires a client record + password in Airtable.

---

## Feedback

Send notes to **freedom@efficiencyarchitects.online** with:

- Device (iPhone, Android, Mac, Windows)
- Browser
- URL tested
- Screenshot if something looks wrong

---

## Rollback

If a bad deploy ships during testing:

```bash
vercel rollback ea-payments --yes
```
