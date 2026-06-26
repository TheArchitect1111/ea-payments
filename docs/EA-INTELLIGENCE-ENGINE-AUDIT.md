# EA Intelligence Engine Audit

Date: June 25, 2026

## Current Architecture Summary

The repo already contains many intelligence pieces, but they are distributed by product instead of governed by one shared engine.

- AI calls: `lib/ai.ts` calls Anthropic directly for content enhancement and enhancement assessment; `lib/ea-voice.ts` enhances admin voice intent; other engines use deterministic scoring/generation.
- Capture logic: `lib/capture-pipeline.ts`, `lib/capture-submit.ts`, `app/api/capture/ingest/route.ts`, and `app/api/portal/captures/analyze/route.ts` handle URLs, uploads, screenshots, async placeholders, and capture records.
- Upload logic: capture upload parsing exists in portal capture routes and client preparation exists in `lib/client-image-upload.ts`.
- Content generation: `lib/blueprint-generator.ts`, `lib/opportunity-experience.ts`, `lib/landing-experience.ts`, `lib/story-engine.ts`, `lib/eacp-launch.ts`, and `lib/skin-factory.ts`.
- Workflows: EACP launch lifecycle, capture pipeline, Connect submission routing, Stripe/webhook flows, password resets, Pulse events, and portal content requests.
- Notifications: `lib/email.ts`, `lib/notify-dispatch.ts`, password reset helpers, Connect automation, capture notifications, and Pulse events.
- Dashboards: admin dashboard, EA Factory, Launch Command Center, Connect admin, Knowledge Graph, Simplifi workspace, portal Pulse.
- Portals: client portal routes under `app/portal/[slug]`, Simplifi portal workspace, Connect profiles, partner portal.
- Duplicated logic: recommendation wording, opportunity detection, upload parsing, AI provider calls, notification triggers, activity emission, and “why this matters” explanations are repeated in product-specific modules.

## Target Architecture Summary

The target is one shared EA Intelligence Engine with product-specific experiences calling the same workflow contract:

Trigger -> Capture -> Understand -> Recommend -> Generate -> Publish -> Notify -> Measure -> Improve

The first shared spine now lives in `lib/ea-intelligence.ts`. It provides:

- normalized capture input types
- understanding extraction
- explainable recommendations with confidence
- Training Transformation output generation
- New Experience planning
- Pulse activity emission

This is intentionally service-first. Products should call engine services or API routes instead of duplicating AI/capture/recommendation logic inside product pages.

## Reusable Service Map

| Shared service | Current source | Target owner |
| --- | --- | --- |
| Capture Service | `capture-pipeline`, capture routes, Connect submit, Discover intake | `lib/ea-intelligence.ts` plus adapters for existing capture pipeline |
| Understanding Service | `resource-radar`, `simplifi-business-analysis`, `intelligence-bundle`, `knowledge-graph` | shared understanding service |
| Knowledge Service | `knowledge-graph`, Airtable record modules, EACP store | shared memory/relationship layer |
| Recommendation Service | `recommendation-engine`, `opportunity-engine`, `guidance-triple`, `discovery-engine` | shared recommendation contract |
| Generation Service | blueprint, landing, opportunity, EACP, skin, content enhance | shared generation adapters |
| Workflow Service | EACP lifecycle, capture async, Connect automation | shared workflow runner |
| Notification Service | `email`, `notify-dispatch`, password reset helpers, Pulse | shared notification adapter |
| Publishing Service | portal pages, Pulse, Connect, landing, email, PDF exports | shared publish targets |
| Analytics Service | Pulse bus, launch command center, portal Pulse | shared analytics event contract |

## First Implementation

Added:

- `lib/ea-intelligence.ts`
- `app/api/intelligence/training-transformation/route.ts`
- `app/api/intelligence/new-experience/route.ts`
- `app/admin/ea-factory/new-experience/page.tsx`
- `app/admin/ea-factory/new-experience/NewExperienceClient.tsx`
- EA Factory link to `/admin/ea-factory/new-experience`

The Training Transformation MVP now supports:

- Upload or text input through API
- Analyze through the shared engine
- Recommend next experience with reason and confidence
- Generate lesson, quiz, checklist, knowledge base article, and manager summary
- Publish target recommendations
- Pulse activity record

## Open-Source Research

