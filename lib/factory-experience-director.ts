/**
 * Experience Director — evaluate Experience Blueprint / website_site; never generate or deploy.
 * Admin/dashboard entry point only — does not register into Launch orchestration.
 */
import crypto from 'node:crypto';
import { appendArtifacts } from '@/lib/factory-artifact';
import {
  averageScore,
  canPublishFromExperienceReview,
  deriveApprovalStatus,
  EXPERIENCE_REVIEW_KIND,
  EXPERIENCE_REVIEW_SCHEMA_VERSION,
  parseExperienceReviewData,
  type ExperienceReviewAnswers,
  type ExperienceReviewData,
  type ExperienceReviewScores,
  type ExperienceReviewSummary,
} from '@/lib/factory-experience-review';
import { buildFactoryConceptPackAsync } from '@/lib/factory-concept-pack';
import {
  getFactoryProject,
  listFactoryProjects,
  type FactoryProject,
} from '@/lib/factory-project-store';
import { ensureProjectContext } from '@/lib/factory-project-context';

function textLen(v: unknown): number {
  return String(v || '').trim().length;
}

function hasStoryBeats(site: Record<string, unknown> | null, pack: Record<string, unknown>): boolean {
  const story = (site?.story && typeof site.story === 'object' ? site.story : null) as Record<
    string,
    unknown
  > | null;
  const brief = (pack.opportunityBrief && typeof pack.opportunityBrief === 'object'
    ? pack.opportunityBrief
    : {}) as Record<string, unknown>;

  const who =
    textLen(story?.whoTheyAre) ||
    textLen(brief.whoTheyAre) ||
    textLen(brief.organization);
  const why =
    textLen(story?.whyTheyExist) || textLen(brief.mission) || textLen(brief.whyTheyExist);
  const help =
    textLen(story?.whoTheyHelp) || textLen(brief.audience) || textLen(brief.whoTheyHelp);
  const matter =
    textLen(story?.whyItMatters) || textLen(brief.whyItMatters) || textLen(brief.stakes);
  const change =
    textLen(story?.whatChanges) || textLen(brief.whatChanges) || textLen(brief.outcomes);

  return who >= 12 && why >= 12 && help >= 8 && matter >= 8 && change >= 8;
}

function looksGenericSaaS(site: Record<string, unknown> | null): boolean {
  const pages = Array.isArray(site?.pages) ? site!.pages : [];
  const roles: string[] = [];
  for (const page of pages) {
    if (!page || typeof page !== 'object') continue;
    const sections = Array.isArray((page as { sections?: unknown }).sections)
      ? ((page as { sections: unknown[] }).sections as unknown[])
      : [];
    for (const section of sections) {
      if (!section || typeof section !== 'object') continue;
      const role = String((section as { role?: unknown }).role || '').toLowerCase();
      if (role) roles.push(role);
    }
  }
  const featureCardHits = roles.filter((r) =>
    /feature|pricing|testimonial.?grid|logo.?cloud|metric|stat.?strip|saas/i.test(r),
  ).length;
  return featureCardHits >= 2;
}

function hasPortalWorkspace(site: Record<string, unknown> | null, pack: Record<string, unknown>): boolean {
  const portal = (site?.portal && typeof site.portal === 'object' ? site.portal : null) as Record<
    string,
    unknown
  > | null;
  const member = (portal?.memberHome && typeof portal.memberHome === 'object'
    ? portal.memberHome
    : null) as Record<string, unknown> | null;
  const briefMember = (
    pack.opportunityBrief && typeof pack.opportunityBrief === 'object'
      ? (pack.opportunityBrief as { member?: Record<string, unknown> }).member
      : null
  ) as Record<string, unknown> | null | undefined;

  const source = member || briefMember || null;
  if (!source) return false;
  return (
    textLen(source.whereYouAre) >= 8 ||
    textLen(source.whatNext) >= 8 ||
    textLen(source.purpose) >= 8 ||
    textLen(source.whatSuccessLooksLike) >= 8
  );
}

function hasDistinctIdentity(site: Record<string, unknown> | null, pack: Record<string, unknown>): boolean {
  const experience = (site?.experience && typeof site.experience === 'object'
    ? site.experience
    : null) as Record<string, unknown> | null;
  const brand = (site?.brand && typeof site.brand === 'object' ? site.brand : null) as Record<
    string,
    unknown
  > | null;
  const briefBrand = (
    pack.opportunityBrief && typeof pack.opportunityBrief === 'object'
      ? (pack.opportunityBrief as { brand?: Record<string, unknown> }).brand
      : null
  ) as Record<string, unknown> | null | undefined;

  const industry =
    textLen(site?.organization && typeof site.organization === 'object'
      ? (site.organization as { industry?: unknown }).industry
      : '') ||
    textLen((pack.opportunityBrief as { industry?: unknown } | undefined)?.industry) ||
    textLen(pack.industry);

  const personality =
    textLen(experience?.brandPersonality) ||
    textLen(experience?.emotionalTone) ||
    textLen(experience?.visualDna) ||
    textLen(brand?.voice) ||
    textLen(briefBrand?.voice) ||
    textLen(briefBrand?.headline);

  return industry >= 3 && personality >= 12;
}

