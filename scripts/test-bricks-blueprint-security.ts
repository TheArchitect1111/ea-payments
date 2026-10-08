import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canAccessBlueprint } from '../lib/blueprint-ownership';
import type { BlueprintRecord } from '../lib/blueprint-store';
import type { Membership } from '../lib/memberships';

const blueprint = {
  clientId: 'blueprint-a',
  ownerOrgId: 'organization-A',
  ownerPortalSlug: 'tenant-a',
} as BlueprintRecord;
const owner = { slug: 'tenant-a', orgId: 'organization-A', email: 'owner@example.com', role: 'owner' };
const active = {
  id: 'member-a', organizationId: 'organization-A', userEmail: 'owner@example.com',
  role: 'owner', status: 'active',
} as Membership;

const cases: Array<[string, boolean, any, BlueprintRecord, Membership | null]> = [
  ['matching verified owner', true, owner, blueprint, active],
  ['missing session', false, null, blueprint, active],
  ['missing membership', false, owner, blueprint, null],
  ['tenant slug mismatch', false, { ...owner, slug: 'tenant-b' }, blueprint, active],
  ['organization mismatch', false, { ...owner, orgId: 'organization-B' }, blueprint, active],
  ['membership bound to another tenant', false, owner, blueprint, { ...active, organizationId: 'organization-B' }],
  ['different member identity', false, owner, blueprint, { ...active, userEmail: 'attacker@example.com' }],
  ['suspended membership', false, owner, blueprint, { ...active, status: 'suspended' }],
  ['viewer role', false, { ...owner, role: 'viewer' }, blueprint, active],
  ['unprivileged membership', false, owner, blueprint, { ...active, role: 'guest' }],
  ['legacy record without owner', false, owner, { ...blueprint, ownerOrgId: undefined }, active],
  ['synthetic tenant', false, { ...owner, orgId: 'org_tenant-a' }, { ...blueprint, ownerOrgId: 'org_tenant-a' }, { ...active, organizationId: 'org_tenant-a' }],
];
for (const [label, expected, actor, record, membership] of cases) {
  assert.equal(canAccessBlueprint(actor, record, membership), expected, label);
}
const read = (path: string) => readFileSync(path, 'utf8');
const routes = [
  ['GET/PATCH', 'app/api/blueprint/[clientId]/route.ts', 2],
  ['GET/POST', 'app/api/blueprint/[clientId]/vault/route.ts', 2],
];
for (const [label, path, expectedCount] of routes) {
  const source = read(path as string);
  const count = source.match(/await authorizeBlueprintRequest\(request, record\)/g)?.length || 0;
  assert.equal(count, expectedCount, label + ': every operation must call authorization');
}
const intake = read('app/api/ctp-v5/ingest/route.ts');
assert.match(intake, /delete intake\.portalAlias/);
assert.doesNotMatch(intake, /alias:\s*intake\.portalAlias/);
assert.match(read('lib/blueprint-store.ts'), /allowOverwrite:\s*false/);
const blueprintPage = read('app/blueprint/[clientId]/page.tsx');
assert.match(blueprintPage, /canAccessBlueprint\(session, record, membership\)/);
console.log('Blueprint P0 security: 12 cross-tenant/RBAC policy cases PASS; route and alias guardrails PASS');
