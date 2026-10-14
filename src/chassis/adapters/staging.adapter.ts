import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import type { ClientConfig } from '../runClickTest';
import { BRICK_IDS, type Brick, type CheckoutRequest, type WelcomeRequest } from '../BrickInterface';

/** Explicit model tests. Never used by the default live runner or production promotion. */
export async function createStagingAdapters(config: ClientConfig, liveBricks: readonly Brick[]): Promise<Brick[]> {
  assert.match(config.id, /^[a-z0-9-]+$/);
  const [offer, cents] = Object.entries(config.prices)[0] || [];
  assert(offer && Number.isSafeInteger(cents) && cents > 0, 'Invalid price fixture');
  const url = new URL(config.janeUrl);
  assert(url.protocol === 'https:' && url.hostname.endsWith('.janeapp.com'), 'Invalid booking destination');
  assert.equal(liveBricks.length, BRICK_IDS.length);
  const catalog = Array.from({ length: 12 }, (_, index) => ({ id: `${config.id}-fixture-${index + 1}`, ready: index < 5 }));
  const sessions = new Map<string, { offer: string; expiresAt: number }>();
  const checkout = async (request: CheckoutRequest) => {
    assert.equal(request.type, 'stripe-test', 'Staging cannot create full-price payments');
    assert(Object.hasOwn(config.prices, request.courseId), 'Unknown configured offer');
    const sessionId = `cs_test_${config.id}_${request.courseId}_${sessions.size + 1}`;
    sessions.set(sessionId, { offer: request.courseId, expiresAt: Date.now() + 72 * 60 * 60 * 1000 });
    return { sessionId, entitlement: `${config.id}:${request.courseId}:72h:test` };
  };
  const welcome = async (request: WelcomeRequest) => {
    assert(sessions.has(request.sessionId), 'Unknown modeled session');
    return { successPage: `/success?session_id=${request.sessionId}`, accessLink: `/learn?session_id=${request.sessionId}`, receiptPdf: `mock://${request.sessionId}/receipt.pdf`, nextSteps: 'Preview the modeled learning access. No payment, email, or access grant occurred.', emailId: `re_mock_${request.sessionId}` };
  };
  const requirements: Record<string, [string, string]> = {
    auth: ['lib/api/portal-route.ts', 'guardPortalApi'],
    lms: ['src/chassis/clickTest.ts', 'entitlement'],
    menu: [`app/${config.id}/page.tsx`, config.id],
    'production-gate': ['.github/workflows/ea-production-gate.yml', 'productionEligible'],
    'chassis-cert': ['src/chassis/runClickTest.ts', "mode === 'contract'"],
    preview: ['src/chassis/adapters/staging.adapter.ts', 'CONTRACT ONLY'],
    amazon: ['src/chassis/adapters/amazon.adapter.ts', "id:'amazon'"],
  };
  return liveBricks.map(live => {
    let valid = false;
    return {
      id: live.id,
      async health() {
        valid = false;
        let observation = 'No external operation requested for this model';
        if (live.id === 'catalog' || live.id === 'jane') {
          try { const health = await live.health(); observation = `Live attempt status=${health.status}: ${health.evidence}`; }
          catch (error) { observation = `Live attempt failed: ${String(error)}`; }
        }
        try {
          assert(BRICK_IDS.includes(live.id as typeof BRICK_IDS[number]), 'Unknown brick');
          const source = requirements[live.id];
          if (source) assert((await readFile(source[0], 'utf8')).includes(source[1]), 'Required source contract missing');
          if (live.id === 'catalog') { assert.equal(catalog.length, 12); assert.equal(catalog.filter(item => item.ready).length, 5); }
          if (live.id === 'jane') assert.equal(new URL(config.janeUrl).hostname, url.hostname);
          if (live.id === 'billing') assert.equal(cents / 100, config.prices[offer] / 100);
          if (['checkout', 'welcome', 'email', 'entitlement'].includes(live.id)) {
            const payment = await checkout({ type: 'stripe-test', courseId: offer });
            const delivery = await welcome(payment);
            assert.equal(Object.values(delivery).filter(Boolean).length, 5);
            assert(delivery.emailId.startsWith(`re_mock_cs_test_${config.id}_`));
            assert(sessions.get(payment.sessionId)!.expiresAt > Date.now());
          }
          valid = true;
          return { status: 200 as const, evidence: `${live.id} CONTRACT ONLY — NOT LIVE — client=${config.id}; modeled assertions passed; catalog fixture=12/5, no live inventory claim; URL attempted=${config.janeUrl}; ${observation}` };
        } catch (error) { return { status: 503 as const, evidence: `${live.id} CONTRACT ONLY validation FAILED: ${String(error)}` }; }
      },
      price: () => ({ amountCad: cents / 100, contractId: offer }),
      checkout,
      welcome,
      // Validates modeled attachment only; never integration certification.
      attach: () => valid,
    };
  });
}
