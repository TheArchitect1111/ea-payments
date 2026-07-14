# Service Registry

| Service | Code owner path | Tenant boundary | Persistence | Status |
|---|---|---|---|---|
| Portal/Simplifi chassis | `app/portal`, `app/simplifi`, `vendor/portal-chassis`, `vendor/premium-chassis` | portal slug plus persisted organization ID | Airtable/platform store | observed |
| Organizations | `lib/organizations.ts` | organization record ID | Organizations table | observed |
| Memberships/RBAC | `lib/memberships.ts`, `lib/rbac.ts` | email + organization ID | Memberships table | observed |
| Entitlements/modules | `lib/entitlements.ts`, `lib/modules` | organization ID | Entitlements table | observed |
| AI gateway/agents | `lib/ai`, `lib/agents` | actor/tenant + conversation ID | process memory and provider | observed; memory is ephemeral |
| Capture records | `lib/capture-records.ts` | portal slug encoded in Source | Airtable | observed; explicit tenant field proposed |
| Pulse/events | `lib/pulse*`, API routes | tenant ID | Airtable | observed |
| Billing | `app/api/billing`, Stripe webhooks | persisted organization ID | Stripe + platform store | observed |

Unknown external repositories are not asserted here. Add a service only after verifying its path, remote, owner, deployment, and data boundary.
