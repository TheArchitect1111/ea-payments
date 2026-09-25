import assert from 'node:assert/strict'; import { readFileSync } from 'node:fs';
const l=JSON.parse(readFileSync('config/module-certification-evidence.json','utf8')); const ids=l.certificates.filter(x=>x.status==='certified').map(x=>x.moduleId);
for(const id of ['billing','events','intake','applications','reports']) assert.ok(ids.includes(id),id+' must be certified');
for(const c of l.certificates) assert.equal(Object.keys(c.evidence).length,10);
console.log('Lego certificate wave 1: PASS',ids.join(','));
