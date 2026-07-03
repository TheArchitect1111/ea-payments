import { publishToAmplifi } from '@/lib/amplifi-publish';
import { createContentRequest, getClientByPortalSlug } from '@/lib/airtable';
import { publishPlatformActivityEvent } from '@/lib/activity-events-store';
import { getCampaign, saveCampaign } from './campaign-store';
import type { CampaignAsset, CreativeCampaign, PublishResult } from './types';

function portalSlug(organizationId: string): string {
  return process.env.CREATIVE_STUDIO_PORTAL_SLUG?.trim() || organizationId || 'demo-client';
}

function assetChannel(asset: CampaignAsset): string {
  if (asset.type.startsWith('social')) return 'social';
  if (asset.type === 'portal-announcement') return 'portal';
  if (asset.type === 'email' || asset.type === 'sms') return 'content-request';
  if (asset.type === 'landing-page' || asset.type === 'homepage-banner') return 'website';
  return 'print';
}

export async function publishCampaignAsset(input: {
  campaignId: string;
  assetId: string;
  actorName?: string;
}): Promise<{ campaign: CreativeCampaign | null; result: PublishResult }> {
  const campaign = await getCampaign(input.campaignId);
  if (!campaign) {
    return { campaign: null, result: { ok: false, mode: 'stub', detail: 'Campaign not found.' } };
  }

  const asset = campaign.assets.find((a) => a.id === input.assetId);
  if (!asset) {
    return { campaign, result: { ok: false, mode: 'stub', detail: 'Asset not found.' } };
  }

  const slug = portalSlug(campaign.organizationId);
  const actor = input.actorName ?? 'Creative Studio';
  let result: PublishResult;

  if (asset.publishDestination === 'amplifi' || asset.type.startsWith('social')) {
    const amplifi = await publishToAmplifi({
      slug,
      title: asset.previewTitle,
      message: asset.previewBody,
      storyUrl: asset.href,
      actorName: actor,
    });
    result = {
      ok: amplifi.ok,
      mode: amplifi.mode,
      detail: amplifi.detail,
      href: amplifi.shareUrls?.amplifi,
    };
  } else if (asset.publishDestination === 'portal' || asset.type === 'portal-announcement') {
    const client = await getClientByPortalSlug(slug);
    if (!client) {
      result = {
        ok: true,
        mode: 'manual',
        detail: `Portal announcement ready — add to ${slug} updates manually.`,
        href: `/portal/${slug}/updates`,
      };
    } else {
      const created = await createContentRequest({
        clientRecordId: client.id,
        organizationName: client.organization ?? client.clientName,
        requestType: 'Portal Announcement',
        pageLocation: 'Portal Home',
        title: asset.previewTitle,
        description: campaign.brief.summary,
        content: asset.previewBody,
        additionalNotes: JSON.stringify({ source: 'creative-studio', campaignId: campaign.id, assetId: asset.id }),
        submittedBy: actor,
        status: 'Approved',
      });
      result = created.ok
        ? {
            ok: true,
            mode: 'airtable',
            detail: 'Portal announcement queued in content requests.',
            href: '/admin/content-requests',
          }
        : { ok: false, mode: 'airtable', detail: created.error ?? 'Failed to queue portal announcement.' };
    }
  } else if (asset.publishDestination === 'content-request' || asset.type === 'email' || asset.type === 'sms') {
    const client = await getClientByPortalSlug(slug);
    const requestType = asset.type === 'sms' ? 'SMS' : asset.type === 'email' ? 'Email Campaign' : asset.label;
    if (!client) {
      result = {
        ok: true,
        mode: 'manual',
        detail: `${requestType} draft ready — configure Airtable client for ${slug} to auto-queue.`,
      };
    } else {
      const created = await createContentRequest({
        clientRecordId: client.id,
        organizationName: client.organization ?? client.clientName,
        requestType,
        title: asset.previewTitle,
        description: campaign.brief.summary,
        content: asset.previewBody,
        additionalNotes: JSON.stringify({ source: 'creative-studio', campaignId: campaign.id, assetId: asset.id }),
        submittedBy: actor,
        status: 'Pending Review',
      });
      result = created.ok
        ? {
            ok: true,
            mode: 'airtable',
            detail: `${requestType} submitted to content requests.`,
            href: '/admin/content-requests',
          }
        : { ok: false, mode: 'airtable', detail: created.error ?? 'Failed to create content request.' };
    }
  } else {
    result = {
      ok: true,
      mode: 'manual',
      detail: `${asset.label} marked ready for ${assetChannel(asset)} delivery.`,
      href: asset.href,
    };
  }

  const assets = campaign.assets.map((a) =>
    a.id === asset.id ? { ...a, status: result.ok ? ('published' as const) : a.status } : a,
  );
  const ready = assets.filter((a) => a.status === 'ready' || a.status === 'published' || a.status === 'scheduled').length;
  const updated = await saveCampaign({
    ...campaign,
    assets,
    completionPercent: Math.round((ready / assets.length) * 100),
  });

  if (result.ok) {
    await publishPlatformActivityEvent({
      organizationId: campaign.organizationId,
      module: 'update-hub',
      eventType: 'creative-studio.publish',
      title: `Published ${asset.label}`,
      summary: `${campaign.brief.title} → ${asset.channel}`,
      actionLabel: 'View campaign',
      actionUrl: `/admin/creative-studio/campaigns/${campaign.id}`,
      metadata: { actorName: actor, assetId: asset.id },
    }).catch(() => undefined);
  }

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
    (a) => a.status !== 'published' && (a.publishDestination || a.type.startsWith('social') || a.type === 'portal-announcement'),
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
