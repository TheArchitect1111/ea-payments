# EA Portal Core

Shared portal infrastructure for Efficiency Architects client portals.  
**Not a UI clone** — structural patterns only.

## Quick links

- Master spec: [`docs/ea-portal-chassis-spec.md`](../docs/ea-portal-chassis-spec.md)
- Extraction guide: [`docs/claude-code/portal-core-extraction.md`](../docs/claude-code/portal-core-extraction.md)
- CPR reference: https://cpr-site.vercel.app

## Install

### Published (GitHub Packages — production)

```bash
# .npmrc in portal repo:
# @ea:registry=https://npm.pkg.github.com

npm install @ea/portal-chassis
```

See [`docs/PUBLISHING.md`](docs/PUBLISHING.md).

### Vendored in CPR (Vercel deploy)

CPR uses `file:./vendor/portal-chassis`. After chassis changes:

```bash
cd cpr-site && npm run sync-chassis
```

### Local file link (development)

```json
"@ea/portal-chassis": "file:../../ea-operating-system/portal-core"
```

Run `npm run build` in `portal-core` first.

## Build

```bash
npm install
npm run build
```

Outputs `dist/` (ESM, CJS, types).

## Exports

| Module | Path | Use |
|--------|------|-----|
| Tenant config types | `config/tenant.ts` | Brand, layout, modules, Airtable schema |
| Env helpers | `lib/env.ts` | `allowSampleData()`, production guards |
| HMAC sessions | `auth/hmac-session.ts` | CPR athlete/parent login tokens |
| HMAC middleware | `auth/hmac-middleware-factory.ts` | Protect `/portal/{role}/{slug}` routes |
| Header portal shell | `layout/HeaderPortalShell.tsx` | CPR-style tab nav without hardcoded brand |
| Admin notify | `lib/admin-notify.ts` | Resend admin alerts (messages, tickets, apply) |
| Passwords | `lib/passwords.ts` | PBKDF2 hash/verify + temp password (Edge/Node) |
| Provisioning | `lib/provisioning.ts` | `provisionPortalUser()` — create user, welcome email, login |
| Tenant env checklist | `config/tenant-env.ts` | `requiredEnvForTenant`, `checkTenantEnv`, `validateTenant` |
| Clerk login shell | `auth/ClerkShell.tsx` | SisterHub, future Clerk portals |
| Clerk middleware | `auth/middleware-factory.ts` | Protected route config |
| Sidebar layout | `layout/PortalLayout.tsx` | Clerk portals with sidebar/bottom nav |
| Airtable client | `lib/airtable-client.ts` | CRUD without SDK |
| Make webhooks | `lib/make-client.ts` | Env-driven automations |
| Resend email | `lib/resend-client.ts` | Single email gateway |
| Activity events | `lib/activity-events.ts` | Shared event contract for every module |
| Brief engine | `lib/brief-engine.ts` | Top-priority card selection for `/api/brief` |
| Brief experience | `layout/BriefExperience.tsx` | Common Brief homepage, card, timeline, quick actions |
| Mission Control engine | `lib/mission-control.ts` | Intent, focus, continue, agents, momentum |
| Mission Control UI | `layout/MissionControlExperience.tsx` | Three-zone Mission Control homepage |
| Platform events | `lib/platform-events.ts` | Unified Pulse + ActivityEvents contract |
| Agent runs | `lib/agent-events.ts` | Agent registry + publish/list |
| Design tokens | `styles/tokens.css` | Shared CSS variables |

## Unified experience contract

Every EA module publishes activity to `ActivityEvents`; every module home renders a Brief first. Product-specific pages can still exist, but global attention, search, notifications, and activity all flow through the same event shape.

```ts
import { listActivityEvents } from "@ea/portal-chassis/activity";
import { buildBriefResponse } from "@ea/portal-chassis/brief";

export async function GET() {
  const events = await listActivityEvents(process.env.AIRTABLE_BASE_ID!, "ActivityEvents", {
    organizationId: "org_ea",
    maxRecords: 100,
  });

  return Response.json(buildBriefResponse(events, {
    organizationId: "org_ea",
    userName: "Mike",
  }));
}
```

## CPR wiring example

See [`examples/cpr.middleware.example.ts`](examples/cpr.middleware.example.ts) for middleware using `createHmacPortalMiddleware`.

```tsx
import { HeaderPortalShell } from '@ea/portal-core/layout/HeaderPortalShell';

<HeaderPortalShell
  logoSrc={tenant.brand.logo}
  nameLine1="CANADIAN PROSPECTS"
  nameLine2="RECRUITMENT"
  tabs={[
    { id: 'home', label: 'Athlete Portal', href: `/portal/athlete/${slug}` },
    { id: 'amplifi', label: 'Amplifi™', href: `/portal/athlete/${slug}/amplifi` },
    { id: 'updates', label: 'Update Portal', href: `/portal/athlete/${slug}/updates` },
  ]}
  activeTabId="home"
/>
```

## CPR patterns to extract next

From `cpr-site` (HMAC auth, not Clerk):

- ~~`lib/portal-auth.ts` → `auth/hmac-session.ts`~~ ✅ v0.2
- ~~`middleware.ts` → `auth/hmac-middleware-factory.ts`~~ ✅ v0.2
- ~~`PortalShell` → `layout/HeaderPortalShell.tsx`~~ ✅ v0.2
- ~~`lib/env.ts` → `lib/env.ts`~~ ✅ v0.2
- Wire CPR to consume portal-core (copy or package import) — **next**
- Align CPR `lib/email.ts` with `resend-client.ts` + `admin-notify.ts`

## Usage (copy into portal)

1. Copy `portal-core/` into your Next.js app or symlink from monorepo
2. Configure `tenant.config.ts` (see chassis spec)
3. Set `AIRTABLE_PAT` / `RESEND_API_KEY` / webhook env vars
4. Never enable `DEMO_MODE` on production paying-client deploys

## Consumers

| Portal | Auth | Status |
|--------|------|--------|
| CPR | HMAC (custom) | Production reference |
| SisterHub | Clerk (planned) | Live site, portal-core partial |
| ea-payments client portal | Session (custom) | Launch sprint in progress |
