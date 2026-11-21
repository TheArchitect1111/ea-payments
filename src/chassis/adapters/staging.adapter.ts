import assert from 'node:assert/strict';
import type { ClientConfig } from '../runClickTest';
import { BRICK_IDS, type Brick, type CheckoutRequest, type WelcomeRequest } from '../BrickInterface';

/** Isolated offline fixtures for explicit contract mode. */
export async function createStagingAdapters(config: ClientConfig, liveBricks: readonly Brick[]): Promise<Brick[]> {
  assert.match(config.id, /^[a-z0-9-]+$/);
  const [offer, cents] = Object.entries(config.prices)[0] ?? [];
  assert(offer && Number.isSafeInteger(cents) && cents > 0, 'Invalid price fixture');
  assert.equal(liveBricks.length, BRICK_IDS.length);
  let sequence = 0;
  const sessions = new Set<string>();
  return BRICK_IDS.map((id) => {
    let healthy = false;
    return {
      id,
      async health() { healthy = true; return { status: 200 as const, evidence: `${id} offline fixture; no provider called` }; },
      price: () => ({ amountCad: cents / 100, contractId: offer }),
      async checkout(request: CheckoutRequest) {
        assert.equal(request.type, 'stripe-test');
        assert.equal(request.courseId, offer);
        const sessionId = `cs_test_${config.id}_${++sequence}`;
        sessions.add(sessionId);
        return { sessionId, entitlement: `${config.id}:${offer}:test` };
      },
      async welcome(request: WelcomeRequest) {
        assert(sessions.has(request.sessionId), 'Unknown modeled session');
        return { successPage: '/success', emailId: 'mock-email', receiptPdf: 'mock://receipt', nextSteps: 'Offline fixture', accessLink: '/learn' };
      },
      attach: () => healthy,
    } satisfies Brick;
  });
}

export const stagingAdapter = { async health() { return { status: 'unconfigured', live: false }; } };
export default stagingAdapter;
export function createStagingAdapter() { return stagingAdapter; }
