# AYF customer security repair evidence

Project `proj-mw17qt3d-744730`, branch `work/ayf-chassis-20261103`, parent `62d72f1ffc01452d1a3063e5190e6bdd9b8bca75`. Local implementation only. No commit or deployment.

## PASS

- Documents and reports persist a server-resolved customer membership ID and normalized customer email. Messages derive customer identity from the authenticated member, ignoring a forged owner email. Identity reuse does not transfer ownership.
- Reads, lists, downloads and writes check current active membership, exact organization/slug, customer ownership and visibility. Staff access requires a current administrator-maintained assignment bound to both customer and staff membership IDs. Administrators/owners retain control. Unowned legacy records are administrator-only; no automatic data migration occurred.
- Assignment management API and administrator portal control replace/revoke assignments, validate existing memberships, and do not create accounts or notify anyone. AYF mutations require the same origin.
- Report generation filters source records to the report customer's membership ID, even when an administrator or staff member can read several customers. Queued reports cannot be downloaded by customers. This remains an inventory generator, not a credit/readiness report integration or full clinical/financial release workflow.
- AYF organization-wide legacy document/message fallbacks are disabled. Portal pages pass authenticated identity to the same domain policy used by HTTP handlers. Uninstalled surfaces outside the canonical seven modules redirect away from legacy portal pages. The seven-module manifest is unchanged.
- Consolidated offline regression: **90 PASS / 0 FAIL**, including initial seven AYF security cases, real controlled HTTP handlers, all content/final brick lifecycles, existing factory/chassis/capture regressions and synthetic image-to-private-preview browser acceptance.
- After final identity/origin refinements, affected brick/HTTP suites: **37 PASS / 0 FAIL**, including eleven AYF security cases. Only the AYF security file was rerun after adding the final email-reuse report-source assertion. Across the consolidated campaign and affected reruns, **94 distinct tests** are covered; repeated tests are not added to this count.
- Factory dependency typecheck: zero diagnostics across its 22 entrypoints and transitive graph. Expanded AYF security typecheck covers all changed routes/pages/controls and the new test: zero diagnostics with unchanged strict compiler options.
- Targeted ESLint: exit 0, zero errors, one existing `react-hooks/set-state-in-effect` warning in FinalBrickPanel's unchanged refresh effect. No lint/security gate disabled. `git diff --check` passes.

## Commands

```powershell
node --require ./tests/fixtures/network-offline.cjs --import tsx --test tests/ayf-customer-security.test.mts tests/content-family.test.mts tests/content-http-routes.test.mts tests/final-nine.test.mts tests/final-nine-http.test.mts tests/factory-screenshot-build.test.mts tests/chassis-autowire.test.mts tests/blockers-certified.test.mts tests/capture-family.test.mts tests/capture-customer-routes.test.mts
node --require ./tests/fixtures/network-offline.cjs --import tsx --test tests/ayf-customer-security.test.mts tests/content-family.test.mts tests/final-nine.test.mts tests/content-http-routes.test.mts tests/final-nine-http.test.mts
node --require ./tests/fixtures/network-offline.cjs --import tsx --test tests/ayf-customer-security.test.mts
node scripts/check-factory-release-types.mjs
node scripts/check-ayf-customer-security-types.mjs
node node_modules/eslint/bin/eslint.js lib/ayf/customer-access.ts app/api/portal/ayf/customer-access/route.ts app/portal/components/AyfCustomerAssignments.tsx app/portal/components/CertifiedContentUpload.tsx app/portal/components/FinalBrickPanel.tsx
git diff --check
```

Tests use in-memory controlled storage, mocked membership/provider ports and synthetic `example.test` identities; the production policy and route functions execute. The retained factory test also exercises an actual private local browser/HTTP preview. Neither constitutes real AYF production acceptance.

## Resolved intermediate failures

- Filesystem sandbox prevented esbuild repository traversal. The authorized rerun outside that sandbox retained the network-offline fixture and passed.
- Expanded typecheck found ten optional-role `includes` diagnostics on affected existing routes/pages. Explicit empty-string fallbacks preserve no-privilege behavior; final count zero.
- Importing the origin check from the policy module initially required persistence exports missing from the isolated legacy HTTP fixture. Moved the pure origin guard into its own module; unchanged legacy HTTP tests pass. No production behavior or mock access checks were weakened.

## BLOCKED: production activation

1. **Deployed source/configuration:** production source identity has not been matched to this uncommitted implementation. Previous Vercel environment metadata inspection returned 403; production application credentials and sender flags remain unverified. Obtain authorized read-only configuration visibility, then use a separately approved deployment/release process and exact-source proofs.
2. **Canonical AYF runtime identities:** prior read-only inventory found no canonical AYF organization/client in the default Airtable base and zero People persons/memberships. Confirm the deployed base override before reconciling the existing AYF project with its persisted organization, seven-module install and authorized accounts. Populate administrator-approved customer/staff assignments only in an authorized activation run. No duplicate project.
3. **Legacy classification:** existing unowned documents/messages/reports deliberately remain inaccessible to customers and staff. An administrator must inventory and explicitly migrate/classify each record with its actual customer membership; never bulk-mark all records member-visible. Email/account changes require reviewed ownership reconciliation.
4. **Production security proof:** real customer A/B, assigned/unassigned staff, administrator and other-tenant sessions remain unavailable for deployed verification. Verify list/read/download/write denials and revocation in the approved private environment, with audit evidence, before customer activation. No real accounts were created here.
5. **AYF financial/report controls:** generic inventory reports do not implement the approved Class 6 report source, audited human release, revocation, raw-data exclusion, retention, staff MFA or complete document-handling controls. Confirm/implement and verify these before processing sensitive credit or financial information. Staff upload remains the existing feature; customer self-upload was not introduced.
6. **Communications and business approvals:** verify production Resend sender/domain and AYF confirmation flag, approved forms/CTA destinations and role decisions. No test message was sent. Seven Figures consent/data-sharing/provider/return agreements remain separate; they need not block an independently approved basic AYF intake/review/access activation.

## Not claimed

No new native Next build or unchanged whole-monorepo typecheck was run. The prior root-typecheck failure remains separate historical evidence; scoped zero diagnostics are not a root pass. No production records, credentials, financial information, external services, emails, payments, public routes, publishing, commits or deployment were touched. Existing unrelated files/logs were preserved.
