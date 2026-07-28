#!/usr/bin/env node
/**
 * One-shot: apply 007–010 from disk using token already in this shell.
 * Avoids SQL Editor path-paste entirely.
 *
 * Usage (in the PowerShell where projects list already works):
 *   $env:SUPABASE_DB_PASSWORD = "your-db-password"
 *   node scripts/apply-people-migrations-remote.mjs
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const REF = process.env.PEOPLE_SUPABASE_PROJECT_REF?.trim() || 'dwygvwnjjaennksddniu';
const evidenceDir = join(root, 'docs', 'audits', 'runtime-evidence-people-phase2c-prod-infra');
mkdirSync(evidenceDir, { recursive: true });

function scrub(s) {
  return String(s || '')
    .replace(/sbp_[a-f0-9]+/gi, '[token]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[jwt]')
    .slice(0, 1000);
}

function run(args, timeout = 180000) {
  return spawnSync('npx', args, {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    env: process.env,
    timeout,
    maxBuffer: 20 * 1024 * 1024,
  });
}

const report = { ref: REF, at: new Date().toISOString(), steps: [], blockers: [] };

if (!process.env.SUPABASE_ACCESS_TOKEN?.trim()?.startsWith('sbp_')) {
  console.log(
    JSON.stringify({
      ok: false,
      blockers: [
        {
          id: 'token',
          action: 'In this same shell set $env:SUPABASE_ACCESS_TOKEN = "sbp_..." then re-run',
        },
      ],
    }),
  );
  process.exit(2);
}

if (!process.env.SUPABASE_DB_PASSWORD?.trim()) {
  console.log(
    JSON.stringify({
      ok: false,
      blockers: [
        {
          id: 'SUPABASE_DB_PASSWORD',
          link: `https://supabase.com/dashboard/project/${REF}/settings/database`,
          action:
            'Copy Database password, then: $env:SUPABASE_DB_PASSWORD = "..." ; node scripts/apply-people-migrations-remote.mjs',
        },
      ],
    }),
  );
  process.exit(2);
}

console.log(JSON.stringify({ step: 'start', ref: REF }));

{
  const r = run(
    [
      'supabase',
      'link',
      '--project-ref',
      REF,
      '--password',
      process.env.SUPABASE_DB_PASSWORD.trim(),
      '--yes',
    ],
    120000,
  );
  const ok = r.status === 0 || /linked|Finished supabase link/i.test(`${r.stdout}\n${r.stderr}`);
  report.steps.push({ id: 'link', ok, detail: scrub(r.stdout || r.stderr) });
  console.log(JSON.stringify({ step: 'link', ok }));
  if (!ok) {
    writeFileSync(join(evidenceDir, 'apply-migrations-report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ ok: false, steps: report.steps, blockers: [{ id: 'link', action: 'Wrong DB password or link failed' }] }, null, 2));
    process.exit(1);
  }
}

{
  const r = run(['supabase', 'db', 'push', '--include-all', '--yes'], 300000);
  const combined = `${r.stdout || ''}\n${r.stderr || ''}`;
  const ok = r.status === 0 || /up to date|Finished supabase db push/i.test(combined);
  report.steps.push({ id: 'db_push', ok, detail: scrub(combined) });
  console.log(JSON.stringify({ step: 'db_push', ok }));
  writeFileSync(join(evidenceDir, 'apply-migrations-report.json'), JSON.stringify(report, null, 2));
  if (!ok) {
    // Fallback: pipe each file into db query --linked
    const files = [
      'supabase/migrations/007_people_phase2c_schema.sql',
      'supabase/migrations/008_people_phase2c_postgrest_wiring.sql',
      'supabase/migrations/009_people_upsert_relationship.sql',
      'supabase/migrations/010_people_get_person.sql',
      'supabase/migrations/011_people_app_schema_grants.sql',
    ];
    for (const f of files) {
      const sql = readFileSync(join(root, f), 'utf8');
      const q = spawnSync('npx', ['supabase', 'db', 'query', '--linked'], {
        cwd: root,
        encoding: 'utf8',
        shell: true,
        env: process.env,
        input: sql,
        timeout: 180000,
        maxBuffer: 20 * 1024 * 1024,
      });
      const qOk = q.status === 0;
      const id = f.split(/[/\\]/).pop();
      report.steps.push({ id, ok: qOk, detail: scrub(q.stdout || q.stderr) });
      console.log(JSON.stringify({ step: id, ok: qOk }));
      if (!qOk) break;
    }
  }
}

const allOk = report.steps.every((s) => s.ok);
writeFileSync(join(evidenceDir, 'apply-migrations-report.json'), JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    {
      ok: allOk,
      steps: report.steps.map((s) => ({ id: s.id, ok: s.ok })),
      evidence: 'docs/audits/runtime-evidence-people-phase2c-prod-infra/apply-migrations-report.json',
    },
    null,
    2,
  ),
);
process.exit(allOk ? 0 : 1);
