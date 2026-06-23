# Product Support, Triage, and Outcome SOP

This SOP covers Simplifi, Magnifi, and Amplifi support. It is designed for the first operator handling client issues.

## Ownership

| Area | Primary Owner | Backup | Escalate When |
|---|---|---|---|
| Capture failures | Product operator | Technical owner | API returns 500, Airtable write fails, repeated file failures |
| Missing Magnifi or Consider link | Product operator | Technical owner | Capture exists but link fields are empty or route 404s |
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
2. If 404, check whether the capture exists and is not archived.
3. Open `/consider/{slug}` if the record has a Consider Slug.
4. If Consider opens but Magnifi does not:
   - Confirm the record ID used by the Magnifi URL.
   - Confirm Airtable identifier lookup can find the capture.
5. If neither opens:
   - Check Capture Records schema and `Share URL` / `Consider Slug`.
   - Escalate with capture ID.

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
