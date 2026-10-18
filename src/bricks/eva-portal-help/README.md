# Eva Portal Help Brick

Existing EA chassis add-on, not a new architecture. Routes and knowledge are tenant-scoped. Amanda is the first registered portal.

## Chassis contracts
- `health(portalId)`: `{status:200,ok:true}` on a valid manifest; `{status:503,ok:false}` on missing, corrupted, or mismatched knowledge.
- `knowledge(portalId)`: portal ID, entry count, last refresh time.
- HTTP: `GET /api/portal/{slug}/eva-help/health`.
- Help: `POST /api/portal/{slug}/eva-help` (same-portal authenticated cookie; JSON `question`, optional `entryKey` and `stepIndex`). A response contains **one** step and a direct page link. Additional steps are requested deliberately with `Next step`.
- Nonmatches return `status:unanswered` and log tenant ID, role, redacted question, reason, time. With `BLOB_READ_WRITE_TOKEN` events are written to private Blob JSON; otherwise the JSON record is emitted to server logs. Blob writes must be configured and observable in the environment.

## Role boundary
Student access is restricted to course catalog and learning controls and student-trainee course menu entries. Admins and owners use their own authenticated portal identity. Do not pass role from the browser. Never share another portal's manifest.

## Refresh and deployment
1. Audit the live navigation and source, then update only the relevant portal JSON manifest.
2. Check `menus` entry count and update the expected count in `knowledge/eva-portal-help-registry.json` when the authoritative inventory changes.
3. Run `node --import tsx scripts/test-eva-portal-help.mts` locally.
4. Restart the server or redeploy the preview. Loader also checks file modification time, but deployed serverless files are immutable until a new deployment.
5. Check `GET /api/portal/{slug}/eva-help/health` for 200, correct count, and refreshed timestamp.
6. Test authorized role access and review unanswered JSON events. No automatic live-site changes, model retraining, or menu hallucination.

## Onboard TB3 next without modifying shared TypeScript
1. Audit TB3 and create `knowledge/eva-tb3-manifest.json` in the same manifest shape, with role-scoped menus, `steps` and hrefs.
2. Register `tb3` under `portals` in `knowledge/eva-portal-help-registry.json` with `manifestFile`, validated entry count, and canonical HTTPS `origin`.
3. Wire a TB3-only entry control to the existing `/api/portal/tb3/eva-help` and existing generic UI pattern. Do **not** embed TB3 rules in `src/bricks/eva-portal-help/`.
4. Restart/redeploy and verify health, tenant isolation, permission filtering, links and unanswered logging.

## Scope and limitations
The Step 1 manifest documents 207 menu/control entries and 30 example unknown questions, including owner routes that were only source-audited, not live authenticated. Guidance labels are audit-derived, not promises of successful account-specific action. The old Amanda `/api/amanda-catherine/eva` course, booking and activity behavior remains unchanged. Some audited menu hrefs point to known broken or obsolete routes; a help response does not certify their runtime behavior. Never mistake an unauthenticated 200 health check for a successfully exercised signed-in student session.
