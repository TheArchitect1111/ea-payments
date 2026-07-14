# Security Model

## Invariants

1. Authentication proves an identity within one realm; it does not imply owner access.
2. Authorization requires an explicit normalized role. Missing or malformed roles resolve to no privilege.
3. Privileged tenant operations require a persisted organization ID and active membership.
4. `org_<slug>` synthetic identifiers are compatibility locators only; they cannot prove persistence, membership, billing ownership, or entitlement.
5. Client-supplied tenant IDs must be ignored or checked against the authenticated session.
6. AI conversation history is keyed by actor/tenant scope and conversation ID.
7. Portal capture reads require exact tenant source matching; prefix collisions are rejected.

## Tenant key contract

- `portalSlug`: URL and legacy client-data routing key.
- `organizationId`: persisted platform identity for memberships, entitlements, billing, and platform events.
- `actorId`: authenticated user/service identity.
- `conversationId`: unique only within an actor/tenant scope.

## Newly observed credential risk

Client Records contains plaintext temporary-password values. Values were not copied into repository artifacts or chat. Removal, forced rotation, and replacement with a non-recoverable onboarding flow require a separate approved security change.

## Known residual risks

- Authentication remains split across admin, portal/Simplifi, and partner realms.
- Several compatibility paths still synthesize organization IDs.
- Capture tenancy is encoded in a Source string rather than a dedicated tenant field.
- Some module defaults remain package-derived when no stored entitlements exist.

These residual risks require follow-up design and migration plans; they must not be hidden by permissive defaults.
