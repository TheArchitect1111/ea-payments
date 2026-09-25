import assert from 'node:assert/strict'; import { readFileSync } from 'node:fs';
const contract=JSON.parse(readFileSync('config/module-certification-contract.json','utf8'));
const ledger=JSON.parse(readFileSync('config/module-certification-evidence.json','utf8'));
assert.equal(contract.requiredEvidenceClasses.length,10);
assert.ok(Array.isArray(ledger.certificates));
assert.match(ledger.policy,/fail-closed|only step that may promote/i);
console.log('Lego certification engine schema Run 2: PASS');
