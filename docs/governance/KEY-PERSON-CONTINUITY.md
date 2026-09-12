# EA Key-Person Continuity Standard

Status: Enterprise control baseline
Owner: EA
Scope: Production-critical EA systems, client operations, incident response, release authority, credential recovery, and Eva execution authority.

## Objective
EA must remain safely operable when the founder is unexpectedly unavailable. Founder absence must not create an authorization vacuum, force credential sharing, disable incident response, or permit Eva/automation to expand its own authority.

## Continuity authority model

### Normal operations
The founder retains normal business authority. Existing Release Governance, Production Acceptance, tenant-isolation, audit, and AI Action Authority controls remain mandatory.

### Continuity activation
Continuity mode may be activated only when the founder is unavailable and a designated human Continuity Approver has been formally registered outside source code. Activation must be recorded in Governance Evidence with actor, reason, time, scope, and expected duration.

A role definition is not an appointment. Until a specific human is formally designated and granted the required independent account access, continuity readiness remains Partial and must fail closed for founder-only actions.

### Continuity Approver authority
A designated Continuity Approver may:
- coordinate incident response;
- pause automated mutation through the global AI execution control;
- approve rollback to a previously verified production baseline;
- authorize recovery procedures documented in governance runbooks;
- coordinate vendors and client communications during an incident;
- authorize emergency access recovery through provider-native recovery mechanisms.

The Continuity Approver may not:
- weaken tenant isolation or security controls;
- disclose or share founder credentials;
- bypass release or production acceptance gates;
- transfer company ownership, intellectual property, funds, or domains absent separately documented legal authority;
- authorize destructive deletion of client or company records merely because the founder is unavailable;
- grant Eva or any AI system broader authority than allowed during normal operations.

## Emergency authority matrix

| Function | Founder available | Founder unavailable | Fail-closed rule |
| --- | --- | --- | --- |
| Observe system health | Founder / authorized operator | Continuity Approver / authorized operator | No mutation required |
| Pause AI mutation | Founder / authorized operator | Continuity Approver | Pause allowed; self-reactivation by AI prohibited |
| Roll back verified production release | Existing release authority | Continuity Approver under incident record | Only to registered verified baseline |
| New production feature/change | Existing release authority | Deferred unless independently authorized under normal governance | Founder absence never lowers gate |
| Credential recovery | Account owner through provider-native recovery | Continuity Approver coordinates registered provider recovery | Never share plaintext secrets |
| Cross-tenant/destructive action | Explicit normal authorization | Prohibited unless separately pre-authorized and independently reviewed | Fail closed |
| Client communication | Founder / delegated operator | Continuity Approver | Incident facts only; no unsupported claims |
| Financial/legal ownership transfer | Founder / legal authority | Outside technical continuity authority | Requires separate legal authority |

## Credential continuity

1. Production secrets remain in provider-native secret stores or approved password/credential management systems, never in this repository or continuity evidence.
2. Recovery documentation records credential owner class and recovery method, not the secret.
3. Founder credentials must never be copied to a successor or emergency operator.
4. Critical providers must support an independent recovery path for the designated Continuity Approver or other legally authorized human.
5. Recovery access must use individual identity, MFA, least privilege, and auditable provider-native access wherever supported.
6. If independent access has not been provisioned and verified for a critical provider, that dependency is not continuity-certified.

## Minimum recovery record for every critical system
Each production-critical system must identify:
- canonical source/repository;
- production target;
- authoritative data source;
- credential owner class and provider-native recovery method;
- vendor/dependency owner;
- known-good rollback target;
- monitoring/health proof location;
- recovery procedure;
- post-recovery verification procedure;
- authorized continuity role.

No recovery record may contain a secret.

## Eva during founder absence
Eva remains bounded by the EA AI Action Authority standard. Founder absence never raises an AI authority tier. High-impact or unresolved actions remain human-gated. The global AI mutation kill switch remains available to the designated Continuity Approver. Eva cannot appoint an approver, alter the authority matrix, reactivate mutation after a human shutdown, or infer emergency authority from founder inactivity.

## Continuity activation procedure
1. Confirm founder unavailability using the company's designated human process.
2. Confirm the requesting operator is the registered Continuity Approver.
3. Create a Governance Evidence incident/continuity activation record.
4. Freeze nonessential high-risk production changes.
5. Review monitoring and active client-impacting incidents.
6. If required, pause AI mutation.
7. Use only documented recovery/rollback paths and verified baselines.
8. Record every material action and outcome.
9. On founder return or lawful authority transition, close continuity mode and review all emergency actions.

## Certification test
A continuity certification passes only when evidence demonstrates:
- a specific human Continuity Approver is registered;
- that person has independent, individual access or verified recovery capability for each critical provider needed for incident operations;
- the operator can locate canonical source, data, rollback, monitoring, and runbooks without founder knowledge;
- AI mutation can be paused without founder credentials;
- a simulated rollback/recovery can be executed using documented procedures without bypassing gates;
- actions are auditable;
- no plaintext secret exchange is required.

Documentation alone does not certify continuity. Until the human designation and independent-access drill pass, Enterprise Stress Certification must remain Partial/Conditional rather than Verified/Pass.

## Review cadence
Review quarterly and whenever a critical provider, account owner, production target, recovery mechanism, or designated Continuity Approver changes.