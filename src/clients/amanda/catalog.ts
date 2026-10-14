import { registry } from '../../../lib/amanda-catherine/registry';
/** Per-client runtime catalog contract. Never assume fixture or static counts are live evidence. */
export const AMANDA_CATALOG_CONTRACT=Object.freeze({liveCount:12,readyCourseIds:[
'aesthetikine-reset-training','body-sculpt-practitioner-certification','non-surgical-bbl-training','wood-therapy-certification','clinical-fat-loss-injectables'] as const});
export async function auditLiveAmandaCatalog(){
 try{
  const live=(await registry()).courses.filter(course=>course.isActive&&course.isVisible&&!course.isTest);
  const ready=live.filter(course=>course.status==='READY');
  const actualReady=new Set(ready.map(course=>course.key));
  const expected=AMANDA_CATALOG_CONTRACT.readyCourseIds;
  const passed=live.length===AMANDA_CATALOG_CONTRACT.liveCount&&ready.length===expected.length&&expected.every(id=>actualReady.has(id));
  return {status:passed?200:503,evidence:`Airtable returned ${live.length} live, ${ready.length} READY; expected 12 live, 5 READY; IDs ${ready.map(x=>x.key).join(',')}`,liveIds:live.map(x=>x.key)} as const;
 }catch(error){return {status:503,evidence:'Live Airtable registry unavailable: '+(error instanceof Error?error.message:String(error)),liveIds:[] as string[]} as const;}
}
