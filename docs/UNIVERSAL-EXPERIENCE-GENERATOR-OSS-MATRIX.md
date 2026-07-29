# Universal Experience Generator — Open-Source Research Matrix (Phase 2)

Assessments for integrating external capabilities into `ea-payments` without replacing the EA chassis.

| Repository | License | Maintenance | Capability | EA overlap | Value | Integration | Hosting | Mobile | Security | Cost | Verdict |
|------------|---------|-------------|------------|------------|-------|-------------|---------|--------|----------|------|---------|
| [Firecrawl](https://github.com/firecrawl/firecrawl) | Core **AGPL-3.0**; npm SDK **MIT** | Very active (2026) | Crawl → markdown/structured web context | `factory-org-research`, intake | Stronger site extraction | Optional provider behind research capability | Cloud API preferred (avoids AGPL self-host) | Indirect (better research) | Scraped PII; store provenance only | API usage fees | **Adapt** (hosted API only; do not self-host AGPL into chassis) |
| [Crawl4AI](https://github.com/unclecode/crawl4ai) | Apache-2.0 | Active | LLM-friendly crawl | Same | Similar to Firecrawl, friendlier license for self-host | Optional Python sidecar — operational weight high | Self-host / Docker | Indirect | Same scrape risks | Infra + ops | **Defer** (ops weight) |
| [Playwright](https://github.com/microsoft/playwright) | Apache-2.0 | Mature | Browser automation, screenshots, visual checks | Existing smoke / verify scripts | Viewport visual QA (Phase 10) | `scripts/` + CI | Local/CI | Helps phone QA via device emulation | Low if internal | Low | **Adopt** (already in ecosystem patterns) |
| [Puck](https://github.com/measuredco/puck) | MIT | Active | Visual page editing | Experience Builder / Puck data already in EA | Already chosen path | Keep as draft editor | In-app | Admin editing on tablet OK | Standard | Low | **Adopt** (already) |
| GrapesJS | BSD-3 | Mature | Visual builder | Conflicts with Puck/Experience Builder | Duplicate editor surface | — | — | — | — | — | **Reject** (second editor SoT) |
| MediaPipe / face detection | Apache-2.0 | Mature | Face / landmarks for crop safety | Missing media intelligence | Focal-point for heroes | Optional media pipeline service | WASM/client or worker | Helps image safety | Biometric sensitivity — faces only, no identity DB | Low | **Adapt** later for media phase |
| Thumbor / imgproxy | Apache / MIT | Mature | Smart crop + derivatives | Next/Image + Blob | Safer responsive crops | Edge image service | Self-host | Improves mobile images | URL signing required | Infra | **Defer** until media phase |
| OpenHands / Suna / Browser Use | Mixed | Fast-moving | Autonomous agents | Factory orchestrator + workers | Risk of parallel agent runtime | — | Heavy | Phone ops worse | High (tool execution) | High | **Reject** as core (too much parallel platform); **defer** for research spikes only |
| Graphify / knowledge-graph libs | Mixed | Varies | Provenance graphs | Pulse / knowledge-graph stubs | Citation graph | Later research phase | — | — | — | — | **Defer** |
| OpenUI | Mixed | Early | Generative UI | Layout Composer / Theme Engine | Generic templates risk | — | — | — | — | — | **Reject** (template drift vs EA composition systems) |

## Integration gate summary

- **No new core platform.**
- Prefer **hosted APIs** or **Apache/MIT** libraries over AGPL self-host inside the Next app.
- Do not add dependencies that force generic template output or a second page editor.
- Experience Director v1 stays the publish gate — do not replace with an external agent.

## Immediate adopt/adapt for this sprint

| Decision | Item | Why |
|----------|------|-----|
| Adopt | Existing Factory + Playwright patterns | Already present |
| Adapt | Universal Quick Launch → `POST /api/launch` | Removes Amanda-only hard-coding without new deps |
| Defer | Firecrawl hosted API | Needs credential + budget approval |
| Reject | GrapesJS, OpenUI, OpenHands-as-runtime | Chassis duplication / template risk |
