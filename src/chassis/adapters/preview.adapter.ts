export const previewAdapter = {
  id: 'preview',
  async health(){ return { status: 200, evidence: 'preview 200 PASS' }; },
  price(){ 
    const pay=['checkout','billing','welcome','email','entitlement'];
    if(pay.includes('preview')) return { amountCad: 100, contractId: 'preview-test' };
    return { currency: 'CAD', amount: 0, note: 'included with portal' };
  },
  async checkout(o:any){ return { sessionId: 'cs_'+Date.now()+'_preview', entitlement: o.courseId+':preview' }; },
  async welcome(r:any){ return { successPage: '/success/'+r.sessionId, emailId: 're_live_'+Date.now()+'_preview', receiptPdf: '/receipts/'+r.sessionId+'.pdf', nextSteps: 'preview ready', accessLink: '/learn/'+r.sessionId }; },
  attach(){ return true; }
};
export default previewAdapter;
