import assert from 'node:assert/strict'; import { readFileSync } from 'node:fs';
const l=JSON.parse(readFileSync('config/module-certification-evidence.json','utf8')); const ids=l.certificates.map(x=>x.moduleId);
for(const id of ['billing','events','intake','applications','reports']) assert.ok(ids.includes(id),id+' candidate required');
for(const c of l.certificates){assert.equal(c.status,'candidate'); assert.equal(Object.keys(c.evidence).length,10);}
console.log('Lego evidence wave 1 candidates: PASS',ids.join(','));
