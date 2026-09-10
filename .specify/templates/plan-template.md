# Implementation Plan: [TITLE]

## Constitution check

Before implementation, confirm:
- Approved intent/source of truth identified.
- Protected invariants captured.
- Security and tenant boundaries preserved.
- Rollback path identified.
- Production verification is defined.
- Visual fidelity checks are included where applicable.

Any failed gate MUST be resolved before production-impacting implementation.

## Architecture

Describe the smallest safe change set, affected files/services, dependencies, and blast radius.

## Execution sequence

1. Inspect authoritative implementation and current production behavior.
2. Make the smallest safe source change.
3. Run repository/build/tests relevant to the change.
4. Review for regressions against protected invariants.
5. Deploy through the existing approved path.
6. Verify the production route and critical interactions.
7. Compare production outcome against every acceptance criterion.
8. If any criterion fails, return to implementation and repeat until converged or rollback/blocker criteria are reached.

## Risk and rollback

- Primary risks: [list]
- Rollback trigger: [condition]
- Rollback method: [method]

## Production proof

Record URLs, checks, deployment/commit identifiers, screenshots or other visual evidence where applicable, and pass/fail status for every acceptance criterion.