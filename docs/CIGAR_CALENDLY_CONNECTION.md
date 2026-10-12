# Cigar Calendly connection

## Goal and boundaries
Register signed booking updates for the existing EA Strategy Meeting account and reconcile genuine bookings that occurred before the connection existed. Restrict the interface and API to existing EA administrator authentication. Preview sync may update only TEST Cigar intake records. No change to /ctp, approved copy, questions, scoring, customer activation, or unrelated projects.

## Credential
The owner saves one server-only Secret, `CIGAR_CALENDLY_API_TOKEN`, in Vercel. Required Calendly scopes are `users:read`, `scheduled_events:read`, and `webhooks:write`. A dedicated `CIGAR_CALENDLY_WEBHOOK_SIGNING_KEY` override is retained; otherwise a private environment-specific signing key is derived using HMAC from the saved token. No credential or derived key is returned to the browser, stored in intake, or committed.

## Observable acceptance
- Unauthorized connection reads and writes fail before any provider call.
- A token for a different scheduling account is rejected.
- Signed subscriptions use user scope, the fixed EA callback for the selected environment, and invitee.created/invitee.canceled only.
- An existing exact active subscription is reused without modifying unrelated subscriptions.
- Reconciliation obtains event and invitee IDs, email, attribution, and timing from the authenticated Calendly API. Browser-provided booking IDs/times are not accepted.
- A sync requires exact persisted submission ID plus email matches and reuses the existing webhook validation and writeback path.
- Invalid signatures, unrelated bookings, non-TEST Preview records, missing provider matches, ambiguous matches, and pagination exhaustion fail safely.
- Scheduled statuses and confirmations are read back from Cigar CTP Lead Intake and the handoff dashboard before release.
- Meeting completion guard stays intact: only authorized staff can confirm an ended active scheduled meeting.

## Rollback
Keep Production activation and redirect promotion blocked on any failed acceptance. Revert this integration change and leave existing customer gates in place. No unrelated subscription, booking, or client data is deleted.

## Verification
The existing question/report regressions and the provider-test security boundary checks passed. New connection tests passed for missing credentials, admin authentication, account ownership, provider-only origins, redirect rejection, environment-separated signatures, secret-safe failures, and rejecting absent/ambiguous provider proof. No Cigar TypeScript errors appeared; 17 existing imported dependency diagnostics remained in the local narrowed project.

The Cigar workflow now runs the requested full `tsc --noEmit --skipLibCheck` command and filters by diagnostic source file to Cigar, CTP, report-email and intake. It retains every unrelated diagnostic as an artifact. Its only scoped baseline exception is the exact pre-existing `lib/ctp-production-provision.ts(61,5)` TS2820 error about `ctp.production.blocked`; no unrelated file or shared type was changed.

Actual webhook activation and real TEST booking reconciliation still require the owner’s saved Calendly token. Unit tests are not live provider evidence.

## Source documentation
- https://developer.calendly.com/docs/authentication/how-to-authenticate-with-personal-access-tokens
- https://developer.calendly.com/docs/authentication/scopes
- https://developer.calendly.com/api-docs/calendly-api/webhooks/create-webhook-subscription
- https://developer.calendly.com/api-docs/calendly-api/scheduled-events/list-scheduled-events
- https://developer.calendly.com/api-docs/calendly-api/scheduled-events/list-event-invitees
