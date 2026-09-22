import { createDropboxAssetReference, toFactoryAssetRef } from '../lib/assembly-line/dropbox-asset-reference.mjs';
import { createVisualReferenceSpec, bindVisualReferenceToBlueprint } from '../lib/assembly-line/visual-reference-spec.mjs';
import { compileBlueprint } from '../lib/assembly-line/blueprint-compiler.mjs';
import { assembleManifest } from '../lib/assembly-line/assembly-engine.mjs';
import { materializeAssemblyPlan } from '../lib/assembly-line/work-order-materializer.mjs';

const websiteAsset = createDropboxAssetReference({ fileId:'id:tpgHnfsjauMAAAAAAAANaA', path:'/EA Factory Assets/TB3-Approved-Website-Design.png' });
const portalAsset = createDropboxAssetReference({ fileId:'id:tpgHnfsjauMAAAAAAAANaQ', path:'/EA Factory Assets/TB3-HQ-Approved-Portal-Design.png' });
const visualSpec = createVisualReferenceSpec({ references:[
  { assetRef:toFactoryAssetRef(websiteAsset), surface:'website', viewport:'laptop' },
  { assetRef:toFactoryAssetRef(portalAsset), surface:'portal', viewport:'laptop' }
]});
const manifest = compileBlueprint(bindVisualReferenceToBlueprint({
  tenantId:'tb3-run12b-proof', projectId:'tb3-run12b-fresh-build', clientIdentity:'TB3 Run 12B Factory Proof',
  selectedProducts:'website+portal', selectedModules:['eshop','events','appointments','documents','messages','community','media','calendar','eva']
}, visualSpec));
const plan = assembleManifest(manifest);
const built = materializeAssemblyPlan(plan);
const failures=[]; const check=(v,m)=>{if(!v) failures.push(m)};
check(built.status==='READY_FOR_ROUTE_RENDER','route render status');
check(built.website?.kind==='website_app','website materialized');
check(built.portal?.kind==='portal_app','portal materialized');
check(built.website.sections.length===9,'website modules');
check(built.portal.surfaces.length===9,'portal modules');
check(built.website.designReference?.kind==='EAVisualReferenceSpec','website visual spec');
check(built.portal.designReference?.kind==='EAVisualReferenceSpec','portal visual spec');
if(failures.length){console.error('FAIL',failures);process.exit(1)}
console.log('PASS Run 12B work-order materialization');
