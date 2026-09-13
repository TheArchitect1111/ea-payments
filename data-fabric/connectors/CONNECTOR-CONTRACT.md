# EA Data Fabric Connector Contract

Run 4 standardizes every external integration behind one of four connector classes:

1. `api` — approved machine-to-machine API or web service.
2. `file` — approved CSV, JSON, XML, fixed-width, spreadsheet, or other batch exchange.
3. `browser` — approved browser-assisted preparation/filling where terms and access permit it. Human certification, MFA, signatures, attestations, and prohibited automation remain human actions.
4. `human` — system prepares a complete submission package and routes it to an authorized person for final entry/certification.

## Durable workflow contract

The orchestration layer is designed for Temporal-compatible durable execution. A connector workflow must be restart-safe and idempotent.

Canonical state path:

`draft -> prepared -> validated -> [approval_required -> approved] -> submitted -> accepted -> reconciled`

Failure or cancellation can occur only through transitions allowed by `fabric.connector_transition_allowed()`.

A worker retry must reuse the same `connector_run.id` and `correlation_key`; it must never create an untracked duplicate external submission.

## Data movement contract

Meltano/Singer-compatible adapters may be used for API/file extraction and loading. Custom adapters must expose the same logical operations:

- `prepare`
- `validate`
- `submit`
- `check_status`
- `reconcile`

Connector-specific code may not bypass tenant context, approval gates, audit records, or the canonical run state machine.

## Human approval

When `connector_definitions.requires_human_approval = true`, a run may not proceed directly from `validated` to `submitted`. It must enter `approval_required`, receive an authorized approval, then enter `approved` before submission.

The approval record stores the requesting and approving identities and decision timestamps.

## Artifacts and evidence

Every material request/response or generated file should be attached to `connector_artifacts` with a checksum where available. Secrets and access tokens must never be stored in payload manifests, artifacts, or audit metadata.

## Reconciliation

`submitted` means only that a transmission/action was attempted successfully enough to receive a destination acknowledgement or reference.

`accepted` means the destination has accepted the submission.

`reconciled` means EA has compared the destination result/reference to the canonical submission and found no unresolved discrepancy.

These states must never be collapsed into a single `success` flag.

## Security

- Connector configuration stores secret references, not secret values.
- Production connector workers use least-privilege credentials.
- One tenant's credentials may never be reused for another tenant.
- Browser automation must not bypass MFA, CAPTCHAs, signatures, attestations, or explicit human-certification requirements.
- All connector tables remain PostgreSQL RLS-protected.
