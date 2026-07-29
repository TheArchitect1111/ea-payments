# Experience Creation Engine — OSS Decision Matrix

Evidence-backed evaluation for Openverse, MediaPipe Face Detector, and Crawl4AI.
Evaluated against `ea-payments` as of 2026-07-29 (post `4d9a6f8a5`).

## Summary decisions

| Project | Decision | Reason |
|---|---|---|
| **Openverse API** | **Adopt** | Fills licensed media discovery gap; HTTP API; no new hosting; MIT API client terms; supplements first-party media |
| **MediaPipe Face Detector** (`@mediapipe/tasks-vision`) | **Adopt (isolated worker)** | Fills face/focal crop gap; Apache-2.0; WASM too heavy for latency-sensitive page renders — run offline in ECE media worker |
| **Crawl4AI** | **Defer** | Existing OpenAI web search + Firecrawl optional + native website crawl already cover research; Crawl4AI needs Python/Playwright sidecar (high ops); attribution obligation; Firecrawl already optional |

Rejected this sprint (per prompt): GrapesJS, Webflow, Plasmic, Dify, OpenUI, Cloudinary, imgproxy, second visual-regression service, OpenHands as mandatory dependency.

---

## Row 1 — Openverse

| Field | Finding |
|---|---|
| Project | Openverse |
| Repository | https://github.com/WordPress/openverse · API https://api.openverse.org |
| License | Media: CC / public domain as labeled per work · API docs / `@openverse/api-client`: MIT |
| Commercial use | Allowed for works under their stated licenses; **must verify license at source** (Openverse disclaimer: metadata not infallible) |
| Maintenance | Actively maintained WordPress.org project; API live; docs current 2025–2026 |
| Function | Search openly licensed images/audio with license, attribution, creator, foreign_landing_url, dimensions |
| EA overlap | Partial: Creative Studio media URLs, CTP asset store, Unsplash story images — **no open-license discovery** |
| EA gap | Licensed supplementary media for `media_brand_pack` with attribution |
| Integration point | `lib/experience-creation/openverse-provider.ts` → `buildMediaBrandPack` / `media_brand_pack` |
| Infrastructure | HTTPS to `api.openverse.org`; optional register for higher rate limits; durable cache in ProjectContext outputs |
| Security | Public search only; SSRF N/A (outbound to Openverse); do not trust license blindly |
| Cost | Free API; rate limits apply |
| Decision | **Adopt** |

## Row 2 — MediaPipe Face Detector

| Field | Finding |
|---|---|
| Project | MediaPipe Face Detector (Google AI Edge) |
| Repository | https://github.com/google-ai-edge/mediapipe · npm `@mediapipe/tasks-vision` |
| License | Apache-2.0 |
| Commercial use | Permitted under Apache-2.0 |
| Maintenance | Actively published on npm (tasks-vision updates through 2026) |
| Function | Detect faces, bounding boxes; derive safe focal regions / object-position |
| EA overlap | Claude vision describes screenshots — **does not return crop geometry** |
| EA gap | Face-aware hero/card/banner crops for `experience_manifest` |
| Integration point | `lib/experience-creation/face-focal.ts` (worker) → `media_brand_pack.assets[].focal` → Puck `object-position` |
| Infrastructure | WASM + model fetch; **not** in page render path; background ECE media analysis |
| Security | No identity recognition; process image bytes only; no biometric classification |
| Cost | Free OSS; CDN/model bandwidth |
| Decision | **Adopt (isolated worker)** — if runtime incompatible, status `BLOCKED_PROVIDER` / `pending`, never invent faces |

## Row 3 — Crawl4AI

| Field | Finding |
|---|---|
| Project | Crawl4AI |
| Repository | https://github.com/unclecode/crawl4ai |
| License | Apache-2.0 **with mandatory attribution** (NOTICE / About credit) |
| Commercial use | Allowed with attribution |
| Maintenance | Active (v0.9.2 Jul 2026); large community |
| Function | LLM-friendly crawl, JS rendering, markdown extraction |
| EA overlap | `lib/firecrawl.ts`, `website-provider` native crawl, prospect `fetchPublicPage`, OpenAI web_search |
| EA gap | Heavier JS sites / multi-page depth — **not proven failing for UXG subjects yet** |
| Integration point | Would be `Crawl4AIResearchProvider` behind `research-adapter.ts` |
| Infrastructure | Python ≥3.10 + Playwright Docker/sidecar — **new runtime on Vercel path** |
| Security | SSRF controls required; private-network block |
| Cost | Hosting + Playwright CPU; attribution ops |
| Decision | **Defer** until benchmark shows EA scraper materially fails static/JS biography pages for acceptance subjects |

## Existing capabilities reused

- OpenAI gateway (`runAIGateway`) + `FACTORY_RESEARCH_MODEL` / web_search
- Firecrawl optional (`FIRECRAWL_API_KEY`) + HTML fallback
- Anthropic vision (`describeScreenshotBase64`) for multimodal critic
- CTP / Creative Studio media persistence patterns
- Playwright smoke config (`playwright.smoke.config.ts`)
- Puck as representation only

## Operational cost (this sprint)

| Item | Cost |
|---|---|
| Openverse | API calls + cache rows |
| MediaPipe | Worker CPU + model download; optional env gate |
| Crawl4AI | $0 (deferred) |
| Multimodal critic | Anthropic vision tokens per viewport |
| Playwright captures | CI/local Chrome time |