/**
 * Heuristic Creative Director evaluation against Constitution dimensions.
 * Evaluator only — does not mutate pages or deploy.
 */
export function evaluateExperienceForDirector(input: {
  projectId: string;
  blueprintRef: string;
  site: Record<string, unknown> | null;
  pack: Record<string, unknown>;
  evaluatedAt?: string;
}): ExperienceReviewData {
  const { projectId, blueprintRef, site, pack } = input;
  const improvements: string[] = [];

  const storyOk = hasStoryBeats(site, pack);
  if (!storyOk) {
    improvements.push(
      'Homepage story must clearly answer who they are, why they exist, who they help, why it matters, and what changes.',
    );
  }

  const originalityOk = hasDistinctIdentity(site, pack);
  if (!originalityOk) {
    improvements.push(
      'Originality: with logo and name removed, industry, audience, and personality must still be identifiable within ten seconds.',
    );
  }

  const generic = looksGenericSaaS(site);
  const swapTestOk = originalityOk && !generic;
  if (!swapTestOk) {
    improvements.push(
      'Swap test failed — experience must not be transferable to another organization by changing only the logo.',
    );
  }

  const visualOk =
    !generic &&
    (Boolean(site?.experience) ||
      textLen((pack.opportunityBrief as { brand?: { headline?: unknown } } | undefined)?.brand?.headline) >=
        8);
  if (!visualOk) {
    improvements.push(
      'Visual craftsmanship: avoid corporate box grids, SaaS dashboards, and repetitive feature cards; aim for editorial, cinematic composition.',
    );
  }

  const pages = Array.isArray(site?.pages) ? site!.pages : [];
  const sectionCount = pages.reduce((n, page) => {
    if (!page || typeof page !== 'object') return n;
    const sections = Array.isArray((page as { sections?: unknown }).sections)
      ? (page as { sections: unknown[] }).sections.length
      : 0;
    return n + sections;
  }, 0);
  const storyRhythmOk = sectionCount >= 4 && !generic;
  if (!storyRhythmOk) {
    improvements.push(
      'Story rhythm: unfold like a documentary — each section should advance the story with visual variety and intentional whitespace.',
    );
  }

  const wowOk =
    originalityOk &&
    visualOk &&
    (textLen((site?.experience as { emotionalTone?: unknown } | undefined)?.emotionalTone) >= 8 ||
      textLen((pack.opportunityBrief as { brand?: { headline?: unknown } } | undefined)?.brand?.headline) >=
        16);
  if (!wowOk) {
    improvements.push(
      'Wow factor: the first ten seconds must feel built specifically for this client — not a generic AI template.',
    );
  }

  const portalOk = hasPortalWorkspace(site, pack);
  if (!portalOk) {
    improvements.push(
      'Portal experience must feel like an executive workspace: where you are, what happened, what is next, what needs attention, and what success looks like.',
    );
  }

  const answers: ExperienceReviewAnswers = {
    story: storyOk,
    originality: originalityOk,
    swapTest: swapTestOk,
    visualCraftsmanship: visualOk,
    storyRhythm: storyRhythmOk,
    wowFactor: wowOk,
    portalExperience: portalOk,
  };

  const partialScores: Omit<ExperienceReviewScores, 'overall'> = {
    story: storyOk ? 88 : 42,
    visual: visualOk ? 84 : 38,
    originality: originalityOk ? (swapTestOk ? 86 : 55) : 30,
    executiveExperience: portalOk ? 82 : 40,
    wow: wowOk ? 85 : 35,
  };

  const scores: ExperienceReviewScores = {
    ...partialScores,
    overall: averageScore(partialScores),
  };

  const approvalStatus = deriveApprovalStatus({
    answers,
    scores: partialScores,
    requiredImprovements: improvements,
  });

  return {
    kind: EXPERIENCE_REVIEW_KIND,
    schemaVersion: EXPERIENCE_REVIEW_SCHEMA_VERSION,
    projectId,
    blueprintRef,
    evaluatedAt: input.evaluatedAt || new Date().toISOString(),
    scores,
    answers,
    requiredImprovements: approvalStatus === 'Approved' ? [] : improvements,
    notes:
      approvalStatus === 'Approved'
        ? 'Meets EA Experience Constitution craftsmanship bar.'
        : 'Experience Director evaluation against EA Experience Constitution.',
    approvalStatus,
  };
}

