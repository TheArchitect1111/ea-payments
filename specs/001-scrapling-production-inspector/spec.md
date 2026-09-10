# Feature Specification: Adaptive Production Inspector

## Approved intent

Integrate Scrapling into EA as a production-verification layer without changing client-facing behavior or weakening existing CI, production gates, monitoring, or security controls.

## Acceptance criteria

1. Scrapling is pinned to a reviewed version and installed only in the inspection workflow.
2. A deterministic self-test proves that a saved selector can be relocated after the original selector breaks.
3. Production targets are defined in a versioned manifest rather than hard-coded into the engine.
4. Inspector output is machine-readable and distinguishes PASS/FAIL per target.
5. The inspector detects missing required elements/text, response-size failures, insufficient image counts, and excessive repeated image sources.
6. Adaptive element memory persists between scheduled GitHub Actions runs.
7. Production inspection failure uploads evidence and opens/updates an incident instead of silently changing production.
8. Existing EA Spec Kit, Graft, CI, security, and production-gate behavior remains intact.

## Protected invariants

- No production content or route is modified by the inspector.
- No authentication, authorization, tenancy, payment, or entitlement rule is weakened.
- No production promotion occurs solely because Scrapling passes.
- A failed inspection cannot be reported as VERIFIED/DONE when the failed criterion is applicable.

## Rollback

Revert the integration commit. The existing hourly production guard and production gates continue independently.

## Verification

- Pull-request workflow installs pinned Scrapling and runs the adaptive self-test.
- Existing repository CI/Graft checks remain green or any unrelated pre-existing failure is explicitly identified.
- After merge, scheduled/manual production inspection produces a JSON evidence artifact.
