# CTP Close SOP — second-person commercial close

Use this when any admin (not only the founder) closes a Consider The Possibilities™ deal.

**Desk:** `/admin/ctp`  
**Support:** `/admin/proposals` · eSign docs · Make onboarding

---

## Checklist (one submission)

1. **Open** `/admin/ctp` → expand the submission.
2. Confirm **Commercial** badge (proposal status / Paid) — join is automatic from proposal + Client Record.
3. **Mark ready for review** when studio/analysis is ready.
4. **Approve & send proposal** (CTP desk) — emails the client; status becomes Approved.
5. Client pays via proposal checkout → Stripe webhook fulfills portal/site/Connect (watch **Paid** badge).
6. After paid (or when reveal is intentional): **Approve & reveal**.
7. If Implementation package: Make onboarding + eSignatures use `ESIGNATURES_MSA_TEMPLATE_ID` / `ESIGNATURES_SOW_TEMPLATE_ID` from the onboarding webhook payload. Callback must be apex:
   `https://efficiencyarchitects.online/api/webhooks/esignatures`

---

## Do not

- Send proposal only from memory — use the desk button or Proposals desk.
- Point eSignatures webhooks at `www.` (CRA marketing — wrong project).
- Flip scale flags before a second person has completed this SOP once.

---

## Scale attestation (after SOP is proven)

When a second person has closed at least one CTP end-to-end:

```bat
vercel env add LAUNCH_OPERATIONAL_MATURITY production --value "true" --yes
vercel env add LAUNCH_FOUNDER_DEPENDENCY_REDUCED production --value "true" --yes
```

Redeploy. Confirm `/api/health/launch` → `scaleReady: true` only when `fullLaunchReady` is also true.

Optional intelligence automation: `PRAISON_PACKAGE_WEBHOOK_URL` (see `docs/MAKE-PRAISON-CTP.md`).
