import assert from 'node:assert/strict';
import { BRICK_IDS, type Brick, type BrickId } from './BrickInterface';
import { PRICE_CONTRACT } from './priceContract';

/** A fail-closed integration verifier: zero success is assumed or mocked. */
export async function clickTest(bricks: readonly Brick[], courseId: string, type: 'stripe-test' | 'square-full' = 'stripe-test') {
  const byId = new Map<string, Brick>();
  for (const brick of bricks) { assert(!byId.has(brick.id), 'duplicate brick '+brick.id); byId.set(brick.id, brick); }
  const results: { id: BrickId; click: boolean; reason: string }[] = [];
  for (const id of BRICK_IDS) {
    try {
      const brick = byId.get(id);
      assert(brick, id + ' missing');
      const h = await brick.health();
      assert.equal(h.status, 200, id+' health FAIL: '+h.evidence);
      const p = brick.price();
      assert.equal(p.contractId, PRICE_CONTRACT.id, id+' price contract drift');
      assert(Number.isFinite(p.amountCad) && p.amountCad > 0, id+' invalid price');
      const co = await brick.checkout({type,courseId});
      assert(co.sessionId && co.entitlement, id+' checkout proof missing');
      const w = await brick.welcome({sessionId:co.sessionId});
      assert(w.successPage && w.emailId && w.receiptPdf && w.nextSteps && w.accessLink, id+' welcome proof missing');
      assert.equal(brick.attach(), true, id+' attach FAIL');
      results.push({id,click:true,reason:'verified'});
    } catch (e) { results.push({id,click:false,reason:e instanceof Error?e.message:String(e)}); }
  }
  const passed = results.filter(r=>r.click).length;
  return { click: passed+'/'+BRICK_IDS.length, passed:passed===BRICK_IDS.length, results };
}
