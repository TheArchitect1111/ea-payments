# Feature Specification: AYF customer record isolation

**Request:** Production security repair for existing project proj-mw17qt3d-744730.
**Project/tenant:** are-you-fundable; existing seven-module manifest unchanged.
**Status:** IMPLEMENTED locally; production verification BLOCKED (deployment prohibited).

## Intent and source of truth
User request, SECURITY-MODEL.md, existing content/final brick stores, active Memberships and canonical tenant identity. Illustrative designs confer no permissions.

## Scope and protected invariants
AYF documents, reports and messages require an explicit customer owner bound server-side to the persisted membership ID; email is a validated lookup, not a transferable grant. Revalidate active persisted memberships and tenant identity. Administrators/owners retain management access; staff require an administrator-maintained customer assignment bound to customer/staff membership IDs. Customers see only their own member-visible records. Unowned legacy records are administrator-only, never silently migrated. Other tenants, authentication, payment/email guards, certification and seven-module manifest remain unchanged. No live records or service writes in verification.

## Acceptance criteria
1. Same-organization customer B cannot list, read, download, overwrite or transition customer A's records.
2. Unassigned/revoked staff and suspended memberships fail closed; owner/admin can manage assignments and legacy records.
3. Customer-supplied owner/assignment/role claims cannot grant access. Report generation uses only that report customer's authorized source records.
4. Portal HTML, JSON, downloads and write paths enforce the same policy; AYF legacy document fallbacks cannot bypass ownership.
5. Behavioral route and service tests exercise actual responses and persisted controlled records; no source-string-only proof.

## Implementation Plan
Constitution checked. Add shared AYF-only policy and durable administrator assignment ledger, pass authenticated actor through existing brick APIs/pages, prevent legacy fallbacks, add assignment management API and minimal existing control fields. Use existing route-handler conventions from installed Next documentation. Validate affected types and consolidated security/factory regressions using network-offline fixtures.

## Tasks
- [x] Inspect authority, blast radius and Next route documentation (Graft executable unavailable).
- [x] Implement policy, route/page wiring and management controls.
- [x] Run controlled cross-customer/download/assignment regression tests and scoped typecheck.
- [x] Record results and unresolved activation blockers (customer-security-evidence.md / .json).
- [ ] Production verification: independently authorized deployment and real scoped customer/staff sessions; prohibited in this run.

## Risk, rollback and production verification
Unowned records intentionally disappear from customer/staff views pending administrator classification. Do not roll back to permissive visibility; disable affected AYF entrypoints if verification fails. Preserve existing data for reviewed migration. Before activation verify deployed source, active canonical tenant/install, individual customer and assigned-staff access, revocation, direct downloads, report approval and audit/retention controls. Visual layouts are not redesigned; form labels require normal desktop/mobile review. No DEPLOYED, VERIFIED or DONE claim without production receipts.
