# EA Portal Run 1 Production Certification

**Date:** 2026-07-27  
**Environment:** Production  
**Domain:** `https://efficiencyarchitects.online`  
**Mode:** Controlled, read-only role and tenant certification  
**Visual changes:** None

## Verdict

**PASS — 13/13 production checks passed.**

## User story

A user signs in under a specific role and tenant, the session resolves authorized modules, the portal or MCC renders only permitted destinations, and cross-tenant or unauthenticated requests redirect safely.

## Production evidence

| Check | Result | Evidence |
|---|---:|---|
| Controlled demo login | PASS | HTTP 200; `demo-client`; persisted organization resolved |
| Portal role: guest | PASS | HTTP 200; 11 sidebar items |
| Portal role: viewer | PASS | HTTP 200; 11 sidebar items |
| Portal role: staff | PASS | HTTP 200; 13 sidebar items |
| Portal role: admin | PASS | HTTP 200; 13 sidebar items |
| Portal role: owner | PASS | HTTP 200; 14 sidebar items |
| Role access progression | PASS | `guest 11 <= viewer 11 <= staff 13 <= admin 13 <= owner 14` |
| Wrong-tenant route | PASS | HTTP 307 to the authenticated session tenant |
| MCC role: viewer | PASS | `/admin/master` returned HTTP 200 with a valid signed role session |
| MCC role: staff | PASS | `/admin/master` returned HTTP 200 with a valid signed role session |
| MCC role: admin | PASS | `/admin/master` returned HTTP 200 with a valid signed role session |
| MCC role: owner | PASS | `/admin/master` returned HTTP 200 with a valid signed role session |
| Public `/launch` access | PASS | HTTP 307 to `/admin/login` |

## MCC route inventory

All 18 destinations referenced by the current Operate and Build navigation registries have source pages:

### Operate

- `/admin/master`
- `/admin/delivery`
- `/admin/ctp`
- `/admin/content-requests`
- `/admin/simplifi`
- `/admin/dashboard`
- `/admin/factory`

### Build

- `/admin/ea-factory`
- `/admin/capability-marketplace`
- `/admin/workspace-preview`
- `/admin/protocol-center`
- `/admin/ea-factory/repo-library`
- `/admin/ea-factory/project-generator`
- `/admin/ea-factory/skin-factory`
- `/admin/ea-factory/codex-builder`
- `/admin/ea-factory/chassis-deployment`
- `/admin/blueprints`
- `/admin/ea-factory/launches`

## Additional boundary evidence

- Unauthenticated portal pages redirect to `/portal/login`.
- Unauthenticated MCC pages redirect to `/admin/login`.
- Unauthenticated `/api/portal/modules` requests return HTTP 401.
- The portal modules API uses tenant, role, entitlements, commerce offer, CTP-submission filtering, and grouped sidebar navigation.
- Production runtime contains no portal or MCC error cluster for the reviewed period.
- The unrelated Activity Events `AIRTABLE_PAT` configuration error remains assigned to the production-infrastructure run.

## Release conclusion

EA Portal Run 1 is certified for the tested authentication, role, navigation, tenant-isolation, CTP-access-filter, MCC-route, and protected-launch boundaries. No visual files, layout, typography, colors, images, spacing, or navigation presentation were changed.
