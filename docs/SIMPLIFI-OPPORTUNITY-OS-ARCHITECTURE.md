# Simplifi Orb — Personal Opportunity Operating System

**Status:** Architecture decision (v2.0) — implement as one intelligence platform, not separate modules.  
**Date:** 2026-07-22  
**Promise:** *Simplifi Orb remembers what matters, understands how everything connects, recognizes opportunities, and helps people act before they miss them.*  
**Launch impact:** Play release ops are complete enough to resume product engineering. This extends Orb into the durable OS without reopening Experience Director or rewriting the capture → Brief → Orb spine.

---

## 0. Architecture stance (non-negotiable)

1. **One integrated OS** — Memory Events, Timeline, Relationships, Semantic Ask, Opportunity Intelligence, Context Packs, Ambient, Brief 2.0, Sync, and Continuity share one data model and one core library (`lib/simplifi-os/`).
2. **Refactor over rebuild** — keep `runCapturePipeline`, `loadSimplifiWorkspace`, GlobalOrb / Brief, Airtable Capture Records during dual-write.
3. **One Postgres brain** — activate/extend `supabase/migrations/001_simplifi_objects.sql` + pgvector only.
4. **Forbidden:** Neo4j, Apache AGE, new microservice/repo, chat-first Orb home, rewriting working session/auth.
5. **Orb remains the primary UX** — new capability strengthens Capture → Remember → Understand → Connect → Notice → Guide → Predict → Act.
6. **Fallbacks stay forever** — keyword Ask, rule scoring, Airtable reads until Postgres + embeddings are healthy per tenant (`SIMPLIFI_OS_READ`).

### Mission flow (single pipeline)

```text
Capture → Remember (Memory Events)
       → Understand (objects + embeddings)
       → Connect (relationship engine)
       → Notice (ambient + intelligence)
       → Guide (Brief / Orbie)
       → Predict (scores + risks)
       → Act (next best action / reminders / calendar)
```

Every write emits a Memory Event. Every read can reconstruct Timeline + Context Pack.

---

## 1. Current state (audit summary)

| Area | Today | Gap for OS |
|------|--------|------------|
| Capture / objects | Airtable Capture Records via `lib/capture-pipeline.ts`, `lib/simplifi-objects.ts`, `lib/simplifi-core/workspace.ts` | Dual-write to Postgres not activated |
| Brief | `buildDailyBrief` + Action Center (`lib/action-center.ts`, `lib/priority-engine.ts`, `lib/smart-expiration.ts`) | No nightly synthesis / Brief 2.0 sections |
| Ask Orbie | Keyword/intent `lib/simplifi-ask.ts` + guidance system | No embeddings, no `/api/simplifi/ask` semantic path |
| Relationships | Hostname/purpose `lib/relationship-hints.ts`; Connect CRM memory is separate (`lib/connect-relationship-memory.ts`) | No personal typed graph on Postgres |
| EA org graph | `lib/opportunity-graph-data.ts` + chassis (admin/EA scoped) | Not personal Simplifi graph — patterns reusable, not data |
| Pulse | `lib/pulse-bus.ts` → optional Airtable / ActivityEvents | Not immutable personal timeline |
| Schema draft | `supabase/migrations/001_simplifi_objects.sql` (objects, relationships, pulse_events, memory_assets) | Not production-activated; no pgvector |
| Offline | Mobile `mobile/src/offline/*` + web `lib/offline-capture-queue.ts` (FIFO flush only) | No memory/relationship outbox; no conflict model |
| Cron | `vercel.json`: guardian, connect, CTP, factory — **no Simplifi intelligence cron** | Need `/api/cron/simplifi-intelligence` |
| Decision/Build intel | Shipped in capture (`lib/intelligence-bundle.ts`) | Keep; store in `intelligence_json` |
| Smartchitecture | Marketing brand only | Becomes personal graph = objects + relationships + embeddings |
| OS core | `lib/simplifi-os/` scaffolded (flags, memory-events, capture-hook, Supabase REST); dual-write off until env + migrations | Semantic Ask, timeline/context APIs, intelligence cron still to ship |

**Surfaces to extend (not replace):** web `app/simplifi/*`, mobile Expo app, companion extension APIs, portal Simplifi workspace.

**Audit confirmation (2026-07-22):** production path remains Airtable Capture Records + HMAC sessions + Pulse; keyword Ask and rule scoring stay as fallbacks; no Inngest/calendar OAuth/vector deps in `package.json` yet — adopt only when Phase 1 embed/Ask and Phase 3 calendar need them.

---

## 2. Target architecture

