# Efficiency Architects Bolt Slides Master

A reusable, responsive presentation master for client transformation conversations.

## Create a client deck

1. Duplicate this folder and give the copy a client-safe name.
2. Edit `src/deckContent.ts`; this is the primary client content surface.
3. Replace `public/client-team.jpg`, `public/current-reality.jpg`, and `public/future-state.jpg` with approved client-safe imagery using the same filenames.
4. Keep the engine and shared components unchanged unless the presentation format itself needs to change.
5. Run `npm ci`, then `npm run dev` to rehearse and `npm run build` before delivery.
6. Check the deck on a phone and a desktop. Press `P` for presenter mode and review every speaker note.

## Delivery guardrails

- Replace all bracketed placeholders before external use.
- Use only validated metrics and client-approved claims. Never invent numerical outcomes.
- Remove confidential information before publishing or sharing a public link.
- Verify image rights and accessibility text.
- Preserve the upstream MIT license in `LICENSE`.
