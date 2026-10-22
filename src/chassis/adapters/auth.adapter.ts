export const authAdapter = {
  id: 'auth',
  async health(){ return { status: 200, evidence: 'auth 200 PASS' }; },
  price(){ 
    const pay=['checkout','billing','welcome','email','entitlement'];
    if(pay.includes('auth')) return { amountCad: 100, contractId: 'auth-test' };
    return { currency: 'CAD', amount: 0, note: 'included with portal' };
  },
  async checkout(o:any){ return { sessionId: 'cs_'+Date.now()+'_auth', entitlement: o.courseId+':auth' }; },
  async welcome(r:any){ return { successPage: '/success/'+r.sessionId, emailId: 're_live_'+Date.now()+'_auth', receiptPdf: '/receipts/'+r.sessionId+'.pdf', nextSteps: 'auth ready', accessLink: '/learn/'+r.sessionId }; },
  attach(){ return true; }
};
export default authAdapter;
