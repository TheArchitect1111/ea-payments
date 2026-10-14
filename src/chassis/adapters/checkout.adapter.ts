import type { ClientConfig } from '../runClickTest';
import type { Brick, CheckoutRequest, CheckoutResult } from '../BrickInterface';
import { sourceAdapter } from './sourceAdapter';
/** Synthetic checkout only. Not a real payment or entitlement mutation. */
export function createCheckoutAdapter(config?: ClientConfig): Brick {
 if (config?.commerce) {
  const ports = config.commerce;
  const base = sourceAdapter({ id: 'checkout', files: [], verify: ports.health });
  return { ...base, checkout: ports.checkout, welcome: ports.welcome };
 }
 const base=sourceAdapter({id:'checkout',files:[],verify:async()=>({status:200,evidence:'CONTRACT ONLY: synthetic checkout format; no real charge'})});
 return {...base,checkout:async(opts:CheckoutRequest):Promise<CheckoutResult>=>{
  if(opts.type === 'stripe-live') throw Error('Live checkout requires client provider ports');
  if(!opts.courseId?.trim()) throw Error('courseId required');
  const courseId=opts.courseId.trim();
  return {sessionId:'cs_test_'+Date.now()+'_'+courseId,entitlement:courseId+':'+(opts.type==='stripe-test'?'72h:test':'lifetime:square-full')};
 }};
}
export const checkoutAdapter=createCheckoutAdapter();
