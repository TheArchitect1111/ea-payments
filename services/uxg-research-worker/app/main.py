"""Authenticated UXG research worker API — no public crawl without bearer token."""
from __future__ import annotations

import asyncio
import logging
import os
import sys
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse

from .crawl_job import run_crawl_job
from .models import (
    ResearchCrawlRequest,
    ResearchJobAccepted,
    ResearchJobSnapshot,
    ResearchJobStage,
)

logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(message)s",
)
log = logging.getLogger("uxg-research-worker")

app = FastAPI(title="EA UXG Research Worker", version="0.1.0", docs_url=None, redoc_url=None)
jobs: dict[str, ResearchJobSnapshot] = {}
job_lock = asyncio.Lock()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def update_stage(job_id: str, name: str, status: str, detail: str | None = None) -> None:
    async with job_lock:
        snapshot = jobs[job_id]
        current = next((s for s in snapshot.stages if s.name == name), None)
        now = now_iso()
        if current is None:
            current = ResearchJobStage(name=name, status="pending")
            snapshot.stages.append(current)
        if status == "running" and not current.startedAt:
            current.startedAt = now
        current.status = status  # type: ignore[assignment]
        current.detail = detail
        if status in ("succeeded", "failed"):
            current.finishedAt = now
            if current.startedAt:
                start = datetime.fromisoformat(current.startedAt)
                current.durationMs = (datetime.fromisoformat(now) - start).total_seconds() * 1000
        snapshot.updatedAt = now


async def execute_job(job_id: str, body: ResearchCrawlRequest) -> None:
    async with job_lock:
        jobs[job_id].status = "running"
        jobs[job_id].updatedAt = now_iso()
    try:
        result = await run_crawl_job(
            body,
            lambda name, status, detail: update_stage(job_id, name, status, detail),
        )
        async with job_lock:
            snapshot = jobs[job_id]
            result.job.stages = [s.model_dump(mode="json", exclude_none=True) for s in snapshot.stages]
            snapshot.status = result.job.status
            snapshot.result = result
            snapshot.updatedAt = now_iso()
    except Exception as exc:
        await update_stage(job_id, "failed", "failed", type(exc).__name__)
        async with job_lock:
            snapshot = jobs[job_id]
            snapshot.status = "failed"
            snapshot.error = f"{type(exc).__name__}: {exc}"[:500]
            snapshot.updatedAt = now_iso()
        log.exception({"event": "crawl_job_failed", "jobId": job_id})


def require_token(authorization: str | None = Header(default=None)) -> None:
    expected = (os.getenv("UXG_RESEARCH_WORKER_TOKEN") or "").strip()
    if not expected:
        raise HTTPException(
            status_code=503,
            detail="Worker token not configured (UXG_RESEARCH_WORKER_TOKEN).",
        )
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized.")
    got = authorization[7:].strip()
    if got != expected:
        raise HTTPException(status_code=401, detail="Unauthorized.")


@app.get("/health")
async def health() -> dict:
    token_set = bool((os.getenv("UXG_RESEARCH_WORKER_TOKEN") or "").strip())
    return {
        "ok": True,
        "service": "uxg-research-worker",
        "authConfigured": token_set,
        "version": "0.1.0",
    }


@app.post("/v1/crawl")
async def crawl(
    body: ResearchCrawlRequest,
    _: None = Depends(require_token),
) -> JSONResponse:
    result = await run_crawl_job(body)
    return JSONResponse(content=result.model_dump(mode="json", exclude_none=True))


@app.post("/v1/jobs", status_code=202)
async def create_job(
    body: ResearchCrawlRequest,
    _: None = Depends(require_token),
) -> JSONResponse:
    job_id = body.jobId or f"job-{uuid4().hex[:16]}"
    body.jobId = job_id
    created = now_iso()
    snapshot = ResearchJobSnapshot(
        jobId=job_id,
        status="queued",
        createdAt=created,
        updatedAt=created,
        stages=[ResearchJobStage(name="queued", status="succeeded", startedAt=created, finishedAt=created, durationMs=0)],
    )
    async with job_lock:
        if job_id in jobs:
            accepted = ResearchJobAccepted(jobId=job_id, statusUrl=f"/v1/jobs/{job_id}")
            return JSONResponse(content=accepted.model_dump(mode="json"), status_code=200)
        jobs[job_id] = snapshot
    asyncio.create_task(execute_job(job_id, body))
    accepted = ResearchJobAccepted(jobId=job_id, statusUrl=f"/v1/jobs/{job_id}")
    log.info({"event": "crawl_job_queued", "jobId": job_id})
    return JSONResponse(content=accepted.model_dump(mode="json"), status_code=202)


@app.get("/v1/jobs/{job_id}")
async def get_job(job_id: str, _: None = Depends(require_token)) -> JSONResponse:
    async with job_lock:
        snapshot = jobs.get(job_id)
        if snapshot is None:
            raise HTTPException(status_code=404, detail="Job not found.")
        payload = snapshot.model_dump(mode="json", exclude_none=True)
    return JSONResponse(content=payload)
