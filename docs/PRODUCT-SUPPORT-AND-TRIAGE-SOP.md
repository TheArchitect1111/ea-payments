# Product Support, Triage, and Outcome SOP

This SOP covers Simplifi, Magnifi, and Amplifi support. It is designed for the first operator handling client issues.

## Ownership

| Area | Primary Owner | Backup | Escalate When |
|---|---|---|---|
| Capture failures | Product operator | Technical owner | API returns 500, Airtable write fails, repeated file failures |
| Missing Magnifi or Consider link | Product operator | Technical owner | Capture exists but link fields are empty or route 404s |
| Empty Amplifi hub / missing Amplifi nav | Product operator | Client success | Entitlement grant needed or capture never created |
| Login or portal access | Client success | Technical owner | Password reset/session issue affects multiple users |
| Share copy or story quality | Product operator | Founder/editor | Story is technically correct but strategically off-brand |
| Payment or onboarding handoff | Client success | Founder | Client paid but portal, email, or Make scenario did not fire |
| Monitoring alerts | Technical owner | Product operator | Error repeats, route down, webhook failing |

## Intake Checklist

Capture these details before troubleshooting:

- User name and email.
- Product: Simplifi, Magnifi, Amplifi, or portal.
- URL they were using.
- Capture ID, Consider slug, or proposal ID if visible.
- File type and file size for uploads.
- Browser/device.
- Screenshot or exact error text.
- Whether this is a client, prospect, tester, or admin.

## Failed Capture SOP

1. Ask whether the user submitted a URL or file.
2. Check if a Capture Record was created in Airtable.
3. If no record exists:
   - Ask user to retry with a smaller file or direct URL.
   - Check `/api/health/launch` for Capture Records schema health.
   - Check Sentry/logs once monitoring is active.
4. If record exists but status is `Analyzing`:
   - Wait for async completion.
   - Check `/api/capture/{id}/status`.
5. If record exists but no scores or links:
   - Mark as technical escalation.
   - Record the capture ID and source URL.

## Missing Magnifi Link SOP

1. Open `/magnifi/{captureId}`.
2. If unavailable / retired, check whether the capture exists and is not archived.
3. Open `/consider/{slug}` if the record has a Consider Slug (demo / CTP path — unchanged).
4. If Consider opens but Magnifi does not:
   - Confirm the record ID used by the Magnifi URL.
   - Confirm Airtable identifier lookup can find the capture.
   - Confirm Status is not `Archived` (archived captures intentionally stop Magnifi).
5. If neither opens:
   - Check Capture Records schema and `Share URL` / `Consider Slug`.
   - Escalate with capture ID.

## Empty Amplifi Hub SOP

Client opens `/portal/{slug}/amplifi` and sees “No Magnifi stories yet” (or no latest story CTA).

1. Confirm they are on the **correct portal slug** and signed in.
2. Confirm package entitles **Amplifi** (Simplifi / Implementation — not Website + Portal alone). See Entitlement Missing SOP if Amplifi nav is absent.
3. Ask whether they have ever captured in Simplifi for this slug.
4. If captures exist in Airtable but hub is empty:
   - Confirm Capture Records `Portal Slug` matches exactly.
   - Confirm Status is not all `Archived` (archived stories are hidden from the hub and Magnifi shows **Story retired**).
5. Guide: open Simplifi → capture a URL or note once → return to Amplifi → **Open latest Magnifi story** / **Review draft before posting**.
6. Remind: Amplifi does **not** auto-post; Magnifi links are public-by-link.

## Amplifi Entitlement Missing SOP

Client cannot see Amplifi in portal chrome, or `/portal/{slug}/amplifi` redirects to portal home.

1. Confirm product package: **Simplifi** / `simplifi_early_access` or **Implementation Package** should include `simplifi` + `amplifi`. Website + Portal Starter does **not**.
2. Mission Control → Capability Marketplace → **Entitlements** → enable `simplifi` and `amplifi` for the org (Phase 1 grant path).
3. Client hard-refreshes `/portal/{slug}` — Amplifi should appear when not on CTP Client Experience chrome.
4. Deep link check: entitled → hub loads; not entitled → redirect home (not a 500).
5. CTP Client Experience tenants: Amplifi is intentionally out of primary CX nav — do not “fix” by adding an Amplifi tab to CX.
6. Escalate if fulfillment/login backfill (`ensurePackageEntitlements`) failed after a paid Simplifi checkout.

