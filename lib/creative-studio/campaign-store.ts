import { extractCampaignBrief } from './extract-brief';
import { goalById } from './goals';
import { generateCampaignPackage } from './generate-assets';
import { getBrandProfile } from './brand-store';
import { listStudioRecords, loadStudioRecord, saveStudioRecord } from './persistence';
import type { CampaignGoalId, CreativeCampaign } from './types';

const MEMORY_CAP = 100;
const campaigns = new Map<string, CreativeCampaign>();

function orgId(): string {
  return process.env.EA_INTERNAL_ORG_ID ?? 'ea';
}

function newId(): string {
  return `camp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function persistCampaign(campaign: CreativeCampaign): Promise<void> {
  campaigns.set(campaign.id, campaign);
  await saveStudioRecord({
    recordType: 'campaign',
    id: campaign.id,
    organizationId: campaign.organizationId,
    payload: campaign,
    title: campaign.brief.title,
  });
}

export async function listCampaigns(organizationId = orgId()): Promise<CreativeCampaign[]> {
  const fromStore = await listStudioRecords<CreativeCampaign>('campaign', organizationId);
  for (const campaign of fromStore) {
    campaigns.set(campaign.id, campaign);
  }

  return [...campaigns.values()]
    .filter((c) => c.organizationId === organizationId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getCampaign(id: string): Promise<CreativeCampaign | null> {
  const cached = campaigns.get(id);
  if (cached) return cached;

  const loaded = await loadStudioRecord<CreativeCampaign>('campaign', id);
  if (loaded) {
    campaigns.set(id, loaded);
    return loaded;
  }
  return null;
}

export async function createCampaign(input: {
  goalId: CampaignGoalId;
  story: string;
  organizationId?: string;
}): Promise<CreativeCampaign> {
  const goal = goalById(input.goalId);
  const brief = await extractCampaignBrief(input.story, input.goalId);
  const organizationId = input.organizationId ?? orgId();
  const brand = await getBrandProfile(organizationId);
  const id = newId();
  const now = new Date().toISOString();
  const generated = generateCampaignPackage({
    id,
    goalId: input.goalId,
    goalLabel: goal.label,
    story: input.story.trim(),
    brief,
    organizationId,
    brand,
  });

  const campaign: CreativeCampaign = {
    id,
    goalId: input.goalId,
    goalLabel: goal.label,
    story: input.story.trim(),
    brief,
    assets: generated.assets,
    timeline: generated.timeline,
    completionPercent: generated.completionPercent,
    createdAt: now,
    updatedAt: now,
    organizationId,
  };

  await persistCampaign(campaign);

  if (campaigns.size > MEMORY_CAP) {
    const oldest = [...campaigns.entries()].sort((a, b) => a[1].createdAt.localeCompare(b[1].createdAt))[0]?.[0];
    if (oldest) campaigns.delete(oldest);
  }

  return campaign;
}

export async function updateAssetStatus(
  campaignId: string,
  assetId: string,
  status: CreativeCampaign['assets'][number]['status'],
): Promise<CreativeCampaign | null> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) return null;

  const assets = campaign.assets.map((a) => (a.id === assetId ? { ...a, status } : a));
  const ready = assets.filter((a) => a.status === 'ready' || a.status === 'published' || a.status === 'scheduled').length;
  const updated: CreativeCampaign = {
    ...campaign,
    assets,
    completionPercent: Math.round((ready / assets.length) * 100),
    updatedAt: new Date().toISOString(),
  };
  await persistCampaign(updated);
  return updated;
}

export async function saveCampaign(campaign: CreativeCampaign): Promise<CreativeCampaign> {
  const updated = { ...campaign, updatedAt: new Date().toISOString() };
  await persistCampaign(updated);
  return updated;
}
