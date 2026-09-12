import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const certifications = [
  ['run0', 'scripts/test-factory-run0-autonomous-completion.mjs'],
  ['run1', 'scripts/test-factory-run1-mass-builders.mjs'],
  ['run2', 'scripts/test-factory-run2-torture-certification.mjs'],
  ['run3', 'scripts/test-factory-run3-scale-envelope.mjs'],
];

const results = [];
for (const [run, script] of certifications) {
  const output = execFileSync(process.execPath, [join(root, script)], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, EA_FACTORY_CERTIFICATION: '1' },
  });
  results.push({ run, script, status: 'PASS', output: output.trim().split('\n').slice(-1)[0] ?? '' });
}

if (results.length !== certifications.length || results.some((item) => item.status !== 'PASS')) {
  throw new Error('Factory Run 4 final acceptance failed');
}

console.log(JSON.stringify({
  certification: 'FACTORY_RUN_4_FINAL_ACCEPTANCE',
  status: 'PASS',
  prerequisiteRuns: results,
  safetyModel: 'FAIL_CLOSED',
  externalProductionWritesRequiredForCertification: false,
  decision: 'FACTORY_CORE_MASS_PRODUCTION_READY',
}, null, 2));
