# Cigar CTP production activation checklist

## Required manual Vercel setting

The Vercel project environment API returned `403 forbidden` for `ea-payments`, and the current execution environment has no Vercel CLI, `VERCEL_TOKEN`, or checked-out `.vercel` configuration. No value has been written or assumed.

In the Vercel project for `ea-payments`, set this exact variable for **Production** only:

- Key: `CIGAR_CTP_LIVE_SUBMISSIONS_ENABLED`
- Value: `true`
- Environment: `Production`

Do not enable customer submissions until two Resend test emails and two real Calendly test bookings have been verified and logged in this file or the release record. Then redeploy production so the runtime receives the variable.

## Release proof to append

- Production deployment URL and commit SHA:
- `/ctp` preserved and verified:
- `/ctp/cigar` verified:
- Cigar CTP intake record IDs:
- Resend message IDs and sent timestamps:
- Calendly booking IDs and matched CTP record IDs:
- Handoff status transitions:
- Desktop 1440x900 check:
- Mobile 390x844 check:


## Current verified state (2026-10-12)

- Cigar questions and report analyzer regression tests passed in GitHub Actions run 38309251089.
- Desktop and mobile browser verification passed in the same run. The test checked 30 questions in each of the brand, lounge, and distributor paths at 1440x900 and 390x844, 35 unique image sources, loaded images, and `object-fit: contain`.
- Vercel built feature branch commit `0e629e27919da059f265ba8cd5761395fec9f1a7` successfully. Preview route `/ctp/cigar` returned the Cigar CTP in preview mode.
- The Cigar Preview QA workflow's broad TypeScript step failed on existing unrelated errors in Amanda, portal navigation, capability registry, organizations, project state, and vendor registry files. The same workflow had already failed on commit `d92e1cc7c7b2fd2fbb6c6a44bbea9ee2f7f2c31a` before this run. The browser job was allowed to run independently and passed.
- Airtable base `appv0YoLIMY45fmDA` contains the dedicated `Cigar CTP Lead Intake` table and `Report Notes JSON` field. Added `Resend Message ID` for provider delivery logging. No QA or customer row was created in that table during this run.
- Production `https://cc.efficiencyarchitects.online/ctp` currently serves the existing Contract Center app. `/ctp/cigar` currently serves the same app shell.
- A path-specific 307 route from `/ctp/cigar` to `https://app.efficiencyarchitects.online/ctp/cigar` is staged on the Contract Center Vercel project as route version `5adea48f-8f74-4f3d-938c-1764f227e359`. It is not promoted. The rule does not match `/ctp`.
- Vercel environment listing returned 403. The current environment has no Vercel CLI, `VERCEL_TOKEN`, or local repository checkout. No live flag was set.
- No Resend test emails or Calendly test bookings were sent or created, so there are no message IDs, booking IDs, or handoff status transitions to report. Do not promote the staged route or merge/deploy the live workflow until those end-to-end provider checks pass.

## Remaining release proof

- Two Resend test message IDs and send timestamps:
- Two actual Calendly booking IDs, matched CTP record IDs, and confirmation results:
- Handoff status transitions for both bookings:
- Production deployment URL and commit SHA:
- `/ctp` preserved and verified after route promotion:
- `/ctp/cigar` verified after route promotion:
- Final live route screenshot:

## Provider TEST evidence, 2026-10-12 22:17 UTC

- Vercel Dashboard confirmed `CIGAR_CTP_LIVE_SUBMISSIONS_ENABLED` is assigned to Preview only. Production remains unset.
- Preview source `f33aef243b6cb563851965495b4032a0ffc1e630` deployed READY at `https://ea-payments-8mu2r7sg6-the-architects-projects-cc813778.vercel.app`.
- Authenticated EA admin ran two synthetic TEST assessments through the protected Preview provider-test flow. Both records are in `Cigar CTP Lead Intake`, table `tblPMCjQ2rXocwLZM`, base `appv0YoLIMY45fmDA`.
- TEST brand: record `rectwRfaIFmHt2owC`, submission `CIGAR-bbe7d721-ff23-4b07-b1bc-2941f925ad6d`, actual Resend message ID `01a13230-b8ae-7998-8aed-d9c123e113f7`, sent at `2026-10-12T22:16:56.288Z`.
- TEST lounge: record `recsVY5YOMIlEg7NN`, submission `CIGAR-9eb5c644-4380-4f2a-81bf-e35cca23b5f9`, actual Resend message ID `01a13230-e884-7d4b-92b9-c300484db4fa`, sent at `2026-10-12T22:17:08.532Z`.
- Airtable readback confirmed both stored provider IDs, timestamps, TEST labels, roles, and `emailed` workflow states. Resend acceptance is verified; delivered/inbox receipt is NOT yet verified.
- GitHub run `38313207208` passed question, report, provider-boundary, and desktop/mobile browser tests. Its TypeScript step failed on previously documented unrelated dependencies. No Cigar-file TypeScript diagnostics appeared in local scoped checks.
- Calendly publicly shows the linked `30min` URL as `15 Minute Strategy Meeting`, 15 minutes. Two attributed TEST forms are prepared for October 13, 2026 at 09:00 and 09:30 America/New_York; neither was submitted because the final Schedule Event action explicitly accepts Calendly Participant Terms and awaits action-time confirmation.
- No actual booking IDs exist yet. Cigar Calendly signing-key environment configuration is absent, so automatic signed booking write back is not verified.
- `/ctp` and `/ctp/cigar` still return the same Contract Center shell. The path-specific redirect remains staged; no production activation or merge has occurred.

