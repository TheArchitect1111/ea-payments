# EA Chassis Storage Setup

The Chassis can run in local memory for demos, but production clones need persistent storage.

## Required Environment

Set these in local `.env.local` and Vercel production/preview environments:

- `AIRTABLE_API_KEY` - Airtable token with schema read and record read/write access.
- `AIRTABLE_PAYMENTS_BASE_ID` - Airtable base id for platform/chassis data.

Optional table-name overrides:

- `AIRTABLE_CHASSIS_FORMS_TABLE`
- `AIRTABLE_CHASSIS_SUBMISSIONS_TABLE`
- `AIRTABLE_CHASSIS_OBJECTS_TABLE`
- `AIRTABLE_CHASSIS_THEMES_TABLE`
- `AIRTABLE_CHASSIS_AUDIT_LOG_TABLE`
- `AIRTABLE_CHASSIS_AI_PROMPTS_TABLE`
- `AIRTABLE_CHASSIS_NAVIGATION_TABLE`
- `AIRTABLE_ENTITLEMENTS_TABLE`
- `AIRTABLE_ORGANIZATIONS_TABLE`
- `AIRTABLE_MEMBERSHIPS_TABLE`

## Required Tables

### Chassis Forms

Purpose: owner-created form schemas rendered in the portal.

Fields:

- `Form Id`
- `Organization Id`
- `Module Id`
- `Name`
- `Description`
- `Status`
- `Fields JSON`
- `Submit Label`
- `Success Message`
- `Created At`
- `Updated At`

### Chassis Submissions

Purpose: submitted portal form responses and review status.

Fields:

- `Submission Id`
- `Organization Id`
- `Form Id`
- `Module Id`
- `Status`
- `Submitter Email`
- `Data JSON`
- `Created At`
- `Updated At`

### Chassis Objects

Purpose: generic people, events, documents, opportunities, resources, and activity records.

Fields:

- `Object Id`
- `Organization Id`
- `Type`
- `Title`
- `Status`
- `Module Id`
- `Person Id`
- `Data JSON`
- `Created At`
- `Updated At`

### Chassis Themes

Purpose: tenant brand, colors, logo, and portal dashboard copy.

Fields:

- `Organization Id`
- `Organization Name`
- `Short Name`
- `Logo URL`
- `Primary Color`
- `Accent Color`
- `Background Color`
- `Portal Kicker`
- `Portal Title`
- `Portal Description`
- `Updated At`

### Chassis Audit Log

Purpose: tenant-scoped owner/admin change history for security and support.

Fields:

- `Audit Id`
- `Organization Id`
- `Actor Email`
- `Action`
- `Target Type`
- `Target Id`
- `Summary`
- `Metadata JSON`
- `Created At`

### Chassis AI Prompts

Purpose: tenant-configurable prompts, tone, and guardrails for AI-assisted features.

Fields:

- `Prompt Id`
- `Organization Id`
- `Key`
- `Name`
- `Purpose`
- `System Prompt`
- `Tone`
- `Guardrails JSON`
- `Status`
- `Updated At`

### Chassis Navigation

Purpose: tenant portal navigation labels, groups, order, and visibility.

Fields:

- `Nav Id`
- `Organization Id`
- `Module Id`
- `Label`
- `Nav Group`
- `Order`
- `Hidden`
- `Updated At`

### Entitlements

Purpose: module access toggles by organization.

Fields:

- `Organization Id`
- `Module Id`
- `Status`
- `Source`

### Organizations

Purpose: canonical organization identity records.

Fields:

- `Organization Id`
- `Name`
- `Slug`
- `Owner Email`
- `Status`

### Memberships

Purpose: user-to-organization roles and access records.

Fields:

- `Organization Id`
- `User Email`
- `Role`
- `Status`

## Verify Storage

Run:

```bash
npm run verify:chassis-storage
```

Or verify against a specific env file:

```bash
node scripts/verify-chassis-storage.mjs .env.production.local
```

Passing output means the Chassis storage contract is ready for production persistence.

## Admin Portal Check

Open:

```text
/admin/chassis
```

The Storage Readiness panel shows whether the current environment is using Airtable persistence or memory fallback.
