# Spec Kit Integration

EA uses GitHub Spec Kit as a specification and convergence layer for production-impacting work.

Pinned compatibility target: `specify-cli==1.0.5`.

## Local bootstrap

Install the pinned CLI using one of the official supported methods, then verify it:

```bash
uv tool install specify-cli==1.0.5
specify version
```

For a fresh local checkout that does not yet have agent commands materialized, initialize the existing project using the appropriate supported integration without replacing EA's committed constitution/templates. Review any generated changes before committing them.

## EA workflow

1. Capture the approved request and source of truth.
2. Create/update a feature specification under `specs/`.
3. Apply `.specify/memory/constitution.md` as mandatory governance.
4. Build a plan from `.specify/templates/plan-template.md`.
5. Build tasks from `.specify/templates/tasks-template.md`.
6. Implement the smallest safe change set.
7. Run repository-specific checks and the existing EA gates.
8. Verify production against every acceptance criterion.
9. Converge: failed criteria create corrective tasks and the cycle repeats.
10. Report DONE only after production proof passes.

## Relationship to existing EA machinery

Spec Kit does not replace Graft, CI, EA Production Gate, monitoring, Vercel, or SECURITY-MODEL.md.

- Graft supplies codebase context and blast-radius assistance.
- Spec Kit supplies intent, specification, planning, tasking, and convergence governance.
- Existing CI/gates supply implementation and production checks.
- SECURITY-MODEL.md remains binding.

## Completion-state vocabulary

Use these states precisely:

- SPECIFIED: acceptance criteria and invariants are defined.
- IMPLEMENTED: source changes are complete locally/in branch.
- DEPLOYED: the intended commit is available on the target environment.
- VERIFIED: production evidence satisfies the specification.
- DONE: VERIFIED with no unresolved blocking regression.
- BLOCKED: additional authorization/input is required or safe execution cannot continue.

A successful commit, merge, build, or HTTP response does not by itself qualify as VERIFIED or DONE.