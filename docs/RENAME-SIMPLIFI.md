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
| App alias | `/app` → `/simplifi/workspace` |
| Capture | `/simplifi/capture` |

## Airtable — Capture Records fields (add if missing)

- Next Action (single line)
- Due Date (date)
- Owner (single line)
- Why This Matters (long text)
- What Most People Do (long text)
- What We Recommend (long text)

Guidance triple is written automatically when capture analysis completes.

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
