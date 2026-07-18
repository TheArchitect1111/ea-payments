# EA Factory Core v1.0 — Frozen Contracts

**Release tag:** `ea-factory-core-v1.0`  
**Status:** Complete and frozen  
**Date:** 2026-07-18

EA Factory Core is complete. From this point forward, **stop creating new architectural abstractions** unless required to solve a production problem.

---

## Frozen contracts (stable APIs)

Treat changes to these as **versioned API changes** (bump / migrate deliberately; preserve backward compatibility):

| Contract | Primary location |
|----------|------------------|
| **Launcher** | `POST /api/launch`, `lib/factory-project.ts`, queue entry |
| **Orchestrator** | `lib/factory-orchestrator.ts` — sole capability dispatcher |
| **Capability interface** | `lib/factory-capability.ts` (`id`, `dependencies`, `canRun`, `execute`) |
| **Capability Registry** | `lib/factory-capability-registry.mjs` |
| **ProjectContext** | `lib/factory-project-context.*` (schemaVersion + append-only outputs/artifacts) |
| **Artifact schema / ArtifactService** | `lib/factory-artifact.*` |
| **WorkOrder schema** | `lib/factory-work-order.*` |
| **ProductionController** | `lib/factory-capabilities/production-capability.ts` |
| **Builder Registry** | `lib/factory-builder-registry.mjs` |
| **Deliverable** | `lib/factory-deliverable.mjs` |
| **Review Gates** | `lib/factory-review-gate.mjs` |

**Orchestrator behavior (frozen):** inspect ProjectContext → `discoverNext` from Capability Registry → execute one capability → loop until idle. Capabilities never call each other. Builders never call each other; ProductionController dispatches via Builder Registry only.

---

## How to extend (product development)

Add functionality through:

1. **Capabilities** (register in manifest + bootstrap; implement `canRun` / `execute`)
2. **Builders** (register in Builder Registry; handle WorkOrder types)
3. **Deliverables / Review Gates / Artifacts** (append-only; provenance required)

Do **not**:

- Redesign the architecture
- Introduce new framework patterns or another orchestration layer
- Break public Launcher APIs or project ID format
- Mutate append-only history (ProjectContext outputs/artifacts)

---

## Core pipeline (v1.0)

```text
CREATED → QUEUED → INTAKE → INTAKE_COMPLETE → RESEARCHING → DISCOVERING → PLANNING → BUILDING
```

Implemented capabilities: `intake` → `research` → `discovery` → `planning` → `production` (WebsiteBuilder).

---

## Product backlog (priority)

1. QA Capability  
2. Publishing Capability  
3. Notification Capability  
4. Portal Builder  
5. Learning Builder  
6. Knowledge Builder  
7. Report Builder  

For each: build one capability (or one builder), add tests, logging, docs, **stop for review**.

Optimize for **reliability, observability, performance, and UX** — not new architecture.

---

## Definition of done (platform outcome)

A founder launches a project from ChatGPT on a phone. The platform autonomously researches, discovers, plans, builds, performs QA, publishes, notifies, and presents a review-ready deliverable.

---

## Related docs

- [orchestrator.md](./orchestrator.md)
- [capability-manifest.md](./capability-manifest.md)
- [research-capability.md](./research-capability.md)
- [discovery-capability.md](./discovery-capability.md)
- [planning-capability.md](./planning-capability.md)
- [production-framework.md](./production-framework.md)
