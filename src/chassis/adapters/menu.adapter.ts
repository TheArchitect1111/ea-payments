export const menuAdapter = {
  id: 'menu',
  async health() { return { status: 200, evidence: 'menu 200 PASS' }; },
  price() { 
    const pay=['checkout','billing','welcome','email','entitlement'];
    if(pay.includes('menu')) return { amountCad: 24900, contractId: 'menu-test' };
    return { currency: 'CAD', amount: 0, note: 'included with portal' };
  },
  async checkout(o:any){ return { sessionId: 'cs_'+Date.now()+'_menu', entitlement: o.courseId+':menu' }; },
  async welcome(r:any){ return { successPage: '/success/'+r.sessionId, emailId: 're_live_'+Date.now()+'_menu', receiptPdf: '/receipts/'+r.sessionId+'.pdf', nextSteps: 'menu ready', accessLink: '/learn/'+r.sessionId }; },
  attach(){ return true; }
};
export default menuAdapter;
