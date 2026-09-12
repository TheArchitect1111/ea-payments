import { readFileSync } from 'node:fs';

const standard = JSON.parse(readFileSync('config/capability-standard.json', 'utf8'));
const registry = readFileSync('lib/modules/registry.ts', 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const required = [
  'id','name','class','version','ui','routes','navigation','data','permissions',
  'dependencies','integrations','provisioning','healthCheck','tests','rollback','costLicense'
];
for (const field of required) assert(standard.requiredContractFields.includes(field), `missing contract field ${field}`);

assert(standard.openSourceAcceptanceGate.defaultOnUncertainty === 'review-required', 'open-source uncertainty must fail closed');
assert(standard.openSourceAcceptanceGate.requirements.includes('self-hostable-without-vendor-cloud-account'), 'self-host gate missing');
assert(standard.openSourceAcceptanceGate.requirements.includes('no-mandatory-per-client-or-per-user-fee'), 'per-client/user fee gate missing');
assert(standard.candidateDecisions.formbricks.decision === 'rejected', 'Formbricks must remain rejected for embedded Forms');
assert(standard.candidateDecisions.documenso.decision === 'isolated', 'Documenso must remain isolated pending integration boundary');
assert(standard.candidateDecisions.pretix.decision === 'review-required', 'pretix must remain review-required');
assert(standard.classes.core.target.includes('amplifi'), 'Amplifi must be a target standard capability');
assert(registry.includes("'amplifi'"), 'Amplifi missing from current module registry');
assert(registry.includes("'events'"), 'Events missing from current module registry');
assert(registry.includes("'calendar'"), 'Calendar missing from current module registry');

if (failures.length) {
  console.error('EA Capability Standard FAILED');
  failures.forEach((failure) => console.error(' -', failure));
  process.exit(1);
}
console.log('EA Capability Standard OK');
console.log(` - ${required.length} required capability contract fields`);
console.log(' - open-source cost/license gate is fail-closed');
console.log(' - Amplifi targeted for standard portal chassis');