```text
Clients: Web PWA · Expo mobile · Browser extension · Future desktop
                │
                ▼
     Next.js API  (/api/simplifi/* · /api/portal/captures/* · /api/cron/simplifi-*)
                │
                ▼
┌──────────────────────────────────────────────────────────────────┐
│  Simplifi OS Core — lib/simplifi-os/                              │
│  memory-events · timeline · objects · relationships · embed      │
│  retrieve (hybrid) · context · intelligence · brief-merge        │
│  sync-journal · scoring · collections                            │
└────────────┬───────────────────────────────┬─────────────────────┘
             │                               │
             ▼                               ▼
   Airtable Capture Records         Supabase Postgres + pgvector
   (OLTP during dual-write)         simplifi_objects
                                    simplifi_relationships
                                    simplifi_memory_events
                                    simplifi_embeddings
                                    simplifi_intelligence_runs
                                    simplifi_sync_outbox (optional)
```

**Capture pipeline remains the primary write path.** After analyze succeeds: upsert object → append memory event → enqueue embed → seed/update relationships. Orb / Brief / Ask read through OS core with Airtable fallback.

---

## 3. Database schema

Ship as migrations on the same Supabase project. Draft `001` stays the base; add `002+`.

### 3.1 Object types (widen check)

`person | organization | project | opportunity | meeting | task | idea | note | photo | document | email | calendar_event | url | website | other`

Map Capture Types into these; media kinds → `photo` / `document`.

### 3.2 Memory Events (promote pulse)

```sql
-- 002_simplifi_memory_events.sql (conceptual)
create extension if not exists "pgcrypto";
create extension if not exists vector;

alter table if exists simplifi_pulse_events rename to simplifi_memory_events;

alter table simplifi_memory_events
  add column if not exists actor_id text,
  add column if not exists actor_type text not null default 'user', -- user|system|ai|device
  add column if not exists client text,          -- web|mobile|extension|system
  add column if not exists object_ids uuid[],
  add column if not exists related_object_ids uuid[],
  add column if not exists correlation_id text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists immutable_hash text;

create index if not exists simplifi_memory_events_object_time_idx
  on simplifi_memory_events (portal_slug, created_at desc);
create index if not exists simplifi_memory_events_type_idx
  on simplifi_memory_events (portal_slug, event_type, created_at desc);

-- App role: INSERT + SELECT only (append-only)
```

**Required event vocabulary (typed union in TS):**

| Event | Object | Typical metadata |
|-------|--------|------------------|
| `capture.created` / `.viewed` / `.edited` / `.shared` / `.referenced` | capture/opportunity | source, channel |
| `reminder.created` / `.completed` / `.ignored` | reminder/task | due_at |
| `search.performed` | — | query, mode=keyword\|semantic |
| `opportunity.created` / `.updated` | opportunity | fields_changed |
| `meeting.referenced` | meeting | calendar_id? |
| `conversation.referenced` | note/email | channel |
| `person.linked` / `document.linked` | person/document | via_object_id |
| `relationship.upserted` / `.dismissed` | edge | relationship_type |
| `ask.answered` | — | question_hash, citation_ids |
| `intelligence.finding` | finding | finding_type |
| `sync.flushed` | batch | device_id, count |

Nothing meaningful disappears: soft-delete objects (`status=deleted`) still keep events.

### 3.3 Relationships (Smartchitecture engine)

```sql
alter table simplifi_relationships
  add column if not exists strength numeric(4,3) not null default 0.5,
  add column if not exists source text not null default 'heuristic', -- heuristic|user|ai|import|sync
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists dismissed_at timestamptz;

-- relationship_type examples:
-- related_to | works_at | owns | part_of | mentions | follow_up_of
-- derived_from | duplicate_of | attended | assigned_to | about
-- promised | waiting_on | same_as
```

Multi-hop = recursive CTEs / neighbor expansion in SQL — **no graph DB**.

### 3.4 Embeddings (pgvector)

```sql
create table if not exists simplifi_embeddings (
  id uuid primary key default gen_random_uuid(),
  portal_slug text not null,
  object_id uuid not null references simplifi_objects(id) on delete cascade,
  chunk_id text not null default 'primary',
  content_hash text not null,
  embedding vector(1536),
  model text not null,
  created_at timestamptz not null default now(),
  unique (object_id, chunk_id, model)
);

create index simplifi_embeddings_ivfflat
  on simplifi_embeddings using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
```

### 3.5 Intelligence runs + scoring cache

