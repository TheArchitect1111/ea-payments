# EA Airtable Disaster Recovery Runbook

Status: ACTIVE
Owner: EA Platform / Governance
Scope: EA Payments Airtable base (`appv0YoLIMY45fmDA`) and the operational Control Plane persisted there.

## Objective

EA must be able to preserve and reconstruct Airtable-hosted operational state without depending on Airtable as the recovery destination.

## Recovery package

The canonical recovery export is produced by:

```bash
node scripts/export-airtable-recovery.mjs
```

The exporter reads the Airtable Meta API plus every table's records and writes a provider-neutral package under `.recovery/airtable/`:

- `manifest.json` — format version, table count, record count, per-table SHA-256 checksums
- `schema.json` — Airtable schema metadata
- one `<table-id>.json` per table — table metadata plus all records, with field IDs preserved

Supported existing EA credential names:

- `AIRTABLE_API_KEY`
- `AIRTABLE_PAT`
- `AIRTABLE_ACCESS_TOKEN`
- `AIRTABLE_TOKEN`

Supported base-id names:

- `AIRTABLE_PAYMENTS_BASE_ID`
- `AIRTABLE_BASE_ID`
- `EA_AIRTABLE_BASE_ID`

No credential value belongs in Git, evidence, screenshots, logs, or the recovery package.

## Provider-neutral restore proof

Run:

```bash
python3 scripts/restore-airtable-recovery.py .recovery/airtable .recovery/ea-recovery.sqlite
```

The restore verifier:

1. verifies every table-file SHA-256 checksum;
2. creates one SQLite table per Airtable table using stable Airtable field IDs;
3. preserves record IDs and created timestamps;
4. serializes complex linked/select/attachment values as JSON text so information is not discarded;
5. compares expected vs restored table/record counts; and
6. runs SQLite `PRAGMA integrity_check`.

A restore is a FAIL unless all checks pass.

## Storage rule

`.recovery/` is gitignored because live exports may contain client and operational data. A completed export must be copied to an access-controlled destination outside Airtable. The preferred design is two copies:

- operational recovery copy in the approved backup destination; and
- secondary immutable/offline copy retained according to EA data-retention policy.

A backup that exists only inside Airtable is not a backup for Airtable failure.

## Minimum cadence

- Daily provider-neutral export for the Control Plane and active operational data.
- Additional export immediately before high-risk schema migrations or bulk data changes.
- Monthly restore verification against the latest export.
- Quarterly documented disaster-recovery drill.

## Disaster procedure

If Airtable is unavailable or access is revoked:

1. Freeze nonessential writes and automated provisioning.
2. Identify the latest recovery manifest and verify checksums.
3. Restore the package into SQLite using `restore-airtable-recovery.py`.
4. Verify table count, record count, SQLite integrity, and critical identity/governance tables.
5. Promote a replacement relational store only after mapping application read/write contracts and tenant boundaries.
6. Update environment configuration through the normal Release Governance gate.
7. Rerun Production Acceptance before restoring normal writes.

## Critical tables for first-response verification

At minimum verify these after restore:

- Organizations
- Memberships
- Entitlements
- Client Records
- Universal Manifest
- Release Governance
- Production Acceptance
- Governance Evidence
- Scale Certification
- Chassis Audit Log
- Legal Acceptances
- Legal Audit Events
- Unit Economics
- Vendor Dependencies

## Certification states

- **Not Ready**: no provider-neutral export/restore mechanism.
- **Partial**: export and restore mechanism exists and is mechanically tested, but no current live full-base snapshot + independent-destination restore drill has been verified.
- **Ready**: current live full-base export exists outside Airtable, checksum validation passes, restore to independent storage passes, and the recovery evidence is recorded.

Do not mark Airtable migration readiness `Ready` on documentation or synthetic tests alone.
