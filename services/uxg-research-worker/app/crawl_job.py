"""Crawl job orchestration with Crawl4AI + domain controls."""
from __future__ import annotations

import asyncio
import hashlib
import logging
import os
import time
from datetime import datetime, timezone
from typing import Iterable
from urllib.parse import urlparse
from urllib import robotparser

from .extract import extract_from_html
from .models import (
    BrandAsset,
    ResearchCrawlRequest,
    ResearchCrawlResult,
    ResearchCrawlJobMeta,
    ResearchDiagnostics,
    ResearchIdentity,
    ResearchOrganization,
    MediaAssetCrawl,
    DocumentAsset,
    ResearchEvidence,
)

log = logging.getLogger("uxg-research-worker")

DEFAULT_BLOCK = {
    "bit.ly",
    "t.co",
    "goo.gl",
    "doubleclick.net",
    "googletagmanager.com",
    "google-analytics.com",
    "facebook.com",
    "instagram.com",
    "tiktok.com",
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _host(url: str) -> str | None:
    try:
        return urlparse(url).hostname.replace("www.", "").lower() if urlparse(url).hostname else None
    except Exception:
        return None


def _subject_hash(name: str) -> str:
    return hashlib.sha256(name.lower().encode()).hexdigest()[:12]


def _allowed(url: str, allow: set[str], block: set[str]) -> bool:
    host = _host(url)
    if not host:
        return False
    if any(host == b or host.endswith("." + b) for b in block):
        return False
    if not allow:
        return True
    return any(host == a or host.endswith("." + a) for a in allow)


def _robots_allowed(url: str, cache: dict[str, robotparser.RobotFileParser]) -> bool:
    parsed = urlparse(url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    if base not in cache:
        rp = robotparser.RobotFileParser()
        rp.set_url(f"{base}/robots.txt")
        try:
            rp.read()
        except Exception:
            # Fail open for fetch attempt; Crawl4AI may still fail.
            cache[base] = rp
            return True
        cache[base] = rp
    return cache[base].can_fetch("EA-UXGResearchBot/0.1", url)


async def _crawl_page(url: str) -> tuple[str, str, str]:
    """Return title, html, markdown using Crawl4AI when available."""
    try:
        from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig

        browser_config = BrowserConfig(headless=True, verbose=False)
        run_config = CrawlerRunConfig(
            word_count_threshold=10,
            exclude_external_links=True,
            process_iframes=False,
        )
        async with AsyncWebCrawler(config=browser_config) as crawler:
            result = await crawler.arun(url=url, config=run_config)
            html = result.html or result.cleaned_html or ""
            md = result.markdown or ""
            title = ""
            if result.metadata and isinstance(result.metadata, dict):
                title = str(result.metadata.get("title") or "")
            return title, html, md
    except Exception as primary:
        # Fallback: httpx fetch for CI/local without full browser
        import httpx

        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=30.0,
            headers={"User-Agent": "EA-UXGResearchBot/0.1"},
        ) as client:
            res = await client.get(url)
            res.raise_for_status()
            html = res.text
            return "", html, ""


def _guess_entity_type(subject: str, text_blob: str) -> str:
    s = subject.lower()
    blob = text_blob.lower()
    if any(k in s for k in ("inc", "llc", "botanical", "circle", "foundation", "church")):
        return "organization"
    if "nonprofit" in blob or "501" in blob or "donate" in blob:
        return "organization"
    if any(k in s for k in ("shop", "store", "product")):
        return "product"
    # Person heuristic: two+ tokens without org suffix
    if len(s.split()) >= 2 and not any(k in s for k in ("botanical", "circle", "architect")):
        return "person"
    return "unknown"


async def run_crawl_job(req: ResearchCrawlRequest) -> ResearchCrawlResult:
    started = time.time()
    started_at = _now()
    job_id = req.jobId or f"job-{int(started * 1000)}"
    max_pages = min(int(os.getenv("UXG_RESEARCH_MAX_PAGES", req.maxPages)), 25)
    max_pages = min(max_pages, req.maxPages)
    timeout_sec = float(os.getenv("UXG_RESEARCH_JOB_TIMEOUT_SEC", "120"))

    allow = set(d.lower().lstrip(".") for d in (req.allowDomains or []))
    block = set(DEFAULT_BLOCK) | set(d.lower().lstrip(".") for d in (req.blockDomains or []))

    seeds: list[str] = []
    seen: set[str] = set()
    for u in list(req.knownUrls) + list(req.candidateUrls):
        key = u.split("?")[0].lower()
        if key in seen:
            continue
        if not _allowed(u, allow, block) and allow:
            # If allowlist set, skip non-allow; if known URL hosts not in allow, add host
            host = _host(u)
            if host and not allow:
                pass
            elif host and host not in allow and not any(host.endswith("." + a) for a in allow):
                # Still allow knownUrls even if discovery miss
                if u in req.knownUrls:
                    allow.add(host)
                else:
                    continue
        seen.add(key)
        seeds.append(u)
        if len(seeds) >= max_pages:
            break

    # If no allow domains yet, derive from first seeds
    if not allow:
        for u in seeds:
            h = _host(u)
            if h:
                allow.add(h)

    log.info(
        {"event": "crawl_start", "jobId": job_id, "subjectHash": _subject_hash(req.subjectName), "seeds": len(seeds)}
    )

    brand_assets: list[BrandAsset] = []
    media_assets: list[MediaAssetCrawl] = []
    documents: list[DocumentAsset] = []
    evidence: list[ResearchEvidence] = []
    org_acc = ResearchOrganization()
    errors: list[dict] = []
    pages_fetched = 0
    retries = 0
    robots_cache: dict = {}
    text_blob_parts: list[str] = []

    async def fetch_one(url: str) -> None:
        nonlocal pages_fetched, retries
        if not _robots_allowed(url, robots_cache):
            errors.append({"url": url, "code": "robots_disallow", "message": "robots.txt disallows"})
            return
        last_err = None
        # Give Playwright + httpx fallback enough time per seed (job budget still enforced).
        page_timeout = max(45.0, min(90.0, timeout_sec / max(1, min(max_pages, 4))))
        for attempt in range(2):
            try:
                title, html, md = await asyncio.wait_for(_crawl_page(url), timeout=page_timeout)
                pages_fetched += 1
                extracted = extract_from_html(
                    html=html or md,
                    page_url=url,
                    retrieved_at=_now(),
                    subject_name=req.subjectName,
                )
                text_blob_parts.append(extracted.get("title") or "")
                text_blob_parts.append(md[:2000] if md else "")
                brand_assets.extend(extracted["brand"])
                media_assets.extend(extracted["media"])
                documents.extend(extracted["documents"])
                evidence.extend(extracted["evidence"])
                o = extracted["organization"]
                if o.mission and not org_acc.mission:
                    org_acc.mission = o.mission
                org_acc.services = list(dict.fromkeys(org_acc.services + o.services))[:12]
                org_acc.audiences = list(dict.fromkeys(org_acc.audiences + o.audiences))[:12]
                org_acc.history = list(dict.fromkeys(org_acc.history + o.history))[:12]
                org_acc.locations = list(dict.fromkeys(org_acc.locations + o.locations))[:12]
                org_acc.leadership = list(dict.fromkeys(org_acc.leadership + o.leadership))[:12]
                org_acc.contactPaths = list(dict.fromkeys(org_acc.contactPaths + o.contactPaths))[:12]
                org_acc.callsToAction = list(dict.fromkeys(org_acc.callsToAction + o.callsToAction))[:12]
                if attempt > 0:
                    retries += 1
                return
            except Exception as err:
                last_err = err
                retries += 1
                await asyncio.sleep(0.4)
        if isinstance(last_err, asyncio.TimeoutError):
            err_msg = f"page_timeout after {page_timeout:.0f}s"
        else:
            err_msg = str(last_err) if last_err else "fetch failed"
            if not err_msg.strip():
                err_msg = type(last_err).__name__ if last_err else "fetch failed"
        err_low = err_msg.lower()
        # Never bypass TLS — surface certificate failures explicitly.
        code = (
            "SOURCE_TLS_ERROR"
            if any(
                t in err_low
                for t in (
                    "certificate",
                    "ssl",
                    "tls",
                    "certifi",
                    "certificate_verify_failed",
                )
            )
            else "fetch_failed"
        )
        errors.append(
            {
                "url": url,
                "code": code,
                "message": err_msg[:500],
            }
        )

    try:
        await asyncio.wait_for(
            asyncio.gather(*(fetch_one(u) for u in seeds)),
            timeout=timeout_sec,
        )
    except asyncio.TimeoutError:
        errors.append({"code": "job_timeout", "message": f"exceeded {timeout_sec}s"})

    # Mark brand color consistency
    color_counts: dict[str, int] = {}
    for b in brand_assets:
        if b.kind == "color":
            color_counts[b.value.lower()] = color_counts.get(b.value.lower(), 0) + 1
    for b in brand_assets:
        if b.kind == "color" and color_counts.get(b.value.lower(), 0) >= 2:
            b.consistentAcrossSources = True
            b.confidence = max(b.confidence, 0.75)

    # Deduplicate media by perceptual hash / URL
    seen_media: set[str] = set()
    deduped_media: list[MediaAssetCrawl] = []
    for m in media_assets:
        key = m.perceptualHash or m.originalUrl.split("?")[0].lower()
        if key in seen_media:
            continue
        seen_media.add(key)
        deduped_media.append(m)

    blob = " ".join(text_blob_parts)
    entity = _guess_entity_type(req.subjectName, blob)
    official = sorted(allow)[:5]
    finished_at = _now()
    status = "succeeded" if pages_fetched > 0 and not errors else (
        "partial" if pages_fetched > 0 else "failed"
    )
    if pages_fetched > 0 and errors:
        status = "partial"

    result = ResearchCrawlResult(
        schemaVersion=1,
        identity=ResearchIdentity(
            canonicalName=req.subjectName,
            entityType=entity,  # type: ignore[arg-type]
            geography=[],
            officialDomains=official,
            socialProfiles=[],
        ),
        evidence=evidence[:40],
        organization=org_acc,
        brandAssets=brand_assets[:80],
        mediaAssets=deduped_media[:60],
        documents=documents[:20],
        diagnostics=ResearchDiagnostics(
            pagesFetched=pages_fetched,
            pagesFailed=len([e for e in errors if e.get("code") in ("fetch_failed", "SOURCE_TLS_ERROR")]),
            retries=retries,
            durationMs=(time.time() - started) * 1000,
            errors=errors[:30],
            provider="crawl4ai",
            workerVersion="0.1.0",
        ),
        job=ResearchCrawlJobMeta(
            jobId=job_id,
            status=status,  # type: ignore[arg-type]
            startedAt=started_at,
            finishedAt=finished_at,
            attempt=1,
        ),
    )
    log.info(
        {
            "event": "crawl_done",
            "jobId": job_id,
            "subjectHash": _subject_hash(req.subjectName),
            "pagesFetched": pages_fetched,
            "status": status,
            "durationMs": result.diagnostics.durationMs,
        }
    )
    return result
