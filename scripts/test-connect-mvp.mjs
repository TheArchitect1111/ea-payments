const baseUrl = (process.env.CONNECT_SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const slug = process.env.CONNECT_SMOKE_SLUG;

if (!slug) {
  console.error('Set CONNECT_SMOKE_SLUG to a real connect profile slug.');
  process.exit(1);
}

const email = process.env.CONNECT_SMOKE_EMAIL || `connect-smoke-${Date.now()}@example.com`;

async function readJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: text.slice(0, 300) };
  }
}

async function main() {
  console.log(`[connect-smoke] loading profile ${slug}`);
  const profileRes = await fetch(`${baseUrl}/api/connect/${encodeURIComponent(slug)}`);
  const profile = await readJson(profileRes);
  if (!profileRes.ok || !profile.ok) {
    throw new Error(profile.error || `Profile load failed (${profileRes.status}).`);
  }

  console.log(`[connect-smoke] submitting connection ${email}`);
  const submitRes = await fetch(`${baseUrl}/api/connect/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug,
      name: 'Connect Smoke Test',
      email,
      company: 'Efficiency Architects QA',
      role: 'Verifier',
      location: 'Remote',
      notes: 'Automated EA Connect smoke verification.',
      campaign: 'smoke-test',
      referralSource: 'codex',
      utmSource: 'codex',
      utmMedium: 'smoke',
      utmCampaign: 'connect-mvp',
      connectionMethod: 'email',
      device: 'script',
      browser: 'node-fetch',
    }),
  });
  const result = await readJson(submitRes);
  if (!submitRes.ok || !result.ok || !result.connectionId) {
    throw new Error(result.error || `Submit failed (${submitRes.status}).`);
  }

  console.log('[connect-smoke] ok');
  console.log(JSON.stringify({
    connectionId: result.connectionId,
    priority: result.classification?.priority,
    destinationUrl: result.destinationUrl || null,
    automationStatus: result.automationStatus,
  }, null, 2));
}

main().catch((err) => {
  console.error(`[connect-smoke] ${err.message}`);
  process.exit(1);
});
