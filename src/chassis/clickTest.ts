import assert from 'node:assert/strict';
import { BRICK_IDS, type Brick } from './BrickInterface';
import { assertPriceContract } from './priceContract';
/** Fail-closed operational certification. Synthetic identifiers do not certify providers. */
export async function clickTest(bricks: readonly Brick[], courseId: string, type: 'stripe-test'|'square-full'='stripe-test') {
 const seen=new Map<string,Brick>();
 for(const brick of bricks){assert(!seen.has(brick.id),'Duplicate brick '+brick.id);seen.set(brick.id,brick);}
 const results: {id:string;click:boolean;evidence:string}[]=[];
 for(const id of BRICK_IDS){try{
  const brick=seen.get(id);assert(brick,id+' not registered');
  const h=await brick.health();assert.equal(h.status,200,id+' health: '+h.evidence);
  assertPriceContract(brick.price());
  assert.equal(brick.attach(),true,id+' has no operational proof');
  results.push({id,click:true,evidence:h.evidence});
 }catch(error){results.push({id,click:false,evidence:error instanceof Error?error.message:String(error)});}}
 const required=['checkout','welcome','email','entitlement'];
 if(required.every(id=>seen.has(id)) && results.every(r=>r.click)){
  try{
   const co=await seen.get('checkout')!.checkout({type,courseId});
   assert(co.sessionId&&co.entitlement,'checkout missing session/entitlement');
   const w=await seen.get('welcome')!.welcome({sessionId:co.sessionId});
   const email=await seen.get('email')!.welcome({sessionId:co.sessionId});
   assert(w.successPage&&w.nextSteps&&w.accessLink&&w.receiptPdf,'welcome incomplete');
   assert(email.emailId&&email.receiptPdf,'email/receipt incomplete');
   assert(!co.sessionId.startsWith('cs_test_synthetic_'),'synthetic checkout cannot certify production');
   assert(!email.emailId.startsWith('re_live_'),'generated email identifier is not Resend delivery proof');
  }catch(e){results.push({id:'checkout-to-welcome',click:false,evidence:e instanceof Error?e.message:String(e)});}
 }
 const count=results.filter(x=>x.click&&BRICK_IDS.includes(x.id as typeof BRICK_IDS[number])).length;
 return {click:count+'/'+BRICK_IDS.length,passed:count===BRICK_IDS.length&&results.every(r=>r.click),results};
}