## Confirmed TEST bookings and delivery, 2026-10-12 22:25 UTC

- Owner confirmed receipt of both TEST evaluation emails and receipt of a Calendly appointment invitation in the conversation.
- After owner accepted Calendly Participant Terms, both Schedule Event submissions succeeded and each Calendly page displayed `You are scheduled!`.
- TEST brand actual invitee booking ID: `06d898b0-6038-417a-84a8-6783e381c0d6`. Calendly confirmation URL: `https://calendly.com/freedom-efficiencyarchitects/30min/invitees/06d898b0-6038-417a-84a8-6783e381c0d6`. Time: `2026-10-13T13:00:00Z` to `2026-10-13T13:15:00Z` (09:00 to 09:15 America/New_York). Matches TEST brand intake record `rectwRfaIFmHt2owC` via the submitted attributed booking link.
- TEST lounge actual invitee booking ID: `3d3c8f6a-f974-452e-9e87-1dbc9b24d20a`. Calendly confirmation URL: `https://calendly.com/freedom-efficiencyarchitects/30min/invitees/3d3c8f6a-f974-452e-9e87-1dbc9b24d20a`. Time: `2026-10-13T13:30:00Z` to `2026-10-13T13:45:00Z` (09:30 to 09:45 America/New_York). Matches TEST lounge intake record `recsVY5YOMIlEg7NN` via the submitted attributed booking link.
- Automatic write back FAILED: Airtable readback and the authenticated handoff dashboard still show both records as `emailed`, `Not booked`, and `Not confirmed`. No scheduled/completed status has been manually fabricated.
- The missing Cigar signed Calendly connection remains the next blocker. Google sign-in for Calendly was selected by the owner in the secure authentication prompt, but automatic approval review rejected the next Google OAuth action because the Calendar access scope was not specifically authorized. The sign-in has not completed; no authorization bypass was attempted.
- Meeting completion cannot be confirmed in production before an active scheduled meeting has ended. These real TEST meetings are on October 13. The existing completion guard remains intact.
- Production activation, path-specific redirect promotion, and PR merge remain blocked until write back and handoff verification pass.


## Booking polling acceptance, October 12

Owner saved the Preview Calendly token. The redeployed Preview verified both actual bookings and wrote `scheduled`, `active`, meeting start/end, and confirmation timestamps to Cigar CTP Lead Intake:

- `rectwRfaIFmHt2owC`: event `9b0b2d7f-6f4d-4976-a7e5-8a142cd328c2`, invitee `06d898b0-6038-417a-84a8-6783e381c0d6`, October 13 13:00 to 13:15 UTC. Confirmation persisted October 12 22:55:24.004 UTC.
- `recsVY5YOMIlEg7NN`: event `515c5d65-0020-42c8-8c36-b5c3cb5b0d46`, invitee `3d3c8f6a-f974-452e-9e87-1dbc9b24d20a`, October 13 13:30 to 13:45 UTC. Confirmation persisted October 12 22:55:22.526 UTC.

Webhook subscription access returned 403. The authenticated read API worked. No subscription success is claimed. The Cigar-only polling fallback checks at most ten pending leads every five minutes in Production, sorted by last check time. The same worker is accessible to administrators on Preview, for TEST records only. Existing invitees are read directly so cancellations and reschedules are observed from provider data. Missing matches and API errors never imply cancellation. Completed records remain completed. The polling job requires CRON_SECRET; Production already has this secret configured.

Added intake fields: Booking Checked At (`fldSNwFwnZ3c0JhNt`), Booking Sync Error (`fldVVPgNi4s5s9Nf0`), Confirmation Message ID (`fldaT5MPLnkEiQPmd`). Evaluation message IDs remain unchanged. Existing confirmation IDs were not captured and must not be invented. New confirmation sends persist the real returned message ID and use Resend's 24-hour idempotency key window. Confirmed bookings do not resend. If provider send succeeds but Airtable persistence remains unavailable beyond 24 hours, operator reconciliation is required before retrying to avoid a duplicate.

Acceptance: offline polling tests must pass; deployed Preview polling must check both real TEST bookings without another confirmation; Airtable check timestamps and unchanged scheduled statuses must be read back. No meeting is auto-completed. Real completed handoff remains pending because both meetings are in the future. Production flag and Calendly token remain Preview-only until authorized release gates pass. No merge, Production activation, redirect promotion, or WORKFLOW LIVE is claimed by this source change.

Rollback: remove the Cigar booking cron entry or unset the Cigar live flag. Preserve the general /ctp route and all other jobs. Do not remove or fabricate existing test evidence.
