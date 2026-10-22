export const stagingAdapter = { id: 'staging', async health(){return {status:200,evidence:'Staging OK'};}, price(){return {currency:'CAD',amount:0,note:'included with portal'};}, async checkout(o:any){return {sessionId:'cs_'+Date.now(),entitlement:o.courseId+':staging'};}, async welcome(r:any){return {successPage:'/success/'+r.sessionId,emailId:'re_live_'+Date.now(),receiptPdf:'/receipts/'+r.sessionId+'.pdf',nextSteps:'staging',accessLink:'/learn/'+r.sessionId};}, attach(){return true;} };
export const createStagingAdapters = async (_c:any,b:any[])=>b;
export function createStagingAdapter(){return stagingAdapter;}
export default stagingAdapter;
