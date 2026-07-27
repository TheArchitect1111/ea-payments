# Amplifi + Magnifi — Client & Support Cheat Sheet

**Audience:** Client success + operators  
**Scope:** Portal V1 (capture → story → share/draft). Nothing auto-posts.

## Client path (2 minutes)

1. Sign in at `/portal/login` → open your portal.
2. Open **Simplifi** → capture a URL or note.
3. When capture finishes, open the **Magnifi** story link (full-screen story).
4. Open **Amplifi** → **Open latest Magnifi** and/or **Review draft before posting**.
5. Copy the draft and post it yourself on LinkedIn / Instagram / email — Amplifi does not publish for you.

## Must-know rules

| Rule | Why |
|------|-----|
| Nothing auto-posts | Amplifi drafts only; you (or your team) publish. |
| Magnifi links are public | Anyone with `/magnifi/{id}` can view the story. |
| Archive to retire | Archive the capture in Simplifi to retire the public Magnifi page. |
| Empty Amplifi hub | Normal before the first capture — use the Capture CTA. |

## Who should see Amplifi / Simplifi

| Package | Amplifi + Simplifi? |
|---------|---------------------|
| Simplifi / Simplifi Early Access | Yes |
| Implementation Package | Yes |
| Website + Portal Starter alone | No |
| CTP Client Experience primary nav | No (by design) |

## Operator: turn Amplifi on for a client

1. Mission Control → **Capability Marketplace** → **Entitlements**.
2. Select the client organization.
3. Enable **`simplifi`** and **`amplifi`**.
4. Ask the client to reload `/portal/{slug}` — both should appear in the sidebar.
5. Confirm `/portal/{slug}/amplifi` loads (not redirected home).

CLI helper (Airtable key in `.env.local`):

```bash
node scripts/pilot-amplifi-magnifi-client.mjs --list
node scripts/pilot-amplifi-magnifi-client.mjs --entitle <portal-slug>
node scripts/pilot-amplifi-magnifi-client.mjs --smoke <portal-slug>
```

## Support triage (quick)

| Symptom | First check |
|---------|-------------|
| No Amplifi in nav | Entitlement missing — enable `simplifi` + `amplifi` (above). |
| Amplifi says no stories | Client has not captured yet — send them to Simplifi. |
| Magnifi “Story unavailable” | Bad/old link or capture never saved — recapture. |
| Need to unshare | Archive the capture in Simplifi (story becomes retired). |

Full SOPs: [PRODUCT-SUPPORT-AND-TRIAGE-SOP.md](./PRODUCT-SUPPORT-AND-TRIAGE-SOP.md).

## Demo (internal)

- One-click: `/api/auth/demo-enter?next=/portal/demo-client/amplifi`
- Fixture portal: `/portal/demo-client`
