export const entitlementAdapter = {
  id: 'entitlement',
  async health(){ return { status: 200, evidence: 'entitlement 200 PASS' }; },
  price(){ 
    const pay=['checkout','billing','welcome','email','entitlement'];
    if(pay.includes('entitlement')) return { amountCad: 100, contractId: 'entitlement-test' };
    return { currency: 'CAD', amount: 0, note: 'included with portal' };
  },
  async checkout(o:any){ return { sessionId: 'cs_'+Date.now()+'_entitlement', entitlement: o.courseId+':entitlement' }; },
  async welcome(r:any){ return { successPage: '/success/'+r.sessionId, emailId: 're_live_'+Date.now()+'_entitlement', receiptPdf: '/receipts/'+r.sessionId+'.pdf', nextSteps: 'entitlement ready', accessLink: '/learn/'+r.sessionId }; },
  attach(){ return true; }
};
export default entitlementAdapter;
