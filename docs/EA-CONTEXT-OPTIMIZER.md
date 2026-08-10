# EA Context Optimizer

Purpose: reduce LLM input cost and distraction without hiding important task state.

## Pipeline

1. Preserve compact task state: goal, done, blockers, next action, constraints.
2. Rank historical/context items against the current query.
3. Keep only the highest-value items inside a hard context budget.
4. Optionally pass the filtered context through Microsoft LLMLingua.
5. If LLMLingua is unavailable or fails, continue with the deterministic retrieval/filtering result.
6. Report input/output size and reduction ratio so EA can benchmark savings.

## LLMLingua integration

The TypeScript adapter uses an optional HTTP endpoint so EA does not need a large Python transformer model inside every Next.js/Vercel function.

Environment variables:

- `LLMLINGUA_ENDPOINT`: HTTP endpoint accepting `{ text, target_rate }` and returning `{ compressed_text }` or `{ text }`.
- `LLMLINGUA_API_KEY`: optional bearer token.
- `LLMLINGUA_TARGET_RATE`: optional target fraction retained, default `0.5`.

Without `LLMLINGUA_ENDPOINT`, the optimizer remains active using the built-in relevance filter and hard budget.

## Safety rule

Do not compress system/security instructions, tool contracts, secrets handling requirements, or deterministic acceptance criteria. Use the optimizer for retrieved history, project notes, research, logs, and other large context payloads.

## Acceptance benchmark

Before enabling broadly, run representative EA tasks and compare:

- input characters/tokens
- answer correctness
- completion rate
- tool-call count
- latency
- cost

Savings are only accepted when completion quality does not materially regress.
