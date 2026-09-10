<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- GRAFT:START -->
## Graft codebase context

This repository uses NanoNets Graft as a local, regenerable code-structure context layer for coding agents.

Before broad repository exploration, prefer Graft queries when available:

- `graft map` for repository orientation and hotspots.
- `graft ask "<question>"` for ranked codebase context.
- `graft skeleton <file>` to inspect a file's API surface without loading full bodies.
- `graft callers <symbol>` to inspect dependency and blast radius before edits.
- `graft grep "<pattern>"` for structure-aware search.
- `graft check` to detect graph drift.

The generated `graft/` directory is a local cache and must not be committed. Rebuild it with `npx -y @nanonets/graft build` when needed.

Use the structural layer first, then open only the source files required to verify or implement a change. Graft is context assistance, not a substitute for tests, source verification, or repository-specific safety checks.

Do not require the optional LLM-enriched `--deep` graph for ordinary work. Use the deterministic local graph by default to avoid unnecessary model cost.
<!-- GRAFT:END -->

<!-- SPEC-KIT:START -->
## EA Spec Kit governance

This repository uses GitHub Spec Kit conventions as the governance and convergence layer for production-impacting work. The pinned compatibility target is Spec Kit v1.0.5.

Before a material implementation:

1. Read `.specify/memory/constitution.md` and treat it as mandatory.
2. Identify the authoritative project/client source of truth.
3. Define observable acceptance criteria, protected invariants, rollback conditions, and production verification before changing production behavior.
4. Use `.specify/templates/spec-template.md`, `.specify/templates/plan-template.md`, and `.specify/templates/tasks-template.md` when creating Spec Kit artifacts.
5. Use Graft for repository context and blast radius, then implement the smallest safe change.
6. Run the repository's existing CI and EA production gates relevant to the change.
7. Converge: if deployed behavior fails any acceptance criterion, append corrective work and continue implementation + verification when a safe path exists.

Completion vocabulary is strict:
- IMPLEMENTED means source work is complete.
- DEPLOYED means the intended commit is available on the target environment.
- VERIFIED means production evidence satisfies every applicable acceptance criterion.
- DONE requires VERIFIED plus no unresolved blocking regression.

Never report DONE merely because code was edited, committed, merged, built, or returned HTTP 200.

See `SPEC-KIT-INTEGRATION.md` for the repository workflow and bootstrap details.
<!-- SPEC-KIT:END -->
