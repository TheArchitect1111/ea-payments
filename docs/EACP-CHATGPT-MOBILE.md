# EACP ChatGPT Mobile Setup

This connects ChatGPT mobile to EACP through a protected GPT Action.

## Production URLs

- **Phone Launch page (recommended):** `https://efficiencyarchitects.online/admin/ea-factory/launch`  
  Live status on screen after Launch. Email (`ADMIN_NOTIFICATION_EMAIL`) only when a project **starts** and when it is **ready** or **failed** — not every step.
- OpenAPI schema: `https://efficiencyarchitects.online/api/eacp/openapi`
- Factory project launch (pipeline): `https://efficiencyarchitects.online/api/launch`
- EACP brief launch: `https://efficiencyarchitects.online/api/eacp/chatgpt-launch`
- Factory projects dashboard: `https://efficiencyarchitects.online/admin/ea-factory/projects`
- Review launches: `https://efficiencyarchitects.online/admin/ea-factory/launches`

**Do not use `www.efficiencyarchitects.online` for Actions** — it often points at a different Vercel project and returns `NOT_FOUND` for `/api/launch`. The OpenAPI `servers` URL is forced to the apex host for this reason.

Legacy alias: `https://ea-payments.vercel.app/api/eacp/...` also works when that deployment is current.

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
https://efficiencyarchitects.online/api/eacp/openapi
```

5. Set authentication to API key / bearer token.
6. Paste the `EACP_CHATGPT_ACTION_KEY` value.
7. Save the GPT.
8. Open that GPT from the ChatGPT mobile app.

## Suggested GPT Instructions

```text
You are EA Factory Command Center.

When the user says Launch … (URL, company name, PDF/image note, or plain text project start),
call launchProject. Examples: "Launch https://www.bgca.org", "Launch Bob Rumball Centre",
"Launch Acme and create a complete learning ecosystem."

After launchProject returns, summarize projectId, status, timestamp, and tell them to check
Admin → EA Factory → Projects (or poll GET /api/projects/{id}).

When the user gives a normal EACP packaging command (briefs only, no live site, not "Launch"),
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

### Factory project (autonomous pipeline)

```text
Launch https://www.bgca.org
```

```text
Launch Bob Rumball Centre
Goal: training transformation
```

### EACP brief package only

```text
EACP Client: Bob Rumball Centre
Goal: Training Transformation
Deliverable: Website + Portal + Learning Hub
Notes: Convert videos, SOPs, policies, and PowerPoints into modular learning.
```

## Security Notes

The ChatGPT action can create Factory projects and EACP launch packages only. It cannot approve,
start builds, or deploy. Keep approval and deployment inside EA Factory.
