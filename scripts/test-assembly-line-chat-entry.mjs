import { createChatFactoryAssemblyRequest } from '../lib/assembly-line/chat-factory-command.mjs';

const request = createChatFactoryAssemblyRequest({
  client: 'Assembly Proof Company',
  product: 'website+portal',
  modules: ['eshop','events','appointments'],
  designReference: { mode: 'factory-default' }
});

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
check(request.launch.client === 'Assembly Proof Company', 'launch client');
check(request.launch.deliverable === 'Website + Portal', 'launch deliverable');
check(request.assembly.manifest.kind === 'ApprovedAssemblyManifest', 'manifest compiled');
check(request.assembly.manifest.modules.length === 3, 'three modules selected');
check(request.assembly.assemblyPlan.readyForFactoryDispatch === true, 'assembly dispatchable');
check(request.assembly.assemblyPlan.workOrders.some((w) => w.type === 'website'), 'website work order');
check(request.assembly.assemblyPlan.workOrders.some((w) => w.type === 'portal'), 'portal work order');
check(request.assembly.assemblyPlan.unresolvedBindings.length === 0, 'no unresolved bindings');

if (failures.length) {
  console.error('FAIL');
  failures.forEach((f) => console.error(` - ${f}`));
  process.exit(1);
}
console.log('PASS assembly-line chat entry');
