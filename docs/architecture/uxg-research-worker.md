# UXG Research Worker (Crawl4AI sidecar)

## Purpose

Deep crawl + brand/media extraction for the Universal Experience Generator. Runs **outside** the Next.js/Vercel bundle.

## Hosting requirement (Preview only)

| Environment | Target |
|-------------|--------|
| Local verify | Docker Compose on `127.0.0.1:8080` |
| Preview remote | **Fly.io private app** (no public unauthenticated crawl) |
| Production | **Do not enable** until host + secrets verified |

Do not deploy this worker until `UXG_RESEARCH_WORKER_TOKEN` and network policy are confirmed.

## Environment variables (names only)

- `UXG_RESEARCH_WORKER_TOKEN`
- `UXG_RESEARCH_MAX_PAGES`
- `UXG_RESEARCH_MAX_DEPTH`
- `UXG_RESEARCH_JOB_TIMEOUT_SEC`
- Next.js: `UXG_RESEARCH_PROVIDER`, `UXG_RESEARCH_WORKER_URL`, `UXG_RESEARCH_WORKER_TOKEN`, `UXG_RESEARCH_JOB_TIMEOUT_MS`

## Local run

```bash
cd services/uxg-research-worker
export UXG_RESEARCH_WORKER_TOKEN=dev-only-local-token
docker compose up --build
curl -s http://127.0.0.1:8080/health
```

## Security

- `/health` is public (liveness only).
- `/v1/crawl` requires `Authorization: Bearer <token>`.
- Respects robots.txt; domain allow/block; page + timeout limits.
