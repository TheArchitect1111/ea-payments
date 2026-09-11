import fs from 'node:fs';

const monitoring = fs.readFileSync('lib/recovery/monitoring.ts', 'utf8');
const cron = fs.readFileSync('app/api/cron/recovery-monitor/route.ts', 'utf8');
const bridge = fs.readFileSync('app/api/internal/recovery-signal/route.ts', 'utf8');
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const journey = fs.readFileSync('scripts/test-recovery-journeys.mjs', 'utf8');

const checks = [
  ['monitor feeds failures into Recovery Orchestrator', monitoring.includes('runRecoveryOrchestrator')],
  ['monitor is dry-run only in Run 2', monitoring.includes("mode: 'dry_run'")],
  ['EA Shared Platform monitored', monitoring.includes("target: 'EA Shared Platform'")],
  ['Amplifi approved marker monitored', monitoring.includes('Focus on your craft')],
  ['Amanda monitored', monitoring.includes("target: 'Amanda Catherine'")],
  ['CPR monitored', monitoring.includes("target: 'Canadian Prospect Recruitment'")],
  ['cron is fail-closed without production secret', cron.includes("process.env.NODE_ENV !== 'production'")],
  ['cron scheduled every five minutes', vercel.crons?.some((entry) => entry.path === '/api/cron/recovery-monitor' && entry.schedule === '*/5 * * * *')],
  ['signed event bridge requires dedicated secret', bridge.includes('EA_RECOVERY_SIGNAL_SECRET') && bridge.includes("process.env.NODE_ENV !== 'production'")],
  ['signed event bridge feeds same orchestrator', bridge.includes('runRecoveryOrchestrator') && bridge.includes("mode: 'dry_run'")],
  ['browser journey catches known failures', /application error\|internal server error\|unable to load agreement/i.test(journey)],
  ['browser journey catches broken images', journey.includes('naturalWidth === 0')],
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
if (failed.length) process.exit(1);
console.log(`Recovery monitoring contract passed (${checks.length}/${checks.length}).`);
