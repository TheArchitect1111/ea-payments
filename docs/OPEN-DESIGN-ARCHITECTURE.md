# Open Design — Creative Experience Engine

**Status:** Architecture integrated July 2026  
**Mode:** Enhancement only — does not replace Executive OS, Mission Control, Make.com, PraisonAI workforce (external), Cursor, GitHub, or Vercel.  
**Guardrail:** Open Design is the **visual design department** of EA. It never performs operational analysis.

---

## Position in the EA stack

```
Client
  → CTP Assessment
  → Executive Intelligence (PraisonAI workforce + EA agents — research & analysis)
  → Creative Brief Generator (lib/open-design/brief-generator.ts)
  → OPEN DESIGN (lib/open-design/)
  → Cursor (implementation)
  → GitHub
  → Vercel
```

**Preserved systems (unchanged ownership):**

| System | Responsibility |
|--------|----------------|
| PraisonAI / EA agents | Research, audit, ops, finance, marketing, portal recommendations, executive summary |
| Mission Control | Executive attention, creative status lane, review gates |
| Creative Studio (`lib/creative-studio/`) | Campaign persistence, asset generation, publish facade |
| Skin Factory (`lib/skin-factory.ts`) | Visual brief sections, repo recommendations |
| Design Studio (`lib/ctp-design-studio.ts`) | Client brand inputs at `ctp/progress` |
| Make.com | Existing automations — Open Design emits Pulse; Make subscribes as today |
| Cursor → GitHub → Vercel | Production implementation path |

Open Design **orchestrates** creative phases and **inherits** Creative Studio + Skin Factory outputs. It does not fork persistence.

---

## What Open Design is (and is not)

**Is:** The Creative Experience Engine — story extraction, art direction, homepage/portal/dashboard/presentation concepts, component language, production-friendly specs for Cursor.

**Is not:** Another image generator, a SaaS template picker, or an operations analyst.

---

## Creative pipeline (automatic phases)

Every design request follows `lib/open-design/pipeline.ts`:

| Phase | Name | Owner | Gate |
|-------|------|-------|------|
| 1 | Executive Intelligence | PraisonAI / EA research agents | Research complete |
| 2 | Story Extraction | Open Design | **One-sentence story required — stop if missing** |
| 3 | Creative Direction | Open Design | Creative DNA generated |
| 4 | Experience Design | Open Design | Deliverables + Cursor output contract |
| 5 | Executive Review | Mission Control | Awaiting executive approval |
| 6 | Implementation | Cursor → GitHub → Vercel | Production deploy |

### Phase 6 — Implementation automation (`lib/open-design/implementation-runner.ts`)

| Mode | When | Behavior |
|------|------|----------|
| **GitHub PR** | `GITHUB_TOKEN` or `OPEN_DESIGN_GITHUB_TOKEN` set | Creates branch + PR with handoff markdown/JSON under `docs/open-design-handoffs/` |
| **Package only** | No GitHub token | Emits Pulse + returns Cursor package for manual handoff |
| **Vercel preview hook** | `OPEN_DESIGN_VERCEL_DEPLOY_HOOK_URL` set | Fires deploy hook after PR (preview only — never auto-promotes production) |

Admin trigger: CTP desk → **Open Design → GitHub** (`run_open_design_handoff`).

Env (optional):

| Variable | Purpose |
|----------|---------|
| `GITHUB_TOKEN` / `OPEN_DESIGN_GITHUB_TOKEN` | Create handoff PRs |
| `OPEN_DESIGN_GITHUB_OWNER` | Default `TheArchitect1111` |
| `OPEN_DESIGN_GITHUB_REPO` | Default `ea-payments` |
| `OPEN_DESIGN_GITHUB_BASE` | Default `master` |
| `OPEN_DESIGN_VERCEL_DEPLOY_HOOK_URL` | Preview deploy hook |

### Phase 2 — Story gate (non-negotiable)

If a one-sentence story cannot be written, **do not design**.

Example: *"W.A.B. Sports exists to use athletics as a vehicle for leadership, education, scholarships, and lifelong opportunity."*

### Phase 3 — Creative DNA

Never default to SaaS/corporate. Direction includes: emotional tone, photography, typography, scroll rhythm, lighting, texture, motion, color psychology, story progression.

Reference styles: Documentary, Editorial, Museum, Magazine, Netflix documentary, Luxury hospitality.

### Phase 4 — Experience deliverables

Homepage, portal, dashboard, landing page, presentation, mobile concepts, component system — each section answers: **"What part of the story is this telling?"**

---

## Standing design rules

1. Story before layout  
2. Experience before sections  
3. Emotion before information  
4. Narrative before navigation  
5. Identity before industry  

**Never:** generic corporate website, default card grids, boxed SaaS dashboards, or "AI-looking" layouts unless they serve the story.

---

## Creative Profile (per organization)

Stored shape: `CreativeProfile` in `lib/open-design/types.ts`. Persisted via Creative Studio brand store + CTP Design Studio fields (`lib/open-design/creative-profile.ts`).

Inherits across all future deliverables: story, mission, audience, creative direction, photography, typography, palette, motion, component language, visual metaphors, editorial/portal/presentation styles.

---

## Industry design library

Starting points only (`lib/open-design/industry-library.ts`): Healthcare, Education, Nonprofit, Sports, Financial Services, Professional Services, Manufacturing, Government, Hospitality.

Each engagement must still become unique to the organization.

---

## Cursor integration (output contract)

Open Design outputs must be production-friendly (`lib/open-design/output-contract.ts`):

- HTML / CSS / Tailwind suggestions  
- React component hierarchy  
- Design tokens (from `@/lib/design-system`)  
- Layout documentation  

Cursor transforms specs into production code with minimal redesign.

---

## Mission Control — Creative status

Executive review lane (`lib/open-design/creative-status.ts`):

- Research Complete  
- Story Extracted  
- Creative DNA Generated  
- Homepage Concept Ready  
- Portal Concept Ready  
- Presentation Ready  
- Awaiting Executive Review  

Surfaced in Mission Control via Pulse events `open.design.*` and attention templates in `lib/pulse-attention.ts`.

---

## Agent registry

`lib/agents/open-design-agent.ts` registers the **Open Design** agent for orchestrator routing. Capabilities: story, art direction, experience design, presentation — **not** operational analysis.

Future specialists (documented, not yet implemented): Brand Designer, UX Designer, Motion Designer, Presentation Designer, Accessibility Designer, Illustration Designer, Image Direction, Photography, Video Storyboard.

---

## Integration map (existing code)

| Hook | File |
|------|------|
| CTP → campaign bridge | `lib/ctp-studio-bridge.ts` → calls `beginOpenDesignFromCtp` |
| Brief normalization | `lib/open-design/brief-generator.ts` ← Skin Brief, Design Studio, intake |
| Asset generation | `lib/creative-studio/generate-assets.ts` |
| Publish | `lib/creative-studio/publish-asset.ts` → `lib/publishing` |
| Portal client inputs | `lib/ctp-design-studio.ts` (`ctp/progress` — secondary to Opportunity Dashboard) |
| Tokens | `lib/design-system/` |
| Factory protocol | `ea-open-design` in `lib/ea-factory.ts` |

---

## Success criteria

Visitors immediately understand **who** the organization is, **why** it exists, **why** it is different, and **why** they should care.

The goal is not beautiful interfaces alone — it is **unforgettable digital experiences** that faithfully communicate each organization's unique story and mission.
