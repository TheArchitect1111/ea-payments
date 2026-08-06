import { getCampaign, saveCampaign } from './campaign-store';
import { socialAssetRequiresMedia } from './media-validation';
import type { CampaignAsset, CreativeCampaign } from './types';

export type WorkflowAction =
  | 'submit-review'
  | 'approve'
  | 'reject'
  | 'schedule'
  | 'cancel-schedule'
  | 'pause-campaign'
  | 'resume-campaign';

export type WorkflowResult = {
  ok: boolean;
  campaign: CreativeCampaign | null;
  error?: string;
};

function validTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

function replaceAsset(
  campaign: CreativeCampaign,
  assetId: string,
  update: (asset: CampaignAsset) => CampaignAsset,
): CreativeCampaign | null {
  if (!campaign.assets.some((asset) => asset.id === assetId)) return null;
  return {
    ...campaign,
    assets: campaign.assets.map((asset) => (asset.id === assetId ? update(asset) : asset)),
  };
}

export async function applyCampaignWorkflow(input: {
  campaignId: string;
  assetId?: string;
  action: WorkflowAction;
  actor: string;
  note?: string;
  publishAt?: string;
  timezone?: string;
}): Promise<WorkflowResult> {
  const campaign = await getCampaign(input.campaignId);
  if (!campaign) return { ok: false, campaign: null, error: 'Campaign not found.' };
  const now = new Date().toISOString();

  if (input.action === 'pause-campaign') {
    const updated = await saveCampaign({
      ...campaign,
      paused: true,
      pausedAt: now,
      pausedBy: input.actor,
    });
    return { ok: true, campaign: updated };
  }

  if (input.action === 'resume-campaign') {
    const updated = await saveCampaign({
      ...campaign,
      paused: false,
      pausedAt: undefined,
      pausedBy: undefined,
    });
    return { ok: true, campaign: updated };
  }

  if (!input.assetId) {
    return { ok: false, campaign, error: 'Asset ID is required.' };
  }

  const asset = campaign.assets.find((item) => item.id === input.assetId);
  if (!asset) return { ok: false, campaign, error: 'Campaign asset not found.' };

  let next: CreativeCampaign | null = null;

  if (input.action === 'submit-review') {
    if (!['ready', 'blocked', 'draft', 'rejected'].includes(asset.status)) {
      return { ok: false, campaign, error: 'Only draft or ready content can be submitted for review.' };
    }
    next = replaceAsset(campaign, asset.id, (item) => ({
      ...item,
      status: 'review',
      approval: {
        status: 'review',
        requestedAt: now,
        requestedBy: input.actor,
        note: input.note?.trim(),
      },
    }));
  }

  if (input.action === 'approve') {
    if (asset.status !== 'review' || asset.approval?.status !== 'review') {
      return { ok: false, campaign, error: 'Content must be in review before approval.' };
    }
    if (socialAssetRequiresMedia(asset) && !asset.mediaValidation?.valid) {
      return { ok: false, campaign, error: 'Attach valid campaign media before approval.' };
    }
    next = replaceAsset(campaign, asset.id, (item) => ({
      ...item,
      status: 'approved',
      approval: {
        ...item.approval,
        status: 'approved',
        decidedAt: now,
        decidedBy: input.actor,
        note: input.note?.trim() || item.approval?.note,
      },
    }));
  }

  if (input.action === 'reject') {
    if (asset.status !== 'review') {
      return { ok: false, campaign, error: 'Only content in review can be rejected.' };
    }
    next = replaceAsset(campaign, asset.id, (item) => ({
      ...item,
      status: 'draft',
      approval: {
        ...item.approval,
        status: 'rejected',
        decidedAt: now,
        decidedBy: input.actor,
        note: input.note?.trim(),
      },
    }));
  }

  if (input.action === 'schedule') {
    if (asset.status !== 'approved' || asset.approval?.status !== 'approved') {
      return { ok: false, campaign, error: 'Content must be approved before scheduling.' };
    }
    const timezone = input.timezone?.trim() || 'America/New_York';
    if (!validTimezone(timezone)) {
      return { ok: false, campaign, error: 'Select a valid IANA timezone.' };
    }
    const publishAt = new Date(input.publishAt ?? '');
    if (!Number.isFinite(publishAt.getTime()) || publishAt.getTime() <= Date.now()) {
      return { ok: false, campaign, error: 'Scheduled publishing time must be in the future.' };
    }
    next = replaceAsset(campaign, asset.id, (item) => ({
      ...item,
      status: 'scheduled',
      schedule: {
        publishAt: publishAt.toISOString(),
        timezone,
        scheduledAt: now,
        scheduledBy: input.actor,
      },
    }));
  }

  if (input.action === 'cancel-schedule') {
    if (asset.status !== 'scheduled' || !asset.schedule) {
      return { ok: false, campaign, error: 'Only scheduled content can be cancelled.' };
    }
    next = replaceAsset(campaign, asset.id, (item) => ({
      ...item,
      status: 'approved',
      schedule: item.schedule
        ? {
            ...item.schedule,
            cancelledAt: now,
            cancelledBy: input.actor,
          }
        : undefined,
    }));
  }

  if (!next) return { ok: false, campaign, error: 'Unsupported workflow action.' };
  return { ok: true, campaign: await saveCampaign(next) };
}

export function canPublishAsset(
  campaign: CreativeCampaign,
  asset: CampaignAsset,
  now = new Date(),
): { ok: boolean; error?: string } {
  if (campaign.paused) return { ok: false, error: 'Campaign publishing is paused.' };
  if (asset.status === 'approved' && asset.approval?.status === 'approved') return { ok: true };
  if (
    asset.status === 'scheduled' &&
    asset.approval?.status === 'approved' &&
    asset.schedule &&
    new Date(asset.schedule.publishAt).getTime() <= now.getTime() &&
    !asset.schedule.cancelledAt
  ) {
    return { ok: true };
  }
  return { ok: false, error: 'Content must be approved or due for scheduled publishing.' };
}
