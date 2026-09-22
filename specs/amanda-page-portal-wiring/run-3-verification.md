# Amanda Catherine page-to-portal wiring: Run 3 verification

Date: 2026-09-19 UTC

Branch: `integration/amanda-page-portal-wiring-20260919`

Verified preview commit: `d070e7ea1843aefce0f24a0eca08e76ee9226a09`

Production was not modified.

## Live preview results

- Public page loaded with the approved title, navigation and content.
- All 11 public-page images loaded successfully after lazy-loaded images entered the viewport.
- The supplied RIMAN product image rendered at its natural 502 × 346 dimensions.
- The supplied Entrepreneurial Artist cover rendered at its natural 1122 × 1402 dimensions.
- Financing remained present in its approved location.
- No public link routed a visitor into an owner destination.
- Four public Academy enrollment links were present and mapped to their approved course IDs.
- All four enrollment pages loaded without a `temporarily unavailable` message.
- The Practitioner Starter Kit private checkout loaded with the approved $499 CAD price and an available checkout action.
- The student learning route redirected to `/portal/login?next=%2Fportal%2Famanda-catherine%2Flearning`.
- Each new owner destination redirected unauthenticated visitors to the private administrator sign-in with its exact return path.
- No application-origin console errors were observed. Browser-extension metadata errors were excluded because they did not originate from the preview application.

## Source and build results

- Page-to-portal parity: PASS
- Run 2 owner wiring: PASS
- Checkout configuration: PASS
- Enrollment-to-login-to-learning handoff: PASS
- Vercel Next.js preview build: READY
- Run 2 comparison changed only the owner section renderer and its test.
- Public page files, financing, imagery and Portal V2 CSS were unchanged by Runs 1–3.

## Responsive safeguards

- The public page retains its existing mobile rendering stylesheet and the approved single-column update-card breakpoint.
- Portal V2 retains its existing 900px responsive breakpoint, stacked owner shell, horizontally scrollable navigation, two-column Quick Actions and single-column content cards.
- Desktop preview showed no horizontal overflow.

## Boundary

Authenticated owner content was verified through source, successful Next.js compilation, route protection and exact return-path behavior. No administrator credentials or sign-in codes were entered during this run.
