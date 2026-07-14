import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const audit = join(root, 'scripts', 'audit-tenant-data-readiness.mjs');
const temporary = mkdtempSync(join(tmpdir(), 'ea-tenant-audit-'));

function runFixture(name, fixture) {
  const fixturePath = join(temporary, name + '.json');
  writeFileSync(fixturePath, JSON.stringify(fixture), 'utf8');
  return spawnSync(process.execPath, [audit], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, AIRTABLE_API_KEY: '', AIRTABLE_PAT: '', TENANT_AUDIT_FIXTURE: fixturePath },
  });
}

const record = (id, fields) => ({ id, fields });
const ready = {
  clients: [record('client-alpha', { 'Portal Slug': 'alpha', Email: 'owner@example.invalid', 'Portal Access Status': 'Active' })],
  organizations: [record('recOrgAlpha', { 'Portal Slug': 'alpha', Status: 'Active' })],
  memberships: [record('membership-alpha', { 'Organization Id': 'recOrgAlpha', 'User Email': 'owner@example.invalid', Role: 'owner', Status: 'active' })],
  entitlements: [record('entitlement-alpha', { 'Organization Id': 'recOrgAlpha', Status: 'active' })],
  captures: [record('capture-alpha', { 'Portal Slug': 'alpha', Source: 'Simplifi Portal alpha' })],
  creativeStudio: [
    record('studio-alpha', { 'Organization ID': 'recOrgAlpha', 'Record Type': 'Experience' }),
    record('studio-internal', { 'Organization ID': 'ea', 'Record Type': 'Internal' }),
  ],
};

const readyResult = runFixture('ready', ready);
assert.equal(readyResult.status, 0, readyResult.stderr || readyResult.stdout);
assert.match(readyResult.stdout, /Mode: FIXTURE \/ READ ONLY/);
assert.match(readyResult.stdout, /READY: no tenant-data gaps found\./);
assert.doesNotMatch(readyResult.stdout, /owner@example\.invalid|alpha/);

const gaps = {
  clients: [...ready.clients, record('client-bravo', { 'Portal Slug': 'bravo', Email: 'bravo@example.invalid', 'Portal Access Status': 'Active' })],
  organizations: [...ready.organizations, record('recOrgBeta', { 'Portal Slug': 'beta', Status: 'Active' })],
  memberships: [...ready.memberships, record('membership-orphan', { 'Organization Id': 'recMissingMembershipOrg', 'User Email': 'nobody@example.invalid', Role: 'viewer', Status: 'active' })],
  entitlements: [...ready.entitlements, record('entitlement-orphan', { 'Organization Id': 'recMissingEntitlementOrg', Status: 'active' })],
  captures: [...ready.captures, record('capture-legacy', { Source: 'Simplifi Portal legacy' })],
  creativeStudio: [
    ...ready.creativeStudio,
    record('studio-synthetic', { 'Organization ID': 'org_legacy', 'Record Type': 'Experience' }),
    record('studio-staging', { 'Organization ID': 'staging_ctp_example', 'Record Type': 'CTP Submission' }),
    record('studio-unknown', { 'Organization ID': 'recUnknownOrg', 'Record Type': 'Experience' }),
  ],
};

const gapResult = runFixture('gaps', gaps);
assert.equal(gapResult.status, 1, gapResult.stderr || gapResult.stdout);
for (const expected of [
  'GAP  Portal clients without an organization: 1',
  'GAP  Active organizations without an active owner: 1',
  'GAP  Active organizations without active/trial entitlements: 1',
  'GAP  Memberships referencing a missing organization: 1',
  'GAP  Entitlements referencing a missing organization: 1',
  'GAP  Historical portal captures missing Portal Slug: 1',
  'GAP  Creative Studio rows using synthetic organization IDs: 1',
  'GAP  Unresolved CTP staging rows: 1',
  'GAP  Creative Studio rows referencing an unknown organization: 1',
]) {
  assert.ok(gapResult.stdout.includes(expected), expected);
}
assert.match(gapResult.stdout, /NOT READY: 9 aggregate tenant-data gaps require review\./);
assert.doesNotMatch(gapResult.stdout, /bravo@example\.invalid|nobody@example\.invalid|recUnknownOrg|org_legacy|staging_ctp_example/);

const blockedResult = spawnSync(process.execPath, [audit], {
  cwd: root,
  encoding: 'utf8',
  env: { ...process.env, AIRTABLE_API_KEY: '', AIRTABLE_PAT: '', TENANT_AUDIT_FIXTURE: '' },
});
assert.equal(blockedResult.status, 2);
assert.match(blockedResult.stderr, /BLOCKED: AIRTABLE_API_KEY\/AIRTABLE_PAT is required\./);

rmSync(temporary, { recursive: true, force: true });
console.log('Tenant data audit tests passed.');
