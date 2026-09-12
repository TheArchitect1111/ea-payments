# EA Modular Assembly — Run 0

Status: implementation candidate

## Objective

Establish one machine-readable standard for reusable EA capabilities before the Assembly Engine is built.

## Capability contract

Every reusable capability must declare and certify:

1. Identity and version
2. UI surface
3. Routes
4. Navigation behavior
5. Data requirements and authority
6. Permissions/RBAC
7. Dependencies
8. External integrations
9. Provisioning steps
10. Health check
11. Automated tests
12. Rollback/removal behavior
13. Cost and licensing boundary

A capability is not Assembly-ready until every contract area is known. Unknown cost or licensing is fail-closed.

## Core policy

Reuse before build. Configure before customize. Integrate before reinvent.

The standard EA portal target includes Dashboard, Amplifi and Update Hub as chassis capabilities. Future Run 1 will expand the universal core only after each added capability meets this standard.

## Open-source gate

EA will not make a third-party open-source project a required chassis dependency when production use requires a paid vendor subscription/account, per-client license, per-user license, mandatory usage fee, or an unacceptable license obligation on proprietary EA code.

Self-hosting infrastructure cost is allowed because EA controls it. Optional paid support is allowed only when the underlying production capability remains functional without it.

### Candidate disposition

- pretix: REVIEW REQUIRED. Existing EA event integration may remain, but do not deepen the dependency until the AGPL/additional-term boundary for client event use is documented.
- Documenso: ISOLATED. If used, consume an unmodified self-hosted Community instance through an API boundary. Do not merge/fork AGPL code into proprietary EA code.
- Novu: REVIEW REQUIRED. Community core is open source, but map the exact EA feature list before adoption because some features are cloud/commercial-only.
- Unleash: REVIEW REQUIRED. Prefer a separately deployed official open-source container if adopted; do not embed/modify the AGPLv3 server in EA proprietary code.
- Formbricks: REJECTED for the planned embedded EA Forms Builder. Build on the existing EA forms/intake architecture or select a permissive alternative.

## Run 1 entry gate

Run 1 may start when:

- this contract is machine-readable;
- existing modules can be classified against it;
- Amplifi is explicitly targeted as a standard portal capability;
- third-party candidates have a recorded cost/license decision;
- no new paid vendor account is required merely to execute the capability plan.
