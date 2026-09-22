function probe(ok, id, detail) { return { id, ok: Boolean(ok), detail }; }

export function certifyAssembly({ manifest, assemblyPlan, portalRuntime = null, websiteArtifact = null } = {}) {
  const results = [];
  results.push(probe(manifest?.kind === 'ApprovedAssemblyManifest', 'manifest', 'approved manifest present'));
  results.push(probe(assemblyPlan?.readyForFactoryDispatch === true, 'assembly-plan', 'assembly plan dispatchable'));
  results.push(probe((assemblyPlan?.unresolvedBindings || []).length === 0, 'bindings', 'no unresolved bindings'));

  for (const product of manifest?.products || []) {
    if (product === 'portal') results.push(probe(portalRuntime?.stub === false, 'portal-runtime', 'portal runtime materialized'));
    if (product === 'website') results.push(probe(websiteArtifact?.data?.stub === false || websiteArtifact?.stub === false, 'website-runtime', 'website artifact materialized'));
  }

  for (const moduleId of manifest?.modules || []) {
    const surface = portalRuntime?.surfaces?.find((s) => s.moduleId === moduleId);
    if ((manifest.products || []).includes('portal')) {
      results.push(probe(surface, `module:${moduleId}`, `portal surface ${moduleId}`));
      results.push(probe(surface?.route === manifest.routes?.[moduleId], `route:${moduleId}`, manifest.routes?.[moduleId]));
      results.push(probe(Boolean(manifest.ctaBindings?.[moduleId]), `cta:${moduleId}`, manifest.ctaBindings?.[moduleId]));
      results.push(probe(Boolean(manifest.permissions?.[moduleId]), `permission:${moduleId}`, 'permission binding'));
      results.push(probe(Boolean(manifest.dataBindings?.[moduleId]), `data:${moduleId}`, 'tenant data binding'));
    }
  }

  const failures = results.filter((r) => !r.ok);
  return {
    kind: 'AssemblyCertification',
    tenantId: manifest?.tenantId || null,
    projectId: manifest?.projectId || null,
    status: failures.length ? 'DENIED' : 'CONTRACT_CERTIFIED',
    runtimeCertified: false,
    results,
    failures,
    nextRequiredEvidence: failures.length ? 'repair failed assembly probes' : 'live deployed runtime probes required for RUNTIME_CERTIFIED'
  };
}
