# Launch Certification browser evidence

**Request:** Continue the reusable EA LEGO Launch Certification & Autonomous Repair Brick through implementation, verification, and pull-request delivery.
**Project/tenant:** EA LEGO Chassis; initial clients TB3 and Amanda Catherine.
**Owner:** Efficiency Architects.
**Status:** In progress; production promotion is not authorized by this work.

## Intent

Turn observable public website quality into fresh, deployment-bound evidence while preserving fail-closed certification. Keep evidence for software structure separate from end-to-end form delivery, authenticated portal behavior, owner approvals, and live integrations.

## Scope

### In scope
- [x] Reuse configured client routes and installed-capability manifests.
- [x] Generate link/navigation, form-structure, accessibility, SEO, and desktop/mobile performance evidence for public website routes.
- [x] Bind evidence to exact deployment build identity, source commit, environment, timestamp, and report artifact.
- [x] Require HTTPS, a full source SHA, and a real deployment ID; require a validated configuration fingerprint in production.
- [x] Record test names/results and fail closed when a browser redirects away from a configured private portal route.
- [x] Probe portal anonymous denial without claiming role, tenant, or authenticated behavior.
- [ ] Fill or explicitly block remaining portal, security, integration, communications, operations, and business-workflow evidence where safe automated probes exist.
- [ ] Integrate executable isolated-branch repair tooling if an authorized, available code-writing agent exists.

### Out of scope
- [x] Live purchases, refunds, customer-facing form submission, provider mutations, production deployment, approval-gate bypass, or changes to client permissions.

## Source of truth

- Initial request: reusable launch-certification brick handoff in this conversation.
- `config/launch-certification/clients.json`
- `config/launch-certification/capabilities.json`
- `docs/LAUNCH-CERTIFICATION.md`
- Existing public/mobile browser gate: `scripts/ea-preview-gate.mjs`
- Repository security and tenancy policy: `SECURITY-MODEL.md`

## Protected invariants

- Certification is `CERTIFIED` only when every mandatory check has fresh evidence for the exact commit, environment, and deployment.
- Missing, stale, unverified, failed, and pending-approval evidence never passes.
- Structural form inspection does not imply successful form delivery.
- An HTTP 200 or an unauthenticated redirect does not prove authenticated portal authorization, tenant isolation, data persistence, or a business workflow.
- No production deployment, live commerce, sensitive permission change, self-approval, or production review-gate bypass.
- Client assets, flows, and approved provider configuration remain unchanged.

## Acceptance criteria

1. The same reusable browser auditor discovers public website routes from each client manifest.
2. It audits internal links/navigation, form structure, automated accessibility, SEO metadata/indexability, and desktop/mobile navigation performance.
3. It produces machine-readable evidence records and a detailed human-readable/audit artifact bound to the deployed commit and environment.
4. Audits never submit forms or invoke commerce mutations; form delivery remains unverified without a configured safe test receipt.
5. The responsive gate cannot treat a redirect to a login/denial page as proof the private portal itself rendered responsively.
6. Missing browser identity or unavailable measurements produce unverified evidence and cannot certify.
7. Deployment/source/configuration changes invalidate previous certificate bindings.
8. Existing chassis and certification tests pass; browser audit contract tests pass.
9. Preview verification runs against a READY deployment matching the exact PR commit. Production remains unchanged.

## Verification plan

- Repository checks: `npm run test:launch-certification`, `npm test`, `npm run build`, `git diff --check`.
- Browser route checks: each manifest website route, desktop and mobile, using the exact commit-bound preview.
- Website interactions: inspect all visible anchors, safely probe same-origin non-mutating GET destinations, inspect forms without submitting.
- Accessibility: axe-core WCAG 2.0 A/AA and WCAG 2.1 AA automated rules.
- SEO: title, description, canonical, one H1, and production indexability.
- Performance: DOMContentLoaded, LCP, CLS at desktop/mobile; record single-run lab-measurement limits.
- Existing visual gate: preserve screenshot, image, response, and viewport checks.
- Certificate binding: changed deployment ID or configuration fingerprint must invalidate an earlier certificate.

## Rollback condition

Revert the browser evidence step if it makes certification accept mismatched/stale evidence, triggers writes or commerce, weakens existing review gates, or prevents reports from being generated. Fix the auditor in the isolated branch if its thresholds or probes falsely pass or fail a route.

## Completion evidence

Record the source commit, exact preview deployment ID, workflow run, report artifact, per-client decision, and any external approvals/verification still required. Persistent certificate storage and a pre-promotion consumer are not configured. Do not call the system production-active or the brick complete while autonomous code repair or mandatory evidence pathways remain unimplemented or externally blocked.
