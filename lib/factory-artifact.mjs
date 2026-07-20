/**
 * Pure Artifact lifecycle — append-only with provenance (Node unit tests).
 */

export const ARTIFACT_SCHEMA_VERSION = 1;

export const RESEARCH_ARTIFACT_KINDS = [
  'website',
  'organization',
  'document',
  'branding',
  'metadata',
];

export const DISCOVERY_ARTIFACT_KINDS = [
  'organization_profile',
  'programs',
  'services',
  'audience_segments',
  'content_inventory',
  'technology_stack',
  'learning_opportunities',
  'accessibility_findings',
  'automation_opportunities',
  'recommendations',
];

export const PLANNING_ARTIFACT_KINDS = [
  'executive_summary',
  'information_architecture',
  'website_sitemap',
  'navigation_tree',
  'portal_blueprint',
  'learning_architecture',
  'content_strategy',
  'deliverables_matrix',
  'production_plan',
  'milestone_plan',
  'review_checklist',
  'work_order',
];

/** Planning document kinds (excludes work_order carrier artifacts). */
export const PLANNING_DOCUMENT_KINDS = PLANNING_ARTIFACT_KINDS.filter((kind) => kind !== 'work_order');

export const PRODUCTION_ARTIFACT_KINDS = [
  'website_site',
  'deliverable',
  'review_gate',
  'production_progress',
];

/** Experience Director — evaluator only (not a Launch orchestration change). */
export const EXPERIENCE_DIRECTOR_ARTIFACT_KINDS = ['experience_review'];

export const ARTIFACT_KINDS = [
  ...RESEARCH_ARTIFACT_KINDS,
  ...DISCOVERY_ARTIFACT_KINDS,
  ...PLANNING_ARTIFACT_KINDS,
  ...PRODUCTION_ARTIFACT_KINDS,
  ...EXPERIENCE_DIRECTOR_ARTIFACT_KINDS,
];

/**
 * @param {object} input
 * @param {string} [at]
 */
export function createArtifact(input, at = new Date().toISOString()) {
  if (!input?.id || !input?.projectId || !input?.kind || !input?.providerId) {
    throw new Error('Artifact requires id, projectId, kind, and providerId');
  }
  if (!ARTIFACT_KINDS.includes(input.kind)) {
    throw new Error(`Unsupported artifact kind: ${input.kind}`);
  }
  if (!input.provenance || typeof input.provenance !== 'object') {
    throw new Error('Artifact requires provenance');
  }

  const sourceArtifactIds = Array.isArray(input.provenance.sourceArtifactIds)
    ? [...new Set(input.provenance.sourceArtifactIds.filter(Boolean).map(String))]
    : undefined;

  return {
    schemaVersion: ARTIFACT_SCHEMA_VERSION,
    id: input.id,
    projectId: input.projectId,
    kind: input.kind,
    providerId: input.providerId,
    createdAt: input.createdAt || at,
    provenance: {
      capabilityId: input.provenance.capabilityId || 'research',
      sourceType: input.provenance.sourceType || input.kind,
      sourceUrl: input.provenance.sourceUrl,
      sourceName: input.provenance.sourceName,
      intakeOutputId: input.provenance.intakeOutputId,
      seedClient: input.provenance.seedClient,
      collectedAt: input.provenance.collectedAt || at,
      notes: input.provenance.notes,
      ...(sourceArtifactIds ? { sourceArtifactIds } : {}),
    },
    data: input.data && typeof input.data === 'object' ? { ...input.data } : {},
  };
}

export function createArtifactId(providerId, kind, nonce = '') {
  return `artifact-${providerId}-${kind}-${nonce || Date.now().toString(36)}`;
}

/**
 * Append artifacts to a list. Idempotent by artifact id. Never overwrites prior entries.
 * @returns {{ artifacts: object[], appended: object[], skippedIds: string[] }}
 */
export function appendArtifacts(existing, incoming, at = new Date().toISOString()) {
  const artifacts = Array.isArray(existing) ? [...existing] : [];
  const seen = new Set(artifacts.map((item) => item.id));
  const appended = [];
  const skippedIds = [];

  for (const raw of incoming || []) {
    const artifact = createArtifact(raw, at);
    if (seen.has(artifact.id)) {
      skippedIds.push(artifact.id);
      continue;
    }
    seen.add(artifact.id);
    artifacts.push(artifact);
    appended.push(artifact);
  }

  return { artifacts, appended, skippedIds };
}

export function listArtifacts(artifacts, kind) {
  const list = Array.isArray(artifacts) ? [...artifacts] : [];
  if (!kind) return list;
  return list.filter((item) => item.kind === kind);
}

export function listArtifactsByCapability(artifacts, capabilityId) {
  return (artifacts || []).filter((item) => item.provenance?.capabilityId === capabilityId);
}

export function listResearchArtifacts(artifacts) {
  return (artifacts || []).filter(
    (item) =>
      item.provenance?.capabilityId === 'research' ||
      RESEARCH_ARTIFACT_KINDS.includes(item.kind),
  );
}

export function listDiscoveryArtifacts(artifacts) {
  return (artifacts || []).filter(
    (item) =>
      item.provenance?.capabilityId === 'discovery' ||
      DISCOVERY_ARTIFACT_KINDS.includes(item.kind),
  );
}

export function listPlanningArtifacts(artifacts) {
  return (artifacts || []).filter(
    (item) =>
      (item.provenance?.capabilityId === 'planning' || PLANNING_DOCUMENT_KINDS.includes(item.kind)) &&
      item.kind !== 'work_order',
  );
}

export function listWorkOrderArtifacts(artifacts) {
  return (artifacts || []).filter((item) => item.kind === 'work_order');
}

export function getArtifactById(artifacts, id) {
  return (artifacts || []).find((item) => item.id === id) || null;
}

export function migrateArtifact(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Artifact migration requires an object');
  }
  const version = Number(raw.schemaVersion) || 0;
  if (version > ARTIFACT_SCHEMA_VERSION) {
    throw new Error(`Unsupported Artifact schemaVersion ${version}`);
  }
  return createArtifact(raw, raw.createdAt);
}
