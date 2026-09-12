# Service Registry

| Service | Code owner path | Tenant boundary | Persistence | Status |
|---|---|---|---|---|
| EA Control Plane registry | `config/ea-system-registry.json`, `lib/control-plane/system-registry.ts` | registry entity ID; persisted organization ID where verified | Git desired state + Airtable Universal Manifest projection | observed; canonical desired-state authority |
| Portal/Simplifi chassis | `app/portal`, `app/simplifi`, `vendor/portal-chassis`, `vendor/premium-chassis` | portal slug plus persisted organization ID | Airtable/platform store | observed |
| Organizations | `lib/organizations.ts` | organization record ID | Organizations table | observed |
| Memberships/RBAC | `lib/memberships.ts`, `lib/rbac.ts` | email + organization ID | Memberships table | observed |
| Entitlements/modules | `lib/entitlements.ts`, `lib/modules` | organization ID | Entitlements table | observed |
| AI gateway/agents | `lib/ai`, `lib/agents` | actor/tenant + conversation ID | process memory and provider | observed; memory is ephemeral |
| Capture records | `lib/capture-records.ts` | portal slug encoded in Source | Airtable | observed; explicit tenant field proposed |
| Pulse/events | `lib/pulse*`, API routes, `app/portal/[slug]/pulse` | tenant ID; EA-only control-plane inventory panel | Airtable + system-registry read model | observed |
| Billing | `app/api/billing`, Stripe webhooks | persisted organization ID | Stripe + platform store | observed |
| Business presence | `lib/business-presence.ts`, portal Settings | portal slug; shared business profile contract | provider-managed until partner API approval | Apple Business guided setup observed; automated sync disabled |
| Creative Foundry | `lib/creative-foundry`, `video-factory/remotion`, existing EA visual workflows | brand/tenant ID carried by creative brief and asset records | provider/object storage through consuming product | shared production contracts + QA gate added; external render providers are capability-gated |

Unknown external repositories are not asserted as canonical ownership. Preserve unresolved systems in the EA System Registry with `attention` or `partial` state until repository, remote, owner, deployment, and data boundary are verified.
