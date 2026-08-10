from __future__ import annotations

import os
from fastapi import FastAPI
from pydantic_ai import Agent

from models import AgentPlan, CompletionDecision, CompletionRequest, PlanRequest

app = FastAPI(title="EA Agent Reliability Service", version="0.1.0")


def verify_completion(req: CompletionRequest) -> CompletionDecision:
    by_name = {item.name: item for item in req.evidence}
    missing = [gate for gate in req.required_gates if gate not in by_name]
    failed = [gate for gate in req.required_gates if gate in by_name and not by_name[gate].passed]
    blockers = list(req.blockers)

    verified = req.claimed_status == "finished" and not missing and not failed and not blockers
    if verified:
        return CompletionDecision(
            task_id=req.task_id,
            status="finished",
            verified=True,
            next_action="No further action. Completion is supported by all required evidence.",
        )

    status = "blocked" if blockers else "in_progress"
    parts: list[str] = []
    if missing:
        parts.append("collect missing evidence: " + ", ".join(missing))
    if failed:
        parts.append("repair failed gates: " + ", ".join(failed))
    if blockers:
        parts.append("resolve blockers: " + ", ".join(blockers))
    if req.claimed_status != "finished" and not parts:
        parts.append("continue execution and collect completion evidence")

    return CompletionDecision(
        task_id=req.task_id,
        status=status,
        verified=False,
        missing_gates=missing,
        failed_gates=failed,
        blockers=blockers,
        next_action="; ".join(parts),
    )


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "ok": True,
        "service": "ea-agent-reliability",
        "pydantic_ai": True,
        "model_configured": bool(os.getenv("OPENAI_API_KEY")),
    }


@app.post("/verify", response_model=CompletionDecision)
def verify(req: CompletionRequest) -> CompletionDecision:
    # This endpoint is deliberately deterministic. An LLM cannot override a failed gate.
    return verify_completion(req)


@app.post("/plan", response_model=AgentPlan)
async def plan(req: PlanRequest) -> AgentPlan:
    if not os.getenv("OPENAI_API_KEY"):
        steps = [
            {
                "id": f"step-{index + 1}",
                "action": criterion,
                "verify": f"Produce deterministic evidence that '{criterion}' is satisfied.",
            }
            for index, criterion in enumerate(req.acceptance_criteria or [req.goal])
        ]
        return AgentPlan(
            goal=req.goal,
            steps=steps,
            completion_rule="Do not report finished until every acceptance criterion has passing evidence.",
        )

    agent = Agent(
        os.getenv("EA_RELIABILITY_MODEL", "openai:gpt-5-mini"),
        output_type=AgentPlan,
        instructions=(
            "You are the EA planning layer. Produce the smallest executable plan. "
            "Every step must include a deterministic verification. Never treat prose confidence as evidence. "
            "Completion requires every supplied acceptance criterion to be verified."
        ),
    )
    prompt = (
        f"Goal:\n{req.goal}\n\n"
        f"Acceptance criteria:\n" + "\n".join(f"- {x}" for x in req.acceptance_criteria) +
        f"\n\nContext:\n{req.context[:12000]}"
    )
    result = await agent.run(prompt)
    return result.output
