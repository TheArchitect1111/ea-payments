import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const route = await readFile(new URL('../app/api/connect/relationships/route.ts', import.meta.url), 'utf8');
const baseUrl = process.env.CONNECT_SMOKE_BASE_URL?.replace(/\/$/, '');

if (!baseUrl) {
  // The default evidence run is offline: this endpoint persists records and can
  // send email/SMS/webhook deliveries, so a live smoke requires an explicit test URL.
  assert.match(route, /Admin-only list[\s\S]*POST remains public for Connect capture/);
  assert.match(route, /export async function POST\(request: NextRequest\)/);
  assert.match(route, /Name and email are required/);
  assert.match(route, /createConnectRelationship\(input\)/);
  assert.match(route, /bridgeCapturedRecord\(/);
  assert.match(route, /sendConnectWelcomeEmail\(/);
  assert.match(route, /sendConnectSms\(/);
  console.log('[connect-smoke] offline capture route contract passed');
} else {
  const orgSlug = process.env.CONNECT_SMOKE_SLUG || process.env.CONNECT_SMOKE_ORG || 'demo-client';
  const email = process.env.CONNECT_SMOKE_EMAIL || `connect-smoke-${Date.now()}@example.com`;

  async function readJson(res) {
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { ok: false, error: text.slice(0, 300) }; }
  }

  async function main() {
    console.log(`[connect-smoke] capture page ${orgSlug}`);
    const pageRes = await fetch(`${baseUrl}/connect/${encodeURIComponent(orgSlug)}`);
    if (!pageRes.ok) throw new Error(`Capture page failed (${pageRes.status}) for org ${orgSlug}.`);

    console.log(`[connect-smoke] submitting relationship ${email}`);
    const submitRes = await fetch(`${baseUrl}/api/connect/relationships`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgSlug, name: 'Connect Smoke Test', email,
        organization: 'Efficiency Architects QA', role: 'Verifier', source: 'QR',
        event: 'smoke-test', conversationNotes: 'Automated EA Connect smoke verification.',
        campaignId: 'smoke-test', tags: ['smoke', 'codex'],
      }),
    });
    const result = await readJson(submitRes);
    if (!submitRes.ok || !result.relationship?.id) {
      throw new Error(result.error || `Relationship create failed (${submitRes.status}).`);
    }

    console.log('[connect-smoke] ok');
    console.log(JSON.stringify({
      relationshipId: result.relationship.id,
      orgSlug: result.relationship.orgSlug,
      leadType: result.relationship.leadType,
      opportunityScore: result.relationship.aiProfile?.opportunityScore,
      amplifiShareUrl: result.relationship.amplifiShareUrl || result.handoff?.amplifi?.shareUrl || null,
      emailDelivery: result.delivery?.email?.ok ?? null,
    }, null, 2));
  }

  main().catch((err) => {
    console.error(`[connect-smoke] ${err.message}`);
    process.exit(1);
  });
}
