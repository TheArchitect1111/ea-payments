import { publishCampaignAsset } from './publish-asset';
import { listAllStudioRecords } from './persistence';
import type { CreativeCampaign } from './types';

export async function processDueAmplifiPosts(now = new Date()): Promise<{
  checked: number;
  published: number;
  queued: number;
  failed: number;
  blocked: number;
}> {
  const campaigns = await listAllStudioRecords<CreativeCampaign>('campaign');
  const due = campaigns.flatMap((campaign) =>
    campaign.paused
      ? []
      : campaign.assets
          .filter(
            (asset) =>
              asset.status === 'scheduled' &&
              asset.approval?.status === 'approved' &&
              asset.schedule &&
              !asset.schedule.cancelledAt &&
              new Date(asset.schedule.publishAt).getTime() <= now.getTime(),
          )
          .map((asset) => ({ campaign, asset })),
  );

  const summary = { checked: due.length, published: 0, queued: 0, failed: 0, blocked: 0 };

  for (const row of due) {
    const { result } = await publishCampaignAsset({
      campaignId: row.campaign.id,
      assetId: row.asset.id,
      actorName: 'Amplifi Scheduler',
    });
    if (result.status === 'published') summary.published += 1;
    else if (result.status === 'queued') summary.queued += 1;
    else if (result.status === 'blocked') summary.blocked += 1;
    else summary.failed += 1;
  }

  return summary;
}
