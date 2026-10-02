# Amanda review preview environment

Configure these settings securely in Vercel **Preview**, scoped to branch
`fix/amanda-lms-locked-v2-20261002`. Never commit credentials or `.env.local`.
No production deployment or merge is authorized by this configuration guide.

| Exact name | Current use |
|---|---|
| `AMANDA_GMAIL_CLIENT_ID` | Required by the Gmail sender: OAuth client ID. |
| `AMANDA_GMAIL_CLIENT_SECRET` | Required by the Gmail sender: OAuth client secret. |
| `AMANDA_GMAIL_REFRESH_TOKEN` | Required by the Gmail sender: Amanda-authorized refresh token with Gmail send permission. |
| `AIRTABLE_PAYMENTS_BASE_ID` | Airtable base selection. Explicitly configure the approved existing Payments & Clients base; current client also has a default base ID. |
| `AIRTABLE_API_KEY` | Runtime Airtable credential with access to the configured base and `amanda_waitlist` table. Current client also supports its existing `AIRTABLE_PAT` fallback. |
| `AMANDA_GMAIL_USER` | Reserved requested setting: `Amanda@aesthetikine.com`. Not read or required by the current sender; does not select or authorize a mailbox. |

Do not create or use `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`,
`GMAIL_REFRESH_TOKEN`, `AIRTABLE_BASE_ID`, or `AIRTABLE_API_KEY_2` for this flow.
The Gmail sender uses the mailbox authorized by its OAuth refresh token. The
waitlist notification recipient is `Amanda@aesthetikine.com` in the existing
notification function. A recipient address does not authorize the sender.

Saved waitlist with failed notification counts as saved, but cannot count as verified email delivery until AMANDA_GMAIL_* live creds are added in Vercel Preview and delivery is observed in Amanda@aesthetikine.com inbox.

The current route reports notification failure after a successful durable save;
it does not report full success or verified delivery. Verify one approved test
submission in the dedicated Airtable table and recipient inbox. Authenticated
checkout, immediate learner unlock and login return require separate live QA.
