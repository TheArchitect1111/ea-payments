# Universal Experience Generator — Capability Inventory (Phase 1)

**Repo:** `ea-payments` (`master`)  
**Date:** 2026-07-29  
**Scope:** Evidence-backed inventory for joining Universal Quick Launch to the existing Factory + chassis stack.

## Verdict in one line

A mostly complete website-and-portal foundation exists; the gap is a **general-purpose creative generator path** (Universal Quick Launch → research → three concepts → wire) without Amanda hard-coding. Experience Director v1 remains **complete / frozen**.

## Operational

| Capability | Evidence |
|------------|----------|
| Factory Core pipeline (intake→research→discovery→planning→production) | `lib/factory-orchestrator.ts`, `lib/factory-capabilities/*`, `docs/architecture/ea-factory-core-v1.md` |
| General Launch API + UI | `POST /api/launch`, `app/admin/ea-factory/launch/LaunchClient.tsx` |
| ProjectContext (append-only) | `lib/factory-project-context.ts` |
| Org research / entity profile / opportunity brief | `lib/factory-org-research.ts`, `factory-entity-profile.ts`, `factory-opportunity-brief.ts` |
| Concept pack + previews + select/wire/publish | `factory-concept-*`, `factory-publish-selected-concept.ts` |
| Experience Director publish gate | `lib/factory-experience-director.ts`, `docs/architecture/experience-director-v1.md` |
| Public `/sites/[slug]`, `/portal/[slug]`, previews | `app/sites`, `app/portal`, `app/preview/factory`, `app/preview/experience` |
| Portal Chassis + theme engine | `vendor/portal-chassis`, `vendor/theme-engine` |

## Incomplete

| Capability | Notes |
|------------|-------|
| QA / Publishing / Notification **capabilities** in orchestrator | Backlog in Core v1; publish is still a separate admin step |
| Portal / Learning / Knowledge / Report builders | Stubs in `lib/factory-workers.ts` (`implemented: false`) |
| Automatic ED gate inside Launch orchestration | Explicitly not wired (ED doc) |
| Identity confidence hard-stop | Research exists; confidence gate for auto-progression still thin |
| Media licensing / focal-point pipeline | Partial via assets; not a full media-intelligence service |

## Hard-coded

| Item | Path |
|------|------|
| Former Quick Launch Amanda-only UI | Replaced 2026-07-29 by Universal Quick Launch; Amanda activate kept as legacy details |
| Sole experience preset | `lib/experience-launch-presets.ts` (`amanda-catherine-editorial`) |
| Amanda slug quarantine | `lib/site-quarantine.ts` |
| Client-name Amanda heuristics in publish/preview | `factory-publish-website.ts`, `factory-publish-selected-concept.ts`, `factory-concept-to-director.ts`, `factory-concept-previews.ts` |

## Mock / placeholder

| Item | Path |
|------|------|
| AI Research Agent / Simplifi / Magnifi admin pages | `EAFactoryPlaceholderPage.tsx` |
| Worker stubs | `lib/factory-workers.ts` |
| Deterministic entity/brief fallbacks when Claude fails | Entity/brief modules (thin, not fake UI) |

## Duplicated / parallel

- Factory projects (`/api/launch`) vs EACP launches (`/api/ea-factory/launch`)
- Three activation/publish paths: activate-experience, publish-website, publish-selected-concept
- `app/admin/factory` vs `app/admin/ea-factory`

## Missing for full Universal Experience Generator (95–98%)

1. Multi-source identity search + scored candidates with citation confidence stop  
2. Full media intelligence (license, duplicate, face/focal, derivatives)  
3. Composition-system catalog beyond Amanda-biased themes  
4. Orchestrated: BUILDING → auto concept pack → human select → ED → chassis wire  
5. Automated visual regression gate across four viewports before publish  

## Runtime verification (this sprint)

| Surface | Status |
|---------|--------|
| Universal Quick Launch UI | Implemented at `/admin/ea-factory/quick-launch` |
| Duplicate launch prevention (24h) | Implemented in `POST /api/launch` |
| Full E2E three-subject publish | Blocked without admin session + AI keys + deploy |

## Architecture decision

Extend `POST /api/launch` + Factory orchestrator + existing concept/wire APIs.  
Do **not** create a second platform or replace Experience Director v1.
