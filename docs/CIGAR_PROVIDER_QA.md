# Cigar provider verification

## Intended behavior
Run the real assessment save and Resend send chain on the Cigar feature Preview without opening customer intake. The provider-test endpoint requires existing EA administrator authentication, the Preview live flag, TEST business/contact names, and explicit testOnly confirmation. Production returns 404 for this endpoint. Ordinary Preview submissions remain rejected.

The internal Preview page `/admin/cigar-ctp/provider-test` requires EA administrator access. It generates fictional TEST answers for the selected path, submits through that same protected endpoint, shows the returned identifiers, and links to the attributed Calendly meeting. Verify identifiers against the intake table and provider evidence; a rendered page alone is not delivery proof.

Signed Calendly Preview notifications may update only matched TEST records. Signature checks, attribution, email matching, cancellation handling, and production customer gates remain intact. Meeting completion still requires authorized staff and an ended active booking.

## Acceptance and rollback
- Production provider-test endpoint returns 404.
- Unauthenticated Preview provider test returns 401.
- Ordinary Preview live submission returns 503 even with the flag true.
- Two owner-designated test inboxes receive evaluation emails, with actual IDs and times recorded.
- Two actual Calendly bookings match TEST Cigar intake records through signed callbacks.
- Dashboard stages reach emailed, scheduled, then completed after test meetings end.
- Existing /ctp, questions, scoring, approved copy, and images stay unchanged.

If any boundary fails, keep Production activation and route promotion blocked and revert this QA change. No provider ID or status is supplied as evidence until observed from the provider or persisted record.

## Outstanding inputs
Two owner-designated test email addresses, authenticated EA admin session, and a signed Calendly subscription targeting the current Preview webhook URL. No credentials belong in this document or chat.

## Local verification, 2026-10-12
- Existing Cigar question/visual-source regression and report/analyzer tests passed.
- Provider QA boundary tests passed with no email or storage calls: production returns 404, ordinary Preview intake returns 503, unauthenticated provider QA returns 401, and non-TEST data returns 400.
- `npx tsc --noEmit --skipLibCheck` returned 356 diagnostics on the starting branch. No diagnostics originated in Cigar source files. The general `lib/ctp-production-provision.ts` has a pre-existing PulseEventType mismatch for `ctp.production.blocked` and was not changed.
- The narrower Cigar TypeScript project returned errors in existing Amanda access, portal navigation, experience registry, organizations, project-state, vendor capability registry, and vendor payments files; no Cigar-file diagnostics. Shared local node_modules resolves vendor packages from the original checkout, so remote clean-install/build verification is still required.
- Provider emails, actual bookings, write backs, and completed handoffs are not yet verified. These local tests do not constitute live provider evidence.
