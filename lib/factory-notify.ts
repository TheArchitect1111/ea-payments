/**
 * Factory founder notifications — start + ready/failed only.
 * Ready email = Opportunity Intelligence Brief™ (intelligence + 3 concept renders).
 */
import { readCtpAssetBytes } from '@/lib/ctp-asset-store';
import { sendFactoryPackageReadyEmail, sendInternalNotification } from '@/lib/email';
import {
  buildFactoryConceptPackAsync,
  exportFactoryConceptPackMarkdown,
  formatFactoryGeneratedDuration,
  renderFactoryConceptPackEmailHtml,
} from '@/lib/factory-concept-pack';
import { formatUsdRange } from '@/lib/factory-capacity-score';
import { generateCustomConceptInlineImages } from '@/lib/factory-concept-mockups';
import { getProject } from '@/lib/factory-project';
import { ctpAssetIdFromUrl } from '@/lib/factory-research/image-signal';
import { saveFactoryProject, type FactoryProject } from '@/lib/factory-project-store';
import { factoryFriendlyLabel } from '@/lib/factory-status-labels';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

const LAUNCH_FOUNDER_NAME = process.env.FACTORY_FOUNDER_NAME?.trim() || 'Robert';

async function loadInlineHero(project: FactoryProject): Promise<{
  heroCidUrl?: string;
  inlineImages?: Array<{
    filename: string;
    contentBase64: string;
    contentId: string;
    mimeType?: string;
  }>;
}> {
  const image =
    (project.attachments || []).find((a) => a.type === 'image' && a.url) ||
    (project.attachments || []).find((a) => a.url);
  const assetId = ctpAssetIdFromUrl(image?.url);
  if (!assetId) return {};

  const loaded = await readCtpAssetBytes(assetId);
  if (!loaded) return {};

  const contentId = 'concept-hero';
  return {
    heroCidUrl: `cid:${contentId}`,
    inlineImages: [
      {
        filename: loaded.meta.fileName || image?.name || 'launch-photo.jpg',
        contentBase64: loaded.bytes.toString('base64'),
        contentId,
        mimeType: loaded.meta.mimeType || 'image/jpeg',
      },
    ],
  };
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function projectsUrl(projectId: string): string {
  const base = (
    process.env.NEXT_PUBLIC_BASE_URL ||
    EA_PLATFORM_URL ||
    'https://efficiencyarchitects.online'
  )
    .replace(/\/$/, '')
    .replace(/^https?:\/\/www\.efficiencyarchitects\.online/i, 'https://efficiencyarchitects.online');
  return `${base}/admin/ea-factory/projects?focus=${encodeURIComponent(projectId)}`;
}

async function persistNotify(
  project: FactoryProject,
  patch: NonNullable<FactoryProject['notifySent']>,
): Promise<void> {
  await saveFactoryProject({
    ...project,
    notifySent: { ...project.notifySent, ...patch },
    updatedAt: new Date().toISOString(),
  });
}

export async function notifyFactoryStarted(projectId: string): Promise<void> {
  const project = await getProject(projectId);
  if (!project || project.notifySent?.startedAt) return;

  const href = projectsUrl(projectId);
  try {
    await sendInternalNotification({
      subject: `Factory started — ${project.client}`,
      title: 'Factory launch received',
      body: [
        `${project.client} is in the Factory.`,
        `Project: ${project.id}`,
        `Status: ${factoryFriendlyLabel(project.pipelineStatus)}`,
        '',
        `Track it: ${href}`,
      ].join('\n'),
    });
  } catch (err) {
    console.error('[factory-notify] started email failed', projectId, err);
  }

  const latest = (await getProject(projectId)) ?? project;
  await persistNotify(latest, { startedAt: new Date().toISOString() });
}

export async function notifyFactoryDone(
  projectId: string,
  options?: { force?: boolean },
): Promise<{ ok: boolean; error?: string }> {
  const project = await getProject(projectId);
  if (!project) return { ok: false, error: 'Project not found.' };
  if (!options?.force && (project.notifySent?.doneAt || project.notifySent?.failedAt)) {
    return { ok: false, error: 'Package email already sent. Use resend to send again.' };
  }
  if (project.pipelineStatus === 'FAILED' || project.pipelineStatus === 'CANCELLED') {
    return { ok: false, error: 'Project is not in a ready state.' };
  }

  const hasResearch = Boolean(
    project.context?.outputs?.some((item) => item.kind === 'research') ||
      (project.context?.artifacts?.length ?? 0) > 0,
  );
  // Email Concept Pack when Factory is done OR idle with enough signal for a sit-down.
  const okStop =
    options?.force ||
    project.pipelineStatus === 'BUILDING' ||
    project.pipelineStatus === 'UNDER_REVIEW' ||
    project.pipelineStatus === 'COMPLETE' ||
    project.pipelineStatus === 'PUBLISHED' ||
    project.pipelineStatus === 'PLANNING' ||
    project.pipelineStatus === 'DISCOVERING' ||
    (hasResearch &&
      (project.pipelineStatus === 'RESEARCHING' ||
        project.pipelineStatus === 'INTAKE_COMPLETE'));
  if (!okStop) return { ok: false, error: 'Project is still processing.' };

  const pack = await buildFactoryConceptPackAsync(project);
  const publicHeroUrl = pack.heroImageUrl?.startsWith('http') ? pack.heroImageUrl : undefined;

  const brief = pack.opportunityBrief;
  let customSamples: Awaited<ReturnType<typeof generateCustomConceptInlineImages>>['images'] = [];
  let visualConfidenceNote: string | undefined;
  try {
    const mockupResult = await generateCustomConceptInlineImages({
      clientName: pack.clientName,
      tagline: brief.brand.subhead || pack.landing.subhead,
      story: brief.story || pack.research.story,
      cta: brief.brand.cta || pack.landing.cta,
      score: pack.scorecard.overallScore,
      capacityLabel: formatUsdRange(
        pack.scorecard.capacityLost.annualLow,
        pack.scorecard.capacityLost.annualHigh,
      ),
      opportunityLabel: formatUsdRange(
        pack.scorecard.opportunityGained.annualLow,
        pack.scorecard.opportunityGained.annualHigh,
      ),
      heroImageUrl: publicHeroUrl || brief.brand.logoUrl,
      primaryColor: brief.brand.primary,
      accentColor: brief.brand.accent,
      logoUrl: brief.brand.logoUrl,
      headline: brief.brand.headline,
      portalModules: brief.portal.modules,
      memberPersona: brief.member.persona,
      memberTiles: brief.member.tiles,
      programLabels: brief.portal.modules.slice(0, 3),
    });
    customSamples = mockupResult.images;
    visualConfidenceNote = mockupResult.thinConfidenceNote;
    if (visualConfidenceNote) {
      pack.opportunityBrief = {
        ...pack.opportunityBrief,
        visualConfidenceNote,
      };
    }
    console.info('[factory-notify] concept renders generated', {
      projectId,
      count: customSamples.length,
      qualityOk: mockupResult.qualityOk,
      regenerated: mockupResult.regenerated,
    });
  } catch (err) {
    console.error('[factory-notify] concept render generation failed', projectId, err);
  }

  const inline = await loadInlineHero(project);
  if (inline.heroCidUrl) {
    pack.heroImageUrl = inline.heroCidUrl;
  }

  const generatedInLabel = formatFactoryGeneratedDuration(project.createdAt);
  const base = EA_PLATFORM_URL.replace(/\/$/, '');
  const emailOptions = {
    inlineSamples: customSamples.length > 0,
    recipientName: LAUNCH_FOUNDER_NAME,
    generatedInLabel,
    reviewUrl: `${base}/api/projects/${encodeURIComponent(project.id)}/concept-pack`,
    regenerateUrl: `${base}/admin/ea-factory/projects`,
    newLaunchUrl: `${base}/admin/ea-factory/launch`,
    visualConfidenceNote,
  };
  const packageMarkdown = exportFactoryConceptPackMarkdown(pack);
  const packageHtml = renderFactoryConceptPackEmailHtml(pack, escHtml, emailOptions);
  const safeName = pack.clientName.replace(/[^\w.-]+/g, '-').slice(0, 48) || 'oib';
  const inlineImages = [...(inline.inlineImages || []), ...customSamples];
  const readySubject = `Opportunity Intelligence Brief™ | ${pack.clientName}`;

  try {
    let sent = await sendFactoryPackageReadyEmail({
      subject: readySubject,
      clientName: pack.clientName,
      packageMarkdown,
      packageHtml,
      filename: `opportunity-brief-${safeName}-${project.id}.md`,
      inlineImages,
    });
    if (!sent.ok && inlineImages.length) {
      console.warn('[factory-notify] retry ready email without heavy inline assets', projectId, sent.error);
      sent = await sendFactoryPackageReadyEmail({
        subject: readySubject,
        clientName: pack.clientName,
        packageMarkdown,
        packageHtml: renderFactoryConceptPackEmailHtml(pack, escHtml, {
          ...emailOptions,
          inlineSamples: false,
        }),
        filename: `opportunity-brief-${safeName}-${project.id}.md`,
        inlineImages: customSamples,
      });
    }
    if (!sent.ok) {
      console.error('[factory-notify] done email failed', projectId, sent.error);
      return { ok: false, error: sent.error || 'Email failed.' };
    }
    console.info('[factory-notify] Opportunity Intelligence Brief™ emailed', {
      projectId,
      client: pack.clientName,
      customMockups: customSamples.length,
      hasHero: Boolean(inline.inlineImages?.length),
      score: pack.scorecard.overallScore,
    });
  } catch (err) {
    console.error('[factory-notify] done email failed', projectId, err);
    return { ok: false, error: err instanceof Error ? err.message : 'Email failed.' };
  }

  const latest = (await getProject(projectId)) ?? project;
  await persistNotify(latest, { doneAt: new Date().toISOString() });
  return { ok: true };
}

export async function notifyFactoryFailed(projectId: string): Promise<void> {
  const project = await getProject(projectId);
  if (!project || project.notifySent?.failedAt) return;
  if (project.pipelineStatus !== 'FAILED') return;

  const href = projectsUrl(projectId);
  try {
    await sendInternalNotification({
      subject: `Factory needs attention — ${project.client}`,
      title: 'Factory launch failed',
      body: [
        `${project.client} hit a problem in the Factory.`,
        `Project: ${project.id}`,
        project.error ? `Error: ${project.error}` : '',
        '',
        `Open it: ${href}`,
      ]
        .filter(Boolean)
        .join('\n'),
    });
  } catch (err) {
    console.error('[factory-notify] failed email failed', projectId, err);
  }

  const latest = (await getProject(projectId)) ?? project;
  await persistNotify(latest, { failedAt: new Date().toISOString() });
}
