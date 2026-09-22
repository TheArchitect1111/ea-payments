# Amanda Catherine page-to-portal wiring: Run 0 contract

Status: approved mapping baseline for preview implementation. No production deployment.

## Non-negotiable boundaries

- Preserve the approved public-page design, copy, navigation, imagery, section order and financing placement.
- Preserve the frozen Portal V2 design and existing owner navigation styling.
- Public visitors and students must never be routed into `/portal/amanda-catherine/owner`.
- Owner destinations mirror Amanda's operating areas; they are not public offer landing pages.
- Do not guess external URLs, credentials, payment availability or entitlement state.
- Complete and verify all wiring in an isolated preview before any production decision.

## Audience and entry routes

| Audience | Entry route | Intended result |
|---|---|---|
| Public visitor | `/amanda-catherine` | Review offerings and select an approved action. |
| New student | `/portal/amanda-catherine/enroll?course={courseId}` | Select payment option and begin secure enrollment for the chosen course. |
| Returning student | `/portal/login?next=%2Fportal%2Famanda-catherine%2Flearning` | Authenticate and return to Amanda's learning area. |
| Authenticated student | `/portal/amanda-catherine/learning` | See entitled Amanda courses and course resources. |
| Amanda as owner | `/portal/amanda-catherine/owner` | Operate the business through the frozen Portal V2 dashboard. |

## Public action contract

| Public area or offering | Approved public action | Destination type | Owner mirror |
|---|---|---|---|
| Restore / appointments | Open Jane and manage appointments | External Jane URL from site content, with the verified Jane fallback | `owner/appointments` |
| AesthetiKine Academy courses | Enroll in the selected course | `/portal/amanda-catherine/enroll?course={courseId}` | `owner/academy` |
| Already enrolled | Sign in and continue learning | `/portal/login?next=%2Fportal%2Famanda-catherine%2Flearning` | `owner/academy` |
| BODY SCULPT Practitioner Starter Kit | Purchase the kit | `/amanda-catherine/private/practitioner-kit` | New `owner/practitioner-kit` destination required in Run 1 |
| RIMAN Canada | Shop Amanda's Canadian storefront | Existing approved external RIMAN Canada URL | `owner/riman` |
| The Entrepreneurial Artist | Buy the book on Amazon | Existing approved Amazon URL | New `owner/book` destination required in Run 1 |
| Founder Advisory | Apply by email | Approved Amanda email with the `Founder Advisory application` subject | `owner/advisory` |
| Founder Clarity Session | Included under Founder Advisory; do not add a duplicate public CTA in Run 1 | Existing advisory inquiry pathway | `owner/clarity` |
| Speaking | Book Amanda to speak by email | Approved Amanda email with the `Book Amanda to Speak` subject | `owner/speaking` |
| LIFELINE LIVE | Watch, apply, download the kit, book an interview or explore a partnership | Existing approved external resources and Amanda email actions | `owner/lifeline` |
| Empower Art Collective | Explore programs, events, volunteering and support | Existing approved Empower Art Collective external URLs | New `owner/empower-art` destination required in Run 1 |
| Reviews and testimonials | View Google and approved social proof | Existing approved external review and social URLs | `owner/reviews` |
| Contact | Email, telephone or Jane | Existing approved contact values | `owner/clients` and `owner/appointments` as internal operating mirrors only |

## Course contract

The public Academy currently exposes four self-enrollment offers, all of which have matching course IDs and learning definitions:

1. `aesthetikine-reset-training`
2. `body-sculpt-practitioner-certification`
3. `non-surgical-bbl-training`
4. `wood-therapy-certification`

`Non-Surgical Tummy Tuck Sculpt with Fat Dissolving Injections` exists in the offer catalog but has no `courseId`; it must not be added to self-enrollment or the public course grid until Amanda supplies/approves the missing course definition and enrollment behavior.

## Run 1 implementation scope

1. Add owner destinations for `Empower Art Collective`, `The Entrepreneurial Artist` and `Practitioner Starter Kit` using the existing frozen Portal V2 component and styling patterns.
2. Add those three destinations to the owner menu and Quick Actions without changing the approved visual system.
3. Keep all current public CTA destinations unchanged unless a verified route test fails.
4. Add a machine-checkable parity assertion covering public business areas, owner destinations and protected audience boundaries.

## Completion evidence for Run 0

- Every approved public offering has an explicit next action and an internal owner mirror.
- Student enrollment, login and learning routes are separated from owner routes.
- The three missing owner destinations are named and bounded.
- The catalog-only tummy-tuck offer is explicitly excluded from self-enrollment until its missing course contract is approved.
- Production and the frozen Portal V2 runtime files remain unchanged in Run 0.
