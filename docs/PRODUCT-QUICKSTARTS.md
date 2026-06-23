# Simplifi, Magnifi, Amplifi Quickstarts

Use this as the first responder guide for a new user, tester, client, or internal operator.

## Product Roles

| Product | Primary Job | Primary User Question | Main URL |
|---|---|---|---|
| Simplifi | Capture and clarify opportunities | What is worth acting on? | `/simplifi/capture`, `/simplifi/workspace` |
| Magnifi | Turn a capture into a future-state story | Can others see what is possible? | `/magnifi/{captureId}`, `/consider/{slug}` |
| Amplifi | Share and distribute the story | How do we get this seen? | `/amplify`, `/amplifi/share`, `/portal/{slug}/amplifi` |

## Simplifi Quickstart

1. Open `/simplifi/capture`.
2. Sign in or start the guest capture flow.
3. Paste a URL, upload an image/PDF, or capture a page.
4. Add a prospect or opportunity name when useful.
5. Submit the capture.
6. Wait for scoring. Async captures show a processing panel.
7. Open the returned links:
   - Consider link for public sharing.
   - Magnifi link for cinematic story.
   - Simplifi guidance link for next steps.
   - Workspace link for ongoing management.

### What To Expect

- Captures are saved to Airtable `Capture Records`.
- Each capture receives score and recommendation fields when analysis succeeds.
- The workspace sorts active captures by priority, momentum, due date, and recency.
- The Daily Brief surfaces stale, overdue, due-soon, and high-opportunity items.

### Common User Language

- "Save this before it disappears."
- "Simplifi will turn this into a clear next action."
- "Use the workspace to decide what to pursue, archive, or follow up."

## Magnifi Quickstart

1. Start with a completed Simplifi capture.
2. Open `/magnifi/{captureId}`.
3. Use the cinematic view for stakeholder buy-in.
4. Use `/magnifi/{captureId}?classic=1` when a report-style view is better.
5. Use `/consider/{slug}` when the viewer should receive a shareable prospect story.
6. Send the user to `/simplifi/guidance/{captureId}` when they need action steps.

### What To Expect

- Magnifi reads the saved capture record.
- It rebuilds context from blueprint summary, recommendation summary, scores, and template signals.
- It maps the capture to one of the Magnifi templates.
- It renders acts such as Opening Reveal, Hidden Opportunity, Future-State Reveal, Possibility Engine, Mission Control Reveal, Top Three Priorities, and First Step.

### Common User Language

- "This is the story version of the opportunity."
- "Use Magnifi when others need to understand the possibility quickly."
- "Use Classic Report when someone wants something more printable."

## Amplifi Quickstart

1. Open `/amplify` or `/amplifi/share`.
2. Paste or share the page, flyer, screenshot, idea, or prospect asset.
3. Let Simplifi analyze the asset in the background.
4. Use the Magnifi story once it is ready.
5. Share the Consider URL through native share, copy link, email, SMS, LinkedIn, or the portal Amplifi hub.
6. Track follow-up through Pulse, workspace outcomes, and assessment events.

### What To Expect

- Amplifi is the distribution layer, not a separate analysis engine.
- It depends on the Simplifi capture pipeline.
- It should produce or expose a shareable story link, usually a Consider or Magnifi URL.

### Common User Language

- "Capture once, share the story everywhere."
- "Amplifi turns an opportunity into momentum."
- "Use Amplifi when the next step is visibility, not more analysis."

## Which Link Should I Send?

| Situation | Send This |
|---|---|
| Prospect or outside stakeholder needs a simple story | `/consider/{slug}` |
| Internal stakeholder needs the full cinematic view | `/magnifi/{captureId}` |
| Client needs action steps | `/simplifi/guidance/{captureId}` |
| Operator needs to manage captures | `/simplifi/workspace` or `/portal/{slug}/simplifi` |
| Someone needs to share the story onward | `/amplifi/share` or native share from the result panel |

## Minimum Successful User Journey

1. Capture an opportunity in Simplifi.
2. Confirm a saved Capture Record exists.
3. Open Magnifi.
4. Share Consider through Amplifi.
5. Record outcome or next action in workspace.
