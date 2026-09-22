function assert(value, message) { if (!value) throw new Error(message); }

const SURFACE_TYPES = new Set(['website','portal']);
const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  laptop: { width: 1440, height: 900 },
  desktop: { width: 1920, height: 1080 }
};

export function createVisualReferenceSpec({ references = [], fidelity = 'strict' } = {}) {
  assert(Array.isArray(references) && references.length, 'at least one visual reference required');
  const normalized = references.map((ref, index) => {
    assert(ref?.assetRef, `references[${index}].assetRef required`);
    assert(SURFACE_TYPES.has(ref.surface), `references[${index}].surface must be website or portal`);
    const viewport = ref.viewport || 'laptop';
    assert(VIEWPORTS[viewport], `unknown viewport ${viewport}`);
    return {
      id: ref.id || `visual-${index + 1}`,
      assetRef: ref.assetRef,
      surface: ref.surface,
      page: ref.page || 'home',
      viewport,
      viewportSize: VIEWPORTS[viewport],
      role: ref.role || 'visual-specification',
      immutable: true
    };
  });

  return {
    kind: 'EAVisualReferenceSpec',
    schemaVersion: '1.0.0',
    fidelity,
    references: normalized,
    interpretation: {
      treatAsSpecificationNotInspiration: true,
      extract: ['layout','section-order','geometry','spacing','typography','colors','borders','radii','shadows','image-placement','navigation-pattern','component-hierarchy'],
      doNotInferFromPixels: ['hidden-behavior','offscreen-content','data-model','button-destination','permissions','responsive-states-not-shown']
    },
    implementation: {
      mapVisibleComponentsToCertifiedEAModules: true,
      useExistingWebsiteEngine: true,
      useExistingPortalChassis: true,
      useExistingThemeEngine: true,
      useExistingModuleEngine: true
    },
    verification: {
      captureWithExistingECEPlaywright: true,
      compareAgainstImmutableReference: true,
      requireAllProvidedViewports: true,
      correctionLoop: true,
      maxIterations: 8,
      pixelDiffIsSupportingSignalOnly: true,
      multimodalCriticRequired: true
    }
  };
}

export function bindVisualReferenceToBlueprint(input = {}, visualReferenceSpec) {
  assert(visualReferenceSpec?.kind === 'EAVisualReferenceSpec', 'EAVisualReferenceSpec required');
  return { ...input, designReference: visualReferenceSpec };
}
