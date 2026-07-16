# Simplifi Companion Browser Extension - Phase 1 Architecture Review

## Objective

Build the browser extension as another doorway into the existing Simplifi platform. The extension must reuse Simplifi authentication, capture processing, AI analysis, Smart Brief logic, user profiles, and the current data store. It should not become a separate product or create duplicate accounts, databases, or AI services.

## Current Codebase Findings

### Existing Extension

The repo already contains a Chromium Manifest V3 extension in `extension/`.

Implemented today:

- `extension/manifest.json` with MV3 service worker, content script, popup, options page, context menus, notifications, storage, and host permissions.
- `extension/background.js` with capture, screenshot capture, status polling, local watch items, follow-up alarms, local daily brief, context menu actions, and popup message handlers.
- `extension/content.js` with a floating webpage orb, panel actions, page payload extraction, quiet page scanning, and extension-to-background messaging.
- `extension/popup.html` / `extension/popup.js` with capture, watch, analyze, follow-up, and brief commands.
- `extension/options.html` / `extension/options.js` with settings storage.
- `extension/connect-bridge.js` plus `/extension/connect` for web-to-extension bootstrap.

This is a useful prototype foundation, not a final first-class Simplifi companion yet.

### Authentication

Existing app auth:

- Portal auth uses `EA_PORTAL_COOKIE` and `verifySession` from `lib/ea-portal-auth`.
- `/extension/connect` checks the portal session and can start a guest session through `useProductGuestSession`.
- `/api/extension/bootstrap` requires a portal session, then returns `apiUrl`, `apiKey`, `portalSlug`, and `notifyEmail`.

Current extension auth gap:

- The extension stores a shared capture API key in `chrome.storage.sync`.
- This avoids duplicate accounts, but it is not the final model requested in the master plan.
- Phase 2 should move toward a scoped extension session token or signed extension bootstrap tied to the existing portal session, not a long-lived backend capture key in extension storage.

### Capture Architecture

Canonical capture flow:

- `/api/portal/captures/analyze` is session-authenticated and uses `submitCapture`.
- `/api/capture/ingest` is extension-friendly and API-key authenticated.
- `lib/capture-submit.ts` routes sync/async submission.
- `lib/capture-pipeline.ts` performs scraping/asset ingest, classification, opportunity scoring, recommendations, blueprint stubs, trust metadata, business analysis, opportunity payload generation, and object guidance updates.
- `lib/capture-response.ts` normalizes capture responses and status polling output.

Current extension behavior:

- Captures page URL, page title, selected text, notes, and visible screenshot.
- Sends data to `/api/capture/ingest`.
- Polls `/api/capture/[id]/status`.
- Stores recent captures locally for popup/brief display.

Integration decision:

- Keep `submitCapture` and `capture-pipeline` as the only capture/AI path.
- Add extension-specific API wrappers only when needed for browser constraints.
- Do not create a separate extension capture database.

### Database And Object Model

Current database:

- Airtable `Capture Records` via `lib/capture-records.ts`.
- Records include source, source URL, category, priority, status, tags, analysis summary, opportunity score, blueprint fields, portal slug, next action, due date, owner, save purpose, and outcome status.

Simplifi object layer:

- `lib/simplifi-objects.ts` maps capture records into `SimplifiObject`.
- `buildDailyBrief` creates brief items from active captures, expiration alerts, momentum, deadlines, and Pulse events.
- `lib/simplifi-store.ts` loads workspace data by portal slug and builds active objects, Smart Brief, memory library, Action Center, and relationship clusters.
- `lib/action-center.ts` derives attention/recommended/watchlist sections from existing objects.

Integration decision:

- The extension Smart Brief should read server-side workspace/brief data, not rebuild a separate daily brief from local extension storage.
- Local extension storage should be treated as cache/UI state only.

### Watch Lists

Current state:

- Extension has local watch items in `chrome.storage.sync`.
- Simplifi workspace has watch-list-like concepts through `savePurpose`, due dates, Smart Brief, memory library, action center, and relationship clusters.
- There is no dedicated backend Watch List table or API in the inspected code.

Technical debt:

- Local watch lists do not yet become durable, cross-device Simplifi data.
- Phase 2 should not expand local-only watch lists as if they are the final model.
- A backend Watch List API/schema is needed before Phase 6/9 browser intelligence can fully match against user watch lists.

### Smart Brief

Existing reusable logic:

- `buildDailyBrief` in `lib/simplifi-objects.ts`.
- `buildActionCenter` in `lib/action-center.ts`.
- `loadSimplifiWorkspace` in `lib/simplifi-store.ts`.
- Companion UI logic in `app/simplifi/workspace/CompanionOrb.tsx`.

Integration decision:

- Extension brief should use the existing brief/action center data through a new authenticated extension endpoint, likely `/api/extension/brief`.
- Limit to five cards in the extension UI.
- Do not open dashboards from the orb; open a compact brief surface.

### AI Services

Existing AI/analysis modules:

- `resource-radar`
- `opportunity-engine`
- `recommendation-engine`
- `blueprint-generator`
- `trust-metadata`
- `simplifi-business-analysis`
- `intelligence-bundle`
- `guidance-triple`

Integration decision:

- Context intelligence should submit metadata/signals to the existing capture pipeline or a small classification endpoint that reuses these modules.
- Do not add extension-specific AI providers or duplicate classification logic in content scripts.

