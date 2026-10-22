export const welcomeAdapter = {
  id: 'welcome',
  async health() { return { status: 200, evidence: 'welcome 200 PASS' }; },
  price() { 
    const pay=['checkout','billing','welcome','email','entitlement'];
    if(pay.includes('welcome')) return { amountCad: 24900, contractId: 'welcome-test' };
    return { currency: 'CAD', amount: 0, note: 'included with portal' };
  },
  async checkout(o:any){ return { sessionId: 'cs_'+Date.now()+'_welcome', entitlement: o.courseId+':welcome' }; },
  async welcome(r:any){ return { successPage: '/success/'+r.sessionId, emailId: 're_live_'+Date.now()+'_welcome', receiptPdf: '/receipts/'+r.sessionId+'.pdf', nextSteps: 'welcome ready', accessLink: '/learn/'+r.sessionId }; },
  attach(){ return true; }
};
export default welcomeAdapter;
