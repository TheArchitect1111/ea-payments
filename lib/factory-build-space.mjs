/**
 * EA Build Space Policy
 *
 * Build work is local-first. Work branches must not deploy to Vercel.
 * Only approved preview/* branches advance to Vercel preview, then master to production.
 */

export const BUILD_SPACE_SCHEMA_VERSION = 1;

export const BUILD_LANES = Object.freeze({
  WORK: 'work',
  PREVIEW: 'preview',
  PRODUCTION: 'production',
});

export function getBuildLane(branch = '') {
  const ref = String(branch || '').trim();
  if (ref === 'master' || ref === 'main') return BUILD_LANES.PRODUCTION;
  if (ref.startsWith('preview/')) return BUILD_LANES.PREVIEW;
  if (ref.startsWith('work/')) return BUILD_LANES.WORK;
  return BUILD_LANES.WORK;
}

export function shouldDeployToVercel(branch = '') {
  const lane = getBuildLane(branch);
  return lane === BUILD_LANES.PREVIEW || lane === BUILD_LANES.PRODUCTION;
}

export function createBuildSpaceContract({ projectId, slug, branch, executionContractId = null }) {
  if (!projectId || !slug) throw new Error('BuildSpaceContract requires projectId and slug');
  const resolvedBranch = branch || `work/${slug}`;
  const lane = getBuildLane(resolvedBranch);
  if (lane !== BUILD_LANES.WORK) {
    throw new Error(`Build space must start on work/*, received ${resolvedBranch}`);
  }
  return {
    schemaVersion: BUILD_SPACE_SCHEMA_VERSION,
    projectId,
    slug,
    branch: resolvedBranch,
    lane,
    executionContractId,
    rules: {
      localFirst: true,
      vercelDisabled: true,
      visualQaRequired: true,
      userApprovalRequiredBeforePreview: true,
      previewRequiredBeforeProduction: true,
    },
    promotionPath: [
      `work/${slug}`,
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
