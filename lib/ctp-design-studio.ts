/**
 * Merge portal Design Studio brand inputs + assets into a CTP submission.
 */
import type { CtpAssetManifest, CtpAssetManifestEntry } from '@/lib/ctp-asset-store';
import { finalizeCtpAssetManifest } from '@/lib/ctp-asset-store';
import { resolveCtpOrganizationId } from '@/lib/ctp-studio-bridge';
import {
  getCtpSubmissionById,
  updateCtpSubmission,
  type CtpSubmission,
} from '@/lib/ctp-submissions';
import { scheduleCtpProduction } from '@/lib/ctp-production-run';
import { emitPulseEvent } from '@/lib/pulse-bus';

export const CTP_DESIGN_STUDIO_FIELDS = [
  'brand_colors',
  'brand_fonts',
  'brand_voice',
  'competitors',
  'inspiration',
  'offer_summary',
] as const;

export type CtpDesignStudioField = (typeof CTP_DESIGN_STUDIO_FIELDS)[number];

export type CtpDesignStudioInput = {
  fields?: Partial<Record<CtpDesignStudioField, string>>;
  assets?: CtpAssetManifest;
};

function cleanField(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 2000) : undefined;
}

function mergeManifest(
  existing: CtpAssetManifest | undefined,
  incoming: CtpAssetManifest | undefined,
): CtpAssetManifest | undefined {
  if (!incoming || !Object.keys(incoming).length) return existing;
  return { ...(existing ?? {}), ...incoming };
}

export function normalizeDesignStudioInput(body: unknown): CtpDesignStudioInput {
  const raw = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const fields: Partial<Record<CtpDesignStudioField, string>> = {};
  const rawFields =
    raw.fields && typeof raw.fields === 'object' ? (raw.fields as Record<string, unknown>) : raw;

  for (const key of CTP_DESIGN_STUDIO_FIELDS) {
    const cleaned = cleanField(rawFields[key]);
    if (cleaned) fields[key] = cleaned;
  }

  const assetsRaw = raw.assets;
  const assets: CtpAssetManifest = {};
  if (assetsRaw && typeof assetsRaw === 'object' && !Array.isArray(assetsRaw)) {
    for (const [assetType, entry] of Object.entries(assetsRaw as Record<string, unknown>)) {
      if (!entry || typeof entry !== 'object') continue;
      const item = entry as Partial<CtpAssetManifestEntry>;
      if (!item.id || !item.url) continue;
      assets[assetType] = {
        id: String(item.id),
        assetType: String(item.assetType ?? assetType),
        fileName: String(item.fileName ?? 'upload'),
        mimeType: String(item.mimeType ?? 'application/octet-stream'),
        size: Number(item.size ?? 0),
        url: String(item.url),
        uploadedAt: String(item.uploadedAt ?? new Date().toISOString()),
      };
    }
  }

  return {
    fields: Object.keys(fields).length ? fields : undefined,
    assets: Object.keys(assets).length ? assets : undefined,
  };
}

