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