## Reusable Components

Reuse directly:

- `/extension/connect`
- `/api/extension/bootstrap`
- `/api/capture/ingest`
- `/api/capture/[id]/status`
- `submitCapture`
- `capture-pipeline`
- `capture-response`
- `capture-records`
- `simplifi-store`
- `simplifi-objects`
- `action-center`
- `priority-engine`

Reuse conceptually:

- `CompanionOrb` interaction model: single tap brief, long press capture, double tap quick capture, draggable position, silent/aware/active states.
- V3 guidance concepts from `lib/simplifi-guidance-system.ts`.

Do not reuse as-is:

- The web `CompanionOrb` React component inside arbitrary webpages. Browser extension content scripts should remain framework-free unless a build pipeline is introduced.

## Technical Debt

- Extension stores a shared backend capture API key in sync storage.
- Watch lists and daily brief are local extension constructs instead of server-backed Simplifi records.
- Host permissions are broad (`http://*/*`, `https://*/*`), which is acceptable for a prototype but too broad for Chrome Store readiness without strong justification.
- Content script orb still displays text/letter state in the extension implementation and should be cleaned to match the Simplifi orb rule.
- No side panel is defined yet.
- No shared extension API client file exists; logic is concentrated in `background.js`.
- Voice capture is not implemented.
- Smart Brief is not sourced from the server workspace.
- There is no backend extension notification center.
- No packaging/versioning checklist beyond `scripts/package-extension.bat`.

## Integration Plan

### Phase 2 Target

Build the browser extension foundation around the existing scaffold, not a new product.

Required changes:

- Keep Manifest V3.
- Add `side_panel` support where Chromium allows it.
- Create a shared extension API client module.
- Replace scattered `fetch` calls with the shared client.
- Keep `/extension/connect`, but define token/session strategy before expanding.
- Use existing Simplifi login/guest session as the only account path.
- Keep API-key bootstrap only as a transitional adapter unless a scoped extension token is added.

### Phase 3 Target

Clean the content-script orb:

- No logo, letter, text, badge, or label inside/on the orb.
- Draggable.
- Stored position.
- Silent/aware/active modes.
- No distracting flashes.
- Avoid blocking page content.

### Phase 4 Target

Server-backed Smart Brief:

- Add `/api/extension/brief` that validates the extension session/bootstrap and returns `loadSimplifiWorkspace` brief/action-center data.
- Content script opens a compact five-card brief.
- Popup and side panel can show the same brief.

### Phase 5 Target

Universal capture through existing `submitCapture`:

- Current page and URL: already partially done.
- Selected text: already partially done.
- Screenshot/image/PDF: use existing asset ingest path.
- Voice notes: add browser speech capture or audio upload path, then submit as notes/file.
- Clipboard/drag-drop/share: extension UI additions only; backend remains `submitCapture`.

## Extension Architecture

Recommended extension layers:

- `manifest.json`: permissions, action, background, content script, options, side panel.
- `background.js`: orchestration, auth/bootstrap state, capture job queue, status polling, notifications, context menus.
- `api-client.js`: all calls to Simplifi backend.
- `content.js`: orb, gesture handling, page context extraction, brief panel, capture affordances.
- `content.css`: orb/panel styling only.
- `popup.*`: quick actions and brief.
- `options.*`: settings and permissions.
- `sidepanel.*`: richer brief/search/notification center.

Recommended backend endpoints:

- Existing `/api/extension/bootstrap`
- Existing `/api/capture/ingest`
- Existing `/api/capture/[id]/status`
- New `/api/extension/brief`
- New `/api/extension/search`
- Future `/api/extension/watch-lists` → **shipped as** `/api/extension/watch-list`
- Future `/api/extension/notifications`
- Future `/api/extension/settings`

## Phase 2 Status

Implemented after the architecture review:

- Added `/api/extension/brief`.
- The extension brief now reads server-side `loadSimplifiWorkspace` data.
- Added `extension/api-client.js` as the shared backend client.
- Routed background capture/brief calls through the shared client.
- Added Manifest V3 `side_panel` support with `sidepanel.html` and `sidepanel.js`.
- Cleaned the in-page orb so it has no logo, letter, badge, or state text.
- Changed the content panel to open with Smart Brief behavior.
- Updated popup brief behavior to use the server-backed brief.
- Changed the popup's main destination from capture dashboard to Simplifi workspace.

**Goal B Pass 4 (session + watch lists):**

- `/api/extension/bootstrap` returns a 7-day HMAC `extensionToken` (+ `tokenExpiresAt`), not a non-expiring capture tenant key.
- `POST /api/extension/session/refresh` rotates tokens for the service worker.
- Capture ingest/status and brief accept `Authorization: Bearer` / `X-EA-Extension-Token`.
- `/api/extension/watch-list` (+ `[id]`) and `/api/portal/simplifi/watch-list` persist user watch items (Airtable table `Simplifi Watch List`, memory fallback).
- Extension hydrates/migrates local watch items on connect.

Still transitional:

- Legacy `X-EA-Capture-Key` still accepted for one release window.
- Voice capture, full gesture model, and notification center are not yet implemented.
- Store-readiness permission narrowing is still pending.
- Optional revoke blocklist by `sid` not yet required (expiry is the revoke mechanism).

## Phase 1 Status

Complete.

Phase 2 should be verified with a production build and a loaded unpacked extension test before moving to the deeper interaction pass.
