/** Client-specific catalog expectations; live Airtable record IDs must be resolved, not invented. */
export const AMANDA_CATALOG_CONTRACT = Object.freeze({
 expectedLiveCount:12,
 readyCourseIds:[
 'aesthetikine-reset-training','body-sculpt-practitioner-certification',
 'non-surgical-bbl-training','wood-therapy-certification','clinical-fat-loss-injectables',
 ] as const,
});
export function verifyAmandaCatalog(rows:readonly {id:string;status:string;isActive:boolean;isVisible:boolean}[]){
 const live=rows.filter(r=>r.isActive&&r.isVisible);
 const ready=live.filter(r=>r.status==='READY');
 const actualIds=new Set(ready.map(r=>r.id));
 const ok=live.length===AMANDA_CATALOG_CONTRACT.expectedLiveCount && ready.length===5 && AMANDA_CATALOG_CONTRACT.readyCourseIds.every(id=>actualIds.has(id));
 return {ok,liveCount:live.length,readyCount:ready.length,liveIds:live.map(r=>r.id),evidence:ok?'Catalog contract verified':'Catalog count or READY IDs mismatch'};
}
