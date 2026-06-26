# Research Agent

The Research Agent is the first production EA agent.

## Endpoint

`POST /api/agents/research`

The Orb should normally call `/api/orchestrator`, not this route. The direct route exists for independent operational testing.

## Responsibilities

- Business research
- Organization research
- Industry research
- Grant research
- Competitor analysis
- Prospect intelligence
- Website analysis
- Market summaries
- Opportunity identification
- Risk identification
- Executive summaries

## Output Shape

```json
{
  "summary": "string",
  "keyFindings": [{ "title": "string", "detail": "string" }],
  "opportunities": [{ "title": "string", "detail": "string" }],
  "risks": [{ "title": "string", "detail": "string" }],
  "recommendedNextSteps": ["string"],
  "confidence": 0.7,
  "sources": ["string"]
}
```

## Confidence And Sources

The agent must not invent source URLs. When no live source material is provided, it should label sources conservatively and lower confidence. Browser/search tooling can be added later through tool adapters and eventually MCP.

## Future Expansion

The Research Agent is intentionally tool-ready. Additional research tools can be added behind the agent without changing the Orb or Orchestrator contract.