export async function applyCtpDesignStudioInput(
  submissionId: string,
  input: CtpDesignStudioInput,
): Promise<{ ok: boolean; submission?: CtpSubmission; error?: string }> {
  const submission = await getCtpSubmissionById(submissionId);
  if (!submission) {
    return { ok: false, error: 'CTP submission not found.' };
  }

  if (submission.status === 'Completed') {
    return { ok: false, error: 'Design Studio is locked after reveal.' };
  }

  const hasFields = Boolean(input.fields && Object.keys(input.fields).length);
  const hasAssets = Boolean(input.assets && Object.keys(input.assets).length);
  if (!hasFields && !hasAssets) {
    return { ok: false, error: 'Provide at least one brand field or asset.' };
  }

  const organizationId =
    (await resolveCtpOrganizationId({
      portalSlug: submission.portalSlug,
      considerSlug: submission.considerSlug,
    })) ||
    submission.portalSlug ||
    submission.considerSlug ||
    submission.id;

  const finalizedAssets = hasAssets
    ? await finalizeCtpAssetManifest(input.assets, organizationId)
    : undefined;

  const discoveryAnswers = {
    ...(submission.discoveryAnswers ?? {}),
    ...(input.fields ?? {}),
    ...(finalizedAssets
      ? {
          asset_uploads: {
            ...((submission.discoveryAnswers?.asset_uploads as CtpAssetManifest | undefined) ?? {}),
            ...finalizedAssets,
          },
        }
      : {}),
  };

  const assetManifest = mergeManifest(submission.assetManifest, finalizedAssets);

  const updated = await updateCtpSubmission(submissionId, {
    discoveryAnswers,
    assetManifest,
  });

  if (!updated.ok || !updated.submission) {
    return { ok: false, error: updated.error ?? 'Could not save Design Studio inputs.' };
  }

  await emitPulseEvent({
    product: 'ea-platform',
    type: 'ctp.studio.input',
    title: `CTP Design Studio updated — ${submission.businessName}`,
    detail: [
      hasFields ? `${Object.keys(input.fields ?? {}).length} fields` : null,
      hasAssets ? `${Object.keys(input.assets ?? {}).length} assets` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    priority: 'medium',
    href: '/admin/ctp',
    tenantId: submission.considerSlug,
    objectId: submission.id,
    metadata: {
      ctpSubmissionId: submission.id,
      fieldCount: Object.keys(input.fields ?? {}).length,
      assetCount: Object.keys(input.assets ?? {}).length,
    },
  });

  // Refresh production so artifacts reflect new brand inputs.
  scheduleCtpProduction(submissionId, { force: true });

  return { ok: true, submission: updated.submission };
}

/**
 * Client marks Design Studio complete → Pulse + founder email so Brick
 * does not need to poll the portal.
 */
export async function completeCtpDesignStudio(
  submissionId: string,
): Promise<{ ok: boolean; submission?: CtpSubmission; error?: string }> {
  const submission = await getCtpSubmissionById(submissionId);
  if (!submission) {
    return { ok: false, error: 'CTP submission not found.' };
  }

  if (submission.status === 'Completed') {
    return { ok: false, error: 'Design Studio is locked after reveal.' };
  }

  const updated = await updateCtpSubmission(submissionId, {
    studioStatus: 'Ready For Review',
  });

  if (!updated.ok || !updated.submission) {
    return { ok: false, error: updated.error ?? 'Could not mark Design Studio complete.' };
  }

  const portalPath = submission.portalSlug
    ? `/portal/${submission.portalSlug}/ctp/progress`
    : '/admin/ctp';
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://efficiencyarchitects.online').replace(
    /\/$/,
    '',
  );

  await emitPulseEvent({
    product: 'ea-platform',
    type: 'ctp.studio.complete',
    title: `Design Studio complete — ${submission.businessName}`,
    detail: `${submission.contactName} · ${submission.email} marked inputs ready for review`,
    priority: 'high',
    href: '/admin/ctp',
    tenantId: submission.considerSlug ?? submission.portalSlug,
    objectId: submission.id,
    metadata: {
      ctpSubmissionId: submission.id,
      portalSlug: submission.portalSlug ?? '',
      businessName: submission.businessName,
    },
  });

  try {
    const { sendInternalNotification } = await import('@/lib/email');
    await sendInternalNotification({
      subject: `Design Studio ready — ${submission.businessName}`,
      title: 'CTP Design Studio complete',
      body: [
        `${submission.contactName} (${submission.email}) marked Design Studio complete for ${submission.businessName}.`,
        '',
        `Portal: ${baseUrl}${portalPath}`,
        `Admin: ${baseUrl}/admin/ctp`,
        submission.proposalId ? `Proposal: ${submission.proposalId}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    });
  } catch (err) {
    console.error('completeCtpDesignStudio: founder notification failed', err);
  }

  return { ok: true, submission: updated.submission };
}
