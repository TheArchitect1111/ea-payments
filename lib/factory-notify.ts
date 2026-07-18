/**
 * Factory founder notifications — start + ready/failed only.
 * Ready email = sit-down Concept Pack (eval + 3 concept screens).
 */
import { readCtpAssetBytes } from '@/lib/ctp-asset-store';
import { sendFactoryPackageReadyEmail, sendInternalNotification } from '@/lib/email';
import {
  buildFactoryConceptPack,
  exportFactoryConceptPackMarkdown,
  renderFactoryConceptPackEmailHtml,
} from '@/lib/factory-concept-pack';
import { loadConceptSampleInlineImages } from '@/lib/factory-concept-mockups';
import { getProject } from '@/lib/factory-project';
import { ctpAssetIdFromUrl } from '@/lib/factory-research/image-signal';
import { saveFactoryProject, type FactoryProject } from '@/lib/factory-project-store';
import { factoryFriendlyLabel } from '@/lib/factory-status-labels';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

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

  const pack = buildFactoryConceptPack(project);
  const inline = await loadInlineHero(project);
  const samples = await loadConceptSampleInlineImages();
  if (inline.heroCidUrl) {
    pack.heroImageUrl = inline.heroCidUrl;
  }
  const packageMarkdown = exportFactoryConceptPackMarkdown(pack);
  const packageHtml = renderFactoryConceptPackEmailHtml(pack, escHtml, { inlineSamples: true });
  const safeName = pack.clientName.replace(/[^\w.-]+/g, '-').slice(0, 48) || 'concept-pack';
  const inlineImages = [...(inline.inlineImages || []), ...samples];

  try {
    let sent = await sendFactoryPackageReadyEmail({
      subject: `Concept Pack ready — ${pack.clientName}`,
      clientName: pack.clientName,
      packageMarkdown,
      packageHtml,
      filename: `concept-pack-${safeName}-${project.id}.md`,
      inlineImages,
    });
    // If attachments blow limits, retry with public sample URLs (no CID samples).
    if (!sent.ok && inlineImages.length) {
      console.warn('[factory-notify] retry ready email without heavy inline assets', projectId, sent.error);
      const packRetry = buildFactoryConceptPack(project);
      sent = await sendFactoryPackageReadyEmail({
        subject: `Concept Pack ready — ${packRetry.clientName}`,
        clientName: packRetry.clientName,
        packageMarkdown: exportFactoryConceptPackMarkdown(packRetry),
        packageHtml: renderFactoryConceptPackEmailHtml(packRetry, escHtml, { inlineSamples: false }),
        filename: `concept-pack-${safeName}-${project.id}.md`,
      });
    }
    if (!sent.ok) {
      console.error('[factory-notify] done email failed', projectId, sent.error);
      return { ok: false, error: sent.error || 'Email failed.' };
    }
    console.info('[factory-notify] Concept Pack emailed', {
      projectId,
      client: pack.clientName,
      sampleCount: samples.length,
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
