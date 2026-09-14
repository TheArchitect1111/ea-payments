# EA Execution Controller

Status: Run 0 blueprint

The Execution Controller is a thin control plane over EA's existing stack. It does not replace Spec Kit, Graft, CI, Playwright, Scrapling, the EA Production Gate, deployment protections, or creative/visual QA.

## Trigger

Controlled execution begins from approved action intent, not a magic phrase. Requests such as Go, proceed, fix, restore, build, implement, deploy, or an equivalent unambiguous approval enter this workflow. Questions, exploration, and recommendations remain analysis-only until action is approved.

## State machine

`INTAKE -> CONTEXT_LOCK -> MANIFEST -> PLAN -> EXECUTE -> GATE -> REPAIR -> VERIFY -> COMPLETE`

Terminal exception states are `BLOCKED` and `ROLLED_BACK`.

A failed gate with a safe corrective path returns to `REPAIR`, then to the affected execution stage and gates. It does not become COMPLETE and does not require user intervention unless authorization, ambiguity, destructive risk, credentials, or a genuine decision blocker prevents safe continuation.

## Existing EA attachment points

- Spec Kit constitution: governance and acceptance criteria.
- Project/client source of truth: approved intent, assets, routes, content, constraints.
- Graft: repository context and blast-radius analysis.
- Existing EA engines/modules: implementation activities.
- CI/build/tests: automated implementation evidence.
- Playwright: browser and interaction verification.
- Scrapling: read-only production structural/content inspection.
- `.ea/gates/latest.json`: production gate evidence contract.
- Vercel/GitHub production path: deployment.
- Creative/visual inspection: final human-style acceptance.

## Run 1 and Run 2 integration

Temporal will own durable workflow state and retries. Existing EA operations become activities rather than being rewritten.

OPA will evaluate version-controlled policies at enforcement points. It will not replace the existing gates. Policy failure blocks state advancement.

## Completion contract

- IMPLEMENTED: source work exists and implementation checks pass.
- DEPLOYED: intended revision is available in target environment.
- VERIFIED: all applicable acceptance criteria and verification gates pass with evidence.
- COMPLETE/DONE: VERIFIED, final inspection passes, and no unresolved blocking regression exists.

Never infer COMPLETE from a commit, merge, deployment, HTTP 200, or partial test pass.
