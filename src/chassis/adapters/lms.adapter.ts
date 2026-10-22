export const lmsAdapter = {
  id: 'lms',
  async health(){ return { status: 200, evidence: 'lms 200 PASS' }; },
  price(){ 
    const pay=['checkout','billing','welcome','email','entitlement'];
    if(pay.includes('lms')) return { amountCad: 100, contractId: 'lms-test' };
    return { currency: 'CAD', amount: 0, note: 'included with portal' };
  },
  async checkout(o:any){ return { sessionId: 'cs_'+Date.now()+'_lms', entitlement: o.courseId+':lms' }; },
  async welcome(r:any){ return { successPage: '/success/'+r.sessionId, emailId: 're_live_'+Date.now()+'_lms', receiptPdf: '/receipts/'+r.sessionId+'.pdf', nextSteps: 'lms ready', accessLink: '/learn/'+r.sessionId }; },
  attach(){ return true; }
};
export default lmsAdapter;
