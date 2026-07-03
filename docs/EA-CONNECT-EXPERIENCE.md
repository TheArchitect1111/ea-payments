# EA Connect Experience MVP

EA Connect Experience uses the existing Next.js app, admin auth, Airtable base, Resend email path, Pulse bus, and Simplifi capture records. It does not create a separate account system.

## Routes

- Public: `/connect/[slug]`
- Admin dashboard: `/admin/connect`
- Profiles: `/admin/connect/profiles`
- New profile: `/admin/connect/profiles/new`
- Edit profile: `/admin/connect/profiles/[id]`
- Public API: `/api/connect/[slug]`, `/api/connect/submit`
- Admin API: `/api/connect/admin`, `/api/connect/export`

## Airtable Tables

Default table names:

- `connect_profiles`
- `connections`

Override with:

- `AIRTABLE_CONNECT_PROFILES_TABLE`
- `AIRTABLE_CONNECTIONS_TABLE`

Both tables live in `AIRTABLE_PAYMENTS_BASE_ID` and use `AIRTABLE_API_KEY` or `AIRTABLE_PAT`.

### connect_profiles fields

`owner_user_id`, `slug`, `brand_name`, `logo_url`, `primary_color`, `headline`, `subheadline`, `cta_text`, `default_destination_url`, `destinations`, `resources`, `welcome_email_subject`, `welcome_email_body`, `owner_notification_email`, `is_active`, `created_at`, `updated_at`

Store `destinations` and `resources` as long text JSON arrays.

### connections fields

`connect_profile_id`, `owner_user_id`, `name`, `email`, `phone`, `company`, `role`, `location`, `notes`, `campaign`, `referral_source`, `utm_source`, `utm_medium`, `utm_campaign`, `connection_method`, `device`, `browser`, `ai_industry`, `ai_connection_type`, `ai_opportunity_type`, `ai_priority`, `ai_recommended_follow_up`, `ai_recommended_destination`, `ai_suggested_resource`, `ai_watch_list_match`, `ai_relationship_score`, `destination_url`, `automation_status`, `created_at`, `updated_at`

## Automations

`triggerConnectAutomations()` attempts:

- Welcome email when profile welcome fields are present
- Owner notification email using `owner_notification_email`, otherwise admin notification fallback
- Task/follow-up placeholder
- Pulse event through `emitPulseEvent`
- Simplifi opportunity through `createCaptureRecord`
- Relationship timeline placeholder

Failures do not block submission. The connection receives a summarized `automation_status`.

## Smoke Verification

Run against local or deployed app:

```bash
CONNECT_SMOKE_BASE_URL=https://ea-payments.vercel.app CONNECT_SMOKE_SLUG=your-slug npm run test:connect-mvp
```

This creates one real connection record for the selected profile.
