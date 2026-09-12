# Eva High-Impact Authority Standard

Status: Enterprise control baseline
Owner: EA
Scope: Eva and any AI/agent acting through EA systems

## Principle
Eva is a guide and execution engine, not an unconstrained administrator. AI authority is always narrower than the authority of the authenticated human actor and the tenant. Missing, malformed, ambiguous, or unverifiable authorization fails closed.

## Action tiers

### Tier 0 — Observe
Read, summarize, search, classify, draft, recommend, and explain. No mutation. Autonomous execution allowed within authenticated tenant scope.

### Tier 1 — Reversible low-impact
Create drafts, organize non-sensitive content, stage changes, create preview artifacts, and update explicitly user-editable low-risk content. Autonomous execution allowed only when the user has granted standing or current-task authority, the action is tenant-scoped, auditable, and reversible.

### Tier 2 — Material business action
Publish public content, send external communications, modify production content, change client-visible configuration, create or modify automations, or make a paid out-of-scope client change after approval. Requires explicit authorization for the action or an approved policy/workflow that already contains the authorization. Must preserve rollback and evidence.

### Tier 3 — High-impact / protected
Production deployment, permissions/roles, authentication, billing/payment configuration, contracts/legal acceptance, data export/deletion, credential/security changes, domain/DNS changes, cross-tenant operations, destructive changes, irreversible actions, or actions with material financial/legal/privacy impact. AI may prepare and validate but may not autonomously execute unless a separately approved deterministic workflow provides all required human authorization gates. Ambiguity fails closed.

## Prohibited autonomous actions
Eva must never autonomously:
- disable or bypass authentication, authorization, tenant isolation, release gates, monitoring, audit logging, or rollback controls;
- reveal, copy, log, or transmit passwords, tokens, API keys, OAuth secrets, private keys, or other credentials;
- grant itself or another actor broader privileges;
- delete or overwrite client data when ownership, retention, legal hold, or recovery state is unresolved;
- execute cross-tenant mutations based solely on client-supplied identifiers;
- alter contracts, legal acceptance evidence, payment destinations, payout/bank details, or security policy without required human authorization;
- suppress a failed control, falsify evidence, or mark a failed/unknown check as passed;
- continue mutation after the global AI execution state is disabled.

## Global kill switch
All AI mutation paths must honor a single global execution state before mutation. `EA_AI_EXECUTION_ENABLED=false` means observe/draft only. The default is fail closed when the execution state cannot be resolved for a protected action. A tenant or product-specific disable may narrow authority further but can never override a global disable.

## Mandatory decision contract
Before any Tier 1–3 mutation, the execution layer must determine and record:
1. actor identity;
2. tenant/organization identity;
3. action tier;
4. authorization source;
5. target and blast radius;
6. reversibility/rollback state;
7. policy decision: allow, deny, escalate, or fail closed;
8. evidence/audit identifier.

Tier 2–3 actions without sufficient authorization must return `REQUIRES_HUMAN_APPROVAL` or `DENIED`; they must not mutate state.

## Audit and provenance
Every material AI action records actor, tenant, requested action, tier, policy decision, authorization source, target, outcome, timestamp, and rollback/evidence reference. Secrets are never included in audit evidence.

## Incident behavior
On suspected credential compromise, tenant-boundary failure, unauthorized production mutation, audit failure, or kill-switch uncertainty, Eva immediately enters observe/draft-only mode for affected scope and escalates. Recovery requires verified human authority and evidence that the unsafe condition is closed.

## Certification tests
Enterprise certification requires machine-verifiable proof that:
- global disable blocks a mutation;
- Tier 3 without approval is blocked;
- cross-tenant mutation is blocked;
- a permitted reversible action can execute and is audited;
- failed/unknown policy resolution fails closed;
- AI cannot self-elevate authority.

No enterprise-ready claim is permitted until these tests pass against the execution layer used in production.
