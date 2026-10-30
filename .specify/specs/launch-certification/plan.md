# Implementation Plan: Launch Certification browser evidence

## Constitution check

- Approved request and client manifests identified.
- Protected authentication, tenant, payment, and review invariants are recorded in `spec.md`.
- Rollback is a commit revert of the isolated branch.
- Production verification is not permitted in this change; exact preview verification is required.
- Existing visual QA is reused and browser evidence is added.

## Architecture

Keep the certification engine authoritative. Add pure audit evaluators and one manifest-driven Playwright runner. Generate an evidence bundle that the existing engine validates by commit, environment, timestamp, and evidence reference. Extend the existing launch workflow to run and archive the bundle before certification. Do not add a provider mutation path or a new agent without available authorized tooling.

## Execution sequence

1. Inspect the certification contract, client manifests, existing browser gate, and recovery/agent tooling.
2. Add pure website audit evaluators and a manifest-driven browser evidence runner.
3. Wire the evidence bundle into the existing workflow and report artifact.
4. Test evidence policy, serialization, and fail-closed behavior.
5. Run full repository tests/build and exact preview certification.
6. Inspect blockers and available repair tooling; integrate only executable authorized components.
7. Update the draft PR with evidence and any genuine external blockers.

## Risk and rollback

- Primary risks: false-positive browser failures, or treating a form/portal observation as proof of backend functionality.
- Rollback trigger: evidence misbinding, unsafe mutation, or weakened fail-closed behavior.
- Rollback method: revert the auditor/workflow commit; certification continues to fail closed on absent evidence.

## Production proof

No production deployment is authorized. Exact preview browser results and artifact must be linked. Production activation and client certification remain separate outcomes.