| Repo/tool | Purpose | License | Maintenance status | Fit for EA | Recommendation | Integration notes |
| --- | --- | --- | --- | --- | --- | --- |
| LangChain.js | LLM app framework, model abstraction, tools, vector stores, agents | MIT | Active; GitHub shows 17.9k stars and recent releases | Good for model/provider abstraction if EA outgrows direct provider calls | Use selectively | Wrap behind EA provider interface; do not let chains leak into product code |
| LlamaIndexTS | TypeScript data framework for LLM/RAG apps | MIT | Active; GitHub shows 3.1k stars and many releases | Good candidate for future document/RAG layer | Evaluate next | Useful when Knowledge Service needs retrieval over documents |
| Unstructured | Document-to-structured-data ETL for PDFs, Office docs, complex files | Apache-2.0 style open-source project | Active and mature | Strong fit for Capture Service document parsing | Use or hosted equivalent | Integrate behind file ingestion adapter; avoid building parsers from scratch |
| Novu | Multi-channel notification infrastructure and inbox | MIT core, enterprise folders separate | Active; broad product and agent communication scope | Strong fit for Notification Service | Evaluate before expanding SMS/in-app | Could replace scattered notification helpers over time |
| Inngest | Durable step functions and AI workflows | SDKs Apache-2.0; server has SSPL/DOSP terms | Active; good TypeScript/Next ergonomics | Good workflow fit, license needs review for self-host server | Use SDK cautiously or hosted | Good for long-running upload/analyze/generate/publish workflows |
| n8n | Visual workflow automation with many integrations | Fair-code/Sustainable Use license | Active and broad | Useful for internal ops, weaker as embedded app dependency | Reject for core engine | Too heavy/licensing not ideal for EA product core |
| Moodle | Open-source LMS | GPL | Mature | Strong LMS but heavy and not Next-native | Reject for MVP | Better to generate lightweight training artifacts first |

Primary references reviewed:

- https://github.com/langchain-ai/langchainjs
- https://github.com/run-llama/LlamaIndexTS
- https://github.com/Unstructured-IO/unstructured
- https://github.com/novuhq/novu
- https://github.com/inngest/inngest
- https://github.com/n8n-io/n8n
- https://github.com/moodle/moodle

## Refactor Plan

1. Keep `lib/ea-intelligence.ts` as the contract boundary.
2. Move direct Anthropic calls from `lib/ai.ts` behind an `AIProvider` adapter.
3. Refactor capture routes to emit normalized `EACaptureInput` before product-specific processing.
4. Move recommendation shapes toward one `EARecommendation` contract with `recommendation`, `reason`, `confidence`, and `suggestedAction`.
5. Add adapters from existing generators into a shared Generation Service.
6. Move Pulse events into every shared workflow stage.
7. Add a persistent Organization Memory model after the MVP flow is stable.

## Build Order

1. Stabilize Training Transformation MVP around `runTrainingTransformationWorkflow`.
2. Add real document text extraction for PDF, Word, PowerPoint, and video transcript inputs.
3. Persist generated outputs and review status.
4. Add publish actions into Training Hub, Client Portal, and Pulse.
5. Refactor existing capture endpoints to call the shared engine.
6. Add provider abstraction for AI calls.
7. Add Knowledge Service persistence and relationship graph updates.
8. Add continuous improvement signals from Pulse.
9. Expand New Experience flow to generate first versions after user approval.

## Risks

- The Vercel project was previously configured as a static project; deploy settings must continue forcing Next output until project settings are corrected.
- Current file upload MVP records file metadata and notes but does not parse full document contents yet.
- Direct AI calls still exist in `lib/ai.ts` and `lib/ea-voice.ts`; they need provider consolidation.
- Airtable-backed records are spread across many modules, so memory/relationship consolidation needs careful migration.
- Notification expansion should avoid adding SMS/inbox infrastructure before the shared contract is stable.

## Estimated Effort

- Shared contract and MVP spine: done.
- Training Transformation end-to-end with real document extraction and persistence: 2-4 focused days.
- Refactor existing capture and recommendation routes to shared services: 3-5 days.
- Publish targets into Training Hub/Portal/Pulse: 2-4 days.
- Organization Memory and Knowledge Service persistence: 1-2 weeks.
- Notification service consolidation: 3-5 days after workflow contracts settle.
- Full platform migration away from duplicated product logic: 2-4 weeks depending on how much legacy behavior must be preserved.

## Decision

Build one intelligence engine. Products are experiences and adapters. The engine owns the shared thinking path.
