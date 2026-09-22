import { compileBlueprint } from '../../lib/assembly-line/blueprint-compiler.mjs';
import { assembleManifest } from '../../lib/assembly-line/assembly-engine.mjs';
import { materializePortalRuntime } from '../../lib/assembly-line/portal-module-runtime.mjs';
import { certifyAssembly } from '../../lib/assembly-line/certification-engine.mjs';

const input = {
  tenantId: 'synthetic-acme-001',
  projectId: 'assembly-proof-001',
  clientIdentity: 'Assembly Proof Company',
  selectedProducts: 'website+portal',
  selectedModules: ['eshop','events','appointments'],
  brandKit: { name: 'Assembly Proof Company' },
  content: { headline: 'Built by the EA Assembly Line' },
  designReference: { mode: 'factory-default' }
};

const manifest = compileBlueprint(input);
const assemblyPlan = assembleManifest(manifest);
const portalWorkOrder = assemblyPlan.workOrders.find((w) => w.type === 'portal');
const portalRuntime = materializePortalRuntime(portalWorkOrder);

// Run 8 intentionally refuses to fake a website artifact or live deployment.
// Existing WebsiteBuilder requires the frozen Factory Core artifact context.
// The proof must therefore expose the remaining integration boundary instead of returning a false green.
const certification = certifyAssembly({ manifest, assemblyPlan, portalRuntime, websiteArtifact: null });

const report = {
  input,
  manifestSummary: { products: manifest.products, modules: manifest.modules, capabilities: manifest.capabilities },
  assemblySummary: { workOrders: assemblyPlan.workOrders.map((w) => ({ id: w.id, type: w.type })), unresolvedBindings: assemblyPlan.unresolvedBindings },
  portalSummary: { surfaceCount: portalRuntime.surfaces.length, routes: portalRuntime.surfaces.map((s) => s.route), stub: portalRuntime.stub },
  certification
};

console.log(JSON.stringify(report, null, 2));
if (certification.status === 'DENIED') process.exitCode = 2;
