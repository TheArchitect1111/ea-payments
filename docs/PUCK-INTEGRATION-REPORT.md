# Puck Integration Report — EA Portal Experience Builder

**Date:** July 2026  
**Repo:** `ea-launch-audit/ea-payments`  
**Build:** `npm run build` — **PASS**

---

## 1. Packages installed

| Package | Version | Purpose |
|---|---|---|
| `@measured/puck` | `0.20.2` | Visual page editor (Puck) — drag-and-drop block composition |

**Note:** npm reports `@measured/puck` is deprecated in favor of `@puckeditor/core`. RC1 uses `@measured/puck` per standard Puck docs and successful build verification. Migrate to `@puckeditor/core` in a future maintenance pass if needed.

**Transitive dependencies added:** 16 packages (Puck editor runtime).

---

## 2. Files created

### Library (`lib/experience-builder/`)

| File | Role |
|---|---|
| `types.ts` | `ExperiencePage` model, empty Puck data factory, preview path helper |
| `page-store.ts` | CRUD via Creative Studio persistence (`experience` record type) |
| `publish-page.ts` | Publish adapter → `lib/publishing/publishCommunication` |
| `puck-config.tsx` | Puck `Config` with EA Design System blocks |
| `experience-builder.css` | Block styles using `--ea-navy`, `--ea-gold`, `--ea-cream` tokens |

### Portal routes

| File | Route |
|---|---|
| `app/portal/[slug]/experience-builder/page.tsx` | `/portal/{slug}/experience-builder` — page list |
| `app/portal/[slug]/experience-builder/ExperienceBuilderIndex.tsx` | List UI + create experience |
| `app/portal/[slug]/experience-builder/[pageId]/page.tsx` | Editor route shell |
| `app/portal/[slug]/experience-builder/[pageId]/ExperienceBuilderEditor.tsx` | Puck editor client |

### Preview routes

| File | Route |
|---|---|
| `app/preview/experience/[slug]/[pageId]/page.tsx` | `/preview/experience/{slug}/{pageId}` |
| `app/preview/experience/[slug]/[pageId]/ExperiencePreview.tsx` | Puck `<Render>` viewer |

### API routes

| File | Endpoints |
|---|---|
| `app/api/portal/experience-pages/route.ts` | `GET` list, `POST` create |
| `app/api/portal/experience-pages/[pageId]/route.ts` | `GET` load, `PUT` save draft |
| `app/api/portal/experience-pages/[pageId]/publish/route.ts` | `POST` publish |

### Modified (additive only)

| File | Change |
|---|---|
| `lib/creative-studio/persistence.ts` | Added `experience` record type to existing Airtable/memory storage |
| `package.json` / `package-lock.json` | Added `@measured/puck` dependency |

---

## 3. Components registered (Puck blocks)

All blocks use EA Design System tokens (`--ea-navy`, `--ea-gold`, `--ea-cream`, `--ea-muted`, `--ea-border`) and shared `ep-btn` patterns.

| Puck component | Label | Category | Fields |
|---|---|---|---|
| `EAHero` | EA Hero | Layout | eyebrow, title, subtitle, ctaLabel, ctaHref |
| `EACtaBand` | EA CTA Band | Layout | title, body, primary/secondary labels + hrefs |
| `EATextSection` | EA Text Section | Content | label, title, body |
| `EAFeatures` | EA Features | Content | label, title, 3 feature title/body pairs |
| `EAMetrics` | EA Metrics | Content | label, title, 3 metric value/label pairs |

**Default page:** New experiences start with one `EAHero` block.

---

## 4. How Save, Preview, and Publish were connected

### Save → existing page storage

```
Puck onChange
  → PUT /api/portal/experience-pages/{pageId}
  → saveExperiencePage()
  → saveStudioRecord({ recordType: 'experience', ... })
  → Airtable "Creative Studio" table (Record Type: Experience) + in-memory fallback
```

- Reuses **Creative Studio persistence layer** (`lib/creative-studio/persistence.ts`) without modifying Creative Studio UI or campaign logic.
- Record key format: `experience:{pageId}`
- Status set to `draft` on each save.

### Preview → existing preview system

```
Preview button / previewPath
  → /preview/experience/{portalSlug}/{pageId}
  → getExperiencePage()
  → Puck <Render config={puckConfig} data={puckData} />
```

- Follows same pattern as `/preview/home` (noindex metadata, dedicated preview route namespace under `/preview/*`).
- Preview works for draft and published pages.

### Publish → existing publishing pipeline

```
Puck Publish button
  → save draft (PUT)
  → POST /api/portal/experience-pages/{pageId}/publish
  → publishExperiencePage()
  → publishCommunication({ channel: 'website', ... })   // lib/publishing/publish.ts
  → markExperiencePagePublished()                       // status: published
  → publishPlatformActivityEvent()                      // Pulse activity feed
```

- **Does not replace** Creative Studio `publishCampaignAsset` or EA Factory flows.
- Uses the same `website` channel as Creative Studio landing-page assets (manual/stub mode until static host hook is added).
- Passes `storyUrl: /preview/experience/{slug}/{pageId}` for downstream routing.
- Source metadata: `{ product: 'experience-builder', campaignId, assetId }`.

---

## 5. What was NOT changed

| System | Status |
|---|---|
| EA Factory / Skin Factory / Codex Builder | Untouched |
| Creative Studio UI and campaign generator | Untouched |
| `lib/publishing/publish.ts` core router | Untouched (called, not rewritten) |
| Custom editor | Not built — Puck is the editor |

---

## 6. Access control

- Portal routes require `requirePortalModule(slug, 'landing')` (admin role on landing module).
- API routes use `guardPortalApi` with portal session cookie validation and slug matching.

---

## 7. Verification

```bash
npm run build
# ✓ Compiled successfully
# ✓ TypeScript passed
# Routes registered:
#   /portal/[slug]/experience-builder
#   /portal/[slug]/experience-builder/[pageId]
#   /preview/experience/[slug]/[pageId]
#   /api/portal/experience-pages/*
```

---

## 8. Usage

1. Navigate to `/portal/{slug}/experience-builder`
2. Click **Create experience**
3. Edit with Puck drag-and-drop blocks
4. Draft auto-saves on change
5. Click **Preview** → `/preview/experience/{slug}/{pageId}`
6. Click **Publish** in Puck → website channel + published status

---

## 9. Follow-ups (out of scope)

- Add Experience Builder link to portal nav / landing module hub cards
- Wire `website` publish channel to ISR/static deploy (currently manual mode)
- Migrate `@measured/puck` → `@puckeditor/core` when stable
- Import additional blocks from synced `landing-chassis`
- Airtable setup: add `Experience` to Creative Studio table Record Type options if using manual schema
