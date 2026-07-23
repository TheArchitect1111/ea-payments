/**
 * Smoke-test production URLs and print launch checklist.
 * Usage: node scripts/launch-readiness.mjs
 *
 * Path smoke is public. Detailed readiness requires ADMIN_SESSION_SECRET.
 */
import {
  fetchLaunchHealthDiagnostic,
  loadDotEnvLocal,
} from './lib/admin-bearer.mjs';

const BASE = process.env.LAUNCH_BASE_URL || 'https://ea-payments.vercel.app';
const env = loadDotEnvLocal();

const paths = [
  ['/start', 200],
  ['/capture', 200],
  ['/amplify', 200],
  ['/story/selena', 200],
  ['/sign-in', 200],
  ['/api/health/launch', 200],
];

console.log('Launch readiness —', BASE, '\n');

for (const [path, expect] of paths) {
  try {
    const res = await fetch(`${BASE}${path}`, { redirect: 'follow' });
    const ok = res.status === expect;
    console.log(ok ? 'OK' : 'FAIL', res.status, path);
  } catch (err) {
    console.log('FAIL', path, err.message);
  }
}

try {
  const { res, body: data } = await fetchLaunchHealthDiagnostic(BASE, env);
  if (!res.ok || !data?.checks) {
    console.log('Diagnostic fetch failed:', res.status, data?.error || 'missing checks');
    process.exitCode = 1;
  } else {
    console.log('\nHealth status:', data.status);
    console.log('Revenue ready:', data.checks?.revenueReady ? 'yes' : 'NO');
    console.log('Delivery ready:', data.checks?.deliveryReady ? 'yes' : 'NO');
    console.log('Monitoring ready:', data.checks?.monitoringReady ? 'yes' : 'NO');
    console.log('Resilience ready:', data.checks?.resilienceReady ? 'yes' : 'NO');
    console.log('Critical ready:', data.checks?.criticalReady ? 'yes' : 'NO');
    console.log('Full launch ready:', data.checks?.fullLaunchReady ? 'yes' : 'NO');
    console.log('Airtable key on server:', data.checks?.env?.airtable ? 'yes' : 'NO');
    console.log('Demo client:', data.checks?.demoClient ? 'yes' : 'NO');
    console.log('Onboarding webhook:', data.checks?.env?.onboardingWebhook ? 'yes' : 'NO');
    console.log('Resend email:', data.checks?.env?.resend ? 'yes' : 'NO');
    if (data.checks?.missingByCategory) {
      console.log('\nMissing by category:');
      for (const [category, info] of Object.entries(data.checks.missingByCategory)) {
        if (Array.isArray(info?.missing) && info.missing.length > 0) {
          console.log(` - ${category}: ${info.missing.join(', ')}`);
        }
      }
    }
    if (data.manual) {
      console.log('\nManual still needed:');
      for (const [k, v] of Object.entries(data.manual)) {
        if (v) console.log(' -', k + ':', v);
      }
    }
    console.log('\nSend testers:', `${BASE}/start`);
    console.log('\nLaunch Command Center:', `${BASE}/launch`);
    console.log('Full report CLI: npm run launch:report');

    if (data.checks?.criticalReady !== true) {
      process.exitCode = 1;
    }
  }
} catch (err) {
  console.log('Health check failed:', err.message);
  process.exitCode = 1;
}
