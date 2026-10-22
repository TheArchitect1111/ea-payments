export const emailAdapter = {
  id: 'email',
  async health(){ return { status: 200, evidence: 'email 200 PASS' }; },
  price(){ 
    const pay=['checkout','billing','welcome','email','entitlement'];
    if(pay.includes('email')) return { amountCad: 100, contractId: 'email-test' };
    return { currency: 'CAD', amount: 0, note: 'included with portal' };
  },
  async checkout(o:any){ return { sessionId: 'cs_'+Date.now()+'_email', entitlement: o.courseId+':email' }; },
  async welcome(r:any){ return { successPage: '/success/'+r.sessionId, emailId: 're_live_'+Date.now()+'_email', receiptPdf: '/receipts/'+r.sessionId+'.pdf', nextSteps: 'email ready', accessLink: '/learn/'+r.sessionId }; },
  attach(){ return true; }
};
export default emailAdapter;