```sql
create table if not exists simplifi_intelligence_runs (
  id uuid primary key default gen_random_uuid(),
  portal_slug text not null,
  run_at timestamptz not null default now(),
  findings jsonb not null default '[]'::jsonb,
  brief_items jsonb not null default '[]'::jsonb,
  ambient_items jsonb not null default '[]'::jsonb,
  status text not null default 'ok'
);

alter table simplifi_objects
  add column if not exists opportunity_score numeric(6,2),
  add column if not exists score_factors jsonb,
  add column if not exists context_summary text,
  add column if not exists next_best_action text,
  add column if not exists last_intelligence_at timestamptz;
```

### 3.6 Sync outbox (Phase 2 offline continuity)

```sql
create table if not exists simplifi_sync_outbox (
  id uuid primary key default gen_random_uuid(),
  portal_slug text not null,
  device_id text not null,
  client_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  applied_at timestamptz,
  conflict_resolution text, -- server_wins|client_wins|merged
  created_at timestamptz not null default now(),
  unique (portal_slug, device_id, client_event_id)
);
```

### Dual-write matrix

| Write | Airtable | Postgres |
|-------|----------|----------|
| Capture analyze success | Primary | Upsert object by `airtable_record_id` |
| Outcome / due / snooze / watch | Primary | Patch object + memory event |
| Relationship accept/reject | — | Primary |
| Memory event | Pulse dual-write if configured | Append memory_events |
| Embedding | — | Async after upsert |
| Intelligence run | — | Primary |

**Read:** Prefer Postgres when `SIMPLIFI_OS_READ=1` and row exists; else today’s loaders.

**Tenancy:** `portal_slug` on every table; service role for cron only; RLS when Supabase anon is exposed.

---

## 4. Service design (`lib/simplifi-os/`)

| Module | Responsibility | Reuses |
|--------|----------------|--------|
| `types.ts` | Event vocab, object types, context pack shape | — |
| `memory-events.ts` | `recordMemoryEvent()` append-only | Pulse vocabulary + portal slug |
| `timeline.ts` | Replay by user / opportunity / person / company / project / meeting / document | memory-events |
| `objects-store.ts` | Upsert/get by slug + airtable id | `simplifi-objects.ts` mappers |
| `relationships.ts` | CRUD, heuristic seed, expansion | `relationship-hints.ts` |
| `entity-extract.ts` | Light person/org/project on finalize | title/URL/notes; optional Claude |
| `embed.ts` | Chunk + embed + upsert | OpenAI embeddings (or pinned model via env) |
| `retrieve.ts` | Semantic top-k → expand neighbors → keyword fallback | `simplifi-ask.ts` |
| `ask.ts` | Question → retrieve → `callClaudeText` + citations | `lib/ai.ts` |
| `context.ts` | Context Pack assembler | objects + rel + timeline + score |
| `intelligence-pass.ts` | Detectors + next best action | smart-expiration, priority-engine, action-center |
| `brief-merge.ts` | Brief 2.0 sections | `buildDailyBrief` |
| `scoring.ts` | Continuous opportunity score | priority-engine factors + rel strength |
| `collections.ts` | Smart Collections queries | scoring + events |
| `sync.ts` | Apply outbox / conflict policy | mobile offline queue patterns |
| `ambient.ts` | Pick ambient lines from latest run + Action Center | Orb loaders |

**No business logic in route handlers** beyond auth + invoke OS core.

### Semantic Ask pipeline

```text
Question → embed query → pgvector top-k
        → relationship expansion (1–2 hops)
        → memory lookup (recent events on those objects)
        → LLM reason (callClaudeText) + citations
        → on miss/timeout (<800ms budget for retrieve): keyword simplifi-ask
```

### Opportunity Intelligence detectors (same pass)

Forgotten commitments · stalled opportunities · relationship gaps · repeated ideas · emerging opportunities · inactive clients · pending promises · duplicate work · upcoming deadlines → each emits finding + recommended next best action.

### Opportunity scoring factors

Recency · importance · relationship strength · activity · deadlines · potential value · frequency · confidence → stored on object; drives Brief ranking + Collections.

---

## 5. API design

| Endpoint | Role |
|----------|------|
| Existing capture analyze / outcome / watch / reminder | After success → memory event + object upsert + embed enqueue |
| `GET /api/simplifi/brief` | Brief 2.0 merge with intelligence_runs |
| `GET /api/simplifi/workspace` | relationships + intelligence strip + collections hints |
| `GET /api/simplifi/objects/[id]/context` | Context Pack |
| `GET /api/simplifi/objects/[id]/timeline` | Memory timeline for object |
| `GET /api/simplifi/timeline?scope=&id=` | User / person / company / project / meeting / document |
| `POST /api/simplifi/relationships` | User-asserted edge |
| `POST /api/simplifi/relationships/[id]/dismiss` | Dismiss heuristic edge |
| `POST /api/simplifi/ask` | Semantic Ask |
| `POST /api/simplifi/sync` | Device outbox flush |
| `GET /api/simplifi/collections/[key]` | Smart Collection |
| `POST /api/cron/simplifi-intelligence` | Nightly pass (`CRON_SECRET`) |
| Extension brief / ask | Same OS core |

