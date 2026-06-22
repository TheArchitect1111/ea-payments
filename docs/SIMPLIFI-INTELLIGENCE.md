# Simplifi Intelligence™ — Decision + Build (v0)

**Shipped in capture pipeline.** Every new capture runs:

```
Magnifi™ → Decision Intelligence™ → Build Intelligence™ → Implementation Blueprint™
```

## API

`GET /api/portal/captures/[id]/intelligence` — requires portal session.

Returns:

- `intelligence.decision` — recommended path (build / buy / overlay / extend / partner / leave-alone), confidence, risks, possibilities
- `intelligence.build` — repo matches, component stack, overlay confidence, Cursor prompt

## Code

| Module | Role |
|--------|------|
| `lib/decision-intelligence.ts` | Path recommendation |
| `lib/build-intelligence.ts` | Implementation blueprint + Cursor prompt |
| `lib/intelligence-bundle.ts` | Orchestrator |
| `lib/repository-library.ts` | EA repo reuse seed data |
| `lib/capture-pipeline.ts` | Embeds bundle in opportunity JSON |

## Supabase

Draft migration: `supabase/migrations/001_simplifi_objects.sql`

Set `intelligence_json` when migrating off Airtable.

## Prompts (operating system)

- `ea-operating-system/Prompt Library/Simplifi Decision Intelligence Platform - MASTER CURSOR DIRECTIVE.md`
- `ea-operating-system/Prompt Library/Simplifi Build Intelligence - MASTER CURSOR DIRECTIVE.md`

## Re-analyze

Captures before this ship lack `intelligence` in embedded JSON. Run a fresh capture to test.
