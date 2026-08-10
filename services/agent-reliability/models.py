from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field


class Evidence(BaseModel):
    name: str
    passed: bool
    detail: str = ""
    source: str | None = None


class CompletionRequest(BaseModel):
    task_id: str
    goal: str
    claimed_status: Literal["in_progress", "blocked", "finished"]
    evidence: list[Evidence] = Field(default_factory=list)
    required_gates: list[str] = Field(default_factory=list)
    blockers: list[str] = Field(default_factory=list)


class CompletionDecision(BaseModel):
    task_id: str
    status: Literal["in_progress", "blocked", "finished"]
    verified: bool
    missing_gates: list[str] = Field(default_factory=list)
    failed_gates: list[str] = Field(default_factory=list)
    blockers: list[str] = Field(default_factory=list)
    next_action: str


class PlanRequest(BaseModel):
    goal: str
    context: str = ""
    acceptance_criteria: list[str] = Field(default_factory=list)


class PlanStep(BaseModel):
    id: str
    action: str
    verify: str


class AgentPlan(BaseModel):
    goal: str
    steps: list[PlanStep]
    completion_rule: str
