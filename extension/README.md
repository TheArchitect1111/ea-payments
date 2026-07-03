# Simplifi Extension

Personal Opportunity Intelligence across the internet.

## What It Does

- Adds a floating Simplifi orb to normal websites.
- Captures the current page, title, metadata, selected text, and screenshot.
- Sends captures to existing Simplifi capture APIs.
- Creates local watch list items and follow-up reminders.
- Shows browser notifications when capture analysis is ready.
- Provides a popup command center with Capture, Watch, Analyze, Follow Up, Smart Brief, and Workspace.
- Provides a browser side panel for the server-backed Smart Brief.

## Install For Testing

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this `extension/` folder.
5. Open `https://ea-payments.vercel.app/extension/connect` while signed in.

The extension stores its API URL, capture key, portal slug, and notify email in `chrome.storage.sync`.

## Current Phase

Implemented:

- Manifest V3
- Floating Simplifi orb with no logo, letter, badge, or state text
- Browser side panel
- Shared extension API client
- Capture current page
- Capture selected text from right-click menu
- Visible screenshot capture
- Watch List storage
- Follow-up reminders via browser alarms
- Server-backed Smart Brief from existing Simplifi workspace data
- Browser notifications
- Popup dashboard
- Existing Simplifi API sync
- `/api/extension/brief` integration

Phase 1 architecture review:

- See `docs/SIMPLIFI-COMPANION-EXTENSION-PHASE-1.md`.
- Current extension is a prototype foundation that already reuses the capture pipeline.
- API-key bootstrap and local watch lists are transitional, not the final first-class architecture.

Not yet implemented:

- Scoped extension session token tied to existing Simplifi login
- Server-backed Watch Lists
- Remote continuous web monitoring
- Region/full-page screenshot stitching
- Voice transcription
- AI autonomous opportunity detection

Those belong to the next passes once watch lists, reminders, and notifications have server-side tables.

## Package

Run:

```bat
scripts\package-extension.bat
```

Output:

```txt
dist\simplifi-extension.zip
```
