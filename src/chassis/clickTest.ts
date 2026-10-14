import assert from 'node:assert/strict';
import { BRICK_IDS, type Brick } from './BrickInterface';
import { PRICE_CONTRACT } from './priceContract';

/** Distinguishes structural checks from side-effecting integration certification. */
export async function clickTest(bricks: readonly Brick[], courseId: string, type: 'stripe-test'|'square-full'='stripe-test') {
 const seen=new Map<string,Brick>();
 for(const brick of bricks){assert(!seen.has(brick.id),'Duplicate brick '+brick.id);seen.set(brick.id,brick);}
 const results=[];
 for(const id of BRICK_IDS){
  try{
   const brick=seen.get(id);assert(brick,id+' not registered');
   const h=await brick.health();assert.equal(h.status,200,id+' health: '+h.evidence);
   const p=brick.price();assert.equal(p.contractId,PRICE_CONTRACT.id,id+' price drift');
   assert(Number.isFinite(p.amountCad)&&p.amountCad>=0,id+' invalid price');
   if(id==='checkout'||id==='billing'||id==='welcome'||id==='email'||id==='entitlement'){
    const co=await brick.checkout({type,courseId});assert(co.sessionId&&co.entitlement,id+' no verified entitlement');
    const w=await brick.welcome({sessionId:co.sessionId});assert(w.successPage&&w.emailId&&w.receiptPdf&&w.nextSteps&&w.accessLink,id+' incomplete delivery');
   }
   assert.equal(brick.attach(),true,id+' has no recorded real integration proof');
   results.push({id,click:true,evidence:h.evidence});
  }catch(error){results.push({id,click:false,evidence:error instanceof Error?error.message:String(error)});}
 }
 const count=results.filter(x=>x.click).length;
 return {click:count+'/14',passed:count===14,results};
}
