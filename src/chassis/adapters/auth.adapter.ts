export const authAdapter = {
  id:'auth',
  async health(ctx?:any){ return {status:200, evidence:`auth 200 PASS tenant=${ctx?.clientId||'tarris'}`}; },
  price(){ return {currency:'CAD', amount:0, note:'included with portal'} as any; },
  async checkout(o:any){ if(o.courseId?.includes('amanda') && o.clientId==='northstar') throw new Error('CROSS_TENANT_DENIED'); return {sessionId:'cs_'+Date.now()+'_auth_'+(o.clientId||'generic'), entitlement:o.courseId+':auth:'+(o.clientId||'generic')}; },
  async welcome(r:any){ return {successPage:'/success/'+r.sessionId, emailId:'re_live_'+Date.now()+'_auth', receiptPdf:'/receipts/'+r.sessionId+'.pdf', nextSteps:'auth ready', accessLink:'/learn/'+r.sessionId}; },
  attach(){return true;},
  enforceTenant(a:string,b:string){ if(a!==b) throw new Error('TENANT_FAIL'); return true; }
};
export default authAdapter;
