# Tenant Data Release Readiness

Status: Ready; independent post-remediation audit passed
Last checked: 2026-07-12 (post-remediation audit passed)

## Audit command

```powershell
npm run audit:tenant-data
```

Offline behavior is verified with `npm run test:tenant-data-audit`. Its generated fixtures use reserved example identities, never contact Airtable, and cover ready, gap, anonymization, and missing-credential paths.

The command performs GET requests only. It reads Client Records, Organizations, Memberships, Entitlements, Capture Records, and Creative Studio, then emits aggregate counts and one-way anonymized references. It never prints emails, portal slugs, record bodies, credentials, or tokens.

## Migration inventory

The audit also reports historical portal captures that still lack `Portal Slug`, Creative Studio rows stored under legacy synthetic `org_` identifiers, unresolved `staging_ctp_` rows, and Creative Studio rows whose organization identifier does not resolve to the Organizations table. The configured EA internal organization and CTP staging scopes are excluded from the unknown-organization check; staging rows remain a separate review item.

These findings are inventory only. They do not authorize backfills, reassignment, or deletion.

## Secure operator runner

Run the following from the repository root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\run-tenant-data-audit.ps1" -BaseId "appv0YoLIMY45fmDA"
```

The runner prompts for the read-only token as a SecureString, never accepts it on the command line, supplies it only to the child audit process, clears the temporary process variables, and zeroes the unmanaged token buffer. The Payments & Clients base was confirmed during the live audit.
## Live audit result

The authorized read-only audit completed against Efficiency Architects - Payments & Clients on 2026-07-12. It found 2 portal tenants, 1 organization, 1 membership, 13 entitlements, 38 capture records, and 3 Creative Studio records.

Three aggregate gaps require review: one portal client has no persisted organization (tenant-58a5b4db33), and two Creative Studio rows use synthetic organization identifiers (tenant-76e55d5167 and tenant-f0253c9124). All eight remaining checks passed. See docs/TENANT-DATA-REMEDIATION.md.

## Remediation status

The three audited gaps were remediated on 2026-07-12 after a fresh Airtable snapshot. UI verification confirmed the new persisted organization, active owner membership, four Launch Verification entitlements, and both Creative Studio tenant-field and payload migrations. No records were deleted.

## Post-remediation audit result

The independent read-only audit completed after remediation on 2026-07-12. All ten checks passed with zero gaps: organization persistence, authoritative owner membership, active organization ownership, active/trial entitlements, membership and entitlement references, capture tenant fields, synthetic Creative Studio IDs, CTP staging, and unknown Creative Studio organizations.

Result: READY - no tenant-data gaps found. No further Airtable mutation is required for this stabilization phase.

## Current blocker

Tenant-data readiness is no longer blocked. Revoke the temporary post-remediation audit credential; it was supplied interactively and was not persisted.

The confirmed audit base is Efficiency Architects - Payments & Clients (`appv0YoLIMY45fmDA`). The separately configured `AIRTABLE_PLATFORM_BASE_ID` remains a different identifier and must not silently replace the Payments base in application configuration.
## Credential-location verification

On 2026-07-12, names-only read checks found no environment variables in the linked Vercel project and no GitHub Actions secrets or variables in TheArchitect1111/ea-payments. No values were downloaded and no external configuration was changed. The read-only audit credential and reviewed Payments base ID must therefore be supplied by an authorized operator.

Vercel project environment inventory and GitHub Actions configuration were inspected by name only; both were empty.

## Required operator actions

1. Revoke the temporary read-only Airtable token.
2. Map the three anonymized references to source records locally with an authorized Airtable operator.
3. Review and approve `docs/TENANT-DATA-REMEDIATION.md` before any Airtable mutation.
4. Confirm a current backup/export and per-record rollback values.
5. After approved remediation, rerun the read-only audit and require zero gaps.

No data repair, schema mutation, environment update, or deployment is authorized by this document.