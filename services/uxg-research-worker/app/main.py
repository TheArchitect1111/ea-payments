"""Authenticated UXG research worker API — no public crawl without bearer token."""
from __future__ import annotations

import logging
import os
import sys

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse

from .crawl_job import run_crawl_job
from .models import ResearchCrawlRequest

logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(message)s",
)
log = logging.getLogger("uxg-research-worker")

app = FastAPI(title="EA UXG Research Worker", version="0.1.0", docs_url=None, redoc_url=None)


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
