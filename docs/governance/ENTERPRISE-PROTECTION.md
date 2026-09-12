# EA Enterprise Protection Standard

Status: ACTIVE governance baseline
Run: Enterprise Protection / Run 1

## Purpose

This standard closes governance gaps around continuity, intellectual property, client portability, retention, and credentials without weakening existing fail-closed production controls.

## 1. Continuity and key-person independence

Every production-critical system must have a recovery record containing: canonical repository/data source, production target, credential owner class, recovery procedure, rollback target, vendor dependencies, and at least one operator-independent verification procedure.

No production service may rely on undocumented knowledge held by one person. Recovery instructions must never contain secret values. Secrets remain in the approved secret-management provider.

Quarterly continuity certification must demonstrate that a qualified operator can identify the source of truth, locate recovery evidence, determine the current approved baseline, and execute the documented recovery path without relying on undocumented owner knowledge.

## 2. Intellectual-property governance

Every reusable EA asset must be classified as one of: EA-owned, client-owned, licensed third-party, open-source, or unknown/review-required.

Reusable code, templates, prompts, visual systems, automations, workflows, schemas, and operating methods created as general EA infrastructure are EA platform IP unless a signed agreement states otherwise.

Client-provided logos, photography, copy, records, and proprietary business materials remain client assets unless a signed agreement states otherwise.

Third-party and open-source components require source/license identification before being promoted into the reusable production chassis. Unknown-license assets fail closed for reuse.

## 3. Client portability and offboarding

Every client must be capable of an orderly exit. Offboarding must support an export manifest covering client-owned content, approved media, relevant structured business data, contractual deliverables, and access/ownership transfer information where applicable.

Offboarding must revoke client-specific access, OAuth grants, active sessions, automation permissions, and unnecessary credentials after the agreed transition window. Shared EA platform IP, internal prompts, reusable chassis code, internal security controls, and other clients' data are excluded from client exports unless contractually required.

Deletion must never precede confirmation that contractual, legal, financial, dispute, backup, and audit-retention obligations have been evaluated.

## 4. Data retention and deletion

Data is retained by category rather than indefinitely by default.

- Active client operational data: retain while needed to provide the service.
- Financial/transaction evidence: retain according to applicable accounting, tax, contractual, and legal requirements.
- Legal acceptance and security/audit evidence: append-only where required for defensibility; deletion requires explicit governance review.
- Client content/assets: retain through the active relationship and documented transition window, then archive or delete according to contract and legal requirements.
- Authentication secrets: never retain recoverable plaintext passwords. Temporary credentials must be short-lived or replaced by one-time invitation/reset flows.
- OAuth/API credentials: retain only while the integration is active; revoke on disconnection/offboarding when technically possible.

Any automated deletion process must be tenant-scoped, auditable, reversible during a defined safety window where feasible, and fail closed on ambiguous ownership.

## 5. Credential protection

Recoverable plaintext passwords are prohibited in production records. New onboarding must use one-time invitation, password-reset, magic-link, or equivalent non-recoverable credential establishment.

Legacy plaintext temporary-password values are a remediation item: identify affected records without copying secret values into logs, invalidate/rotate the affected credentials, clear the plaintext field, and record remediation evidence. Password hashes must use an approved adaptive password hashing mechanism. No secret value may be committed to Git or governance evidence.

## 6. Required release gates

A production change touching identity, credentials, retention, deletion, offboarding, export, IP classification, or continuity must pass: tenant isolation, authorization, audit evidence, rollback/recovery, source identity, build/test, and production verification gates.

Destructive or cross-tenant operations require explicit authorization and must not be inferred from ordinary content-update permission.

## 7. Evidence contract

Run evidence must record what was tested, target/system, source commit or configuration version where applicable, outcome, blocker/remediation, and timestamp. Evidence must never contain passwords, API keys, access tokens, private keys, or raw sensitive authentication material.

## Run 1 acceptance criteria

Run 1 is governance-complete when this standard is canonical, legacy plaintext-password exposure is inventoried without secret disclosure, a safe credential migration path is defined, continuity/offboarding/IP/retention requirements are represented in the control plane, and no production presentation or client experience is changed merely to satisfy governance documentation.
