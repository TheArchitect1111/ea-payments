import { createVisualReferenceSpec, bindVisualReferenceToBlueprint } from '../lib/assembly-line/visual-reference-spec.mjs';
import { compileBlueprint } from '../lib/assembly-line/blueprint-compiler.mjs';
import { createVisualCorrectionSession, applyCriticResult } from '../lib/assembly-line/visual-correction-loop.mjs';

const spec = createVisualReferenceSpec({ references: [
  { assetRef: 'chat-attachment://website-master.png', surface: 'website', viewport: 'laptop' },
  { assetRef: 'chat-attachment://portal-master.png', surface: 'portal', viewport: 'laptop' },
  { assetRef: 'chat-attachment://portal-mobile.png', surface: 'portal', viewport: 'mobile' }
]});

const input = bindVisualReferenceToBlueprint({
  tenantId: 'visual-proof-001', projectId: 'visual-proof-project', clientIdentity: 'Visual Proof Company',
  selectedProducts: 'website+portal', selectedModules: ['eshop','events','appointments']
}, spec);
const manifest = compileBlueprint(input);
const session = createVisualCorrectionSession({ visualSpec: manifest.designReference, candidateRoutes: { website: '/visual-proof', portal: '/portal/visual-proof' } });
const failures = [];
const check = (condition, label) => { if (!condition) failures.push(label); };
check(manifest.designReference.kind === 'EAVisualReferenceSpec', 'visual spec bound');
check(manifest.designReference.references.length === 3, 'all images retained');
check(session.targets.length === 3, 'three comparison targets');
check(session.status === 'READY_FOR_CAPTURE', 'capture ready');
const repair = applyCriticResult(session, { targets: [{ id:'1', status:'FAIL', deltas:['spacing'] }] });
check(repair.status === 'REPAIR_REQUIRED', 'failed critic enters repair loop');
const passed = applyCriticResult(session, { targets: [{ id:'1', status:'PASS' }, { id:'2', status:'PASS' }, { id:'3', status:'PASS' }] });
check(passed.status === 'VISUALLY_CERTIFIED', 'all critic targets certify');
if (failures.length) { console.error('FAIL', failures); process.exit(1); }
console.log('PASS assembly-line visual reference pipeline');
