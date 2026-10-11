# Client factory V1
Source: certified chassis e451ff7. Scope: source scaffolding, not live tenant provisioning.
Acceptance: one command creates a client branch and client folder; shared registry is consumed by trackingPortal and brick-events; generated adapters call the registrar; reject invalid names, duplicate slugs and dirty working trees; existing clients and payment/test isolation remain unchanged; guard, tests and build pass.
Implementation: registrar owns filesystem generation; CLI owns Git branching; atomic registry replacement; new client directory scanned by guard.
Rollback: close PR or revert factory commit. No production data is written or deployed by the factory.
Verification: exercise CLI in isolated repository, generated adapter through mocked tracking ports, invalid/duplicate requests, guard bypass rejection, full npm test and build. Director review precedes merge.
