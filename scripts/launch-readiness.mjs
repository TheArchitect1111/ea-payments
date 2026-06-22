/**
 * Smoke-test production URLs and print launch checklist.
 * Usage: node scripts/launch-readiness.mjs
 */
const BASE = process.env.LAUNCH_BASE_URL || 'https://ea-payments.vercel.app';

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
  const health = await fetch(`${BASE}/api/health/launch`);
  const data = await health.json();
  console.log('\nHealth status:', data.status);
  console.log('Airtable key on server:', data.checks?.env?.airtable ? 'yes' : 'NO');
  console.log('Demo client:', data.checks?.demoClient ? 'yes' : 'NO');
  console.log('Onboarding webhook:', data.checks?.env?.onboardingWebhook ? 'yes' : 'NO');
  console.log('Resend email:', data.checks?.env?.resend ? 'yes' : 'NO');
  if (data.manual) {
    console.log('\nManual still needed:');
    for (const [k, v] of Object.entries(data.manual)) {
      if (v) console.log(' -', k + ':', v);
    }
  }
  console.log('\nSend testers:', `${BASE}/start`);
  console.log('\nLaunch Command Center:', `${BASE}/launch`);
  console.log('Full report CLI: npm run launch:report');
} catch (err) {
  console.log('Health check failed:', err.message);
}