## Retire / Unshare Sensitive Magnifi Capture

**Policy (V1):** Magnifi is **public-by-link**. Anyone with `/magnifi/{id}` can view the story until it is retired. Session-gated Magnifi is backlog after portal-ready.

**Client-facing warning:** “Anyone with the link can view this story.” (portal Amplifi hub, capture success share, Amplifi draft tool, capture-ready email, Magnifi CTA footer)

### Operator steps

1. Confirm capture ID from the Magnifi URL (`/magnifi/{id}` → `{id}`).
2. Ask where the link was shared (email, LinkedIn, SMS, etc.) and tell the client to **stop resharing**.
3. In Simplifi workspace or portal Simplifi, **Archive** the capture (or set Status = `Archived` in Capture Records).
4. Verify: open `/magnifi/{id}` in a private window → should show **Story retired** (not the cinematic story).
5. Confirm the capture is gone from the client’s active Amplifi / Simplifi lists.
6. Log: capture ID, client slug, who archived, where the link had been posted, time.

### Escalate when

- The story contains private client data that already circulated widely.
- Archive does not retire Magnifi (technical defect — escalate with capture ID + Status field value).
- Client needs a formal unpublish confirmation for compliance.

### What not to do

- Do not promise Magnifi is private or login-gated in V1.
- Do not point clients at Amplifi Communications / Postiz (not shipped).
- Do not invent alternate public URLs; prefer `/magnifi/{id}` for portal share.

## Login Or Portal Access SOP

1. Confirm whether the user is admin, partner, portal client, or guest.
2. Use the correct login route:
   - Admin: `/admin/login`
   - Portal: `/portal/login`
   - Partner: `/partners/login`
3. If password reset fails, confirm email and route used.
4. If session redirects to the wrong portal slug, escalate with email and slug.
5. Do not manually share admin-only links with clients.

## Share Issue SOP

1. Ask what they tried: native share, copied link, email, SMS, LinkedIn, browser extension, bookmarklet.
2. Confirm the shared URL opens in a private/incognito browser.
3. If the public link requires login unexpectedly, escalate access policy issue.
4. If native share fails, use copy link fallback.
5. If the preview copy is poor, route to story-quality review.

## Admin Triage SOP

Review captures daily during launch:

1. Open `/admin/simplifi` or `/admin/blueprints`.
2. Sort by newest and highest opportunity score.
3. For each new capture:
   - Confirm title and business name are reasonable.
   - Confirm Consider link opens.
   - Confirm Magnifi link opens.
   - Confirm guidance link opens.
   - Decide next action: share, follow up, archive, duplicate, or ask for review.
4. Use `Archived` only for records no longer useful.
5. Use duplicate when the same capture should be adapted for another prospect.

## Outcome Tracking SOP

Use outcomes to keep the workspace clean and useful:

| Outcome | Use When | Result |
|---|---|---|
| `in_progress` | Opportunity is active but not complete | Keeps item active |
| `won` | Opportunity converted, accepted, or moved into delivery | Removes from active queue |
| `lost` | Opportunity was pursued and declined | Removes from active queue |
| `passed` | Not worth pursuing now | Removes from active queue |
| `snooze` | Worth revisiting later | Moves due date forward |
| `archive` | No future value or duplicate noise | Hides from active workspace |

## Escalation Rules

Escalate immediately when:

- Multiple users report the same issue.
- Payment, onboarding, or access is affected.
- Public share links expose private content.
- Airtable writes fail.
- A capture is technically successful but strategically harmful to share.

## Response Templates

### Capture Failed

We found that your capture did not finish cleanly. Please send the URL or file again, and we will also check the saved record on our side.

### Link Missing

The capture was received, but the share link is not ready yet. We are checking the record and will send the correct Magnifi or Consider link as soon as it is available.

### Share Fallback

If native share does not open on your device, use Copy Link and paste it into email, SMS, or LinkedIn.

Remind the client: **Anyone with the link can view this story.** Prefer sharing the Magnifi URL (`/magnifi/{id}`), not an internal portal path.
