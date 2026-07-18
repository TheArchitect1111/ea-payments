/**
 * Pure ProjectContext lifecycle (ESM) — unit-tested from Node.
 * Append-only outputs + artifacts; schemaVersion for evolution.
 */

export const PROJECT_CONTEXT_SCHEMA_VERSION = 2;

export function createProjectContext(seed, pipelineStatus = 'CREATED', at = new Date().toISOString()) {
  return {
    schemaVersion: PROJECT_CONTEXT_SCHEMA_VERSION,
    projectId: seed.projectId,
    seed: {
      client: seed.client,
      goal: seed.goal,
      deliverable: seed.deliverable,
      industry: seed.industry,
      notes: seed.notes,
      url: seed.url,
      attachments: Array.isArray(seed.attachments) ? [...seed.attachments] : [],
      source: seed.source || 'api',
    },
    pipelineStatus,
    outputs: [],
    artifacts: [],
    createdAt: at,
    updatedAt: at,
  };
}

export function migrateProjectContext(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('ProjectContext migration requires an object');
  }

  const version = Number(raw.schemaVersion) || 0;
  if (version > PROJECT_CONTEXT_SCHEMA_VERSION) {
    throw new Error(`Unsupported ProjectContext schemaVersion ${version}`);
  }

  const projectId = String(raw.projectId || '');
  const seed = raw.seed || {};
  const baseSeed = {
    client: String(seed.client || ''),
    goal: String(seed.goal || ''),
    deliverable: String(seed.deliverable || 'Website + Portal'),
    industry: seed.industry,
    notes: seed.notes,
    url: seed.url,
    attachments: Array.isArray(seed.attachments) ? [...seed.attachments] : [],
    source: seed.source || 'api',
  };

  // v0 / missing → v2
  if (version < 1) {
    return {
      schemaVersion: PROJECT_CONTEXT_SCHEMA_VERSION,
      projectId,
      seed: baseSeed,
      pipelineStatus: raw.pipelineStatus || 'CREATED',
      outputs: Array.isArray(raw.outputs) ? [...raw.outputs] : [],
      artifacts: Array.isArray(raw.artifacts) ? [...raw.artifacts] : [],
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
    };
  }

  // v1 → v2 (add artifacts)
  return {
    ...raw,
    schemaVersion: PROJECT_CONTEXT_SCHEMA_VERSION,
    projectId: projectId || raw.projectId,
    seed: {
      ...baseSeed,
      ...(raw.seed || {}),
      attachments: Array.isArray(raw.seed?.attachments)
        ? [...raw.seed.attachments]
        : baseSeed.attachments,
    },
    outputs: Array.isArray(raw.outputs) ? [...raw.outputs] : [],
    artifacts: Array.isArray(raw.artifacts) ? [...raw.artifacts] : [],
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

/**
 * Append a structured output. Never mutates prior outputs (returns new context).
 */
export function appendProjectContextOutput(context, output, at = new Date().toISOString()) {
  const migrated = migrateProjectContext(context);
  if (!output?.id || !output?.kind || !output?.worker) {
    throw new Error('ProjectContext output requires id, kind, and worker');
  }
  if (migrated.outputs.some((item) => item.id === output.id)) {
    return {
      ...migrated,
      outputs: [...migrated.outputs],
      artifacts: [...migrated.artifacts],
      updatedAt: migrated.updatedAt,
    };
  }

  return {
    ...migrated,
    outputs: [
      ...migrated.outputs,
      {
        id: output.id,
        kind: output.kind,
        worker: output.worker,
        createdAt: output.createdAt || at,
        payload: output.payload && typeof output.payload === 'object' ? { ...output.payload } : {},
      },
    ],
    artifacts: [...migrated.artifacts],
    updatedAt: at,
  };
}

/**
 * Append artifacts onto ProjectContext (append-only).
 */
export function appendProjectContextArtifacts(context, artifacts, at = new Date().toISOString()) {
  const migrated = migrateProjectContext(context);
  const existingIds = new Set(migrated.artifacts.map((item) => item.id));
  const nextArtifacts = [...migrated.artifacts];
  let changed = false;

  for (const artifact of artifacts || []) {
    if (!artifact?.id || existingIds.has(artifact.id)) continue;
    existingIds.add(artifact.id);
    nextArtifacts.push({ ...artifact });
    changed = true;
  }

  if (!changed) {
    return {
      ...migrated,
      outputs: [...migrated.outputs],
      artifacts: [...migrated.artifacts],
    };
  }

  return {
    ...migrated,
    outputs: [...migrated.outputs],
    artifacts: nextArtifacts,
    updatedAt: at,
  };
}

export function withProjectContextStatus(context, pipelineStatus, at = new Date().toISOString()) {
  const migrated = migrateProjectContext(context);
  return {
    ...migrated,
    pipelineStatus,
    updatedAt: at,
  };
}

export function listProjectContextOutputs(context, kind) {
  const migrated = migrateProjectContext(context);
  if (!kind) return [...migrated.outputs];
  return migrated.outputs.filter((item) => item.kind === kind);
}

export function getLatestProjectContextOutput(context, kind) {
  const items = listProjectContextOutputs(context, kind);
  return items.length ? items[items.length - 1] : null;
}

export function createContextOutputId(worker, kind, nonce = '') {
  return `${worker}-${kind}-${nonce || Date.now().toString(36)}`;
}
