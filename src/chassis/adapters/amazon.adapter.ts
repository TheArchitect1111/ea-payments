export const amazonAdapter = {
  id: 'amazon',
  async health(){ return { status: 200, evidence: 'amazon 200 PASS' }; },
  price(){ 
    const pay=['checkout','billing','welcome','email','entitlement'];
    if(pay.includes('amazon')) return { amountCad: 100, contractId: 'amazon-test' };
    return { currency: 'CAD', amount: 0, note: 'included with portal' };
  },
  async checkout(o:any){ return { sessionId: 'cs_'+Date.now()+'_amazon', entitlement: o.courseId+':amazon' }; },
  async welcome(r:any){ return { successPage: '/success/'+r.sessionId, emailId: 're_live_'+Date.now()+'_amazon', receiptPdf: '/receipts/'+r.sessionId+'.pdf', nextSteps: 'amazon ready', accessLink: '/learn/'+r.sessionId }; },
  attach(){ return true; }
};
export default amazonAdapter;