export function getLatestExperienceReviewFromProject(
  project: FactoryProject,
): ExperienceReviewSummary | null {
  const artifacts = (project.context?.artifacts || []).filter(
    (item) => item.kind === EXPERIENCE_REVIEW_KIND,
  );
  const latest = [...artifacts].reverse()[0];
  if (!latest) return null;
  const review = parseExperienceReviewData(latest.data, {
    projectId: project.id,
    blueprintRef: String(latest.data?.blueprintRef || latest.id),
  });
  if (!review) return null;
  return {
    artifactId: latest.id,
    projectId: project.id,
    client: project.client,
    createdAt: latest.createdAt,
    review,
    canPublish: canPublishFromExperienceReview(review),
  };
}

export async function getLatestExperienceReview(
  projectId: string,
): Promise<ExperienceReviewSummary | null> {
  const project = await getFactoryProject(projectId);
  if (!project) return null;
  return getLatestExperienceReviewFromProject(project);
}

export async function listExperienceDirectorDashboardRows(): Promise<
  Array<{
    projectId: string;
    client: string;
    pipelineStatus: string;
    updatedAt: string;
    review: ExperienceReviewSummary | null;
  }>
> {
  const projects = await listFactoryProjects();
  return projects
    .map((project) => ({
      projectId: project.id,
      client: project.client,
      pipelineStatus: project.pipelineStatus,
      updatedAt: project.updatedAt,
      review: getLatestExperienceReviewFromProject(project),
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function runExperienceDirectorReview(projectId: string): Promise<{
  ok: boolean;
  error?: string;
  summary?: ExperienceReviewSummary;
  industry?: string;
  blueprintVersion?: string;
}> {
  const project = await getFactoryProject(projectId);
  if (!project) {
    return { ok: false, error: 'Factory project not found.' };
  }

  await ensureProjectContext(projectId);
  const fresh = await getFactoryProject(projectId);
  if (!fresh) {
    return { ok: false, error: 'Factory project not found after context load.' };
  }

  const siteArtifact = [...(fresh.context?.artifacts || [])]
    .reverse()
    .find((a) => a.kind === 'website_site');
  const site =
    siteArtifact?.data && typeof siteArtifact.data === 'object'
      ? (siteArtifact.data as Record<string, unknown>)
      : null;

  const pack = (await buildFactoryConceptPackAsync(fresh)) as unknown as Record<string, unknown>;
  const blueprintRef = siteArtifact?.id || `concept-pack:${projectId}`;
  const blueprintVersion =
    siteArtifact?.id ||
    (typeof site?.schemaVersion === 'number'
      ? `experience_blueprint:v${site.schemaVersion}`
      : blueprintRef);

  const industry =
    String(
      (site?.organization && typeof site.organization === 'object'
        ? (site.organization as { industry?: unknown }).industry
        : '') ||
        (pack.opportunityBrief as { industry?: unknown } | undefined)?.industry ||
        pack.industry ||
        fresh.industry ||
        'Unspecified',
    ).trim() || 'Unspecified';

  const review = evaluateExperienceForDirector({
    projectId,
    blueprintRef,
    site,
    pack,
  });

  const nonce = crypto.randomBytes(3).toString('hex');
  const appended = await appendArtifacts(projectId, [
    {
      kind: EXPERIENCE_REVIEW_KIND,
      providerId: 'experience-director',
      provenance: {
        capabilityId: 'experience_director',
        sourceType: 'experience_review',
        sourceName: 'Experience Director Dashboard',
        seedClient: fresh.client,
        notes: 'Manual/admin evaluation — not Launch orchestration',
        sourceArtifactIds: siteArtifact?.id ? [siteArtifact.id] : undefined,
      },
      data: review as unknown as Record<string, unknown>,
      id: `artifact-experience-director-experience_review-${nonce}`,
    },
  ]);

  const artifact = appended?.appended?.[0];
  if (!artifact) {
    return { ok: false, error: 'Failed to append Experience Review artifact.' };
  }

  return {
    ok: true,
    industry,
    blueprintVersion,
    summary: {
      artifactId: artifact.id,
      projectId,
      client: fresh.client,
      createdAt: artifact.createdAt,
      review,
      canPublish: canPublishFromExperienceReview(review),
    },
  };
}
