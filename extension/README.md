# Simplifi Extension

Personal Opportunity Intelligence across the internet.

## What It Does

- Adds a floating Simplifi orb to normal websites.
- Captures the current page, title, metadata, selected text, and screenshot.
- Sends captures to existing Simplifi capture APIs.
- Creates local watch list items and follow-up reminders.
- Shows browser notifications when capture analysis is ready.
- Provides a popup command center with Capture, Watch, Analyze, Follow Up, Daily Brief, and Dashboard.

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
- Floating Simplifi Orb
- Capture current page
- Capture selected text from right-click menu
- Visible screenshot capture
- Watch List storage
- Follow-up reminders via browser alarms
- Daily Brief generation from local extension activity
- Browser notifications
- Popup dashboard
- Existing Simplifi API sync

Not yet implemented:

- Remote continuous web monitoring
- Region/full-page screenshot stitching
- Voice transcription
- Backend watch list database
- AI autonomous opportunity detection

Those belong to Phase 2/3 once watch lists, reminders, and notifications have server-side tables.

## Package

Run:

```bat
scripts\package-extension.bat
```

Output:

```txt
dist\simplifi-extension.zip
```
