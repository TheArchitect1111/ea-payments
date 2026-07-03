# Creative Studio — Production Setup

Creative Studio stores campaigns, brand profiles, and media assets in a single Airtable table using JSON document rows.

## 1. Create the Airtable table

In the **Payments** base (`AIRTABLE_PAYMENTS_BASE_ID`), create a table named **Creative Studio** (or set `AIRTABLE_CREATIVE_STUDIO_TABLE` to your table name).

| Field | Type | Notes |
|-------|------|-------|
| Record Key | Single line text | Unique key: `campaign:{id}`, `brand:{orgId}`, or `media:{id}` |
| Record Type | Single select | Options: `Campaign`, `Brand`, `Media` |
| Organization ID | Single line text | Tenant id (default internal org: `ea`) |
| Title | Single line text | Display title |
| Payload JSON | Long text | Serialized campaign, brand, or media document |
| Updated At | Date | ISO timestamp; used for list sorting |

## 2. Environment variables

Add to Vercel Production (and `.env.local` for dev):

```env
AIRTABLE_API_KEY=pat_...
AIRTABLE_PAYMENTS_BASE_ID=appv0YoLIMY45fmDA
AIRTABLE_CREATIVE_STUDIO_TABLE=Creative Studio
EA_INTERNAL_ORG_ID=ea
CREATIVE_STUDIO_PORTAL_SLUG=demo-client
```

`CREATIVE_STUDIO_PORTAL_SLUG` maps the internal org to a portal slug when publishing to client portals.

## 3. Verify schema

With `LAUNCH_SETUP_KEY` set:

```bash
curl -H "x-launch-setup-key: $LAUNCH_SETUP_KEY" \
  https://ea-payments.vercel.app/api/health/setup-schema
```

The response includes `schema.creativeStudio` with `ok: true` when the table and fields exist.

## 4. M3 features (July 2026)

| Feature | Route / path |
|---------|----------------|
| Media library (URL-based) | `/admin/creative-studio/media` |
| Brand logo URL | `/admin/creative-studio/brand` |
| Media API | `GET/POST /api/creative-studio/media` |

Campaign assets support optional `mediaIds`, `thumbnailUrl`, and `renderUrl` for attaching library items in upcoming publish flows.

## 5. Fallback behavior

If Airtable is unconfigured or the table is missing, Creative Studio uses in-memory storage (data lost on cold start). Production should always have the table configured before relying on campaigns across deploys.
