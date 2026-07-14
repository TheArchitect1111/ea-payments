#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.join(process.cwd(), '.env.local');
const fileEnv = {};
try {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index < 1) continue;
    let value = line.slice(index + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    fileEnv[line.slice(0, index).trim()] = value;
  }
} catch {}
const env = { ...fileEnv, ...process.env };
const key = (env.AIRTABLE_API_KEY || env.AIRTABLE_PAT || '').trim();
const baseId = (env.AIRTABLE_PAYMENTS_BASE_ID || 'appv0YoLIMY45fmDA').trim();
const fixturePath = (env.TENANT_AUDIT_FIXTURE || '').trim();
const tables = {
  clients: 'Client Records',
  organizations: env.AIRTABLE_ORGANIZATIONS_TABLE || 'Organizations',
  memberships: env.AIRTABLE_MEMBERSHIPS_TABLE || 'Memberships',
  entitlements: env.AIRTABLE_ENTITLEMENTS_TABLE || 'Entitlements',
  captures: env.AIRTABLE_CAPTURES_TABLE || 'Capture Records',
  creativeStudio: env.AIRTABLE_CREATIVE_STUDIO_TABLE || 'Creative Studio',
};

if (!fixturePath && (!key || !baseId)) {
  console.error('BLOCKED: AIRTABLE_API_KEY/AIRTABLE_PAT is required.');
  process.exit(2);
}

