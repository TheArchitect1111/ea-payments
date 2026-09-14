# EA Execution Controller Temporal Service

Run 1 introduces the durable workflow backbone without replacing or bypassing EA's existing systems.

## Durable state

The Temporal workflow owns progression through INTAKE, CONTEXT_LOCK, MANIFEST, PLAN, EXECUTE, GATE, REPAIR, VERIFY, COMPLETE, BLOCKED, and ROLLED_BACK.

Activities use bounded retries for transient infrastructure failures. Business/quality failures are not treated as infrastructure retries. They return gate results and are routed through repair, rollback, or block behavior.

## Safety posture

The initial adapters fail closed at GATE and VERIFY. This is intentional. Run 1 proves the orchestration contract but cannot declare a real EA job COMPLETE until authoritative existing gate evidence is wired in. OPA policy evaluation is added in Run 2. Automatic corrective activities are added in Run 3.

## Deployment model

Run the worker as a long-lived worker service, not inside a Vercel request lifecycle. The existing Next.js/Vercel application remains the product surface. It can later submit approved jobs through a thin Temporal client adapter.

Required runtime configuration:
- TEMPORAL_ADDRESS
- TEMPORAL_NAMESPACE
- TEMPORAL_API_KEY when using Temporal Cloud
- EA_TEMPORAL_TASK_QUEUE (defaults to ea-execution-controller)

No credentials belong in the repository.
