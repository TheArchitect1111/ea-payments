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