const headers = { Authorization: `Bearer ${key}` };
async function readTable(table) {
  const records = [];
  let offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`);
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);
    const response = await fetch(url, { headers });
    if (!response.ok) {
      return { ok: false, status: response.status, records: [] };
    }
    const body = await response.json();
    records.push(...(body.records || []));
    offset = body.offset;
  } while (offset);
  return { ok: true, status: 200, records };
}

let results;
if (fixturePath) {
  const fixture = JSON.parse(fs.readFileSync(path.resolve(fixturePath), 'utf8'));
  results = Object.fromEntries(
    Object.keys(tables).map((name) => [
      name,
      Array.isArray(fixture[name])
        ? { ok: true, status: 200, records: fixture[name] }
        : { ok: false, status: 0, records: [] },
    ]),
  );
} else {
  results = Object.fromEntries(
    await Promise.all(Object.entries(tables).map(async ([name, table]) => [name, await readTable(table)])),
  );
}
const unavailable = Object.entries(results).filter(([, result]) => !result.ok);
if (unavailable.length) {
  for (const [name, result] of unavailable) {
    console.log(`BLOCKED ${name} table unavailable (HTTP ${result.status})`);
  }
  process.exit(2);
}

const clients = results.clients.records
  .map((record) => ({
    slug: String(record.fields['Portal Slug'] || '').trim().toLowerCase(),
    email: String(record.fields.Email || '').trim().toLowerCase(),
    status: String(record.fields['Portal Access Status'] || '').trim().toLowerCase(),
  }))
  .filter((client) => client.slug && client.status !== 'suspended');

const organizations = results.organizations.records.map((record) => ({
  id: record.id,
  slug: String(record.fields['Portal Slug'] || record.fields.Slug || '').trim().toLowerCase(),
  status: String(record.fields.Status || 'Active').trim().toLowerCase(),
}));
const orgBySlug = new Map(organizations.filter((org) => org.slug).map((org) => [org.slug, org]));
const orgIds = new Set(organizations.map((org) => org.id));
const internalOrgId = (env.EA_INTERNAL_ORG_ID || 'ea').trim();

const memberships = results.memberships.records.map((record) => ({
  orgId: String(record.fields['Organization Id'] || '').trim(),
  email: String(record.fields['User Email'] || '').trim().toLowerCase(),
  role: String(record.fields.Role || '').trim().toLowerCase(),
  status: String(record.fields.Status || '').trim().toLowerCase(),
}));
const entitlements = results.entitlements.records.map((record) => ({
  orgId: String(record.fields['Organization Id'] || '').trim(),
  status: String(record.fields.Status || '').trim().toLowerCase(),
}));

const captures = results.captures.records.map((record) => ({
  id: record.id,
  portalSlug: String(record.fields['Portal Slug'] || '').trim().toLowerCase(),
  source: String(record.fields.Source || '').trim(),
}));
const creativeStudio = results.creativeStudio.records.map((record) => ({
  id: record.id,
  orgId: String(record.fields['Organization ID'] || '').trim(),
  recordType: String(record.fields['Record Type'] || '').trim(),
}));

const missingOrganization = clients.filter((client) => !orgBySlug.has(client.slug));
const clientOwnerMissing = clients.filter((client) => {
  const org = orgBySlug.get(client.slug);
  if (!org) return false;
  return !memberships.some((membership) =>
    membership.orgId === org.id &&
    membership.email === client.email &&
    membership.role === 'owner' &&
    membership.status === 'active'
  );
});
const noActiveOwner = organizations.filter((org) =>
  org.status === 'active' &&
  !memberships.some((membership) =>
    membership.orgId === org.id &&
    membership.role === 'owner' &&
    membership.status === 'active'
  )
);
const noActiveEntitlement = organizations.filter((org) =>
  org.status === 'active' &&
  !entitlements.some((entitlement) =>
    entitlement.orgId === org.id &&
    (entitlement.status === 'active' || entitlement.status === 'trial')
  )
);
const orphanMemberships = memberships.filter((membership) => membership.orgId && !orgIds.has(membership.orgId));
const orphanEntitlements = entitlements.filter((entitlement) => entitlement.orgId && !orgIds.has(entitlement.orgId));
const portalCapturesMissingSlug = captures.filter((capture) =>
  !capture.portalSlug && /^Simplifi Portal/i.test(capture.source)
);
const syntheticCreativeStudio = creativeStudio.filter((record) => record.orgId.startsWith('org_'));
const unresolvedCtpStaging = creativeStudio.filter((record) => record.orgId.startsWith('staging_ctp_'));
const unknownCreativeStudioOrganizations = creativeStudio.filter((record) =>
  record.orgId &&
  record.orgId !== internalOrgId &&
  !record.orgId.startsWith('staging_ctp_') &&
  !record.orgId.startsWith('org_') &&
  !orgIds.has(record.orgId)
);

const anonymous = (value) =>
  `tenant-${crypto.createHash('sha256').update(value).digest('hex').slice(0, 10)}`;
const refs = (items, key) => [...new Set(items.map((item) => anonymous(item[key] || 'missing')))].slice(0, 20);

const checks = [
  ['Portal clients without an organization', missingOrganization, 'slug'],
  ['Portal client owner email without active owner membership', clientOwnerMissing, 'slug'],
  ['Active organizations without an active owner', noActiveOwner, 'id'],
  ['Active organizations without active/trial entitlements', noActiveEntitlement, 'id'],
  ['Memberships referencing a missing organization', orphanMemberships, 'orgId'],
  ['Entitlements referencing a missing organization', orphanEntitlements, 'orgId'],
  ['Historical portal captures missing Portal Slug', portalCapturesMissingSlug, 'id'],
  ['Creative Studio rows using synthetic organization IDs', syntheticCreativeStudio, 'id'],
  ['Unresolved CTP staging rows', unresolvedCtpStaging, 'id'],
  ['Creative Studio rows referencing an unknown organization', unknownCreativeStudioOrganizations, 'id'],
];

console.log('# Tenant Data Readiness Audit');
console.log('');
console.log(fixturePath ? 'Mode: FIXTURE / READ ONLY' : 'Mode: READ ONLY');
console.log(`Portal tenants: ${clients.length}`);
console.log(`Organizations: ${organizations.length}`);
console.log(`Memberships: ${memberships.length}`);
console.log(`Entitlements: ${entitlements.length}`);
console.log(`Capture records: ${captures.length}`);
console.log(`Creative Studio records: ${creativeStudio.length}`);
console.log('');
let gapCount = 0;
for (const [label, items, keyName] of checks) {
  gapCount += items.length;
  const status = items.length ? 'GAP' : 'PASS';
  console.log(`${status.padEnd(4)} ${label}: ${items.length}`);
  if (items.length) console.log(`     refs: ${refs(items, keyName).join(', ')}`);
}
console.log('');
console.log(gapCount ? `NOT READY: ${gapCount} aggregate tenant-data gaps require review.` : 'READY: no tenant-data gaps found.');
process.exitCode = gapCount ? 1 : 0;
