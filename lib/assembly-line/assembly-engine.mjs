function assert(condition, message) { if (!condition) throw new Error(message); }

export function assembleManifest(manifest = {}) {
  assert(manifest.kind === 'ApprovedAssemblyManifest', 'ApprovedAssemblyManifest required');
  assert(manifest.tenantId && manifest.projectId, 'tenant/project binding required');
  const products = manifest.products || [];
  assert(products.length > 0, 'at least one product required');

  const workOrders = products.map((type) => ({
    id: `assembly-${manifest.projectId}-${type}`,
    projectId: manifest.projectId,
    tenantId: manifest.tenantId,
    type,
    status: 'ready',
    payload: {
      assemblyLine: true,
      modules: manifest.modules,
      capabilities: manifest.capabilities,
      navigation: manifest.navigation,
      routes: manifest.routes,
      ctaBindings: manifest.ctaBindings,
      permissions: manifest.permissions,
      dataBindings: manifest.dataBindings,
      workflows: manifest.workflows,
      integrations: manifest.integrations,
      brandKit: manifest.brandKit,
      content: manifest.content,
      designReference: manifest.designReference
    },
    provenance: { capabilityId: 'assembly-line', sourceType: 'ApprovedAssemblyManifest', seedClient: manifest.clientIdentity }
  }));

  const unresolved = [];
  for (const item of manifest.navigation || []) {
    if (!item.route) unresolved.push(`navigation:${item.moduleId}`);
    if (manifest.routes?.[item.moduleId] !== item.route) unresolved.push(`route:${item.moduleId}`);
    if (!manifest.ctaBindings?.[item.moduleId]) unresolved.push(`cta:${item.moduleId}`);
    if (!manifest.permissions?.[item.moduleId]) unresolved.push(`permissions:${item.moduleId}`);
    if (!manifest.dataBindings?.[item.moduleId]) unresolved.push(`data:${item.moduleId}`);
  }
  assert(!unresolved.length, `unresolved bindings: ${unresolved.join(',')}`);

  return {
    kind: 'AssemblyPlan',
    tenantId: manifest.tenantId,
    projectId: manifest.projectId,
    workOrders,
    sharedCapabilities: manifest.capabilities,
    runtimeConfig: {
      navigation: manifest.navigation,
      routes: manifest.routes,
      ctaBindings: manifest.ctaBindings,
      permissions: manifest.permissions,
      dataBindings: manifest.dataBindings,
      workflows: manifest.workflows,
      integrations: manifest.integrations
    },
    acceptanceProbes: [
      ...(manifest.acceptance?.requiredRoutes || []).map((route) => ({ type: 'route', route })),
      ...(manifest.acceptance?.requiredModules || []).map((moduleId) => ({ type: 'module', moduleId }))
    ],
    unresolvedBindings: [],
    readyForFactoryDispatch: true
  };
}
