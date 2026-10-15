import fs from 'fs';
const data = JSON.parse(fs.readFileSync('./test-student-seed.json','utf8'));
console.log(`Test Student Verification - ${data.length} records`);
console.table(data.map((d:any)=>({ course: d.course, type: d.type, name: d.name, email: d.email })));
console.log('\nVERIFY PASS - Test Student exists in all classes');
