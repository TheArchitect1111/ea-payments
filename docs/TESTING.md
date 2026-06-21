# EA — external testing guide



**Share this URL with testers:** https://ea-payments.vercel.app



Do **not** send people to `www.efficiencyarchitects.online` yet — that domain still shows a legacy site.



---



## Demo login (Pulse + Simplifi + Magnifi)



| Field | Value |

|-------|-------|

| Login | https://ea-payments.vercel.app/portal/login |

| Email | `demo@efficiencyarchitects.online` |

| Password | `DemoPulse2026!` |

**First-time setup (once):** double-click `scripts/run-airtable-setup.bat`, paste Airtable token. Creates Capture Records, demo client, and prints a **Magnifi demo URL**.

Optional on Vercel: `LAUNCH_AUTO_APPROVE_PROPOSALS=true` — assessments can checkout from proposal without admin approval.

After setup, testers get:

- **Pulse:** `/portal/demo-client/pulse`
- **Simplifi workspace:** `/portal/demo-client/simplifi` — paste a URL to capture
- **Magnifi demo:** link printed by seed script (`/magnifi/{id}`)



---



## What to test



| # | Flow | URL | What good looks like |

|---|------|-----|----------------------|

| 1 | **Homepage** | `/` | Hero, product sections, assessment CTA |

| 2 | **Simplifi landing** | `/simplifi` | Marketing page · Start Simplifi → checkout |

| 3 | **Capacity Assessment** | `/assessment` | Submit → **thank-you** page · optional “View My Analysis” |

| 4 | **Pulse** | `/portal/login` → Pulse | Four client success scores after login |

| 5 | **Simplifi workspace** | `/portal/demo-client/simplifi` | Paste URL → scores → **Open Magnifi** link |

| 6 | **Magnifi experience** | `/magnifi/{id}` | Full-screen cinematic V2 · `?classic=1` for report view |
| 7 | **Simplifi guidance** | `/simplifi/guidance/{id}` | 9-section guided journey + AI Guide panel |
| 8 | **Update Hub** | `/portal/{slug}/updates` | Submit update requests |
| 9 | **Scorecard** | `/scorecard` | Download `.docx` works |
| 10 | **Unsubscribe** | `/unsubscribe` | Page loads |
| — | **Template library** | `/experience/templates` | All 10 Simplifi + Magnifi pairs listed |



### Optional (admin / payments)



| Flow | URL | Notes |

|------|-----|--------|

| Admin Simplifi | `/admin/simplifi` | Requires admin password · same capture pipeline |

| Admin login | `/admin/dashboard` | Internal |

| Simplifi checkout | `/checkout?package=simplifi_early_access` | Stripe keys required |

| Master Control | `/admin/master` | Do not share widely |



---



## Tester checklist (copy/paste)



```

Homepage

[ ] Loads on phone and laptop

[ ] “Take The Assessment” works



Assessment

[ ] Form readable on mobile

[ ] Submit → thank-you (not a broken error page)

[ ] “View My Analysis” works when proposal saved



Portal (demo login)

[ ] Login works

[ ] Pulse shows four scores

[ ] Simplifi tab → paste URL → capture completes

[ ] Magnifi link opens with sections + roadmap



Simplifi marketing

[ ] /simplifi loads

[ ] Checkout opens or shows clear Stripe message



Scorecard

[ ] Download starts



General

[ ] EA logo visible · footer links work

```



---



## Known limitations (preview)



- **Marketing domain** — use `ea-payments.vercel.app` only until DNS cutover.

- **Email** — welcome/onboarding emails need Resend DNS (not required for UI testing).

- **Make webhooks** — post-payment automation pending webhook URLs on Vercel.

- **Capture Records** — Simplifi/Magnifi need a **Capture Records** table in the Payments Airtable base. Run `node scripts/seed-demo-client.mjs` to create demo data (requires `AIRTABLE_API_KEY`).

- **URL scraping** — works with or without `FIRECRAWL_API_KEY` (fallback fetch when unset).



---



## Feedback



Send notes to **freedom@efficiencyarchitects.online** with device, browser, URL, and screenshot if something looks wrong.



---



## Rollback



```bash

vercel rollback ea-payments --yes

```


