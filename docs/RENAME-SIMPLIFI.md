# Rename: ea-payments → simplifi

The codebase is **Simplifi** (EA Intelligence OS). Vercel project name may still be `ea-payments` until you rename in the dashboard — that is fine.

## GitHub (one-time)

1. GitHub → **TheArchitect1111/ea-payments** → Settings → General → **Rename** → `simplifi`
2. Locally: `git remote set-url origin https://github.com/TheArchitect1111/simplifi.git`

## Canonical URLs

| Purpose | URL |
|---------|-----|
| Production | https://www.efficiencyarchitects.online |
| Workspace | https://www.efficiencyarchitects.online/simplifi/workspace |
| Simplifi app | https://app.simplifi.ai (add domain in Vercel) |
| App alias | `/app` → `/simplifi/workspace` |
| Capture | `/simplifi/capture` |

## Airtable — marketing views + new fields

**Paste prompt:** `ea-operating-system/Prompt Library/Airtable Rename - MARKETING NAMES PROMPT.md`  
**Open base:** https://airtable.com/appv0YoLIMY45fmDA

Safe: view names, descriptions, demo labels.  
Locked: table names + column headers listed in that prompt.

### Capture Records fields (add if missing — do not rename)

- Next Action (single line)
- Due Date (date)
- Owner (single line)
- Why This Matters (long text)
- What Most People Do (long text)
- What We Recommend (long text)
- Save Purpose, Save Reason
- Outcome Status (single line)

Guidance triple is written automatically when capture analysis completes.

## Active Save™

After capture, users set **purpose + target date** (Review Later, Visit Later, etc.). Stored in Save Purpose, Due Date, Next Action.

## app.simplifi.ai (Vercel DNS)

1. Vercel → ea-payments project → **Settings → Domains** → Add `app.simplifi.ai`
2. At your DNS host, **CNAME** `app` → `cname.vercel-dns.com`
3. Middleware routes: `/` → workspace, `/capture` → `/simplifi/capture`
4. Optional staging host: `app-simplifi.vercel.app` (add in Vercel if desired)

## Architect Mode (CTP gate)

Consider The Possibilities™ sections (scores, revenue estimates, CTP narrative) require **Architect Mode**:

- EA admin session cookie, OR
- Portal slug in `ARCHITECT_PORTAL_SLUGS` with email in `ARCHITECT_EMAILS`

Public demo `/consider/selena` remains fully visible for marketing.

Env vars (optional):

```
ARCHITECT_PORTAL_SLUGS=demo-client,robert-portal
ARCHITECT_EMAILS=freedom@efficiencyarchitects.online
```

## Vercel (optional)

- Rename project to `simplifi` in Vercel dashboard
- Add domain alias `app.simplifi.ai` → `/simplifi/workspace` when DNS is ready
