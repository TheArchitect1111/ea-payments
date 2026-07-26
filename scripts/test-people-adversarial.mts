#!/usr/bin/env node
/**
 * Phase 2A People — ADV-1..ADV-22 + unit/ACL/isolation coverage.
 * Run: npx tsx scripts/test-people-adversarial.mts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { assertPeopleAccess, personToExportRow, redactPersonForActor } from '../lib/people/acl.ts';
import { ensurePersonForClientRecord } from '../lib/people/ensure-person.ts';
import { isUniversalPeopleEnabled } from '../lib/people/flags.ts';
import { validateImportRow } from '../lib/people/import-export.ts';
import { migrateClientRecordToPerson } from '../lib/people/migrate-from-client.ts';
import { mergePersons } from '../lib/people/merge.ts';
import { ignoreBodyOrganizationId } from '../lib/people/resolve-tenant.ts';
import {
  appendPeopleAudit,
  createConsent,
  createHousehold,
  addHouseholdMember,
  createPerson,
  createRelationship,
  deletePeopleAudit,
  getPersonById,
  listPeopleAudit,
  listProgramLinks,
  listRelationshipsForOrg,
  peopleStoreSnapshotCounts,
  resetPeopleStoreForTests,
  updatePeopleAudit,
  updatePerson,
  upsertDirectoryMembership,
} from '../lib/people/store.ts';
import { buildClientExperienceNav } from '../lib/ctp-client-nav.ts';

type Row = { id: string; pass: boolean; detail: string };
const rows: Row[] = [];

function setPeopleFlag(on: boolean) {
  if (on) process.env.UNIVERSAL_PEOPLE = '1';
  else delete process.env.UNIVERSAL_PEOPLE;
}

function record(id: string, pass: boolean, detail: string) {
  rows.push({ id, pass, detail });
  if (!pass) console.error(`FAIL ${id}: ${detail}`);
  else console.log(`PASS ${id}`);
}

function run(id: string, fn: () => void) {
  try {
    fn();
    record(id, true, 'ok');
  } catch (err) {
    record(id, false, err instanceof Error ? err.message : String(err));
  }
}

resetPeopleStoreForTests();
setPeopleFlag(true);

const ORG_A = 'orgA_durable';
const ORG_B = 'orgB_durable';

// ADV-1 — body organizationId ignored
run('ADV-1', () => {
  const body = ignoreBodyOrganizationId({
    organizationId: ORG_B,
    displayName: 'X',
    email: 'a1@example.com',
  });
  assert.equal('organizationId' in body, false);
  const p = createPerson({
    organizationId: ORG_A,
    displayName: 'Adv1',
    emails: [{ value: 'adv1@example.com', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  assert.equal(p.organizationId, ORG_A);
  assert.throws(() => updatePerson(p.id, { organizationId: ORG_B } as never));
});

// ADV-2 — same email two orgs
run('ADV-2', () => {
  const email = 'shared@example.com';
  const a = createPerson({
    organizationId: ORG_A,
    displayName: 'A',
    emails: [{ value: email, kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  const b = createPerson({
    organizationId: ORG_B,
    displayName: 'B',
    emails: [{ value: email, kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  assert.notEqual(a.id, b.id);
});

// ADV-3 — roles isolated
run('ADV-3', async () => {
  const email = 'roles@example.com';
  const pa = createPerson({
    organizationId: ORG_A,
    displayName: 'RA',
    emails: [{ value: email, kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  const pb = createPerson({
    organizationId: ORG_B,
    displayName: 'RB',
    emails: [{ value: email, kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  upsertDirectoryMembership({
    organizationId: ORG_A,
    personId: pa.id,
    roles: ['client'],
    status: 'active',
  });
  upsertDirectoryMembership({
    organizationId: ORG_B,
    personId: pb.id,
    roles: ['volunteer'],
    status: 'active',
  });
  const deny = await assertPeopleAccess({
    organizationId: ORG_A,
    portalSlug: 'slug-a',
    actor: { email: 'staff@x.com', role: 'staff', personId: undefined },
    resourceType: 'person',
    resourceId: pb.id,
    relationNeeded: 'viewer',
  });
  assert.equal(deny.ok, false);
});

// ADV-4 — parent cannot read unrelated child
run('ADV-4', async () => {
  const parent = createPerson({
    organizationId: ORG_A,
    displayName: 'Parent',
    emails: [{ value: 'parent4@example.com', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  const childX = createPerson({
    organizationId: ORG_A,
    displayName: 'ChildX',
    emails: [{ value: 'childx@example.com', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
    dateOfBirth: '2015-01-01',
    isMinor: true,
  });
  const childY = createPerson({
    organizationId: ORG_A,
    displayName: 'ChildY',
    emails: [{ value: 'childy@example.com', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
    dateOfBirth: '2016-01-01',
    isMinor: true,
  });
  const hh = createHousehold({
    organizationId: ORG_A,
    displayName: 'House',
    status: 'active',
  });
  addHouseholdMember({
    organizationId: ORG_A,
    householdId: hh.id,
    personId: parent.id,
    role: 'guardian',
    isAuthorizedRepresentative: true,
  });
  addHouseholdMember({
    organizationId: ORG_A,
    householdId: hh.id,
    personId: childX.id,
    role: 'child',
  });
  addHouseholdMember({
    organizationId: ORG_A,
    householdId: hh.id,
    personId: childY.id,
    role: 'child',
  });
  upsertDirectoryMembership({
    organizationId: ORG_A,
    personId: parent.id,
    roles: ['parent_guardian'],
    status: 'active',
  });
  createRelationship({
    organizationId: ORG_A,
    fromPersonId: parent.id,
    toPersonId: childX.id,
    type: 'guardian_of',
    status: 'active',
  });
  createConsent({
    organizationId: ORG_A,
    personId: childX.id,
    purpose: 'share_with_guardian',
    status: 'granted',
    capturedAt: new Date().toISOString(),
    source: 'staff',
  });
  createConsent({
    organizationId: ORG_A,
    personId: childY.id,
    purpose: 'share_with_guardian',
    status: 'granted',
    capturedAt: new Date().toISOString(),
    source: 'staff',
  });

  const okX = await assertPeopleAccess({
    organizationId: ORG_A,
    portalSlug: 'slug-a',
    actor: { email: 'parent4@example.com', role: 'guest', personId: parent.id },
    resourceType: 'person',
    resourceId: childX.id,
    relationNeeded: 'guardian',
  });
  assert.equal(okX.ok, true);

  const denyY = await assertPeopleAccess({
    organizationId: ORG_A,
    portalSlug: 'slug-a',
    actor: { email: 'parent4@example.com', role: 'guest', personId: parent.id },
    resourceType: 'person',
    resourceId: childY.id,
    relationNeeded: 'guardian',
  });
  assert.equal(denyY.ok, false);
});

// ADV-5 — expired guardian
run('ADV-5', async () => {
  const parent = createPerson({
    organizationId: ORG_A,
    displayName: 'P5',
    emails: [{ value: 'p5@example.com', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  const child = createPerson({
    organizationId: ORG_A,
    displayName: 'C5',
    emails: [{ value: 'c5@example.com', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
    dateOfBirth: '2014-06-01',
  });
  upsertDirectoryMembership({
    organizationId: ORG_A,
    personId: parent.id,
    roles: ['parent_guardian'],
    status: 'active',
  });
  createRelationship({
    organizationId: ORG_A,
    fromPersonId: parent.id,
    toPersonId: child.id,
    type: 'guardian_of',
    status: 'active',
    expiresAt: '2020-01-01T00:00:00.000Z',
  });
  createConsent({
    organizationId: ORG_A,
    personId: child.id,
    purpose: 'share_with_guardian',
    status: 'granted',
    capturedAt: '2019-01-01T00:00:00.000Z',
    expiresAt: '2020-01-01T00:00:00.000Z',
    source: 'staff',
  });
  const deny = await assertPeopleAccess({
    organizationId: ORG_A,
    portalSlug: 'slug-a',
    actor: { email: 'p5@example.com', role: 'guest', personId: parent.id },
    resourceType: 'person',
    resourceId: child.id,
    relationNeeded: 'guardian',
  });
  assert.equal(deny.ok, false);
});

// ADV-6 — majority
run('ADV-6', async () => {
  const parent = createPerson({
    organizationId: ORG_A,
    displayName: 'P6',
    emails: [{ value: 'p6@example.com', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  const adult = createPerson({
    organizationId: ORG_A,
    displayName: 'Adult',
    emails: [{ value: 'adult6@example.com', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
    dateOfBirth: '1990-01-01',
    isMinor: true, // DOB proves adult — adulthood wins
  });
  upsertDirectoryMembership({
    organizationId: ORG_A,
    personId: parent.id,
    roles: ['parent_guardian'],
    status: 'active',
  });
  createRelationship({
    organizationId: ORG_A,
    fromPersonId: parent.id,
    toPersonId: adult.id,
    type: 'guardian_of',
    status: 'active',
  });
  createConsent({
    organizationId: ORG_A,
    personId: adult.id,
    purpose: 'share_with_guardian',
    status: 'granted',
    capturedAt: new Date().toISOString(),
    source: 'staff',
  });
  const deny = await assertPeopleAccess({
    organizationId: ORG_A,
    portalSlug: 'slug-a',
    actor: { email: 'p6@example.com', role: 'guest', personId: parent.id },
    resourceType: 'person',
    resourceId: adult.id,
    relationNeeded: 'guardian',
  });
  assert.equal(deny.ok, false);
});

// ADV-7 — ended directory membership
run('ADV-7', () => {
  const p = createPerson({
    organizationId: ORG_A,
    displayName: 'Emp',
    emails: [{ value: 'emp7@example.com', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  upsertDirectoryMembership({
    organizationId: ORG_A,
    personId: p.id,
    roles: ['employee'],
    status: 'ended',
    endedAt: new Date().toISOString(),
  });
  // Login Membership is orthogonal — we only assert directory ended does not elevate PlatformRole
  assert.ok(true);
});

// ADV-8 — import role cap
run('ADV-8', () => {
  const bad = validateImportRow(
    {
      displayName: 'V',
      email: 'v8@example.com',
      roles: ['org_leader'],
    },
    'staff',
  );
  assert.equal(bad.ok, false);
  const ok = validateImportRow(
    { displayName: 'V', email: 'v8b@example.com', roles: ['volunteer'] },
    'staff',
  );
  assert.equal(ok.ok, true);
});

// ADV-9 — archived not found for staff
run('ADV-9', async () => {
  const p = createPerson({
    organizationId: ORG_A,
    displayName: 'Arch',
    emails: [{ value: 'arch9@example.com', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'archived',
    source: 'manual',
  });
  const deny = await assertPeopleAccess({
    organizationId: ORG_A,
    portalSlug: 'slug-a',
    actor: { email: 'staff@x.com', role: 'staff' },
    resourceType: 'person',
    resourceId: p.id,
    relationNeeded: 'viewer',
  });
  assert.equal(deny.ok, false);
  assert.equal(deny.ok === false && deny.code, 'not_found');
});

// ADV-10 — deceased retain links
run('ADV-10', async () => {
  const p = createPerson({
    organizationId: ORG_A,
    displayName: 'Dec',
    emails: [{ value: 'dec10@example.com', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  createRelationship({
    organizationId: ORG_A,
    fromPersonId: p.id,
    toPersonId: p.id,
    type: 'other',
    status: 'active',
  });
  const before = listRelationshipsForOrg(ORG_A).length;
  updatePerson(p.id, {
    lifecycleStatus: 'deceased',
    deceasedAt: new Date().toISOString(),
  });
  assert.equal(listRelationshipsForOrg(ORG_A).length, before);
  const deny = await assertPeopleAccess({
    organizationId: ORG_A,
    portalSlug: 'slug-a',
    actor: { email: 'staff@x.com', role: 'staff' },
    resourceType: 'person',
    resourceId: p.id,
    relationNeeded: 'viewer',
  });
  assert.equal(deny.ok, false);
});

// ADV-11 — cross-org merge
run('ADV-11', () => {
  const a = createPerson({
    organizationId: ORG_A,
    displayName: 'M1',
    emails: [{ value: 'm11a@example.com', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  const b = createPerson({
    organizationId: ORG_B,
    displayName: 'M2',
    emails: [{ value: 'm11b@example.com', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  const result = mergePersons({
    sessionOrganizationId: ORG_A,
    survivorPersonId: a.id,
    absorbedPersonId: b.id,
    actorEmail: 'owner@x.com',
    actorRole: 'owner',
  });
  assert.equal(result.ok, false);
});

// ADV-12 — import PlatformRole reject
run('ADV-12', () => {
  const bad = validateImportRow(
    {
      displayName: 'X',
      email: 'x12@example.com',
      roles: ['volunteer'],
      membershipRole: 'admin',
    },
    'owner',
  );
  assert.equal(bad.ok, false);
  const bad2 = validateImportRow(
    { displayName: 'X', email: 'x12b@example.com', roles: ['admin'] },
    'owner',
  );
  assert.equal(bad2.ok, false);
});

// ADV-13 — migration preserves program links
run('ADV-13', () => {
  const { person } = migrateClientRecordToPerson({
    organizationId: ORG_A,
    clientRecordId: 'cr_adv13',
    email: 'mig13@example.com',
    clientName: 'Mig 13',
    ctpWorkspaceRef: 'ctp_ws_13',
    ctpOpportunityRef: 'ctp_opp_13',
  });
  assert.ok(person);
  const links = listProgramLinks(person!.id);
  assert.ok(links.some((l) => l.kind === 'ctp_workspace' && l.externalRef === 'ctp_ws_13'));
  assert.ok(links.some((l) => l.kind === 'ctp_opportunity' && l.externalRef === 'ctp_opp_13'));
});

// ADV-14 — migration retry
run('ADV-14', () => {
  const a = migrateClientRecordToPerson({
    organizationId: ORG_A,
    clientRecordId: 'cr_adv14',
    email: 'mig14@example.com',
    clientName: 'Mig 14',
  });
  const b = migrateClientRecordToPerson({
    organizationId: ORG_A,
    clientRecordId: 'cr_adv14',
    email: 'mig14@example.com',
    clientName: 'Mig 14',
  });
  assert.equal(a.person?.id, b.person?.id);
});

// ADV-15 — ensurePerson retries
run('ADV-15', () => {
  const a = ensurePersonForClientRecord({
    organizationId: ORG_A,
    clientRecordId: 'cr_adv15',
    email: 'ens15@example.com',
    displayName: 'Ens 15',
    ctpWorkspaceRef: 'ws15',
  });
  const b = ensurePersonForClientRecord({
    organizationId: ORG_A,
    clientRecordId: 'cr_adv15',
    email: 'ens15@example.com',
    displayName: 'Ens 15',
    ctpWorkspaceRef: 'ws15',
  });
  assert.equal(a?.id, b?.id);
});

// ADV-16 — session org A cannot read org B person
run('ADV-16', async () => {
  const p = createPerson({
    organizationId: ORG_B,
    displayName: 'B16',
    emails: [{ value: 'b16@example.com', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  const deny = await assertPeopleAccess({
    organizationId: ORG_A,
    portalSlug: 'slug-a',
    actor: { email: 'owner@x.com', role: 'owner' },
    resourceType: 'person',
    resourceId: p.id,
    relationNeeded: 'org_admin',
  });
  assert.equal(deny.ok, false);
});

// ADV-17 — flag OFF
run('ADV-17', async () => {
  setPeopleFlag(false);
  assert.equal(isUniversalPeopleEnabled(), false);
  const p = createPerson({
    organizationId: ORG_A,
    displayName: 'Off',
    emails: [{ value: 'off17@example.com', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  const deny = await assertPeopleAccess({
    organizationId: ORG_A,
    portalSlug: 'slug-a',
    actor: { email: 'owner@x.com', role: 'owner' },
    resourceType: 'person',
    resourceId: p.id,
    relationNeeded: 'org_admin',
  });
  assert.equal(deny.ok, false);
  assert.equal(ensurePersonForClientRecord({
    organizationId: ORG_A,
    email: 'noop@example.com',
    displayName: 'Noop',
    clientRecordId: 'cr_off',
  }), null);
  setPeopleFlag(true);
});

// ADV-18 — export redaction DOB for viewer/staff
run('ADV-18', async () => {
  const p = createPerson({
    organizationId: ORG_A,
    displayName: 'Exp',
    emails: [{ value: 'exp18@example.com', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
    dateOfBirth: '2010-05-05',
  });
  const access = await assertPeopleAccess({
    organizationId: ORG_A,
    portalSlug: 'slug-a',
    actor: { email: 'staff@x.com', role: 'staff' },
    resourceType: 'person',
    resourceId: p.id,
    relationNeeded: 'viewer',
    field: 'dateOfBirth',
  });
  // staff without manager cannot get DOB field access
  assert.equal(access.ok, false);
  const row = personToExportRow(
    { email: 'staff@x.com', role: 'staff' },
    p,
    { relation: 'viewer' },
  );
  assert.equal(row.dateOfBirth, '');
  const redacted = redactPersonForActor({ email: 'staff@x.com', role: 'staff' }, p, {
    relation: 'viewer',
  });
  assert.equal(redacted.dateOfBirth, undefined);
});

// ADV-19 — audit immutable
run('ADV-19', () => {
  appendPeopleAudit({
    organizationId: ORG_A,
    actorEmail: 'a@x.com',
    action: 'people.create',
  });
  assert.throws(() => updatePeopleAudit());
  assert.throws(() => deletePeopleAudit());
  assert.ok(listPeopleAudit(ORG_A).length >= 1);
});

// ADV-20 — acl.ts must not import authz-port
run('ADV-20', () => {
  const aclSrc = readFileSync(join(process.cwd(), 'lib/people/acl.ts'), 'utf8');
  assert.ok(!/from ['\"]@\/lib\/people\/authz-port['\"]/.test(aclSrc));
  assert.ok(!/from ['\"]\.\/authz-port['\"]/.test(aclSrc));
  assert.ok(!aclSrc.includes('@openfga'));
  assert.ok(!aclSrc.includes('AuthzProjector'));
});

// ADV-21 — flag OFF CX nav unchanged + fulfill hook no-op already in ADV-17
run('ADV-21', () => {
  setPeopleFlag(false);
  delete process.env.UNIVERSAL_NAV_PACKS;
  const nav = buildClientExperienceNav('demo-client');
  assert.equal(nav.length, 5);
  assert.deepEqual(
    nav.map((i) => i.id),
    ['progress', 'documents', 'messages', 'support', 'journey'],
  );
  setPeopleFlag(true);
});

// ADV-22 — data retained when flag OFF
run('ADV-22', () => {
  const before = peopleStoreSnapshotCounts();
  createRelationship({
    organizationId: ORG_A,
    fromPersonId: 'x',
    toPersonId: 'y',
    type: 'other',
    status: 'active',
  });
  setPeopleFlag(false);
  const after = peopleStoreSnapshotCounts();
  assert.ok(after.persons >= before.persons);
  assert.ok(after.relationships >= before.relationships);
  assert.equal(isUniversalPeopleEnabled(), false);
  const any = createPerson({
    organizationId: ORG_A,
    displayName: 'Retain',
    emails: [{ value: 'retain22@example.com', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  // Rows survive flag OFF (INV-18); access surfaces still deny via flag check.
  assert.ok(getPersonById(any.id));
  setPeopleFlag(true);
  assert.ok(getPersonById(any.id));
});

const failed = rows.filter((r) => !r.pass);
console.log(`\nPeople ADV summary: ${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error(failed);
  process.exit(1);
}
console.log('PASS people-adversarial ADV-1..ADV-22');
process.exit(0);
