function assert(value, message) { if (!value) throw new Error(message); }

export function createVisualCorrectionSession({ visualSpec, candidateRoutes = {}, maxIterations } = {}) {
  assert(visualSpec?.kind === 'EAVisualReferenceSpec', 'visualSpec required');
  const limit = maxIterations || visualSpec.verification?.maxIterations || 8;
  const targets = visualSpec.references.map((reference) => {
    const route = candidateRoutes[`${reference.surface}:${reference.page}`] || candidateRoutes[reference.surface];
    assert(route, `candidate route missing for ${reference.surface}:${reference.page}`);
    return {
      referenceId: reference.id,
      referenceAsset: reference.assetRef,
      surface: reference.surface,
      page: reference.page,
      viewport: reference.viewport,
      viewportSize: reference.viewportSize,
      candidateRoute: route,
      protectedRegions: ['full-page']
    };
  });

  return {
    kind: 'EAVisualCorrectionSession',
    status: 'READY_FOR_CAPTURE',
    iteration: 0,
    maxIterations: limit,
    targets,
    loop: ['ECE_CAPTURE_CANDIDATE','MULTIMODAL_COMPARE_TO_REFERENCE','CLASSIFY_VISUAL_DELTAS','PATCH_THEME_LAYOUT_COMPONENTS','RENDER_AGAIN','REPEAT_UNTIL_PASS_OR_LIMIT'],
    passRequirements: {
      allTargetsRendered: true,
      noMissingViewportEvidence: true,
      noCriticalStructureMismatch: true,
      noCriticalTypographyMismatch: true,
      noCriticalSpacingMismatch: true,
      noCriticalImagePlacementMismatch: true,
      functionalCertificationSeparateAndRequired: true
    },
    rules: {
      candidateCannotReplaceReference: true,
      referenceCannotBeMutated: true,
      visualPassCannotOverrideFunctionalFailure: true,
      functionalPassCannotOverrideVisualFailure: true,
      patchFactoryOrGeneratedCandidateNotReference: true
    }
  };
}

export function applyCriticResult(session, result = {}) {
  assert(session?.kind === 'EAVisualCorrectionSession', 'visual correction session required');
  assert(Array.isArray(result.targets), 'critic target results required');
  const failures = result.targets.filter((target) => target.status !== 'PASS');
  const nextIteration = session.iteration + 1;
  if (!failures.length) return { ...session, iteration: nextIteration, status: 'VISUALLY_CERTIFIED', lastCriticResult: result };
  if (nextIteration >= session.maxIterations) return { ...session, iteration: nextIteration, status: 'VISUAL_CERTIFICATION_DENIED', lastCriticResult: result, repairQueue: failures };
  return { ...session, iteration: nextIteration, status: 'REPAIR_REQUIRED', lastCriticResult: result, repairQueue: failures };
}
