import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');const failures=[];const assert=(c,m)=>{if(!c)failures.push(m);};const imp=(p)=>import(pathToFileURL(join(root,p)).href);
const { createWorkOrder, workOrderToArtifactDraft, WORK_ORDER_TYPES }=await imp('lib/factory-work-order.mjs');
const { createArtifact, appendArtifacts, PRODUCTION_ARTIFACT_KINDS }=await imp('lib/factory-artifact.mjs');
const { createBuilderRegistry }=await imp('lib/factory-builder-registry.mjs');
const { wrapBuilderWithExecutionContract }=await imp('lib/factory-execution-contract.mjs');
const { portalBuilder }=await imp('lib/factory-builders/portal-builder.mjs');
const { learningBuilder }=await imp('lib/factory-builders/learning-builder.mjs');
const { knowledgeBuilder }=await imp('lib/factory-builders/knowledge-builder.mjs');
const { reportBuilder }=await imp('lib/factory-builders/report-builder.mjs');
const { productionCanRun }=await imp('lib/factory-capability-gates.mjs');
assert(WORK_ORDER_TYPES.includes('report'),'report WorkOrder type registered');
for(const kind of ['portal_app','learning_system','knowledge_base','report_pack','execution_contract'])assert(PRODUCTION_ARTIFACT_KINDS.includes(kind),`production kind ${kind}`);
const registry=createBuilderRegistry();for(const b of [portalBuilder,learningBuilder,knowledgeBuilder,reportBuilder])registry.register(wrapBuilderWithExecutionContract(b));
for(const [type,id] of [['portal','portal'],['learning','learning'],['content','knowledge'],['report','report']])assert(registry.getByWorkOrderType(type)?.id===id,`${type} resolves ${id}`);
const projectId='proj-run1';const at='2026-09-12T22:00:00.000Z';const source='artifact-discovery-source';
const planning={portal:{kind:'portal_blueprint',data:{modules:[{id:'dashboard'}]}},learning:{kind:'learning_architecture',data:{tracks:[{id:'track-1'}]}},content:{kind:'content_strategy',data:{pillars:[{id:'proof'}]}},report:{kind:'executive_summary',data:{highlights:['proof']}}};
for(const type of ['portal','learning','content','report']){
 const wo=createWorkOrder({id:`workorder-${type}-run1`,projectId,type,title:`${type} deliverable`,acceptanceCriteria:[`${type} structure complete`],createdAt:at,provenance:{capabilityId:'planning',sourceArtifactIds:[source],seedClient:'EA Run 1',collectedAt:at}});
 const woDraft=workOrderToArtifactDraft(wo);const p=planning[type];const artifacts=[createArtifact({id:source,projectId,kind:'organization_profile',providerId:'discovery',provenance:{capabilityId:'discovery',sourceType:'research',sourceArtifactIds:['research-1'],collectedAt:at},data:{name:'EA Run 1'}}),createArtifact({id:`artifact-planning-${p.kind}-${type}`,projectId,kind:p.kind,providerId:'planning',provenance:{capabilityId:'planning',sourceType:'discovery_artifacts',sourceArtifactIds:[source],collectedAt:at},data:p.data}),createArtifact({...woDraft,projectId,provenance:{...woDraft.provenance,collectedAt:at}})];
 const builder=registry.getByWorkOrderType(type);const result=builder.build(wo,{artifacts,projectId,seedClient:'EA Run 1'},at);assert(result.ok,`${type} builder succeeds`);assert(result.completedWorkOrder?.status==='complete',`${type} completes WorkOrder`);assert(result.deliverable?.status==='ready_for_review',`${type} deliverable review-ready`);assert(result.drafts.some((d)=>d.kind==='execution_contract'),`${type} execution contract`);const merged=appendArtifacts(artifacts,result.drafts.map((d)=>({...d,projectId,provenance:{...d.provenance,collectedAt:d.provenance.collectedAt||at}})),at);assert(merged.appended.length===result.drafts.length,`${type} drafts validate and append`);
}
const portalWo=createWorkOrder({id:'wo-portal-gate',projectId,type:'portal',title:'Portal',createdAt:at,provenance:{capabilityId:'planning',sourceArtifactIds:[source],collectedAt:at}});const portalDraft=workOrderToArtifactDraft(portalWo);const gateContext={pipelineStatus:'PLANNING',outputs:[{kind:'planning'}],artifacts:[{...portalDraft,data:portalDraft.data}]};assert(productionCanRun(gateContext)===true,'Production gate recognizes non-website builders');
if(failures.length){console.error('FAIL Factory Run 1 mass builders');for(const f of failures)console.error(' -',f);process.exit(1);}console.log('PASS Factory Run 1 mass builders: portal + learning + knowledge + report');
