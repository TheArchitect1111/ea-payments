import { createHash } from 'node:crypto';
import { registry } from '../lib/amanda-catherine/registry';
import { pushToTrackingPortal } from '../lib/services/trackingPortal';
import { airtableAuthHeaders, airtableConfigured, airtableQuery, AIRTABLE_BASE_ID } from '../lib/data/airtable-client';

export const TEST_EMAIL = 'test.student@amandacatherine.ca';
export const TEST_NAME = 'Test Student';
export const TEST_TAG = 'TEST RUN';
export const TEST_NOTE = 'TEST RUN - Test Student - verify links work';
export const TEST_PREFIX = 'amanda-tracking-test-';
export const fingerprint = (id: string) => createHash('sha256').update(id).digest('hex').slice(0, 32);
export const testRegistrationId = (slug: string, type: 'live' | 'waitlist') =>
  'test-student-' + fingerprint(TEST_EMAIL + ':' + slug + ':' + type);
export const testRecordKey = (slug: string, type: 'live' | 'waitlist') =>
  'experience:' + TEST_PREFIX + fingerprint(testRegistrationId(slug, type));

export async function getClasses() {
  const courses = (await registry()).courses.filter(course => !course.isTest);
  if (!courses.length) throw new Error('Refusing empty Amanda catalog');
  return courses;
}

export async function testRows() {
  if (!airtableConfigured()) throw new Error('AIRTABLE_API_KEY/AIRTABLE_PAT not configured');
  return airtableQuery(process.env.AIRTABLE_CREATIVE_STUDIO_TABLE || 'Creative Studio', {
    filterByFormula: "AND({Record Type}='Experience',FIND('amanda-tracking-test-',{Record Key})>0)",
    maxRecords: 100,
  });
}

export function parsedTestRow(row: { id: string; fields: Record<string, unknown> }) {
  let payload: Record<string, unknown>;
  try { payload = JSON.parse(String(row.fields['Payload JSON'] || '')); } catch { return null; }
  if (payload.email !== TEST_EMAIL || payload.name !== TEST_NAME ||
      payload.is_test !== true || payload.testTag !== TEST_TAG ||
      payload.record_kind !== 'amanda_tracking_test') return null;
  return { id: row.id, key: String(row.fields['Record Key'] || ''), payload };
}

async function seed() {
  const courses = await getClasses();
  const now = new Date().toISOString();
  let live = 0, waitlist = 0;
  for (const course of courses) {
    for (const type of ['live', 'waitlist'] as const) {
      const result = await pushToTrackingPortal({
        first_name: 'Test', last_name: 'Student', name: TEST_NAME,
        email: TEST_EMAIL, phone: '', client_id: 'amanda-catherine',
        class_name: course.title, class_id: course.key, registration_type: type,
        registration_id: testRegistrationId(course.key, type),
        created_at: now, source_page: '/portal/amanda-catherine#classes',
        payment_status: 'unpaid', payment_reference: null, is_test: true,
        testTag: TEST_TAG, notes: TEST_NOTE,
      } as Parameters<typeof pushToTrackingPortal>[0]);
      if (!result?.ok) throw new Error('Test seed failed: ' + course.key + ' / ' + type);
      if (type === 'live') live++; else waitlist++;
    }
  }
  console.log(`Seeded ${live} live + ${waitlist} waitlist for Test Student`);
  console.log('TEST ONLY. No payment, no course entitlement, no public emails.');
}

async function clean() {
  const courses = await getClasses();
  const keys = new Set(courses.flatMap(c => (['live', 'waitlist'] as const).map(t => testRecordKey(c.key, t))));
  const matching = (await testRows()).map(parsedTestRow).filter((x): x is NonNullable<typeof x> =>
    Boolean(x && keys.has(x.key) && x.payload.email === TEST_EMAIL));
  let deleted = 0;
  const table = encodeURIComponent(process.env.AIRTABLE_CREATIVE_STUDIO_TABLE || 'Creative Studio');
  for (const row of matching) {
    const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${table}/${row.id}`, {
      method: 'DELETE', headers: airtableAuthHeaders(),
    });
    if (!res.ok) throw new Error('Test cleanup failed for ' + row.key + ': ' + res.status);
    deleted++;
  }
  console.log(`Cleaned ${deleted} records`);
}

if (process.argv[1]?.endsWith('seed-test-student.ts')) {
  (process.argv.includes('--clean') ? clean() : seed()).catch(e => { console.error(e); process.exitCode = 1; });
}
