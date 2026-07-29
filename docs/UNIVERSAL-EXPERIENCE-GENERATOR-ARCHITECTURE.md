# Universal Experience Generator — Architecture (this sprint)

## Flow

```text
Admin phone/laptop
  → /admin/ea-factory/quick-launch  (Universal Quick Launch)
  → POST /api/launch  (multipart: name, detail, url, deliverable, files)
  → duplicate check (24h same client)
  → createFactoryProject + ProjectContext
  → launchFactoryProjectFlow / orchestrator
       intake → research → discovery → planning → production
  → project status (FactoryLiveStatus)
  → /admin/ea-factory/concepts/[projectId]  (select concept)
  → publish-selected-concept / Experience Director gate
  → /sites/[slug] + /portal/[slug]
```

## Principles

- Extend Factory + chassis; do not create a parallel platform.
- Amanda preset remains a **legacy** activate path only.
- Experience Director v1 stays the publishing gate (frozen).
- Provenance via append-only ProjectContext artifacts.
- No invented biographical facts — research capabilities record sources; confidence hard-stop is a follow-on.

## What this sprint ships

1. Universal Quick Launch UI (mobile-first, draft restore, uploads, output selector)
2. Structured launch body parsing + multi-file attachments
3. Duplicate launch prevention
4. Inventory + OSS matrix docs
5. Contract tests for three non-Amanda subjects

## What remains (blockers)

| Item | Owner | Action |
|------|-------|--------|
| Live admin E2E for 3 subjects | Admin + eng | Log in, launch three names, approve concepts, wire |
| Firecrawl (or equivalent) hosted key | Platform | Optional research upgrade |
| Media focal/license pipeline | Eng | Phase 5 follow-on |
| Auto concept generation after BUILDING | Eng | Queue hook after production |
| Production deploy of this branch | DevOps | Push + Vercel |
