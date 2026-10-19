import fs from 'fs';
const COURSES = ['wood-therapy','non-surgical-bbl','body-sculpt-certification','nervous-system-reset','clinical-fat-loss','strategy-call'];
const data = COURSES.flatMap(c => [
  { id: `test-${c}-live`, course: c, type: 'live', name: 'Test Student', email: 'test.student@amandacatherine.ca', phone: '000-000-0000', created: new Date().toISOString() },
  { id: `test-${c}-waitlist`, course: c, type: 'waitlist', name: 'Test Student', email: 'test.student@amandacatherine.ca', phone: '000-000-0000', created: new Date().toISOString() }
]);
fs.writeFileSync('./test-student-seed.json', JSON.stringify(data, null, 2));
console.log(`✅ Wrote ${data.length} records to test-student-seed.json`);
console.log(data.map(d=>`[OK] ${d.course} ${d.type}`).join('\n'));
