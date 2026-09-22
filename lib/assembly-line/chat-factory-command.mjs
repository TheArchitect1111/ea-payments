import { compileBlueprint } from './blueprint-compiler.mjs';
import { assembleManifest } from './assembly-engine.mjs';

const PRODUCT_ALIASES = new Map([
  ['website', 'website'], ['page', 'website'], ['site', 'website'],
  ['portal', 'portal'], ['website+portal', 'website+portal'], ['website + portal', 'website+portal'], ['page + portal', 'website+portal']
]);

function normalizeProduct(value = 'website+portal') {
  const key = String(value).trim().toLowerCase();
  return PRODUCT_ALIASES.get(key) || 'website+portal';
}

export function createChatFactoryAssemblyRequest({
  client,
  modules = [],
  product = 'website+portal',
  brandKit = null,
  content = null,
  designReference = null,
  goal = 'Assemble and certify client digital platform',
  industry = null,
  notes = null,
  attachments = []
} = {}) {
  if (!client?.trim()) throw new Error('client required');
  const tenantId = client.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const projectId = `assembly-${tenantId}-${Date.now().toString(36)}`;
  const selectedProducts = normalizeProduct(product);
  const manifest = compileBlueprint({
    tenantId, projectId, clientIdentity: client.trim(), selectedProducts,
    selectedModules: modules, brandKit, content, designReference
  });
  const assemblyPlan = assembleManifest(manifest);

  return {
    launch: {
      command: `Launch ${client.trim()}`,
      client: client.trim(),
      goal,
      deliverable: selectedProducts === 'website+portal' ? 'Website + Portal' : selectedProducts,
      industry: industry || undefined,
      notes: [notes, `EA Assembly Manifest Project: ${projectId}`, `Modules: ${modules.join(', ')}`].filter(Boolean).join('\n'),
      attachments
    },
    assembly: { manifest, assemblyPlan }
  };
}
