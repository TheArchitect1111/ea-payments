import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, '.ea', 'gates', 'latest.json');

function fail(message) {
  console.error(`[EA Master Guard] BLOCKED: ${message}`);
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

const requiredGates = ['sourceIdentity', 'build', 'assets', 'functional', 'desktopVisual', 'mobileVisual', 'creativeCritic'];
for (const gate of requiredGates) {
  if (manifest.gates?.[gate]?.status !== 'PASS') fail(`${gate} gate did not PASS`);
  if (!manifest.gates?.[gate]?.proof) fail(`${gate} gate has no proof`);
}

let parentSha;
try {
  parentSha = execFileSync('git', ['rev-parse', 'HEAD^'], { cwd: root, encoding: 'utf8' }).trim();
} catch {
  fail('unable to resolve promotion parent');
}

if (manifest.sourceCommit !== parentSha) {
  fail(`manifest sourceCommit ${manifest.sourceCommit} does not match parent ${parentSha}`);
}

let changed;
try {
  changed = execFileSync('git', ['diff', '--name-only', 'HEAD^', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
} catch {
  fail('unable to inspect promotion commit');
}

const changedFiles = changed.split('\n').filter(Boolean);
if (changedFiles.length !== 1 || changedFiles[0] !== '.ea/gates/latest.json') {
  fail(`promotion commit must change only .ea/gates/latest.json; saw: ${changedFiles.join(', ') || '(none)'}`);
}

console.log(`[EA Master Guard] PASS for promotion of ${manifest.sourceCommit}`);