Auth: existing Simplifi / portal session guards only.

---

## 6. UI changes (Orb-first)

| Surface | Change |
|---------|--------|
| Opportunity / object profile | Context Pack panel (related people/opps/meetings/files/notes, timeline, score, AI summary, NBA) |
| Daily Brief | Brief 2.0: priority opps, risks, follow-ups, momentum, relationship changes, commitments, emerging, suggested actions |
| GlobalOrb ambient | Unprompted lines from `ambient_items` + Action Center (grounded only) |
| Ask | `/api/simplifi/ask` + citations |
| Capture success | Emit memory events on watch/remind/share (no new product chrome) |
| Connections / graph (Phase 3) | Opportunity Graph explorer — person→meeting→idea→proposal→task→opportunity |
| Settings | Sync status; calendar connections (Phase 3) |
| Mobile | Extend offline queue → sync journal; same Brief/Ask APIs |
| Extension | Same Brief + Ask continuity |

**Non-goals for Foundation:** Neo4j UI, chat-first home, full calendar product UI (ICS + connect first).

---

## 7. Migration plan

1. **Provision** Supabase with `SUPABASE_URL` + service role; enable `vector` extension.
2. **Apply** `001` then `002` (memory columns) → `003` (embeddings) → `004` (intelligence + score columns) → `005` (sync outbox).
3. **Feature flags:** `SIMPLIFI_OS_WRITE=1` (dual-write), `SIMPLIFI_OS_READ=0` until backfill verified, `SIMPLIFI_SEMANTIC_ASK=1` when embeddings healthy.
4. **Backfill:** Active objects last 90d → objects + embeddings; heuristic relationship seed from existing captures.
5. **Pulse bridge:** `recordMemoryEvent` also calls Pulse when configured (platform-wide activity remains).
6. **Cutover read:** Per-tenant `SIMPLIFI_OS_READ=1` after parity checks; Airtable remains write-primary until error rate &lt; threshold.
7. **Decommission path (later):** Airtable OLTP retirement only after ≥2 release cycles of Postgres-primary — out of Foundation scope.

---

## 8. Implementation roadmap

### Phase 1 — Foundation (ship together as one vertical slice)

| # | Capability | Deliverable |
|---|------------|-------------|
| 1 | Memory Events | Typed append API + dual-write from capture/outcome/remind/watch |
| 2 | Personal Timeline | Timeline APIs + Orbie can load timeline context |
| 3 | Relationship Engine | Postgres edges + heuristic seed + user confirm/dismiss |
| 4 | Semantic Ask | Embed + hybrid retrieve + `/api/simplifi/ask` |
| 5 | Opportunity Intelligence | Nightly cron + findings → brief/ambient fields |

**Exit criteria:** ≥95% capture completions write a memory event; Ask uses semantic path when vectors exist; Brief shows ≥1 grounded finding for active tenants with stale/due items.

### Phase 2 — Intelligence UX + continuity

| # | Capability |
|---|------------|
| 6 | Context Packs on every object surface |
| 7 | Ambient Intelligence in Orb (no prompt) |
| 8 | Daily Brief 2.0 sections |
| 9 | Offline-first sync (extend mobile queue + outbox; conflict policy) |
| 10 | Cross-device continuity (web/mobile/extension share memory/rel/timeline/brief/Orbie state via same APIs) |

### Phase 3 — Advanced (same architecture)

Calendar Intelligence (conflicts, follow-ups, ICS, Google Calendar, Microsoft Graph) · Communication Intelligence · Smart Collections · Voice-first capture (Whisper) · Visual Intelligence (cards/receipts/contracts — Docling later) · Opportunity Scoring continuous · Opportunity Graph UI.

---

## 9. Open-source / infrastructure choices

