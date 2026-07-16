# PraisonAI — EA Intelligence Workforce

**Status:** Architecture integrated July 2026  
**Mode:** Enhancement only — preserves Executive OS, Make.com, Stripe, Airtable, Resend, existing AI Gateway, and client journey.

## Core principle

> **Make.com orchestrates software.**  
> **PraisonAI orchestrates intelligence.**  
> The two systems work together.

```
Client → CTP Assessment → Executive Intelligence Trigger
    → PRAISON AI WORKFORCE
        → Research · Website · Operations · Finance · Marketing
        → Proposal · Portal · Executive Writer · QA · Executive Agent
    → Executive Intelligence Package
    → Make.com (Airtable · Portal · Proposal · Email · Mission Control)
    → Open Design (creative layer — analysis already complete)
```

## What PraisonAI owns

| Agent | Output |
|-------|--------|
| **Executive Agent** | Coordinates workforce, merges findings, final recommendations |
| **Research Agent** | Business intelligence report |
| **Website Auditor** | Website score + UX/story/brand/SEO recommendations |
| **Operations Analyst** | Operational opportunity report |
| **Financial Analyst** | Money & payments assessment |
| **Marketing Analyst** | Marketing opportunity summary |
| **Proposal Architect** | Blueprints, scope, pricing, timeline |
| **Portal Architect** | Portal module recommendations |
| **Executive Writer** | Executive summary, confirmation email, proposal language |
| **QA Agent** | Validates all outputs before release |

## What PraisonAI does NOT replace

- Make.com automation (webhooks fire **after** workforce completes)
- Stripe, Airtable, Resend
- AI Gateway (specialists route through existing gateway when internal mode)
- Open Design (consumes Executive Intelligence Package)
- Portal auth, module registry, Pulse bus

## Modes

| Mode | When | Behavior |
|------|------|----------|
| **Internal workforce** | Default (`OPENAI_API_KEY` set) | EA specialist agents via AI Gateway |
| **External PraisonAI** | `PRAISON_AI_API_URL` set | Delegates to PraisonAI orchestration API |
| **Degraded** | No keys | Falls back to single intake agent (legacy path) |

## Intelligence memory

`lib/praison-ai/knowledge-graph.ts` — Organizational Knowledge Graph per org/submission:

Research, website, portal, finance, marketing, operations, recommendations, client conversations, business profile.

Stored in CTP Payload JSON (`workforcePackage`) + searchable in-memory index for Mission Control.

## Mission Control statuses

Research Complete → Website Review Complete → Proposal Draft Ready → QA Passed → Blueprint Ready → Waiting for Executive Review

## Pulse events

`praison.workforce.started`, `praison.agent.complete`, `praison.qa.passed`, `praison.qa.failed`, `praison.package.ready`

## Extension

New agents register in `lib/praison-ai/workforce-registry.ts` without changing the orchestrator framework.
