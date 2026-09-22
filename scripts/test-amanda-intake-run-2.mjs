import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const middleware = readFileSync('middleware.ts', 'utf8');
const layout = readFileSync('app/portal/amanda-catherine/owner/layout.tsx', 'utf8');
const page = readFileSync('app/portal/amanda-catherine/owner/[section]/page.tsx', 'utf8');
const queue = readFileSync('app/portal/amanda-catherine/owner/OwnerApplicationQueue.tsx', 'utf8');
const statusApi = readFileSync('app/api/portal/forms/status/route.ts', 'utf8');

assert.ok(middleware.includes("'/portal/amanda-catherine/apply'"), 'Amanda apply route must be public');
for (const guard of ['verifySession', "session.slug!=='amanda-catherine'", "roleAtLeast(normalizeRole(session.role),'staff')"]) {
  assert.ok(layout.includes(guard), `owner layout is missing guard: ${guard}`);
}
assert.ok(page.includes("listPortalFormSubmissions('amanda-catherine', { kind: 'application' })"));
assert.ok(page.includes("formId === 'founder-advisory'"));
assert.ok(page.includes("formId === 'speaking-media'"));
assert.ok(page.includes("formId === 'lifeline-media-guest'"));
assert.ok(page.includes("submission.payload?.program === 'lifeline'"));
for (const status of ['submitted', 'reviewed', 'accepted', 'rejected']) assert.ok(queue.includes(`'${status}'`));
for (const detail of ['submission.email', 'submission.phone', 'submission.createdAt', 'payload?.answers', 'payload?.assetUploads']) assert.ok(queue.includes(detail));
assert.ok(statusApi.includes("roleAtLeast(normalizeRole(auth.session.role), 'staff')"));
assert.ok(statusApi.includes('portalTenant(auth.session)'));

console.log('Amanda intake Run 2: PASS');
