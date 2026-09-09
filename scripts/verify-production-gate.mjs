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
if (manifest.status !== 'PASS') fail(`manifest status is ${manifest.status}`);

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
