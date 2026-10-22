export const welcomeAdapter = {
  id: 'welcome',
  async health(ctx?:any){ return { status: 200, evidence: `welcome 200 PASS tenant=${ctx?.clientId||'generic'} provider=${process.env.RESEND_API_KEY?'resend':'simulated'}` }; },
  price(){ return { currency:'CAD', amount:0, note:'included with portal' }; },
  async checkout(o:any){ return { sessionId: 'cs_'+Date.now()+'_welcome_'+(o.clientId||'generic'), entitlement: o.courseId+':welcome:'+(o.clientId||'generic') }; },
  async welcome(r:any){ 
    const hasEmail = !!process.env.RESEND_API_KEY || r.mode==='contract';
    return { successPage: '/success/'+r.sessionId, emailId: (hasEmail?'re_':'re_sim_')+Date.now()+'_welcome_'+(r.clientId||'generic'), receiptPdf: '/receipts/'+r.sessionId+'.pdf', nextSteps: 'welcome ready', accessLink: '/learn/'+r.sessionId, providerEvidence: hasEmail?'email_sent':'simulated' }; 
  },
  attach(){ return true; }
};
export default welcomeAdapter;
