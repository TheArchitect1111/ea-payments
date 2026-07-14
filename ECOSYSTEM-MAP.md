# EA Ecosystem Map

Status labels: **observed** means verified in this repository; **proposed** requires review.

| Layer | Observed foundation | Canonical tenant key | Notes |
|---|---|---|---|
| Experience surfaces | Portal, Simplifi workspace, Premium chassis, Connect, Creative Studio | portal slug for routing | Product names are surfaces, not repository boundaries. |
| Platform identity | Organizations and memberships | persisted organization record ID | Synthetic `org_<slug>` values are compatibility-only and must not authorize privileged access. |
| Access | RBAC and entitlements | organization ID + user identity | Missing role, membership, or entitlement must fail closed. |
| Intelligence | AI gateway, agents, EA Intelligence | actor/tenant scope + conversation ID | History must never use conversation ID alone. |
| Data adapters | Airtable platform store, capture records, Pulse events | documented per service | Source strings are not a substitute for a tenant column. |
| Delivery | GitHub repository and Vercel project named `ea-payments` | N/A | Renaming is deferred. |

## Proposed north star

The Universal Workspace Engine is the shared orchestration layer; product experiences remain composable modules. See `docs/architecture/0001-universal-workspace-engine.md`.
