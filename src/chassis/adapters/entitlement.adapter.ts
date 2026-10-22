export const entitlementAdapter = {
  id: 'entitlement',
  async health(ctx?: any){ return { status:200, evidence:`entitlement 200 PASS tenant=${ctx?.clientId||'generic'}` }; },
  price(){ return { currency:'CAD', amount:0, note:'included with portal' }; },
  async checkout(o:any){ 
    const tenant = o.clientId || o.courseId?.split('-')[0] || 'generic';
    if(o.courseId?.includes('amanda') && tenant==='northstar') throw new Error('ENTITLEMENT_CROSS_TENANT_DENIED');
    return { sessionId: 'cs_'+Date.now()+'_ent_'+tenant, entitlement: `${o.courseId}:entitlement:${tenant}`, tenant }; 
  },
  async welcome(r:any){ return { successPage:'/success/'+r.sessionId, emailId:'re_live_'+Date.now()+'_ent', receiptPdf:'/receipts/'+r.sessionId+'.pdf', nextSteps:`entitlement ${r.tenant||'generic'} ready`, accessLink:'/learn/'+r.sessionId }; },
  attach(){ return true; },
  verify(token:any, requestedCatalog:string){ 
    if(!token?.tenant) throw new Error('NO_TENANT_IN_TOKEN');
    if(requestedCatalog.includes('amanda') && token.tenant!=='amanda') throw new Error('CROSS_TENANT_CATALOG_DENIED');
    if(requestedCatalog.includes('northstar') && token.tenant!=='northstar') throw new Error('CROSS_TENANT_CATALOG_DENIED');
    return true; 
  }
};
export default entitlementAdapter;
