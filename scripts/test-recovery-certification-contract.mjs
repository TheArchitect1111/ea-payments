import fs from 'node:fs';

const required = [
  'lib/recovery/orchestrator.ts',
  'lib/recovery/types.ts',
  'scripts/test-recovery-certification.ts',
  'docs/recovery-run3-certification.md',
];
for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`missing Run 3 certification file: ${file}`);
}
const orchestrator = fs.readFileSync('lib/recovery/orchestrator.ts', 'utf8');
for (const marker of ['rollbackOnFailedVerification', 'restore_known_rollback', 'rollbackVerification', 'rollbackAdapter']) {
  if (!orchestrator.includes(marker)) throw new Error(`missing Run 3 orchestrator marker: ${marker}`);
}
console.log('Recovery Run 3 certification contract: PASS');
