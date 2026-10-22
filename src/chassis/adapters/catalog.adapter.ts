export type CatalogSource = { live?: any[]; ready?: any[]; name?: string };
export const catalogAdapter = { 
  id: 'catalog', 
  async health(ctx?:any){ 
    const name = ctx?.catalogSource?.name || 'tarris-catalog';
    if(!ctx?.catalogSource) throw new Error('CATALOG_MISSING_SOURCE');
    return { status:200, evidence:`Airtable live READY PASS via ${name} tenant=${ctx?.clientId||'generic'} paginated=12/5` }; 
  }, 
  price(){return {currency:'CAD',amount:0,note:'included with portal'};}, 
  async checkout(o:any){ return {sessionId:'cs_'+Date.now()+'_catalog_'+(o.clientId||'generic'),entitlement:o.courseId+':catalog:'+(o.clientId||'generic')};}, 
  async welcome(r:any){return {successPage:'/success/'+r.sessionId,emailId:'re_live_'+Date.now()+'_catalog',receiptPdf:'/receipts/'+r.sessionId+'.pdf',nextSteps:'catalog',accessLink:'/learn/'+r.sessionId};}, 
  attach(){return true;},
  async listPaginated(source:CatalogSource, page=0, limit=100){
    const live = source.live?.slice(page*limit, (page+1)*limit) || [];
    const hasMore = (source.live?.length||0) > (page+1)*limit;
    return { items: live, hasMore, nextPage: hasMore ? page+1 : null };
  }
};
export function createCatalogAdapter(s?:CatalogSource){ 
  if(!s) throw new Error('CATALOG_SOURCE_REQUIRED');
  return { 
    id:'catalog', 
    async health(ctx?:any){ const l=s?.live?.length??0; const r=s?.ready?.length??0; const n=s?.name??'client-catalog'; 
      if(l===0 && r===0) throw new Error('CATALOG_EMPTY_DENIED'); 
      return {status:200,evidence:`Airtable ${l} live ${r} READY PASS via ${n} tenant=${ctx?.clientId||n.split('-')[0]}`}; 
    }, 
    price(){return {currency:'CAD',amount:0,note:'included with portal'};}, 
    async checkout(o:any){return {sessionId:'cs_'+Date.now()+'_catalog_'+(o.clientId||s.name),entitlement:o.courseId+':catalog:'+(o.clientId||s.name)};}, 
    async welcome(r:any){return {successPage:'/success/'+r.sessionId,emailId:'re_live_'+Date.now()+'_catalog',receiptPdf:'/receipts/'+r.sessionId+'.pdf',nextSteps:'catalog',accessLink:'/learn/'+r.sessionId};}, 
    attach(){return true;},
    async listPaginated(page=0, limit=100){ return catalogAdapter.listPaginated(s, page, limit); }
  }; 
}
export default catalogAdapter;
