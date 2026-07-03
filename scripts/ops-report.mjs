/**
 * Print aggregated ops health report.
 * Usage:
 *   npm run ops:report
 *   LAUNCH_BASE_URL=https://ea-payments.vercel.app npm run ops:report
 */
const BASE = process.env.LAUNCH_BASE_URL || 'http://127.0.0.1:3000';

async function main() {
  const url = `${BASE.replace(/\/$/, '')}/api/health/ops`;
  console.log('Ops health —', url, '\n');

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(90_000) });
    const data = await res.json();
    console.log('Status:', res.status, data.ok ? 'OK' : 'DEGRADED');
    console.log('Launch:', data.launchStatus, `(${data.readinessScore}/100)`);
    console.log('Blockers:', data.launchBlockers);
    console.log('Next:', data.recommendedNextAction);
    console.log('\nSubsystems:');
    for (const s of data.subsystems ?? []) {
      console.log(` - [${s.status}] ${s.name}: ${s.message}`);
    }
    console.log('\nMonitoring:');
    console.log('  Sentry:', data.monitoring?.sentryConfigured ? 'yes' : 'NO');
    console.log('  Uptime dashboard:', data.monitoring?.uptimeDashboardConfigured ? 'yes' : 'NO');
    console.log('  Backup URI:', data.monitoring?.backupDestinationConfigured ? 'yes' : 'NO');
    if (data.monitoring?.backupDestinationReachable != null) {
      console.log('  Backup reachable:', data.monitoring.backupDestinationReachable ? 'yes' : 'NO');
    }
    process.exit(data.ok ? 0 : 1);
  } catch (err) {
    console.error('Could not reach ops health:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
