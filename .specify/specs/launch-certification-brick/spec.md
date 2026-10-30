# Launch Certification & Autonomous Repair Brick

## Goal

Add a reusable, tenant-aware release certification capability to the EA LEGO Chassis. It must reuse current certification and preflight tools, bind each result to its deployment and source commit, and fail closed when applicable evidence is missing, stale, or unverified.

## Protected invariants

- No production deployment, commerce activation, live charge, refund, or sensitive permission change is authorized by this work.
- A software test pass is not proof that a provider account is authorized or that a live integration works.
- A prior certificate expires when its source or deployment identity changes.
- Only installed capabilities add required evidence checks.
- No repair agent may be claimed unless an executable, configured agent is available. GitHub issue creation is triage, not autonomous repair.
- Existing customer-specific behavior and other clients remain unchanged.

## Acceptance criteria

1. A reusable certification engine consumes a versioned client capability manifest and the existing chassis/certification evidence.
2. The same engine accepts TB3 and at least one other client configuration without copying its core implementation.
3. Every mandatory check must have fresh, commit- and environment-bound evidence to produce `CERTIFIED`.
4. Failed, missing, stale, pending-approval, and unverified results produce `NOT CERTIFIED` with a human-readable and JSON report.
5. The CLI supports one client and all configured clients.
6. CI invokes certification on pull requests, production deployment events, a scheduled cycle, and manual dispatch; failed checks fail the workflow.
7. A failure creates or updates one deduplicated GitHub repair issue. If no repair agent is executable, the issue states that limitation and requests owner/team triage.
8. New tests exercise decision logic, manifest validation, stale evidence, module discovery, deduplication identity, and multiple clients.

## Production verification boundary

The initial implementation may verify source-level contracts, CI tests, and public HTTP routes. Authenticated HQ permissions, tenant isolation against live data, uploads and persistence, provider authorization, live payment/fulfillment, communication delivery, recovery, and end-to-end business journeys remain uncertified unless real protected evidence is provided. TB3 must therefore remain `NOT CERTIFIED` until these blockers have valid evidence.

## Rollback

Revert the dedicated branch/PR. The workflow is additive and does not change production runtime configuration or promote deployments.
