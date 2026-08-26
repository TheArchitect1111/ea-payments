# EA Design Studio v4

## Core rule
Design first. Implement second.

No artifact may be coded into its final form before its visual composition has passed art-direction review.

## Creative workflow
1. Classify the artifact: poster/flyer, landing page, website, portal, presentation.
2. Lock audience, purpose, facts, assets, representation requirements, and reference signals.
3. Build a visual composition in the design-native layer.
4. Produce three genuinely different internal directions.
5. Art Director selects one direction.
6. Refine the selected direction until visual score >= 9/10.
7. Only then hand off to implementation/export.
8. Verify the implemented output against the approved design.

## Design-native layer
Preferred: Penpot, using reusable EA libraries and design tokens.

Fallback when direct Penpot automation is unavailable: structured vector composition specification that can be imported into Penpot later. Code/CSS must not be used to discover the composition.

## Production targets
- Flyers/posters: SVG/PDF/PNG export from approved fixed canvas. Scribus only for bleed/CMYK/prepress when required.
- Websites/landing pages: Next.js + Tailwind CSS + shadcn/ui after design approval.
- Portals: Next.js + Tailwind/shadcn with Refine where CRUD/admin acceleration is useful.
- Motion: Framer Motion only after layout approval.

## EA quality standard
The first user-visible design should be 90-95% complete.

Reject before user review if any apply:
- wrong artifact class
- generic SaaS/template look
- weak or competing hierarchy
- accidental overlap or clipping
- low-quality/mismatched imagery
- representation requirements violated
- tiny essential copy
- excessive boxes/cards
- CTA or QR buried
- brand identity not immediately recognizable
- layout feels assembled rather than art-directed

## Typography
Typography is brand-specific. Do not apply one universal pair. Default open-source candidates: Geist, Inter, Montserrat, Instrument Serif, Cormorant Garamond. Limit most artifacts to two families.

## Color
Color is brand-specific. Never force violet gradients or any universal premium palette. Avoid pure black only when the selected brand direction benefits from a softer near-black.

## Twin City acceptance test
Twin City Provincial Golf Flyer must be a true promotional sports poster.
- dominant African American golfer
- crimson pants, cream shirt, crimson headwear direction
- Kappa crimson, cream, restrained old gold
- founders/heritage as subtle atmospheric layer
- March 12, 8:00 AM, $85/player, 2-man teams, Winston Lake Golf Course immediately scannable
- strong registration/tournament QR with clear quiet space
- phone-first shareability and print readiness
- no invented address
- no landing-page paragraphs
- no previous rejected flyer composition reused
