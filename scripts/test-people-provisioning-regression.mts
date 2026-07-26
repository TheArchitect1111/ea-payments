#!/usr/bin/env node
/**
 * Phase 2A — fulfill People hook is flag-gated; OFF is no-op.
 * Run: npx tsx scripts/test-people-provisioning-regression.mts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensurePersonForClientRecord } from '../lib/people/ensure-person.ts';
import {
  peopleStoreSnapshotCounts,
  resetPeopleStoreForTests,
} from '../lib/people/store.ts';

const fulfill = readFileSync(join(process.cwd(), 'lib/fulfill-paid-client.ts'), 'utf8');
assert.ok(fulfill.includes('isUniversalPeopleEnabled'), 'fulfill should gate People on flag');
assert.ok(fulfill.includes("await import('@/lib/people/flags')"), 'dynamic import flags');
assert.ok(fulfill.includes('ensurePersonForClientRecord'), 'ensurePerson hook present');

delete process.env.UNIVERSAL_PEOPLE;
resetPeopleStoreForTests();
const before = peopleStoreSnapshotCounts();
const result = ensurePersonForClientRecord({
  organizationId: 'org_test_durable',
  email: 'x@example.com',
  displayName: 'X',
  clientRecordId: 'cr1',
});
assert.equal(result, null);
assert.equal(peopleStoreSnapshotCounts().persons, before.persons);

console.log('PASS people-provisioning-regression');
