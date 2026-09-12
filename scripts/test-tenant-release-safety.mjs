import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (path) => readFileSync(path, 'utf8');

const pulse = read('app/api/pulse/events/route.ts');
assert.match(pulse, /guardAdminApi\(req\)/, 'Pulse reads must remain admin-only');

const billing = read('app/api/billing/portal/route.ts');
assert.match(billing, /organization\.id !== session\.orgId/, 'Billing tenant must match authenticated tenant');
assert.match(billing, /membership\.status !== 'active'/, 'Billing requires active membership');
assert.match(billing, /billing:manage/, 'Billing requires billing permission');

const resolver = read('lib/auth/resolve-portal-session.ts');
assert.match(resolver, /!hasRequiredOrganization\(session\)/, 'Portal session must require persisted tenant identity');
assert.match(resolver, /startsWith\('org_'\)/, 'Synthetic organization IDs must be recognized and rejected in production');

const capture = read('lib/capture-records.ts');
assert.match(capture, /Portal Slug/, 'Capture storage must use a dedicated tenant field');
assert.doesNotMatch(capture, /filterByFormula:\s*`OR\(\{Source\}/, 'Capture tenant query must not depend on Source');

const experience = read('lib/experience-builder/page-store.ts');
assert.doesNotMatch(experience, /syntheticOrgId/, 'Experience storage must not synthesize tenant identity');
assert.match(experience, /requires a persisted organization ID/, 'Experience storage must fail closed without persisted tenant identity');

const middleware = read('middleware.ts');
assert.doesNotMatch(middleware, /payload\.role\s*\?\?\s*['"]owner['"]/, 'Missing admin role must never default to owner');

console.log('EA Tenant Release Safety: PASS');
