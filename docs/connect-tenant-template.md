# Connect Tenant Template

Connect is now structured as a reusable tenant platform. A new tenant should be launched by adding configuration, not by rebuilding the product.

## Fast Duplication Path

1. Add a tenant in `lib/connect-store.ts`.
   - Use `createConnectTenantTemplate(...)` for a standard tenant.
   - Use the CPR config as the model when the tenant needs fully custom guide, journey, campaigns, and language.

2. Required tenant fields.
   - `slug`: URL key, for example `coalition`, `amanda`, `amplify-stables`, or `church-demo`.
   - `name`: public organization name.
   - `offer.headline`: capture-page promise.
   - `offer.resourceTitle`: first resource delivered after the connection.
   - `offer.promise`: short reason to connect now.
   - `redirectDestination`: where the user lands after activation.
   - `notificationEmails`: staff/admin recipients.
   - `leadTypes`: routing categories.
   - `teams`: follow-up owner categories.

3. Customize the experience.
   - Capture page: `/connect/{slug}`
   - Guide page: `/connect/{slug}/guide`
   - Journey page: `/connect/{slug}/journey`
   - QR SVG: `/api/connect/qr?org={slug}&campaign={campaignId}`
   - Tracking redirect: `/api/connect/track?org={slug}&resource={resourceId}&to={encodedUrl}`

4. Customize tenant content.
   - `guide.title`
   - `guide.intro`
   - `guide.sections`
   - `guide.faqs`
   - `journey.kicker`
   - `journey.title`
   - `journey.intro`
   - `journey.pillars`
   - `journey.events`
   - `journey.consultationCopy`

5. Customize campaigns.
   - Staff QR: personal rep code.
   - Event QR: event-specific code.
   - Location QR: placed sign or desk code.
   - NFC Destination: tap card destination.

6. Customize delivery.
   - `resources`: each guide, PDF, video, calendar link, application, or portal.
   - `sequence`: immediate and delayed follow-up steps.
   - `automationRules`: trigger/action routing.
   - `template.emailFrom`: tenant sender identity.
   - `template.emailTemplates`: welcome, follow-up, hot lead alert.
   - `template.smsTemplates`: SMS versions.

## Minimum Production Checklist

Before calling a duplicated tenant complete, verify:

- Airtable API credentials are set in Vercel Production.
- `/admin/connect/tenants` shows Tenant Storage as ready, or the `Setup Storage` button has created/repaired the tables.
- The Connect Tenants Airtable table has fields: `Slug`, `Name`, `Status`, `Config JSON`, `Created At`, `Updated At`.
- The Connect Relationships Airtable table has fields for name, email, phone, event, rep, lead type, routed team, score, and recommended action.
- Capture form submits and creates a relationship.
- Welcome email sends through Resend.
- Staff/admin notification is delivered.
- SMS sends through Twilio when a phone number is captured and Twilio env vars are configured.
- n8n automation webhook receives the `connect.relationship.created` event when configured.
- Resource tracking link redirects correctly.
- `/connect/{slug}/guide` loads with tenant copy.
- `/connect/{slug}/journey` loads with tenant copy.
- QR endpoint renders for every campaign.
- Relationship appears in the Connect dashboard.
- Airtable/DB table receives the relationship record.
- Follow-up owner/team routing is correct.

## Current Gap List

These are the remaining pieces for a full commercial template:

- Persistent tenant CRUD instead of code-only tenant configs.
- Resource upload/storage with file attachments.
- Campaign builder UI and QR download pack.
- Delayed n8n/Twilio sequence scheduling beyond the immediate capture event.
- OpenAI living relationship profile after each engagement event.
- Staff task board for follow-up completion.
- Consent/preferences language and unsubscribe handling per tenant.
- End-to-end 20-connection production test run.

## Example

```ts
const coalition = createConnectTenantTemplate({
  slug: 'coalition',
  name: 'Coalition Community Network',
  offerHeadline: 'Get the Community Welcome Kit',
  resourceTitle: 'Community Welcome Kit',
  accent: '#0f766e',
  leadTypes: ['Member', 'Volunteer', 'Donor', 'Partner'],
  teams: ['Membership Team', 'Volunteer Team', 'Development Team'],
});
```

Then add `coalition` to the `orgs` array and customize the generated guide, journey, resources, campaigns, and sequence as needed.

## Admin Creator

Use `/admin/connect/tenants` to create a tenant from the browser. If Airtable tenant storage is configured, the tenant is persisted and becomes available at:

- `/connect/{slug}`
- `/connect/{slug}/guide`
- `/connect/{slug}/journey`

If Airtable credentials are not configured, the creator still works for local/dev testing, but the new tenant is temporary and may disappear after a serverless restart.

The admin page includes a `Setup Storage` button. It creates or repairs:

- `Connect Tenants`
- `Connect Relationships`

The table names can be overridden with `CONNECT_TENANTS_TABLE`, `CONNECT_TENANTS_TABLE_ID`, `AIRTABLE_CONNECT_TENANTS_TABLE_ID`, `CONNECT_RELATIONSHIPS_TABLE`, `CONNECT_RELATIONSHIPS_TABLE_ID`, or `AIRTABLE_CONNECT_RELATIONSHIPS_TABLE_ID`.
