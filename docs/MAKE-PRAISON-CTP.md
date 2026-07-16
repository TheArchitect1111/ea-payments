# Make.com — PraisonAI CTP Intelligence Package

**Mode:** Enhancement — does not replace onboarding/esign Make scenarios.  
**Trigger:** `praison.package.ready` after workforce QA passes.

## Env var

| Variable | Required | Notes |
|----------|----------|-------|
| `PRAISON_PACKAGE_WEBHOOK_URL` | Optional | Preferred |
| `CTP_INTELLIGENCE_WEBHOOK_URL` | Optional | Fallback alias |

If neither is set, PraisonAI still runs and persists `workforcePackage` — Make simply does not receive the package event.

## Create the scenario

1. Make.com → **Create scenario**
2. Trigger: **Webhooks → Custom webhook** → copy URL → set as `PRAISON_PACKAGE_WEBHOOK_URL` in Vercel Production
3. Suggested modules:

| # | Module | Action |
|---|--------|--------|
| 1 | Webhook | Receive JSON (`event` = `praison.package.ready`) |
| 2 | Filter | `qaPassed` = true |
| 3 | Airtable | Update **CTP Submissions** by `submissionId` (optional enrichment fields) |
| 4 | Optional | Generate proposal doc / Slack Mission Control / email ops |

## Payload shape (from `lib/praison-ai/make-bridge.ts`)

```json
{
  "event": "praison.package.ready",
  "submissionId": "CTP-…",
  "organizationId": "…",
  "businessName": "…",
  "reviewStatus": "awaiting-executive-review",
  "qaPassed": true,
  "executiveHeadline": "…",
  "executiveNarrative": "…",
  "topOpportunities": [],
  "topRisks": [],
  "recommendedActions": [],
  "confidence": 0.87,
  "pulseInsights": [],
  "proposalScope": [],
  "proposalTimeline": "…",
  "proposalPricingNotes": "…",
  "portalModules": [],
  "websiteScore": 72,
  "knowledgeGraphRef": "kg://…",
  "generatedAt": "ISO-8601",
  "packageId": "praison_…"
}
```

## Acceptance

- CTP submit with `OPENAI_API_KEY` → Pulse `praison.package.ready`
- Make scenario receives webhook when URL is set
- `/api/health/launch` → `checks.ctp.praisonPackageWebhook` = true
