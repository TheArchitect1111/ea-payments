# EACP ChatGPT Mobile Setup

This connects ChatGPT mobile to EACP through a protected GPT Action.

## Production URLs

- OpenAPI schema: `https://efficiencyarchitects.online/api/eacp/openapi`
- EACP brief launch: `https://efficiencyarchitects.online/api/eacp/chatgpt-launch`
- Field demo (site + portal + report + email): `https://efficiencyarchitects.online/api/eacp/field-demo`
- Connect finish line (ops): `https://efficiencyarchitects.online/api/eacp/connect-finish`
- Review launches: `https://efficiencyarchitects.online/admin/ea-factory/launches`

Legacy alias: `https://ea-payments.vercel.app/api/eacp/...` also works when that deployment is current.

## Required Vercel Environment Variable

Set this in Vercel Production:

```text
EACP_CHATGPT_ACTION_KEY=<long-random-secret>
```

Use the same value as the ChatGPT Action bearer token.

Also required for field demos: `AIRTABLE_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_NOTIFICATION_EMAIL`, Creative Studio table, and `ADMIN_SESSION_SECRET` / org store as for normal portal provision.

## Custom GPT Setup

1. Open ChatGPT on desktop.
2. Create or edit a custom GPT named `EA Factory Command Center`.
3. Add an Action.
4. Import the schema from:

```text
https://efficiencyarchitects.online/api/eacp/openapi
```

5. Set authentication to API key / bearer token.
6. Paste the `EACP_CHATGPT_ACTION_KEY` value.
7. Save the GPT.
8. Open that GPT from the ChatGPT mobile app.

## Suggested GPT Instructions

```text
You are EA Factory Command Center.

When the user wants a FIELD DEMO / something to SHOW a client in the room
(phrases like "field demo", "show this client", "generate a demo", "I am with a prospect"),
call launchFieldDemo.

Required for field demo:
- client (business name)
- goal

Optional: industry, notes, deliverable (defaults to Website + Portal), contactEmail.

After launchFieldDemo returns, summarize:
- siteUrl (show this first)
- reportUrl (findings)
- portalLoginUrl
- talkingPoints
- remind them to check email for the full pack

When the user gives a normal EACP packaging command (briefs only, no live site),
call launchEACPFromChatGPT instead.

Required for EACP brief launch:
- client
- goal
- deliverable

Industry is optional. Notes are strongly recommended.

Do not approve, build, deploy, or archive launches.
Do not invent URLs — only use links returned by the action.
If information is missing, ask for the missing fields instead of guessing.
```

## Phone Command Examples

### Field demo (preferred in-room)

```text
Field demo for: Acme Roofing, Atlanta.
Industry: home services.
Goal: book more estimate appointments.
They use Facebook and word of mouth; no real website.
```

### EACP brief package only

```text
EACP Client: Bob Rumball Centre
Goal: Training Transformation
Deliverable: Website + Portal + Learning Hub
Notes: Convert videos, SOPs, policies, and PowerPoints into modular learning.
```

## What field demo creates

1. EACP launch package (Factory trail)
2. Client record + portal credentials
3. Organization + package entitlements
4. Creative Studio brand profile
5. Live starter website at `/sites/{slug}`
6. Public findings report at `/demo/{slug}/report`
7. Founder email via `ADMIN_NOTIFICATION_EMAIL` with show links

## Security Notes

- The ChatGPT action cannot approve, start builds, or charge Stripe.
- Field demos are tagged `source: field-demo` in Pulse metadata and use synthetic field-demo emails when no contactEmail is provided.
- Keep `EACP_CHATGPT_ACTION_KEY` secret; rotate if exposed.
- Field demo is rate-limited per IP.
