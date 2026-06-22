/**
 * Tier 2 launch readiness — env + health + optional webhook dry-run.
 * Usage: node scripts/test-tier2-launch.mjs [baseUrl]
 */
const BASE = process.argv[2] || 'https://ea-payments.vercel.app';

console.log('Tier 2 launch check —', BASE, '\n');

const paths = [
  ['/checkout', 200],
  ['/api/health/launch', 200],
];

for (const [path, expect] of paths) {
  try {
    const res = await fetch(`${BASE}${path}`, { redirect: 'follow' });
    console.log(res.status === expect ? 'OK' : 'FAIL', res.status, path);
  } catch (err) {
    console.log('FAIL', path, err.message);
  }
}

try {
  const health = await fetch(`${BASE}/api/health/launch`);
  const data = await health.json();
  console.log('\nStatus:', data.status);
  const t2 = data.checks?.tier2 ?? {};
  console.log('Tier 2 ready:', t2.ready ? 'YES' : 'NO');
  console.log('  onboardingWebhook:', t2.onboardingWebhook ? 'yes' : 'MISSING');
  console.log('  esignWebhook:', t2.esignWebhook ? 'yes' : 'MISSING');
  console.log('  resend:', t2.resend ? 'yes' : 'MISSING');
  console.log('  stripe + webhook secret:', t2.stripe && t2.stripeWebhookSecret ? 'yes' : 'MISSING');

  if (data.manual) {
    const open = Object.entries(data.manual).filter(([, v]) => v);
    if (open.length) {
      console.log('\nStill needed:');
      for (const [k, v] of open) console.log(' -', k + ':', v);
    }
  }

  if (data.status === 'full_launch_ready') {
    console.log('\nPASS — full_launch_ready. Run one live Stripe checkout to confirm end-to-end.');
  } else if (t2.ready) {
    console.log('\nWebhooks configured — run live checkout at', `${BASE}/checkout`);
  } else {
    console.log('\nNext: docs/MAKE-TIER2.md → scripts/run-tier2-setup.bat');
  }
} catch (err) {
  console.log('Health check failed:', err.message);
  process.exit(1);
}
