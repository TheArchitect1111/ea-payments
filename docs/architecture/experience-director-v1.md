# Experience Director v1 — Complete

**Status:** Complete — do not extend unless a real defect or justified user feedback  
**Merged:** PR [#193](https://github.com/TheArchitect1111/ea-payments/pull/193), hardening PR [#194](https://github.com/TheArchitect1111/ea-payments/pull/194)  
**Date:** 2026-07-20

Experience Director v1 is done. Treat further work on this surface as **out of sprint** unless it directly unblocks EA launch, or a production defect / explicit user feedback requires a fix.

---

## What shipped (v1)

| Surface | Role |
|---------|------|
| Admin dashboard `/admin/ea-factory/experience-director` | Run review, scores, improvements, approval status |
| Experience Review artifact | `experience_review` — Approved / Needs Refinement / Rejected |
| Publish gate | `lib/factory-publish-website.ts` — only Approved may publish |
| Validation Mode | Phase 1 human vs AI validation store + UI |
| Calibration | Phase 2 gold standards, confidence, benchmarks |

---

## Explicit non-goals (still true)

- Not registered in Launch orchestration (`lib/factory-capability-manifest.mjs`) — admin evaluator + publish gate only
- Does not generate, deploy, or fork Launch
- Does not replace the Orchestrator or invent a parallel review system

Wiring `experience_director` into automated Launch is a **separate backlog** item and must pass the launch-sprint filter before scheduling.

---

## Related

- [experience-blueprint.md](./experience-blueprint.md)
- [capability-manifest.md](./capability-manifest.md)
- [production-framework.md](./production-framework.md)
