import assert from 'node:assert/strict';
import { BRICK_IDS, type Brick } from './BrickInterface';
import { assertPriceContract } from './priceContract';
/** Client-independent click verification; runtime adapters must supply real evidence. */
export async function clickTest(bricks: readonly Brick[], courseId: string, type: 'stripe-test'|'square-full'='stripe-test') {
 const seen=new Map<string,Brick>();
 for(const brick of bricks){assert(!seen.has(brick.id),'Duplicate brick '+brick.id);seen.set(brick.id,brick);}
 const results=[];
 for(const id of BRICK_IDS){try{
  const brick=seen.get(id);assert(brick,id+' not registered');
  const h=await brick.health();assert.equal(h.status,200,id+' health: '+h.evidence);
  assertPriceContract(brick.price());
  if(['checkout','billing','welcome','email','entitlement'].includes(id)) {
   const co=await brick.checkout({type,courseId});assert(!('notApplicable' in co),id+' checkout is not applicable');assert(co.sessionId&&co.entitlement,id+' no verified entitlement');
   const w=await brick.welcome({sessionId:co.sessionId});assert(w.successPage&&w.emailId&&w.receiptPdf&&w.nextSteps&&w.accessLink,id+' incomplete delivery');
  }
  assert.equal(brick.attach(),true,id+' has no recorded real integration proof');
  results.push({id,click:true,evidence:h.evidence});
 }catch(error){results.push({id,click:false,evidence:error instanceof Error?error.message:String(error)});}}
 const count=results.filter(x=>x.click).length;
 return {click:count+'/'+BRICK_IDS.length,passed:count===BRICK_IDS.length,results};
}
