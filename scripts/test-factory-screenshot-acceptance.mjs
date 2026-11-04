import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const root = process.cwd();
const resume = process.argv.indexOf('--resume');
const only = process.argv.find(arg=>arg.startsWith('--only='))?.slice(7).split(',');
const pattern = process.argv.find(arg=>arg.startsWith('--test-name-pattern='));
const output = resume >= 0 ? resolve(process.argv[resume+1]) : join(tmpdir(), `ea-screenshot-consolidated-${Date.now()}`);
mkdirSync(output, { recursive: true });
const report = resume >= 0 ? JSON.parse(readFileSync(join(output,'report.json'),'utf8')) : { startedAt: new Date().toISOString(), branch: 'work/ayf-chassis-20261103', output, jobs: [], configuration: null };
const inspect = spawnSync(process.execPath, ['-e', `
  require('@next/env').loadEnvConfig(process.cwd(),true,{info(){},error(){}});const e=process.env;
  console.log(JSON.stringify({vision:!!(e.ANTHROPIC_API_KEY||e.CLAUDE_API_KEY),airtable:!!(e.AIRTABLE_API_KEY||e.AIRTABLE_PAT),
    peopleCredentials:!!((e.PEOPLE_SUPABASE_URL||e.SUPABASE_URL)&&(e.PEOPLE_SUPABASE_API_KEY||e.PEOPLE_SUPABASE_ANON_KEY)&&(e.PEOPLE_SUPABASE_JWT_SECRET||e.PEOPLE_SUPABASE_KEY||e.PEOPLE_SUPABASE_APP_KEY)),
    peopleEnabled:/^(1|true|on|yes)$/i.test(e.UNIVERSAL_PEOPLE||''),peoplePersistEnabled:/^(1|true|on|yes)$/i.test(e.UNIVERSAL_PEOPLE_PERSIST||''),
    remoteVerifier:!!(e.EA_SCREENSHOT_VERIFIER_URL&&e.EA_SCREENSHOT_VERIFIER_SECRET)}));`], { cwd: root, encoding: 'utf8' });
if (inspect.status === 0) report.configuration = JSON.parse(inspect.stdout.trim());
const env = { ...process.env, FORCE_COLOR: '0' };
// Fixture suites never inherit permission to call a configured live provider.
for (const key of ['OPENAI_API_KEY','ANTHROPIC_API_KEY','CLAUDE_API_KEY','AIRTABLE_API_KEY','AIRTABLE_PAT',
  'EA_SCREENSHOT_VERIFIER_URL','EA_SCREENSHOT_VERIFIER_SECRET','UNIVERSAL_PEOPLE','UNIVERSAL_PEOPLE_PERSIST',
  'PEOPLE_SUPABASE_URL','PEOPLE_SUPABASE_API_KEY','PEOPLE_SUPABASE_ANON_KEY','PEOPLE_SUPABASE_JWT_SECRET','PEOPLE_SUPABASE_KEY','PEOPLE_SUPABASE_APP_KEY']) delete env[key];
const prefix = ['--require', resolve(root,'tests/fixtures/network-offline.cjs'), '--import', 'tsx'];
function run(name, args, { offline = true, timeout = 180000 } = {}) {
  if(only && !only.includes(name))return;
  const started = Date.now();
  const selectedArgs = pattern && name === 'behavioral' ? [args[0],pattern,...args.slice(1)] : args;
  const child = spawnSync(process.execPath, [...(offline ? prefix : []), ...selectedArgs], { cwd: root, env, encoding: 'utf8', timeout, maxBuffer: 12 * 1024 * 1024, windowsHide: true });
  const previous = report.jobs.find(job=>job.name===name);
  const attempt = previous ? (previous.attempt || 1) + 1 : 1;
  const log = join(output, `${name}${attempt>1?`-attempt${attempt}`:''}.log`);
  const text = (child.stdout || '') + (child.stderr || '') + (child.error ? `\n${child.error.message}` : '');
  writeFileSync(log, text);
  const result = { name, attempt, command: `node ${[...(offline ? prefix : []), ...selectedArgs].join(' ')}`, status: child.status === 0 ? 'PASS' : 'FAIL', exitCode: child.status,
    ...(pattern && name==='behavioral'?{scope:pattern,coverageNote:'Targeted repair; unchanged passing cases retained in previous attempt logs'}:{}),
    durationMs: Date.now() - started, log, ...(name === 'types' ? { diagnosticCount: (text.match(/error TS\d+/g) || []).length } : {}) };
  if(previous) { result.history=[...(previous.history||[]),{status:previous.status,log:previous.log}];report.jobs[report.jobs.indexOf(previous)]=result; }
  else report.jobs.push(result);
  console.log(`${result.status} ${name} (${result.durationMs}ms) ${log}`);
  writeFileSync(join(output,'report.json'), JSON.stringify(report,null,2));
}
run('behavioral', ['--test','tests/factory-screenshot-build.test.mts','tests/chassis-autowire.test.mts','tests/blockers-certified.test.mts','tests/capture-family.test.mts','tests/capture-customer-routes.test.mts']);
for (const name of ['factory-production','factory-capability-registry','factory-orchestrator','factory-project-context','universal-quick-launch',
  'production-protection','tenant-release-safety','release-guardrails','master-guard-contract','system-registry','tenant-safety',
  'lego-strict-authority','lego-final-acceptance','airtable-read-hardening','factory-run2-torture-certification']) run(name,[`scripts/test-${name}.mjs`]);
for (const name of ['factory-identity-concept-pack','experience-creation-engine','factory-wire-selected','factory-quick-launch-review']) run(name,[`scripts/test-${name}.ts`]);
run('lint',['node_modules/eslint/bin/eslint.js','lib/factory-screenshot-submit.ts','lib/factory-screenshot-verifier.ts','lib/factory-screenshot-browser-worker.ts','scripts/serve-factory-screenshot-verifier.mts','lib/experience-creation/build-knowledge-pack.ts',
  'tests/factory-screenshot-build.test.mts','tests/chassis-autowire.test.mts','tests/fixtures/people-runtime.ts','tests/fixtures/screenshot-ledger.ts',
  'scripts/test-factory-production.mjs','scripts/test-factory-capability-registry.mjs','scripts/test-factory-identity-concept-pack.ts',
  'scripts/test-factory-screenshot-acceptance.mjs','app/api/projects/[id]/screenshot-build/submit/route.ts'], { offline: false });
run('types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false','--pretty','false'], { offline: false });
report.finishedAt = new Date().toISOString();
report.status = report.jobs.some(job=>job.status==='FAIL') ? 'FAIL' : 'PASS';
writeFileSync(join(output,'report.json'),JSON.stringify(report,null,2));
console.log(`Consolidated evidence: ${join(output,'report.json')}`);
process.exitCode = report.status === 'PASS' ? 0 : 1;
