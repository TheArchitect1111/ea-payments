# EA Factory Run 0 — Autonomous Completion

Date: 2026-09-12

## Objective

Extend the frozen EA Factory Core v1.0 through the review-ready boundary without introducing a new orchestration layer.

## Conveyor

`INTAKE → RESEARCH → DISCOVERY → PLANNING → PRODUCTION → QA → PUBLISHING → NOTIFICATION → UNDER_REVIEW`

## Run 0 capabilities

### QA

QA runs only after Production has no pending website WorkOrders and the required production artifacts exist. It verifies deliverable, website, and experience-concept evidence. Structural review gates (`website-content`, `website-navigation`) may be auto-remediated when their source artifacts are present. Gate history remains append-only; readers resolve the latest semantic state.

The subjective `experience-concept` gate is deliberately not auto-approved. It remains a human review decision.

### Publishing

Publishing requires a passed QA output. Run 0 publishes a canonical internal Factory review preview at `/preview/factory/{projectId}/{conceptId}` and verifies the route contract. It does not perform an external production publication or bypass creative approval.

### Notification

Notification requires the verified review-ready publishing receipt. It reuses the existing Factory founder notification system and appends a durable notification output. Email degradation does not erase or invalidate the review-ready deliverable.

## Recovery

QA and PUBLISHING are included in the orchestrator drain statuses so interrupted jobs can resume. `UNDER_REVIEW` remains runnable until the notification receipt exists, then becomes terminal for autonomous processing.

## Safety

- Factory Core contracts remain unchanged.
- Capabilities never call each other.
- Orchestrator remains the sole dispatcher.
- Artifacts and outputs remain append-only.
- Structural checks may self-heal; subjective creative approval cannot.
- No external production publication occurs in Run 0.

## Acceptance

Run 0 is accepted only when:

1. Manifest order includes QA, Publishing, and Notification.
2. Capability registry boots all three new workers.
3. QA can auto-resolve structural review gates without erasing history.
4. Subjective experience approval remains pending for a human.
5. Publishing emits a canonical verified review-preview URL only after QA passes.
6. Notification runs after publishing and preserves the review-ready URL.
7. CI certifies the pure state-machine and wiring contracts.
8. Existing CI, security, recovery, tenant isolation, build, and browser smoke checks remain green.
