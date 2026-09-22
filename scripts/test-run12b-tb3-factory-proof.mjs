import { createDropboxAssetReference, toFactoryAssetRef } from '../lib/assembly-line/dropbox-asset-reference.mjs';
import { createVisualReferenceSpec, bindVisualReferenceToBlueprint } from '../lib/assembly-line/visual-reference-spec.mjs';
import { compileBlueprint } from '../lib/assembly-line/blueprint-compiler.mjs';
import { assembleManifest } from '../lib/assembly-line/assembly-engine.mjs';
import { createVisualCorrectionSession } from '../lib/assembly-line/visual-correction-loop.mjs';

const website = createDropboxAssetReference({
  fileId: 'id:tpgHnfsjauMAAAAAAAANaA',
  path: 'ns:96842076//EA Factory Assets/TB3-Approved-Website-Design.png',
  contentHash: '40c0952c36d9a50639b86f8a28995b5b58b1f2251bf87ce16755c304c85e476b'
});
const portal = createDropboxAssetReference({
  fileId: 'id:tpgHnfsjauMAAAAAAAANaQ',
  path: 'ns:96842076//EA Factory Assets/TB3-HQ-Approved-Portal-Design.png',
  contentHash: 'fc96e3cb9b4e1b4fc3aee3ad46756d81a979266a799c9967a4491b53cdfa368f'
});

const visualSpec = createVisualReferenceSpec({ references: [
  { assetRef: toFactoryAssetRef(website), surface: 'website', page: 'home', viewport: 'laptop' },
  { assetRef: toFactoryAssetRef(portal), surface: 'portal', page: 'home', viewport: 'laptop' }
]});
const blueprint = bindVisualReferenceToBlueprint({
  tenantId: 'tb3-run12b-proof',
  projectId: 'tb3-run12b-fresh-build',
  clientIdentity: 'TB3 Run 12B Factory Proof',
  selectedProducts: 'website+portal',
  selectedModules: ['eshop','events','appointments','documents','messages','community','media','calendar','eva']
}, visualSpec);
const manifest = compileBlueprint(blueprint);
const plan = assembleManifest(manifest);
const correction = createVisualCorrectionSession({ visualSpec: manifest.designReference, candidateRoutes: {
  website: '/factory-proof/tb3-run12b', portal: '/portal/factory-proof/tb3-run12b'
}});

const failures = [];
const check = (v, label) => { if (!v) failures.push(label); };
check(plan.readyForFactoryDispatch === true, 'factory dispatch');
check(plan.unresolvedBindings.length === 0, 'zero unresolved bindings');
check(correction.targets.length === 2, 'two immutable visual targets');
check(correction.status === 'READY_FOR_CAPTURE', 'visual capture ready');
if (failures.length) { console.error('FAIL', failures); process.exit(1); }
console.log('PASS Run 12B TB3 fresh-build acceptance fixture');
