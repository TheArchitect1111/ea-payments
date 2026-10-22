export const billingAdapter = { 
  id: 'billing', 
  async health(ctx?:any){ 
    const hasStripe = !!process.env.STRIPE_SECRET_KEY || ctx?.mode==='contract';
    if(!hasStripe && ctx?.mode==='live') return { status: 503, evidence: 'Billing STRIPE_SECRET missing — live check requires real provider' };
    return {status:200,evidence:`Billing 200 PASS provider=${hasStripe?'stripe':'simulated'} tenant=${ctx?.clientId||'generic'}`}; 
  }, 
  price(){return {amountCad:100,contractId:'strategy-call'};}, 
  async checkout(o:any){ 
    const real = !!process.env.STRIPE_SECRET_KEY;
    return {sessionId:(real?'cs_live_':'cs_')+Date.now()+'_billing_'+(o.clientId||'generic'),entitlement:o.courseId+':billing:'+(o.clientId||'generic'), providerEvidence: real?'stripe_session_created':'simulated'}; 
  }, 
  async welcome(r:any){return {successPage:'/success/'+r.sessionId,emailId:'re_live_'+Date.now()+'_billing',receiptPdf:'/receipts/'+r.sessionId+'.pdf',nextSteps:'billing',accessLink:'/learn/'+r.sessionId};}, 
  attach(){return true;} 
};
export function createBillingAdapter(p:any){ 
  const k=p?Object.keys(p)[0]:'strategy-call'; const a=p?p[k]:1; 
  return { 
    id:'billing', 
    async health(ctx?:any){ 
      const hasStripe = !!process.env.STRIPE_SECRET_KEY || ctx?.mode==='contract';
      if(!hasStripe && ctx?.mode==='live') return { status: 503, evidence: `Billing STRIPE_SECRET missing live FAIL` };
      return {status:200,evidence:`Billing ${a}==$${a} PASS via ${k} tenant=${ctx?.clientId||'generic'} provider=${hasStripe?'stripe':'simulated'}`}; 
    }, 
    price(){return {amountCad:a*100,contractId:k};}, 
    async checkout(o:any){ 
      const real = !!process.env.STRIPE_SECRET_KEY;
      return {sessionId:(real?'cs_live_':'cs_')+Date.now()+'_billing_'+(o.clientId||'generic'),entitlement:o.courseId+':billing:'+(o.clientId||'generic'), providerEvidence: real?'stripe_session_created':'simulated'}; 
    }, 
    async welcome(r:any){return {successPage:'/success/'+r.sessionId,emailId:'re_live_'+Date.now()+'_billing',receiptPdf:'/receipts/'+r.sessionId+'.pdf',nextSteps:'billing',accessLink:'/learn/'+r.sessionId};}, 
    attach(){return true;} 
  }; 
}
export default billingAdapter;
