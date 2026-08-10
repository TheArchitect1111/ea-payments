# EA Agent Reliability Layer

This implementation combines two ideas without importing AGPL code from OpenMontage.

## 1. Pydantic AI reliability service

`services/agent-reliability` is a small Python service. Pydantic AI is used for typed planning. Completion verification is intentionally deterministic: an LLM cannot override missing evidence, failed tests, deployment failures, or unresolved blockers.

Core contract:

`Plan -> Execute -> Verify -> Complete`

A task may only become `finished` when every required gate has explicit passing evidence.

Environment variables:

- `OPENAI_API_KEY` for AI-assisted planning.
- `EA_RELIABILITY_MODEL` optional model override.
- `EA_AGENT_RELIABILITY_URL` in the Next.js application when the Python service is deployed.

Without the service URL, the TypeScript client uses the same deterministic verification rules locally.

## 2. Video Factory staged pipeline

EA keeps its own Remotion implementation and uses an original staged artifact model inspired by general production-pipeline patterns:

`brief -> research -> script -> scene-plan -> assets -> narration -> render -> qa -> publish`

Each stage records evidence. Later stages cannot be certified until prerequisite stages pass. The final agent completion gate consumes those stage records, preventing a render, deployment, or narration task from being reported as finished prematurely.

This code is EA-owned. No OpenMontage source code is copied or linked into the application.

## Rollout

1. Run `scripts/test-context-optimizer.ts` to validate context reduction.
2. Run `scripts/test-agent-reliability.ts` to validate completion gating.
3. Run Python tests under `services/agent-reliability`.
4. Deploy the reliability service separately and set `EA_AGENT_RELIABILITY_URL`.
5. Wire high-risk orchestrator jobs to the verifier, beginning with Video Factory, deployments, and factory launches.

## Non-negotiable rule

Agent prose is not evidence. Tests, HTTP checks, deployment states, artifacts, rendered media checks, and other deterministic observations are evidence.
