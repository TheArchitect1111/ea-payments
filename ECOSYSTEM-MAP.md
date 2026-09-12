# EA Ecosystem Map

Status labels: **observed** means verified in this repository; **attention** means the system is preserved but canonical ownership or deployment evidence is incomplete.

## Control-plane authority

EA now uses one explicit source-of-truth hierarchy:

1. `config/ea-system-registry.json` is the canonical desired-state registry for systems, products, clients, repositories, deployments, URLs, recovery points, and verification state.
2. Airtable `Universal Manifest` is the operational projection used for live operations and evidence tracking. It does not override the repository desired state.
3. `lib/canonical-project-registry.ts` remains a compatibility resolver while callers migrate to the system registry.
4. GitHub and Vercel are observed actual state. A deployed surface does not become canonical merely because it exists.
5. Pulse is the command surface. The internal EA Pulse view exposes registry counts and attention records without exposing control-plane inventory to client tenants.

Unknown facts must remain `null`, `partial`, or `attention`. Automation must not infer missing repository, tenant, deployment, or approval ownership.

| Layer | Observed foundation | Canonical tenant key | Notes |
|---|---|---|---|
| Control plane | EA System Registry + Universal Manifest projection + Pulse | registry entity ID plus persisted organization ID where available | Desired state and observed runtime are intentionally separate. |
| Experience surfaces | Portal, Simplifi workspace, Premium chassis, Connect, Creative Studio | portal slug for routing | Product names are surfaces, not repository boundaries. |
| Platform identity | Organizations and memberships | persisted organization record ID | Synthetic `org_<slug>` values are compatibility-only and must not authorize privileged access. |
| Access | RBAC and entitlements | organization ID + user identity | Missing role, membership, or entitlement must fail closed. |
| Intelligence | AI gateway, agents, EA Intelligence | actor/tenant scope + conversation ID | History must never use conversation ID alone. |
| Data adapters | Airtable platform store, capture records, Pulse events | documented per service | Source strings are not a substitute for a tenant column. |
| Delivery | GitHub repositories and verified Vercel projects | N/A | A Vercel project without verified canonical ownership remains attention-only. |
| Digital presence | Reusable provider manifest and portal-guided setup for Apple Business | portal slug + shared business profile | Guided setup is active; automated sync requires Apple partner/API approval. |

## Registry coverage rule

The system registry must contain every entity in the compatibility registry and every operational entity projected into the Universal Manifest. It may be larger, but it may never silently drop an existing system during consolidation.

## Proposed north star

The Universal Workspace Engine is the shared orchestration layer; product experiences remain composable modules. See `docs/architecture/0001-universal-workspace-engine.md`.
