import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';
import {
  appendGoldStandardReview,
  compareGoldWithValidationAi,
  getCalibrationDashboard,
  importValidationEntriesToGoldStandard,
  type OrganizationSize,
  type ProjectType,
} from '@/lib/factory-experience-director-calibration';
import {
  type ExperienceDirectorApprovalStatus,
  type ExperienceReviewScores,
} from '@/lib/factory-experience-review';

export const dynamic = 'force-dynamic';

/**
 * Phase 2 Calibration API — gold standard + AI/human comparison analytics.
 * Does not change publish, Launch, or orchestration.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const dashboard = await getCalibrationDashboard();
  return NextResponse.json({ ok: true, dashboard });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: {
    action?: 'import_validation' | 'add_gold' | 'compare';
    validationIds?: string[];
    goldStandardId?: string;
    validationEntryId?: string;
    organizationSize?: OrganizationSize;
    projectType?: ProjectType;
    gold?: {
      projectId?: string;
      client?: string;
      industry?: string;
      organizationSize?: OrganizationSize;
      projectType?: ProjectType;
      blueprintVersion?: string;
      humanReviewer?: string;
      humanOverallScore?: number;
      humanCategoryScores?: ExperienceReviewScores;
      humanWrittenRationale?: string;
      approvalStatus?: ExperienceDirectorApprovalStatus;
      reviewedAt?: string;
    };
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const action = body.action || 'import_validation';

  if (action === 'import_validation') {
    const result = await importValidationEntriesToGoldStandard({
      validationIds: body.validationIds,
      organizationSize: body.organizationSize,
      projectType: body.projectType,
    });
    const dashboard = await getCalibrationDashboard();
    return NextResponse.json({
      ok: true,
      imported: result.imported.length,
      skipped: result.skipped,
      entries: result.imported,
      dashboard,
    });
  }

  if (action === 'compare') {
    const goldStandardId = String(body.goldStandardId || '').trim();
    if (!goldStandardId) {
      return NextResponse.json({ error: 'goldStandardId is required.' }, { status: 400 });
    }
    const comparison = await compareGoldWithValidationAi(
      goldStandardId,
      body.validationEntryId?.trim(),
    );
    if (!comparison) {
      return NextResponse.json(
        {
          error:
            'Could not compare — gold standard or matching AI validation review not found for this blueprint.',
        },
        { status: 400 },
      );
    }
    const dashboard = await getCalibrationDashboard();
    return NextResponse.json({ ok: true, comparison, dashboard });
  }

  if (action === 'add_gold') {
    const g = body.gold || {};
    const projectId = String(g.projectId || '').trim();
    const humanReviewer =
      String(g.humanReviewer || auth.user.email || auth.user.name || '').trim() ||
      'Human Reviewer';
    const approvalStatus = g.approvalStatus;
    if (!projectId || !approvalStatus) {
      return NextResponse.json(
        { error: 'gold.projectId and gold.approvalStatus are required.' },
        { status: 400 },
      );
    }

    const scores = g.humanCategoryScores || {
      overall: Number(g.humanOverallScore) || 0,
      story: Number(g.humanOverallScore) || 0,
      visual: Number(g.humanOverallScore) || 0,
      originality: Number(g.humanOverallScore) || 0,
      executiveExperience: Number(g.humanOverallScore) || 0,
      wow: Number(g.humanOverallScore) || 0,
    };

    const entry = await appendGoldStandardReview({
      projectId,
      client: String(g.client || projectId),
      industry: String(g.industry || 'Unspecified'),
      organizationSize: g.organizationSize || body.organizationSize || 'Unspecified',
      projectType: g.projectType || body.projectType || 'Unspecified',
      blueprintVersion: String(g.blueprintVersion || `blueprint:${projectId}`),
      humanReviewer,
      humanOverallScore: Number(g.humanOverallScore) || scores.overall,
      humanCategoryScores: scores,
      humanWrittenRationale: String(g.humanWrittenRationale || ''),
      approvalStatus,
      failedConstitutionRules: [],
      reviewedAt: g.reviewedAt || new Date().toISOString(),
    });

    const dashboard = await getCalibrationDashboard();
    return NextResponse.json({ ok: true, entry, dashboard });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
