# Experience Creation Engine — Completion Evidence (partial)

Date: 2026-07-29  
Base commit: `4d9a6f8a51de2bcaba3c62b3e907b72079d313df`  
**Deploy: NOT performed** (explicit gate).

## 1. OSS evaluation matrix

See `docs/architecture/experience-creation-oss-matrix.md`.

| Project | Decision |
|---|---|
| Openverse | **Adopt** |
| MediaPipe Face Detector | **Adopt (isolated worker)** — crop math shipped; WASM bootstrap gated by `ECE_FACE_FOCAL_ENABLED` |
| Crawl4AI | **Defer** — existing Firecrawl/HTML path preferred until benchmark fails |

## 2. Packages / services added

| Item | Notes |
|---|---|
| Openverse HTTPS client | No new npm package — `lib/experience-creation/openverse-provider.ts` |
| MediaPipe | Optional dynamic import; **not** added to `package.json` until worker host is ready |
| Crawl4AI | Not installed |
| Playwright ECE config | `playwright.ece.config.ts` + `tests/ece-visual/` |

## 3. Licenses

- Openverse API client usage: public API; media under CC/PD as labeled (verify per asset)
- MediaPipe: Apache-2.0 (when installed)
- Crawl4AI: Apache-2.0 + attribution (deferred)

## 4. Existing capabilities reused

- EA AI gateway (`lib/ai/gateway.ts`)
- Firecrawl / scrapeUrl
- Anthropic vision (`lib/screenshot-vision.ts`)
- Factory ProjectContext outputs
- Playwright (expanded, not replaced)
- Puck as representation only

## 5. Rejected tools

GrapesJS, Webflow, Plasmic, Dify, OpenUI, Cloudinary, imgproxy, second visual-regression service, OpenHands (deferred), Crawl4AI (deferred this sprint).

## 6–8. Smoke evidence

Run locally:

```bash
npm run test:ece-openverse-smoke
npm run test:ece-face-focal
npm run test:ece-crawl4ai-gate
npm run test:experience-creation-engine
```

- Openverse: thematic search + license/attribution + `canPublish` false until approved
- MediaPipe: fixture crop hints for portrait/group/none/event; live WASM pending env
- Crawl4AI: defer decision documented in matrix + benchmark script

## 9–11. Multimodal critic / screenshots / acceptance

- Multimodal critic: `lib/experience-creation/multimodal-critic.ts` (requires Anthropic + Playwright screenshots)
- Heuristic-only **cannot certify GO**
- Human acceptance: `/admin/ea-factory/experience-acceptance`
- Viewport projects: 390×844, 768×1024, 1440×900, 1920×1080

## 12. Security

- No secrets in readiness UI (env var *names* only)
- Openverse licenses never auto-approved for publish
- Face analysis: no identity recognition / no sensitive attribute inference
- MediaPipe not loaded on page-render path

## 13. Operational cost

Openverse free (rate limits); Anthropic vision tokens per viewport sample; MediaPipe worker CPU when enabled; Crawl4AI $0 (deferred).

## 14. Files changed (this sprint slice)

- `lib/experience-creation/*` (providers, readiness, multimodal critic, media/content/manifests/engine)
- `docs/architecture/experience-creation-oss-matrix.md`
- `app/admin/ea-factory/experience-acceptance/*`
- `app/api/admin/factory/experience-acceptance/route.ts`
- `scripts/ece-*.ts`, `playwright.ece.config.ts`, `tests/ece-visual/*`
- `package.json` scripts

## 15. Tests

- `npm run test:experience-creation-engine` — fixture + BLOCKED_PROVIDER without key + distinct compositions
- Openverse / face-focal smokes

## 16. Final verdict

**NO-GO for deploy.** Foundation + OSS gates + fake-success block are in place, but three-subject production-equivalent acceptance (9+9 previews, 72 viewports, multimodal critic pass, human approval of all 18) is **not yet certified**. Do not deploy until that run completes with real providers.
