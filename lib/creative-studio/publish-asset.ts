import { publishCommunication } from '@/lib/publishing';
import { publishPlatformActivityEvent } from '@/lib/activity-events-store';
import { getCampaign, saveCampaign } from './campaign-store';
import { getMediaAsset } from './media-store';
import { socialAssetRequiresMedia, validateMediaForAsset } from './media-validation';
import type { CampaignAsset, CampaignAssetStatus, CreativeCampaign, PublishResult } from './types';

import { resolvePortalSlugForOrg } from '@/lib/tenant-context';

function assetChannel(asset: CampaignAsset): string {
  if (asset.type.startsWith('social')) return 'social';
  if (asset.type === 'portal-announcement') return 'portal';
  if (asset.type === 'email' || asset.type === 'sms') return 'content-request';
  if (asset.type === 'landing-page' || asset.type === 'homepage-banner') return 'website';
  return 'print';
}

function resolvePublishChannel(asset: CampaignAsset): Parameters<typeof publishCommunication>[0]['channel'] {
  if (asset.publishDestination === 'amplifi' || asset.type.startsWith('social')) return 'amplifi';
  if (asset.publishDestination === 'portal' || asset.type === 'portal-announcement') return 'portal';
  if (asset.publishDestination === 'content-request' || asset.type === 'email' || asset.type === 'sms') {
    return 'content-request';
  }
  if (asset.publishDestination === 'website') return 'website';
  if (asset.publishDestination === 'print') return 'print';
  return 'manual';
}

function stubResult(detail: string): PublishResult {
  return {
    ok: false,
    mode: 'stub',
    status: 'failed',
    detail,
    attemptedAt: new Date().toISOString(),
    retryable: false,
  };
}

function assetStatus(result: PublishResult): CampaignAssetStatus {
  return result.status;
}

function idempotencyKey(campaignId: string, assetId: string): string {
  return `creative-studio:${campaignId}:${assetId}`;
}

export async function publishCampaignAsset(input: {
  campaignId: string;
  assetId: string;
  actorName?: string;
}): Promise<{ campaign: CreativeCampaign | null; result: PublishResult }> {
  const campaign = await getCampaign(input.campaignId);
  if (!campaign) {
    return { campaign: null, result: stubResult('Campaign not found.') };
  }

  const asset = campaign.assets.find((a) => a.id === input.assetId);
  if (!asset) {
    return { campaign, result: stubResult('Asset not found.') };
  }

  if (asset.status === 'published' && asset.publishReceipt?.externalId) {
    return {
      campaign,
      result: {
        ok: true,
        ...asset.publishReceipt,
        detail: 'Already published; duplicate request was ignored.',
      },
    };
  }

  if (socialAssetRequiresMedia(asset)) {
    const media = asset.mediaIds?.[0] ? await getMediaAsset(asset.mediaIds[0]) : null;
    const mediaValidation = validateMediaForAsset(asset, media);
    if (!mediaValidation.valid) {
      const result: PublishResult = {
        ok: false,
        mode: 'stub',
        status: 'blocked',
        detail: mediaValidation.errors.join(' '),
        attemptedAt: mediaValidation.checkedAt,
        retryable: false,
      };
      const assets = campaign.assets.map((item) =>
        item.id === asset.id
          ? {
              ...item,
              status: 'blocked' as const,
              mediaValidation,
              publishReceipt: {
                status: result.status,
                mode: result.mode,
                detail: result.detail,
                attemptedAt: result.attemptedAt,
                retryable: result.retryable,
              },
            }
          : item,
      );
      const updated = await saveCampaign({ ...campaign, assets });
      return { campaign: updated, result };
    }
  }

  const slug = resolvePortalSlugForOrg(campaign.organizationId);
  const actor = input.actorName ?? 'Creative Studio';
  const channel = resolvePublishChannel(asset);
  const requestType =
    asset.type === 'sms' ? 'SMS' : asset.type === 'email' ? 'Email Campaign' : asset.label;

  const outcome = await publishCommunication({
    channel,
    portalSlug: slug,
    title: asset.previewTitle,
    body: asset.previewBody,
    summary: campaign.brief.summary,
    requestType,
    storyUrl: asset.href,
    actorName: actor,
    idempotencyKey: idempotencyKey(campaign.id, asset.id),
    source: { product: 'creative-studio', campaignId: campaign.id, assetId: asset.id },
  });

  const result: PublishResult = {
    ok: outcome.ok,
    mode: outcome.mode,
    status: outcome.status,
    detail: outcome.detail,
    href: outcome.href ?? asset.href,
    externalId: outcome.externalId,
    idempotencyKey: outcome.idempotencyKey,
    attemptedAt: outcome.attemptedAt,
    retryable: outcome.retryable,
  };

  const assets = campaign.assets.map((item) =>
    item.id === asset.id
      ? {
          ...item,
          status: assetStatus(result),
          publishReceipt: {
            status: result.status,
            mode: result.mode,
            detail: result.detail,
            href: result.href,
            externalId: result.externalId,
            idempotencyKey: result.idempotencyKey,
            attemptedAt: result.attemptedAt,
            retryable: result.retryable,
          },
        }
      : item,
  );
  const complete = assets.filter((item) =>
    ['ready', 'scheduled', 'queued', 'published'].includes(item.status),
  ).length;
  const updated = await saveCampaign({
    ...campaign,
    assets,
    completionPercent: Math.round((complete / assets.length) * 100),
  });

  await publishPlatformActivityEvent({
    organizationId: campaign.organizationId,
    module: 'update-hub',
    eventType: `creative-studio.publish.${result.status}`,
    title:
      result.status === 'published'
        ? `Published ${asset.label}`
        : result.status === 'queued'
          ? `Queued ${asset.label}`
          : `${asset.label} publishing ${result.status}`,
    summary: `${campaign.brief.title} → ${asset.channel}: ${result.detail}`,
    actionLabel: 'View campaign',
    actionUrl: `/admin/creative-studio/campaigns/${campaign.id}`,
    metadata: {
      actorName: actor,
      assetId: asset.id,
      publishStatus: result.status,
      externalId: result.externalId,
      retryable: result.retryable,
    },
  }).catch(() => undefined);

  return { campaign: updated, result };
}

export async function publishAllCampaignAssets(input: {
  campaignId: string;
  actorName?: string;
}): Promise<{
  campaign: CreativeCampaign | null;
  results: Array<{ assetId: string; label: string; result: PublishResult }>;
}> {
  const campaign = await getCampaign(input.campaignId);
  if (!campaign) {
    return { campaign: null, results: [] };
  }

  const publishable = campaign.assets.filter(
    (asset) =>
      asset.status !== 'published' &&
      (asset.publishDestination || asset.type.startsWith('social') || asset.type === 'portal-announcement'),
  );

  const results: Array<{ assetId: string; label: string; result: PublishResult }> = [];
  let latest = campaign;

  for (const asset of publishable) {
    const { campaign: next, result } = await publishCampaignAsset({
      campaignId: input.campaignId,
      assetId: asset.id,
      actorName: input.actorName,
    });
    if (next) latest = next;
    results.push({ assetId: asset.id, label: asset.label, result });
  }

  return { campaign: latest, results };
}
