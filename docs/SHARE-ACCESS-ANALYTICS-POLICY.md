# Share, Access, and Analytics Policy

This policy defines which links are public, which are client-only, and which events should be tracked.

## Link Access Rules

| Surface | Route | Audience | Access Rule |
|---|---|---|---|
| Consider | `/consider/{slug}` | Prospects, outside stakeholders | Public when slug exists |
| Magnifi cinematic | `/magnifi/{captureId}` | Client/internal stakeholders | Public-by-link for now; avoid sensitive captures |
| Magnifi classic report | `/magnifi/{captureId}?classic=1` | Internal, print/report viewers | Public-by-link for now; avoid sensitive captures |
| Simplifi guidance | `/simplifi/guidance/{captureId}` | Client/operator | Public-by-link for now; share selectively |
| Simplifi workspace | `/simplifi/workspace`, `/portal/{slug}/simplifi` | Client/operator | Session required for personalized workspace |
| Admin capture/blueprints | `/admin/*` | Internal admins | Admin-only |
| Amplifi share | `/amplifi/share`, `/amplify` | Client/tester | Guest or session flow |

## Public/Private Decision Rules

- Use Consider links for prospects and public storytelling.
- Use Magnifi links when the viewer needs the cinematic story and the capture is safe to share by link.
- Use Simplifi Guidance only with users who should see recommended actions.
- Do not share admin URLs externally.
- Do not share captures containing private client data until access controls are tightened.
- If a capture includes personal data, legal details, financial details, or confidential strategy, keep it portal/admin-only.

## Amplifi Positioning

Amplifi is the distribution layer for captured opportunity stories.

Primary promise:

> Capture once. Turn it into a story. Share it where momentum can happen.

Amplifi is not the analysis engine. Simplifi analyzes. Magnifi tells the story. Amplifi gets the story seen.

## Share Flow SOP

1. Capture with Simplifi.
2. Confirm Magnifi or Consider link opens.
3. Choose the right share target:
   - Prospect: Consider link.
   - Internal buy-in: Magnifi link.
   - Client next step: Simplifi Guidance link.
4. Choose the channel:
   - Email for formal follow-up.
   - SMS for warm/high-trust relationships.
   - LinkedIn for visibility and market signal.
   - Native share when mobile.
5. Record outcome in Simplifi workspace after response.

## Social Draft Standards

### LinkedIn

- 2 to 5 short paragraphs.
- Start with the hidden opportunity.
- Avoid overclaiming.
- End with a specific invitation or next step.

Template:

```text
We noticed something worth paying attention to:

[Hidden opportunity]

The next move is not more noise. It is clarity around [priority].

Here is the story:
[Consider URL]
```

### Email

- Subject should name the opportunity.
- First sentence should explain why they are receiving it.
- Include one CTA.

Template:

```text
Subject: A clearer view of [opportunity]

Hi [Name],

I captured this because it points to a real opportunity for [organization].

The story is here: [Consider URL]

The strongest next step is [next action].
```

### SMS

- Short.
- Link only after context.

Template:

```text
Saw something worth exploring for [org]. I made a quick story from it: [Consider URL]
```

## Analytics Plan

Track these events through Pulse or the existing Consider tracking path:

| Event | Trigger | Purpose |
|---|---|---|
| `capture.completed` | Capture finishes | Confirms Simplifi pipeline |
| `magnifi.opened` | Magnifi route viewed | Measures story consumption |
| `consider.viewed` | Consider route viewed | Measures public share engagement |
| `share.copied` | Copy link used | Measures distribution intent |
| `share.native_opened` | Native share used | Measures mobile sharing |
| `assessment.started` | Assessment opened from Consider | Measures conversion intent |
| `assessment.completed` | Assessment submitted from Consider | Measures conversion |
| `capture.outcome_recorded` | Won/lost/passed/in-progress set | Measures business outcome |

## Browser And Extension Guidance

| Use Case | Recommended Path |
|---|---|
| Phone capture | `/simplifi/capture` or `/capture`, add to home screen |
| Share a page quickly | `/amplify?url={encodedUrl}` |
| Browser shortcut | `/amplifi/install` bookmarklet |
| Extension/API connection | `/extension/connect` when capture key is configured |
| Portal client workspace | `/portal/{slug}/simplifi` |
| Standalone app domain | `app.simplifi.ai` after DNS setup |
