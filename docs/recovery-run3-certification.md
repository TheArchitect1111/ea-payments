# Recovery Orchestrator Run 3 Certification

Run 3 certifies the controlled self-healing loop introduced in Runs 1 and 2.

## Certified loop

Detect → diagnose → compare against canonical authority → allowlisted repair → verify → rollback on failed verification → verify again → record evidence → escalate when unsafe.

## Certification cases

1. Approved isolated asset repair succeeds and verifies healthy.
2. Approved isolated configuration repair fails verification, invokes known rollback, and verifies restored health.
3. Repair fails verification and rollback cannot mutate: system remains unhealthy and must escalate.
4. Provider/account/credential/quota failures are never auto-repaired.
5. Shared-platform mutation is never autonomous-safe.
6. Execute mode fails closed when EA_RECOVERY_EXECUTION_ENABLED is not explicitly true.

## Production boundary

Certification does not grant blanket mutation authority. Production execution still requires all canonical safety gates, `EA_RECOVERY_EXECUTION_ENABLED=true`, an explicit approved repair adapter, and an explicit approved rollback adapter. Missing authority, unknown rollback, shared-platform scope, provider failures, or unmapped failures fail closed or escalate.
