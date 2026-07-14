import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const REGISTRY_PATH = path.join(ROOT, 'config', 'ecosystem-repositories.json');

function loadRepositoryRegistry() {
  const configured = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
  const repos = configured.repositories.map((repo) => ({
    ...repo,
    path: path.resolve(ROOT, repo.path),
  }));

  const extraPaths = (process.env.EA_ECOSYSTEM_REPOSITORIES ?? '')
    .split(path.delimiter)
    .map((value) => value.trim())
    .filter(Boolean);
  for (const repoPath of extraPaths) {
    repos.push({
      id: path.basename(repoPath).toLowerCase(),
      name: path.basename(repoPath),
      path: path.resolve(repoPath),
      criticality: 'unclassified',
      role: 'Operator-supplied repository; classify after verification',
      expectedScripts: [],
    });
  }
  return repos;
}

const repos = loadRepositoryRegistry();
function runGit(repoPath, args) {
  try {
    return execFileSync('git', args, {
      cwd: repoPath,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return '';
  }
}

function readPackage(repoPath) {
  const pkgPath = path.join(repoPath, 'package.json');
  if (!existsSync(pkgPath)) return null;
  try {
    return JSON.parse(readFileSync(pkgPath, 'utf8'));
  } catch {
    return null;
  }
}

function statusFor(repo) {
  const present = existsSync(repo.path);
  const pkg = present ? readPackage(repo.path) : null;
  const scripts = pkg?.scripts ?? {};
  const missingScripts = repo.expectedScripts.filter((script) => !scripts[script]);
  const gitStatus = present ? runGit(repo.path, ['status', '--short']) : '';
  const remote = present ? runGit(repo.path, ['remote', 'get-url', 'origin']) : '';
  const dirtyLines = gitStatus ? gitStatus.split(/\r?\n/).filter(Boolean) : [];
  const generatedNoise = dirtyLines.filter((line) =>
    /node_modules|\.cache|(^|\s)build[\\/]|\.next|\.vercel/.test(line),
  );
  const sourceChanges = dirtyLines.length - generatedNoise.length;
  const hasVercel = present && existsSync(path.join(repo.path, 'vercel.json'));

  const blockers = [];
  const warnings = [];
  if (!present) blockers.push('repo path missing');
  if (repo.criticality.includes('critical') && !remote) warnings.push('no origin remote detected');
  if (missingScripts.length) warnings.push(`missing scripts: ${missingScripts.join(', ')}`);
  if (sourceChanges > 0) warnings.push(`${sourceChanges} source/doc changes not committed`);
  if (generatedNoise.length > 0) warnings.push(`${generatedNoise.length} generated/cache changes present`);

  let readiness = 'ready';
  if (blockers.length) readiness = 'blocked';
  else if (sourceChanges > 0 || missingScripts.length > 0) readiness = 'needs_attention';
  else if (generatedNoise.length > 0) readiness = 'cleanup_recommended';

  return {
    ...repo,
    present,
    packageName: pkg?.name ?? null,
    next: pkg?.dependencies?.next ?? pkg?.devDependencies?.next ?? null,
    react: pkg?.dependencies?.react ?? pkg?.devDependencies?.react ?? null,
    scripts: Object.keys(scripts),
    missingScripts,
    remote,
    hasVercel,
    dirtyCount: dirtyLines.length,
    sourceChanges,
    generatedNoise: generatedNoise.length,
    readiness,
    blockers,
    warnings,
  };
}

function printMarkdown(results) {
  console.log('# EA Repository Readiness\n');
  console.log(`Generated: ${new Date().toISOString()}\n`);
  console.log('| Repo | Criticality | Readiness | Source Changes | Generated Noise | Missing Scripts | Role |');
  console.log('|---|---|---:|---:|---:|---|---|');
  for (const repo of results) {
    console.log(
      `| ${repo.name} | ${repo.criticality} | ${repo.readiness} | ${repo.sourceChanges} | ${repo.generatedNoise} | ${repo.missingScripts.join(', ') || '-'} | ${repo.role} |`,
    );
  }

  const needs = results.filter((repo) => repo.readiness !== 'ready');
  console.log('\n## Follow-up\n');
  if (!needs.length) {
    console.log('- All tracked repositories are ready from the repository-readiness perspective.');
    return;
  }
  for (const repo of needs) {
    console.log(`- ${repo.name}: ${[...repo.blockers, ...repo.warnings].join('; ')}`);
  }
}

const results = repos.map(statusFor);
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), repos: results }, null, 2));
} else {
  printMarkdown(results);
}
