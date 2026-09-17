# Amanda Catherine V2 — Visual QA Handoff

Status: READY FOR RENDERED QA
Production cutover: NOT AUTHORIZED
Production changed: NO

## Source of truth
The approved Amanda portal reference image is the visual specification. The protected owner portal and the read-only `/amanda-visual-qa` mirror share the same `owner.css` visual system.

## QA mirror safety
The QA mirror contains no client records, no authentication credentials, no payment controls, no Update Hub mutations, and no privileged actions. Links are intentionally non-interactive.

## Acceptance criteria
Desktop and mobile must preserve:
- warm cream/ivory canvas with sage, blush, clay and muted earth accents
- editorial serif hierarchy with restrained sans-serif utility copy
- left owner navigation and Amanda owner identity
- Welcome Amanda header and status treatment
- large photographic AesthetiKine hero
- seven Quick Actions
- Appointments and Studio Lab feature cards
- Business Pulse metrics
- Academy programs and approved CAD prices
- LIFELINE and Eva panels
- generous spacing, soft borders, rounded cards and subtle shadows
- responsive mobile stacking without clipping or horizontal page overflow

## Approved Academy catalog
- Nervous System Reset Training — $997 CAD
- Body Sculpt Practitioner Certification — $2,497 CAD promo / $4,997 regular
- Non-Surgical BBL Training — $1,497 CAD
- Tummy Tuck Sculpt with Fat-Dissolving Injection Integration — $2,497 CAD

## Final visual QA procedure
1. Deploy the read-only mirror to the isolated Amanda preview target or access it using Vercel's automation protection bypass.
2. Capture full-page desktop at 1440px width.
3. Capture mobile at 390px width.
4. Compare section-by-section with the approved reference.
5. Correct layout, typography, image crop, spacing, card geometry and responsive defects only. Do not redesign approved content.
6. Repeat capture after corrections.
7. Lock visual baseline only when no material discrepancy remains.
8. Remove/disable the temporary public QA surface after certification.

## Gate after visual lock
Proceed to authenticated functional certification only after visual QA passes: enrollment → Stripe test checkout → stable course entitlement → portal login → course visibility; Update Hub persistence/authorization; Jane; navigation; mobile; production guards.
