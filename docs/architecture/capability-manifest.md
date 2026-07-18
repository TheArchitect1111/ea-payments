# EA Factory Capability Manifest (Phase 3)

**Status:** Implemented  
**Machine-readable source:** [`lib/factory-capability-manifest.mjs`](../../lib/factory-capability-manifest.mjs)  
**Runtime:** [`lib/factory-capability-registry.mjs`](../../lib/factory-capability-registry.mjs) + [`lib/factory-capability.ts`](../../lib/factory-capability.ts)

---

## Purpose

Document **execution order** and **dependencies** for Factory capabilities so the Orchestrator can discover the next runnable unit without a hard-coded if/else sequence.

---

## Capability interface

| Member | Meaning |
|--------|---------|
| `id` | Stable identity (matches ProjectContext output `kind`) |
| `dependencies` | Capability ids that must have an appended output before this can run |
| `canRun(ProjectContext)` | Capability-specific readiness |
| `execute(ProjectContext)` | Read/append ProjectContext only; never call other capabilities |

---

## Manifest (current)

| order | id | dependencies | implemented | role |
|------:|----|--------------|:-----------:|------|
| 10 | `intake` | — | yes | worker |
| 20 | `research` | `intake` | yes | worker — provider artifacts (no AI) |
| 30 | `discovery` | `research` | yes | worker — discovery artifacts from research only |
| 40 | `planning` | `discovery` | yes | worker — planning artifacts + WorkOrders |
| 50 | `production` | `planning` | yes | worker — ProductionController + WebsiteBuilder |

```text
intake → research → discovery → planning → production → (more builders…)
```

Dependency rule used by the registry: a dependency is satisfied when ProjectContext has an output with `kind === dependencyId`.

---

## Discovery algorithm

1. Load ProjectContext.
2. Skip terminal project states (`FAILED`, `CANCELLED`; legacy `UNDER_REVIEW` + `launchId`).
3. Order registered capabilities by manifest `order`.
4. Pick the first capability where:
   - all `dependencies` are satisfied (outputs present), and
   - `canRun(context)` is true.
5. Orchestrator calls `execute` once per step; never chains capability→capability calls.

---

## Extending the engine

1. Add a manifest entry (`id`, `order`, `dependencies`).
2. Implement `Capability` (`canRun` / `execute`).
3. Register in `bootstrapCapabilityRegistry`.
4. Append outputs to ProjectContext; do not overwrite history.
5. Keep public launch APIs unchanged.

---

## Related

- Orchestrator + ProjectContext flow: [orchestrator.md](./orchestrator.md)
- Research / Artifacts: [research-capability.md](./research-capability.md)
- Discovery: [discovery-capability.md](./discovery-capability.md)
- Planning / WorkOrders: [planning-capability.md](./planning-capability.md)
- Production framework: [production-framework.md](./production-framework.md)
- ProjectContext contract: `lib/factory-project-context.ts`
