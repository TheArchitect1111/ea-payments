import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';
import {
  getLatestExperienceReview,
  runExperienceDirectorReview,
} from '@/lib/factory-experience-director';
import { computeReviewConfidence } from '@/lib/factory-experience-director-confidence';
import {
  appendExperienceDirectorValidationEntry,
  createValidationEntryFromReview,
  getExperienceDirectorValidationAnalytics,
  listValidationEntriesForComparison,
  type ExperienceDirectorValidationEntry,
} from '@/lib/factory-experience-director-validation';
import { getFactoryProject } from '@/lib/factory-project-store';

export const dynamic = 'force-dynamic';

/**
 * Phase 1 Validation Framework API.
 * Does not change publish behavior or Launch orchestration.
 *
 * GET — analytics (+ optional ?compare=id1,id2)
 * POST — run/log a Validation Mode review
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const compareRaw = req.nextUrl.searchParams.get('compare')?.trim();
  if (compareRaw) {
    const ids = compareRaw
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    const entries = await listValidationEntriesForComparison(ids);
    return NextResponse.json({ ok: true, mode: 'compare', entries });
  }

  const analytics = await getExperienceDirectorValidationAnalytics();
  return NextResponse.json({ ok: true, mode: 'analytics', analytics });
}

function withConfidence(
  base: Omit<ExperienceDirectorValidationEntry, 'id' | 'schemaVersion' | 'validationMode'>,
): Omit<ExperienceDirectorValidationEntry, 'id' | 'schemaVersion' | 'validationMode'> {
  return {
    ...base,
    confidence: computeReviewConfidence({
      scores: base.scores,
      answers: base.answers,
      requiredImprovements: base.requiredImprovements,
      rationale: base.rationale,
    }),
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: {
    projectId?: string;
    reviewer?: string;
    rationale?: string;
    useLatestReview?: boolean;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const projectId = String(body.projectId || '').trim();
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required.' }, { status: 400 });
  }

  const reviewer =
    String(body.reviewer || auth.user?.email || auth.user?.name || 'Experience Director').trim() ||
    'Experience Director';
  const rationale = body.rationale != null ? String(body.rationale) : undefined;

  let entry: ExperienceDirectorValidationEntry;

  if (body.useLatestReview) {
    const project = await getFactoryProject(projectId);
    const latest = await getLatestExperienceReview(projectId);
    if (!project || !latest) {
      return NextResponse.json(
        { error: 'No latest Experience Review found for this project.' },
        { status: 400 },
      );
    }
    entry = await appendExperienceDirectorValidationEntry(
      withConfidence(
        createValidationEntryFromReview({
          projectId,
          client: project.client,
          industry: project.industry,
          artifactId: latest.artifactId,
          blueprintVersion: latest.review.blueprintRef,
          review: latest.review,
          reviewer,
          rationale,
        }),
      ),
    );
  } else {
    const result = await runExperienceDirectorReview(projectId);
    if (!result.ok || !result.summary) {
      return NextResponse.json({ error: result.error || 'Review failed.' }, { status: 400 });
    }
    entry = await appendExperienceDirectorValidationEntry(
      withConfidence(
        createValidationEntryFromReview({
          projectId,
          client: result.summary.client,
          industry: result.industry,
          artifactId: result.summary.artifactId,
          blueprintVersion: result.blueprintVersion || result.summary.review.blueprintRef,
          review: result.summary.review,
          reviewer,
          rationale,
        }),
      ),
    );
  }

  const analytics = await getExperienceDirectorValidationAnalytics();
  return NextResponse.json({
    ok: true,
    validationMode: true,
    entry,
    analytics,
  });
}