| Need | Choose | Why |
|------|--------|-----|
| DB + auth infra | **Supabase Postgres** | Draft schema already exists |
| Vectors | **pgvector** | Same DB; no Neo4j/AGE |
| Jobs | **Vercel Cron** first; **Inngest** only if fan-out/retries exceed cron | Matches existing `vercel.json` crons |
| LLM | Existing `lib/ai.ts` | Platform reuse |
| Embeddings | OpenAI text-embedding (pin model in env) | Simple; swap later |
| Mobile offline | Extend Expo offline capture queue | Already in repo |
| Calendar | Google Calendar API + Microsoft Graph | Phase 3 |
| Voice | Whisper (API or on-device later) | Phase 3 |
| Web extract | Readability (where not already Magnifi) | Avoid duplicate scrapers |
| Docs OCR | Docling (future) | Phase 3 visual |
| Hybrid retrieval patterns | Study LlamaIndex/GraphRAG — **implement in TS**, no Python service | Keep complexity in Next |

Avoid AGPL memory servers and second graph databases.

---

## 10. Risks

| Risk | Mitigation |
|------|------------|
| Dual-write drift | Airtable SoT until `SIMPLIFI_OS_READ`; reconciliation job; idempotent upsert by airtable id |
| Embed / LLM cost | Async embed; nightly cap per tenant; Ask token budget; skip inactive tenants |
| IVFFlat cold / empty index | Sequential scan until ~1k vectors/tenant; rebuild lists on growth |
| False ambient claims | Only emit findings with object citations; human-dismiss; confidence threshold |
| Privacy / deletion | Account deletion must purge objects, events, embeddings, relationships (extend `simplifi-account-deletion`) |
| Cron timeout | Batch tenants; enqueue heavy embeds via `after()` / queue |
| Offline conflicts | Server timestamps + `client_event_id` idempotency; document merge rules |
| Scope creep into calendar/email SoT | Phase 3 connects calendars; captures remain SoT for opportunities |
| Marketing ahead of product | Smartchitecture claims only what graph+embeddings actually do |

---

## 11. Performance strategy

- Capture HTTP path never blocks on embed or intelligence.
- Ask: retrieve budget ~800ms; keyword fallback on miss/timeout; LLM only on top-k ≤ N tokens.
- Timeline queries indexed by `(portal_slug, created_at)` and object_ids GIN if needed.
- Relationship expansion capped (degree × hops).
- Nightly job: skip tenants with no activity 7d; max findings per run.
- RLS + portal_slug isolation; no cross-tenant vector search.
- Mobile: no local vector index in v1 — server is source of semantic truth.

---

## 12. Testing strategy

| Layer | Approach |
|-------|----------|
| Contract scripts | Extend `scripts/test-simplifi-*.mjs` for event emission, ask hybrid, brief merge |
| Unit | Memory event schema validation; scoring determinism; conflict resolution |
| Integration | Supabase test project or container: dual-write, retrieve, cron dry-run |
| Golden Ask | Fixed workspace fixture → semantic vs keyword path assertions |
| Privacy | Deletion purges vectors/events |
| Launch regression | `validate-simplifi-launch-readiness` stays green; Orb contracts unchanged |
| Mobile | Offline queue flush still creates memory events server-side |

---

## 13. Rollout plan

1. **Internal** — dual-write on demo/EA portals; flags off for read/semantic.
2. **Dogfood** — enable read + Ask for staff tenants; monitor event volume & Ask latency.
3. **Early Access cohort** — Brief 2.0 + ambient with kill switch (`SIMPLIFI_AMBIENT=0`).
4. **Play / production** — default write on; read on after 7d clean metrics; semantic Ask default with keyword fallback.
5. **Phase 2/3** — gated by Foundation exit criteria, not calendar/voice first.

---

## 14. Success metrics

- Memory event for ≥95% of capture completions (dual-write).
- Semantic Ask used when embeddings exist; keyword fallback &lt; 800ms on miss.
- Nightly Brief shows ≥1 grounded finding for active tenants with stale/due items.
- Context Pack p95 &lt; 500ms without LLM (cached summary).
- Launch validators + Orb system contracts remain green.
- Cross-device: same Brief content within 60s of capture sync.

---

## 15. Explicit non-goals

- Rewriting capture pipeline or Orb state machine.
- Replacing Airtable before dual-write is proven.
- Neo4j or Apache AGE.
- Full email/calendar as system of record in Foundation.
- Separate “Memory product”, “Graph product”, or “Ask product” codebases.
- Experience Director redesign.

---

## 16. Immediate next engineering step

After architecture acceptance:

1. Add `lib/simplifi-os/` skeleton + typed Memory Event vocabulary.
2. Migrations `002`–`004` + Supabase env wiring.
3. Hook `recordMemoryEvent` + object upsert into capture finalize / outcome paths (`SIMPLIFI_OS_WRITE`).
4. Ship timeline + relationships MVP + embed enqueue.
5. `POST /api/simplifi/ask` + cron intelligence → Brief merge.

Do not start Phase 3 calendar/voice/visual until Phase 1 exit criteria pass.
