import { getClasses, parsedTestRow, testRows, testRecordKey, TEST_NAME } from './seed-test-student';

export async function verifyTestStudent() {
  const courses = await getClasses();
  const rows = (await testRows()).map(parsedTestRow).filter((v): v is NonNullable<typeof v> => Boolean(v));
  let live = 0, waitlist = 0;
  const missing: string[] = [];
  let latest = '';
  for (const c of courses) {
    const counts = (['live', 'waitlist'] as const).map(t =>
      rows.filter(row => row.key === testRecordKey(c.key, t) &&
        row.payload.class_id === c.key && row.payload.class_name === c.title &&
        row.payload.registration_type === t && row.payload.name === TEST_NAME).length);
    if (counts[0] === 1) live++;
    if (counts[1] === 1) waitlist++;
    if (counts.some(n => n !== 1)) missing.push(c.key);
    console.log(`[${counts.every(n => n === 1) ? '✓' : ' '}] Class: ${c.title} [${c.key}] - Live: ${counts[0]} (Test Student) - Waitlist: ${counts[1]} (Test Student)`);
  }
  for (const row of rows) {
    const date = String(row.payload.created_at || '');
    if (date > latest) latest = date;
  }
  console.log('---');
  console.log(`TOTAL: ${live}/${courses.length} classes registered, ${waitlist}/${courses.length} waitlists registered`);
  console.log('Last run:', latest || 'none');
  console.log('STATUS:', missing.length ? 'FAIL missing: ' + missing.join(', ') : 'ALL PASS');
  if (missing.length) process.exitCode = 1;
}

if (process.argv[1]?.endsWith('verify-test-student.ts')) {
  verifyTestStudent().catch(e => { console.error(e); process.exitCode = 1; });
}
