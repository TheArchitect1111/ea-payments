# EA Spec Kit Constitution

Version: 1.0.0
Spec Kit compatibility target: v1.0.5
Ratified: 2026-09-10

## Principle I: Approved intent is the source of truth

Every material change MUST begin from an explicit request, approved requirement, or existing project source of truth. Agents MUST preserve approved content, flows, assets, branding, pricing, legal language, and client-specific constraints unless the change explicitly authorizes modification.

## Principle II: Specify before changing production behavior

Before implementation, define the intended outcome, affected surfaces, acceptance criteria, protected invariants, rollback condition, and verification method. Ambiguous requirements MUST be clarified before irreversible or production-impacting changes.

## Principle III: No silent regression

A change MUST NOT remove, replace, hide, duplicate, or degrade previously approved content or behavior unless the specification explicitly requires it. Existing security, tenancy, entitlement, payment, authentication, legal, monitoring, and deployment invariants remain binding.

## Principle IV: Production proof is required

Code completion is not task completion. A change is complete only when the deployed production surface is verified against the acceptance criteria. Verification MUST include the relevant combination of build checks, route checks, critical interaction checks, content/image checks, mobile checks, and source-of-truth comparison.

## Principle V: Converge until the specification is satisfied

If verification identifies a gap, the work returns to implementation automatically when a safe corrective path exists. The run MUST continue through repair and re-verification until all acceptance criteria pass, a rollback is required, or a blocker requires new user authorization.

## Principle VI: Fail safely

Production changes MUST have a known rollback path. Failed verification, broken authentication, payment failures, missing critical content, security regressions, or destructive drift MUST block completion. When a safe rollback is available, prefer rollback over leaving a degraded deployment live.

## Principle VII: Tenant and security boundaries are non-negotiable

The repository SECURITY-MODEL.md is incorporated by reference. Authentication, authorization, tenant scoping, organization identity, actor identity, conversation scope, and client-data separation MUST not be weakened to make a feature easier to ship.

## Principle VIII: Guided client experience

Client-facing language and flows MUST remain clear, guided, and action-oriented. Internal implementation terminology, developer jargon, and generic consultant language MUST not leak into client experiences unless explicitly required.

## Principle IX: Visual fidelity is functional fidelity

For EA public sites and portals, visual correctness is part of acceptance. Missing images, repeated images, incorrect assets, broken hierarchy, unreadable text, clipping, poor mobile layout, or visual drift from an approved reference are failures, not cosmetic follow-ups.

## Principle X: Evidence before completion

Agents MUST NOT report a production task complete based only on edited source code, a successful commit, or an HTTP 200. Completion requires evidence from the relevant deployed route and checks. Reports MUST distinguish implemented, deployed, verified, and blocked states.

## Change workflow

1. Capture request and project context.
2. Produce or update a specification.
3. Define acceptance criteria and protected invariants.
4. Produce an implementation plan.
5. Break work into executable tasks.
6. Implement the smallest safe change set.
7. Run automated and repository-specific checks.
8. Deploy through the existing production path.
9. Verify production against the specification.
10. Converge on failures until acceptance passes or rollback/blocker criteria are met.

## Definition of done

A production change is DONE only when all applicable acceptance criteria pass, protected invariants remain intact, production verification passes, and no unresolved high-severity regression remains.

## Governance

This constitution outranks convenience and speed. Project-specific specifications may add stricter constraints but may not weaken these principles without an explicit approved governance change. Amendments MUST document the reason, affected principles, migration impact, and new version.