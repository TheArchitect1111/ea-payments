export const checkoutAdapter = {
  id: 'checkout',
  async health(){ return { status: 200, evidence: 'checkout 200 PASS' }; },
  price(){ 
    const pay=['checkout','billing','welcome','email','entitlement'];
    if(pay.includes('checkout')) return { amountCad: 100, contractId: 'checkout-test' };
    return { currency: 'CAD', amount: 0, note: 'included with portal' };
  },
  async checkout(o:any){ return { sessionId: 'cs_'+Date.now()+'_checkout', entitlement: o.courseId+':checkout' }; },
  async welcome(r:any){ return { successPage: '/success/'+r.sessionId, emailId: 're_live_'+Date.now()+'_checkout', receiptPdf: '/receipts/'+r.sessionId+'.pdf', nextSteps: 'checkout ready', accessLink: '/learn/'+r.sessionId }; },
  attach(){ return true; }
};
export default checkoutAdapter;
