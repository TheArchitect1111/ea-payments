import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * @param {string} root
 */
export function collectCertMetadata(root) {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  let gitSha = 'unknown';
  let gitShort = 'unknown';
  let gitBranch = 'unknown';
  let gitDirty = false;
  try {
    gitSha = execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf8' }).trim();
    gitShort = execSync('git rev-parse --short HEAD', { cwd: root, encoding: 'utf8' }).trim();
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: root, encoding: 'utf8' }).trim();
    const dirty = execSync('git status --porcelain', { cwd: root, encoding: 'utf8' }).trim();
    gitDirty = dirty.length > 0;
  } catch {
    // offline / non-git
  }

  const migrationsDir = join(root, 'supabase', 'migrations');
  const migrations = existsSync(migrationsDir)
    ? readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort()
    : [];
  const migrationVersion = migrations.length ? migrations[migrations.length - 1] : 'none';

  const flags = {
    SIMPLIFI_OS_WRITE: process.env.SIMPLIFI_OS_WRITE === '1',
    SIMPLIFI_EMBED: process.env.SIMPLIFI_EMBED === '1',
    SIMPLIFI_SEMANTIC_ASK: process.env.SIMPLIFI_SEMANTIC_ASK === '1',
    SIMPLIFI_INTELLIGENCE: process.env.SIMPLIFI_INTELLIGENCE === '1',
    SIMPLIFI_BRIEF_INTEL: process.env.SIMPLIFI_BRIEF_INTEL === '1',
    SIMPLIFI_OS_READ: process.env.SIMPLIFI_OS_READ === '1',
  };

  const envPresence = {
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL?.trim()),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SERVICE_KEY?.trim(),
    ),
    OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY?.trim()),
    CRON_SECRET: Boolean(process.env.CRON_SECRET?.trim()),
  };

  return {
    harness: 'simplifi-os-certification',
    harnessVersion: '1.0.0',
    timestamp: new Date().toISOString(),
    git: { sha: gitSha, short: gitShort, branch: gitBranch, dirty: gitDirty },
    build: {
      name: pkg.name,
      version: pkg.version,
      node: process.version,
    },
    database: {
      migrationVersion,
      migrations,
    },
    featureFlags: flags,
    envPresence,
    shadowMode: !flags.SIMPLIFI_SEMANTIC_ASK && !flags.SIMPLIFI_BRIEF_INTEL && !flags.SIMPLIFI_OS_READ,
  };
}
