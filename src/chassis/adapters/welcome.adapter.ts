import type { ClientConfig } from '../runClickTest';
import type { Brick, WelcomeResult } from '../BrickInterface';
import { sourceAdapter } from './sourceAdapter';
/** Synthetic welcome payload, not a sent email or existing PDF. */
export function createWelcomeAdapter(config?: ClientConfig): Brick {
 if (config?.commerce) {
  const ports = config.commerce;
  const base = sourceAdapter({ id: 'welcome', files: [], verify: ports.health });
  return { ...base, welcome: ports.welcome };
 }
 const base=sourceAdapter({id:'welcome',files:[],verify:async()=>({status:200,evidence:'CONTRACT ONLY: synthetic welcome fields; no sent email or PDF'})});
 return {...base,welcome:async({sessionId}):Promise<WelcomeResult>=>{
  if(!/^cs_test_[0-9]+_[a-zA-Z0-9_-]+$/.test(sessionId)) throw Error('Synthetic checkout session ID required');
  const courseId=sessionId.replace(/^cs_test_[0-9]+_/,'');
  return {successPage:'/success/'+sessionId,accessLink:'/learn/'+encodeURIComponent(courseId),
   receiptPdf:'/receipt/'+sessionId+'.pdf',nextSteps:'Check confirmation and access your course',
   emailId:'re_pending_'+sessionId};
 }};
}
export const welcomeAdapter=createWelcomeAdapter();
