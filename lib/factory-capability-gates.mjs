/**
 * Pure canRun gates for implemented capabilities (Node unit tests + TS wrappers).
 */

function hasOutput(context, kind) {
  return (context.outputs || []).some((item) => item.kind === kind);
}

function latestKind(context, kind) {
  const items = (context.outputs || []).filter((item) => item.kind === kind);
  return items.length ? items[items.length - 1] : null;
}

export function intakeCanRun(context) {
  const status = context.pipelineStatus;
  if (status === 'CANCELLED' || status === 'FAILED') return false;

  const existingIntake = latestKind(context, 'intake');
  if (existingIntake && (status === 'INTAKE_COMPLETE' || status === 'RESEARCHING')) {
    return false;
  }

  if (
    status === 'RESEARCHING' ||
    status === 'DISCOVERING' ||
    status === 'PLANNING' ||
    status === 'BUILDING' ||
    status === 'QA' ||
    status === 'PUBLISHING' ||
    status === 'UNDER_REVIEW' ||
    status === 'COMPLETE'
  ) {
    return false;
  }

  if (status === 'GENERATING') {
    return !existingIntake;
  }

  return status === 'QUEUED' || status === 'INTAKE';
}

export function researchCanRun(context) {
  const status = context.pipelineStatus;
  if (status === 'CANCELLED' || status === 'FAILED') return false;

  // Finished research — do not re-run
  if (hasOutput(context, 'research')) return false;

  if (
    status === 'DISCOVERING' ||
    status === 'PLANNING' ||
    status === 'BUILDING' ||
    status === 'QA' ||
    status === 'PUBLISHING' ||
    status === 'UNDER_REVIEW' ||
    status === 'COMPLETE'
  ) {
    return false;
  }

  // INTAKE_COMPLETE = ready; RESEARCHING without output = resume after timeout
  return status === 'INTAKE_COMPLETE' || status === 'RESEARCHING';
}

function hasResearchArtifacts(context) {
  return (context.artifacts || []).some(
    (item) =>
      item.provenance?.capabilityId === 'research' ||
      ['website', 'organization', 'document', 'branding', 'metadata'].includes(item.kind),
  );
}

export function discoveryCanRun(context) {
  const status = context.pipelineStatus;
  if (status === 'CANCELLED' || status === 'FAILED') return false;

  // Idempotent: never re-run once a discovery output exists
  if (hasOutput(context, 'discovery')) return false;

  if (status !== 'RESEARCHING') return false;
  if (!hasOutput(context, 'research')) return false;
  if (!hasResearchArtifacts(context)) return false;

  return true;
}

function hasDiscoveryArtifacts(context) {
  return (context.artifacts || []).some(
    (item) =>
      item.provenance?.capabilityId === 'discovery' ||
      [
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
      ].includes(item.kind),
  );
}

export function planningCanRun(context) {
  const status = context.pipelineStatus;
  if (status === 'CANCELLED' || status === 'FAILED') return false;

  // Idempotent: never re-run once a planning output exists
  if (hasOutput(context, 'planning')) return false;

  if (status !== 'DISCOVERING') return false;
  if (!hasOutput(context, 'discovery')) return false;
  if (!hasDiscoveryArtifacts(context)) return false;

  return true;
}

function pendingBuildableWorkOrders(context) {
  const artifacts = context.artifacts || [];
  const latestById = new Map();
  for (const item of artifacts) {
    if (item.kind !== 'work_order') continue;
    const wo = item.data?.workOrder;
    if (!wo?.id) continue;
    const prev = latestById.get(wo.id);
    if (!prev || String(wo.createdAt || '') >= String(prev.createdAt || '')) {
      latestById.set(wo.id, wo);
    }
  }
  // Phase 7: only website WorkOrders are buildable
  return [...latestById.values()].filter(
    (wo) => wo.type === 'website' && wo.status !== 'complete' && wo.status !== 'cancelled',
  );
}

export function productionCanRun(context) {
  const status = context.pipelineStatus;
  if (status === 'CANCELLED' || status === 'FAILED') return false;

  if (status !== 'PLANNING' && status !== 'BUILDING') return false;
  if (!hasOutput(context, 'planning')) return false;

  return pendingBuildableWorkOrders(context).length > 0;
}
