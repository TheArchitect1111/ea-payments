import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = process.cwd();
const manifestPath = path.join(ROOT, '.ea', 'gates', 'latest.json');
const currentSha = process.env.VERCEL_GIT_COMMIT_SHA || '';

function fail(message) {
  console.error(`[EA Production Gate] BLOCKED: ${message}`);
  process.exit(2);
}

if (!existsSync(manifestPath)) fail('missing .ea/gates/latest.json');

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch {
  fail('gate manifest is not valid JSON');
}

const required = ['sourceCommit', 'previewUrl', 'status', 'completedAt', 'gates'];
for (const key of required) {
  if (!manifest[key]) fail(`manifest missing ${key}`);
}
if (manifest.productionEligible === false || manifest.verificationType === 'CONTRACT ONLY') fail('staging contract evidence cannot promote production');
if (manifest.status !== 'PASS') fail(`manifest status is ${manifest.status}`);


// Strict scoped releases must cover the entire source delta since the last
// approved source, not merely the two-file promotion commit.
function execGit(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding:'utf8' }).trim();
}
function validateEvaScopedRelease(manifest) {
  const mode = 'EVA-SCOPED';
  const log = (msg) => console.log('[EA Production Gate] MODE=' + mode + ' ' + msg);
  const requiredFields = ['sourceBaselineCommit','previewCommit','evidence'];
  for (const key of requiredFields) {
    if (!manifest[key]) fail('eva-scoped missing ' + key);
  }
  if (manifest.verificationType !== 'eva-scoped' || manifest.productionEligible !== true) {
    fail('eva-scoped release needs explicitly eligible live evidence, not a contract fixture');
  }
  const parent = execGit(['rev-parse','HEAD^']);
  if (manifest.sourceCommit !== parent || manifest.previewCommit !== parent) {
    fail('eva-scoped sourceCommit/previewCommit do not match the immediate promotion parent');
  }
  // Never infer a baseline from caller-controlled data alone.
  let approvedSource;
  try {
    const approved = JSON.parse(execGit(['show','HEAD^:.ea/gates/latest.json']));
    approvedSource = approved.sourceCommit;
  } catch {
    fail('unable to read previous approved release manifest from source parent');
  }
  if (!/^[a-f0-9]{40}$/.test(approvedSource) || manifest.sourceBaselineCommit !== approvedSource) {
    fail('eva-scoped baseline differs from recorded previous gate');
  }
  try {
    execGit(['merge-base','--is-ancestor',approvedSource,parent]);
  } catch {
    fail('eva-scoped baseline is not an ancestor of proposed source');
  }
  const changedPromotion = execGit(['diff','--name-only','HEAD^','HEAD']).split('\n').filter(Boolean);
  const promotionPaths = new Set(['.ea/gates/latest.json','.ea/gates/eva-scoped-release.md']);
  if (!changedPromotion.includes('.ea/gates/latest.json') ||
      changedPromotion.some(path => !promotionPaths.has(path))) {
    fail('eva-scoped promotion must contain only the gate manifest and scoped release policy');
  }
  if (!existsSync(path.join(ROOT,'.ea/gates/eva-scoped-release.md'))) {
    fail('missing authorized Eva release policy');
  }
  const sourceChanged = execGit(['diff','--name-only',approvedSource,parent]).split('\n').filter(Boolean);
  const allowed = (file) =>
    file.startsWith('src/bricks/eva-portal-help/') ||
    /^knowledge\/eva-[a-z0-9-]+-manifest\.json$/.test(file) ||
    file === 'knowledge/eva-portal-help-registry.json' ||
    file.startsWith('knowledge/eva-menu-sources/') ||
    file.startsWith('app/api/portal/[slug]/eva-help/');
  const outside = sourceChanged.filter(file => !allowed(file));
  if (outside.length) {
    console.error('[EA Production Gate] MODE=EVA-SCOPED REJECT: ' +
      outside.length + ' non-Eva source files:\n' + outside.join('\n'));
    fail('eva-scoped source range contains excluded paths; full 14-brick certification required');
  }
  if (!sourceChanged.length) fail('eva-scoped source range is empty; no scoped release demonstrated');
  const checks = ['sourceIdentity','build','functional','previewHealth'];
  for (const name of checks) {
    const gate = manifest.gates?.[name];
    if (gate?.status !== 'PASS' || typeof gate.proof !== 'string' || !gate.proof.trim()) {
      fail('eva-scoped gate ' + name + ' missing verified PASS evidence');
    }
  }
  const tests=manifest.evidence?.tests;
  if (tests?.amanda !== '10/10' || tests?.tb3 !== '10/10' || tests?.isolation !== '2/2') {
    fail('eva-scoped tests do not show Amanda 10/10, TB3 10/10 and isolation 2/2');
  }
  for (const id of ['amanda','tb3']) {
    const h=manifest.evidence?.previewHealth?.[id];
    if (h?.status !== 200 || h?.ok !== true || typeof h?.url !== 'string' ||
      !h.url.startsWith('https://') || !Number.isInteger(h.entryCount) || h.entryCount < 1 ||
      !Number.isFinite(Date.parse(h.checkedAt))) {
      fail('eva-scoped preview health proof incomplete: ' + id);
    }
  }
  const currentSha = process.env.VERCEL_GIT_COMMIT_SHA || '';
  if (currentSha && currentSha !== execGit(['rev-parse','HEAD'])) {
    fail('Vercel commit SHA does not match checked-out HEAD');
  }
  log('PASS for source ' + parent + ' (' + sourceChanged.length + ' scoped files)');
  process.exit(0);
}
if (manifest.type === 'eva-scoped') validateEvaScopedRelease(manifest);
// Otherwise the original seven-gate full chassis verification below applies.

const requiredGates = ['sourceIdentity','build','assets','functional','desktopVisual','mobileVisual','creativeCritic'];
for (const gate of requiredGates) {
  if (manifest.gates?.[gate]?.status !== 'PASS') fail(`${gate} gate did not PASS`);
  if (!manifest.gates?.[gate]?.proof) fail(`${gate} gate has no proof`);
}

let parentSha = '';
try {
  parentSha = execFileSync('git', ['rev-parse', 'HEAD^'], { cwd: ROOT, encoding: 'utf8' }).trim();
} catch {
  fail('unable to resolve production commit parent');
}

if (manifest.sourceCommit !== parentSha) {
  fail(`manifest sourceCommit ${manifest.sourceCommit} does not match production parent ${parentSha}`);
}

let changed = '';
try {
  changed = execFileSync('git', ['diff', '--name-only', 'HEAD^', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
} catch {
  fail('unable to inspect production promotion commit');
}
const changedFiles = changed.split('\n').filter(Boolean);
const allowed = new Set(['.ea/gates/latest.json']);
const illegal = changedFiles.filter((file) => !allowed.has(file));
if (illegal.length) fail(`promotion commit changed non-gate files: ${illegal.join(', ')}`);

if (currentSha && currentSha !== execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()) {
  fail('Vercel commit SHA does not match checked-out HEAD');
}

console.log(`[EA Production Gate] PASS for source ${manifest.sourceCommit}`);
process.exit(0);
