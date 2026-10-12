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
