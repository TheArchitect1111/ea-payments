const baseUrl = (process.env.CONNECT_SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const orgSlug = process.env.CONNECT_SMOKE_SLUG || process.env.CONNECT_SMOKE_ORG || 'demo-client';
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
  console.log(`[connect-smoke] capture page ${orgSlug}`);
  const pageRes = await fetch(`${baseUrl}/connect/${encodeURIComponent(orgSlug)}`);
  if (!pageRes.ok) {
    throw new Error(`Capture page failed (${pageRes.status}) for org ${orgSlug}.`);
  }

  console.log(`[connect-smoke] submitting relationship ${email}`);
  const submitRes = await fetch(`${baseUrl}/api/connect/relationships`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orgSlug,
      name: 'Connect Smoke Test',
      email,
      organization: 'Efficiency Architects QA',
      role: 'Verifier',
      source: 'QR',
      event: 'smoke-test',
      conversationNotes: 'Automated EA Connect smoke verification.',
      campaignId: 'smoke-test',
      tags: ['smoke', 'codex'],
    }),
  });
  const result = await readJson(submitRes);
  if (!submitRes.ok || !result.relationship?.id) {
    throw new Error(result.error || `Relationship create failed (${submitRes.status}).`);
  }

  console.log('[connect-smoke] ok');
  console.log(
    JSON.stringify(
      {
        relationshipId: result.relationship.id,
        orgSlug: result.relationship.orgSlug,
        leadType: result.relationship.leadType,
        opportunityScore: result.relationship.aiProfile?.opportunityScore,
        amplifiShareUrl: result.relationship.amplifiShareUrl || result.handoff?.amplifi?.shareUrl || null,
        emailDelivery: result.delivery?.email?.ok ?? null,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(`[connect-smoke] ${err.message}`);
  process.exit(1);
});
