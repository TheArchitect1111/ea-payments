/**
 * Verifies critical webhook endpoints are configured and reachable at network level.
 * This script is non-destructive: it uses OPTIONS requests only.
 */
const REQUIRED = [
  ['ONBOARDING_WEBHOOK_URL', process.env.ONBOARDING_WEBHOOK_URL],
  ['ESIGN_WEBHOOK_URL', process.env.ESIGN_WEBHOOK_URL],
];

const TIMEOUT_MS = 8000;

function isHttpsUrl(raw) {
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' && !/localhost|127\.0\.0\.1/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

async function checkEndpoint(name, rawUrl) {
  if (!isHttpsUrl(rawUrl)) {
    return { ok: false, name, reason: `${name} is missing or not a valid public https URL` };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(rawUrl, {
      method: 'OPTIONS',
      signal: controller.signal,
      headers: { 'User-Agent': 'ea-launch-readiness/1.0' },
    });
    return { ok: true, name, reason: `reachable (${res.status})` };
  } catch (err) {
    return { ok: false, name, reason: err instanceof Error ? err.message : 'network failure' };
  } finally {
    clearTimeout(timer);
  }
}

console.log('Webhook readiness check\n');
const results = await Promise.all(REQUIRED.map(([name, url]) => checkEndpoint(name, url)));
let failed = false;
for (const r of results) {
  if (r.ok) {
    console.log(`PASS ${r.name}: ${r.reason}`);
  } else {
    failed = true;
    console.log(`FAIL ${r.name}: ${r.reason}`);
  }
}

if (failed) {
  process.exitCode = 1;
}
