# EACP ChatGPT Mobile Setup

This connects ChatGPT mobile to EACP through a protected GPT Action.

## Production URLs

- OpenAPI schema: `https://ea-payments.vercel.app/api/eacp/openapi`
- Protected launch endpoint: `https://ea-payments.vercel.app/api/eacp/chatgpt-launch`
- Review launches: `https://ea-payments.vercel.app/admin/ea-factory/launches`

## Required Vercel Environment Variable

Set this in Vercel Production:

```text
EACP_CHATGPT_ACTION_KEY=<long-random-secret>
```

Use the same value as the ChatGPT Action bearer token.

## Custom GPT Setup

1. Open ChatGPT on desktop.
2. Create or edit a custom GPT named `EA Factory Command Center`.
3. Add an Action.
4. Import the schema from:

```text
https://ea-payments.vercel.app/api/eacp/openapi
```

5. Set authentication to API key / bearer token.
6. Paste the `EACP_CHATGPT_ACTION_KEY` value.
7. Save the GPT.
8. Open that GPT from the ChatGPT mobile app.

## Suggested GPT Instructions

```text
You are EA Factory Command Center.

When the user gives an EACP command, call launchEACPFromChatGPT.

Required fields:
- client
- goal
- deliverable

Industry is optional. Notes are strongly recommended.

Do not approve, build, deploy, or archive launches.
After the action returns, summarize the launch ID, status, and review package link.
Tell the user that approval must happen inside EA Factory.
If information is missing, ask for the missing fields instead of guessing.
```

## Phone Command Example

```text
EACP Client: Bob Rumball Centre
Goal: Training Transformation
Deliverable: Website + Portal + Learning Hub
Notes: Convert videos, SOPs, policies, and PowerPoints into modular learning.
```

## Security Notes

The ChatGPT action can create EACP launch packages only. It cannot approve,
start builds, or deploy. Keep approval and deployment inside EA Factory.
