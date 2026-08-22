/**
 * EA Build Space Policy
 *
 * ALL build work, including stack/infrastructure work, is workspace-first.
 * Workspace branches must not deploy to Vercel.
 * Only approved preview/* branches advance to Vercel preview, then master/main to production.
 */

export const BUILD_SPACE_SCHEMA_VERSION = 2;

export const BUILD_LANES = Object.freeze({
  WORK: 'work',
  PREVIEW: 'preview',
  PRODUCTION: 'production',
});

export function getBuildLane(branch = '') {
  const ref = String(branch || '').trim();
  if (ref === 'master' || ref === 'main') return BUILD_LANES.PRODUCTION;
  if (ref.startsWith('preview/')) return BUILD_LANES.PREVIEW;
  return BUILD_LANES.WORK;
}

export function shouldDeployToVercel(branch = '') {
  const lane = getBuildLane(branch);
  return lane === BUILD_LANES.PREVIEW || lane === BUILD_LANES.PRODUCTION;
}

export function isWorkspaceBranch(branch = '') {
  return getBuildLane(branch) === BUILD_LANES.WORK;
}

export function assertWorkspaceFirst(branch = '') {
  if (!isWorkspaceBranch(branch)) {
    throw new Error(`EA build work must begin in workspace. Received promoted branch: ${branch || '(unknown)'}`);
  }
  return true;
}

export function createBuildSpaceContract({ projectId, slug, branch, executionContractId = null, scope = 'client' }) {
  if (!projectId || !slug) throw new Error('BuildSpaceContract requires projectId and slug');
  const resolvedBranch = branch || `work/${slug}`;
  assertWorkspaceFirst(resolvedBranch);
  return {
    schemaVersion: BUILD_SPACE_SCHEMA_VERSION,
    projectId,
    slug,
    branch: resolvedBranch,
    lane: BUILD_LANES.WORK,
    scope,
    executionContractId,
    rules: {
      workspaceFirst: true,
      appliesToInfrastructure: true,
      vercelDisabled: true,
      visualQaRequired: true,
      userApprovalRequiredBeforePreview: true,
      previewRequiredBeforeProduction: true,
      noDirectMasterBuilds: true,
    },
    promotionPath: [
      resolvedBranch,
      `preview/${slug}`,
      'master',
    ],
  };
}

export function canPromoteBuild({ fromBranch, toBranch, localVisualQaPassed = false, userApproved = false, previewPassed = false }) {
  const from = getBuildLane(fromBranch);
  const to = getBuildLane(toBranch);

  if (from === BUILD_LANES.WORK && to === BUILD_LANES.PREVIEW) {
    const ok = localVisualQaPassed === true && userApproved === true;
    return { ok, reason: ok ? 'approved_for_preview' : 'local_qa_and_user_approval_required' };
  }

  if (from === BUILD_LANES.PREVIEW && to === BUILD_LANES.PRODUCTION) {
    const ok = previewPassed === true && userApproved === true;
    return { ok, reason: ok ? 'approved_for_production' : 'preview_pass_and_user_approval_required' };
  }

  return { ok: false, reason: 'invalid_build_lane_transition' };
}
