import { extractCampaignBrief } from './extract-brief';
import { goalById } from './goals';
import { generateCampaignPackage, GENERATION_VERSION } from './generate-assets';
import { getBrandProfile } from './brand-store';
import { listStudioRecords, loadStudioRecord, saveStudioRecord } from './persistence';
import type {
  CampaignGoalId,
  CampaignStrategy,
  CreativeCampaign,
  SocialPlatform,
} from './types';

const MEMORY_CAP = 100;
const campaigns = new Map<string, CreativeCampaign>();
const SOCIAL_PLATFORMS = new Set<SocialPlatform>(['facebook', 'instagram', 'linkedin', 'x']);

function orgId(): string {
  return process.env.EA_INTERNAL_ORG_ID ?? 'ea';
}

function newId(): string {
  return `camp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanList(values: unknown, fallback: string[]): string[] {
  if (!Array.isArray(values)) return fallback;
  const cleaned = [...new Set(values.map(String).map((value) => value.trim()).filter(Boolean))];
  return cleaned.length ? cleaned.slice(0, 6) : fallback;
}

function normalizeStrategy(
  input: Partial<CampaignStrategy> | undefined,
  fallbackAudience: string,
  goalLabel: string,
): CampaignStrategy {
  const platforms = Array.isArray(input?.platforms)
    ? input.platforms.filter((value): value is SocialPlatform => SOCIAL_PLATFORMS.has(value as SocialPlatform))
    : [];
  const successTarget = Number(input?.successTarget);

  return {
    objective: input?.objective?.trim() || goalLabel,
    audience: input?.audience?.trim() || fallbackAudience,
    startDate: input?.startDate?.trim() || undefined,
    endDate: input?.endDate?.trim() || undefined,
    platforms: platforms.length ? [...new Set(platforms)] : ['facebook', 'instagram'],
    tone: input?.tone?.trim() || 'Clear, warm, and credible',
    successMetric: input?.successMetric?.trim() || 'Engagements',
    successTarget: Number.isFinite(successTarget) && successTarget > 0 ? successTarget : undefined,
    contentPillars: cleanList(input?.contentPillars, ['Story', 'Proof', 'Invitation']),
  };
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
  for (const campaign of fromStore) campaigns.set(campaign.id, campaign);

  return [...campaigns.values()]
    .filter((campaign) => campaign.organizationId === organizationId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function ensureCurrentGeneration(campaign: CreativeCampaign): Promise<CreativeCampaign> {
  if ((campaign.generationVersion ?? 0) >= GENERATION_VERSION) return campaign;

  const brand = await getBrandProfile(campaign.organizationId);
  const generated = await generateCampaignPackage({
    id: campaign.id,
    goalId: campaign.goalId,
    goalLabel: campaign.goalLabel,
    story: campaign.story,
    brief: campaign.brief,
    strategy: campaign.strategy,
    organizationId: campaign.organizationId,
    brand,
  });
  const upgraded: CreativeCampaign = {
    ...campaign,
    ...generated,
    generationVersion: GENERATION_VERSION,
    updatedAt: new Date().toISOString(),
  };
  await persistCampaign(upgraded);
  return upgraded;
}

export async function getCampaign(id: string): Promise<CreativeCampaign | null> {
  const cached = campaigns.get(id);
  if (cached) return ensureCurrentGeneration(cached);

  const loaded = await loadStudioRecord<CreativeCampaign>('campaign', id);
  if (loaded) return ensureCurrentGeneration(loaded);
  return null;
}

export async function createCampaign(input: {
  goalId: CampaignGoalId;
  story: string;
  organizationId?: string;
  strategy?: Partial<CampaignStrategy>;
}): Promise<CreativeCampaign> {
  const goal = goalById(input.goalId);
  const brief = await extractCampaignBrief(input.story, input.goalId);
  const strategy = normalizeStrategy(input.strategy, brief.audience, goal.label);
  const organizationId = input.organizationId ?? orgId();
  const brand = await getBrandProfile(organizationId);
  const id = newId();
  const now = new Date().toISOString();
  const generated = await generateCampaignPackage({
    id,
    goalId: input.goalId,
    goalLabel: goal.label,
    story: input.story.trim(),
    brief,
    strategy,
    organizationId,
    brand,
  });

  const campaign: CreativeCampaign = {
    id,
    goalId: input.goalId,
    goalLabel: goal.label,
    story: input.story.trim(),
    brief: { ...brief, audience: strategy.audience },
    strategy,
    assets: generated.assets,
    timeline: generated.timeline,
    completionPercent: generated.completionPercent,
    createdAt: now,
    updatedAt: now,
    organizationId,
    generationVersion: GENERATION_VERSION,
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

  const assets = campaign.assets.map((asset) => (asset.id === assetId ? { ...asset, status } : asset));
  const ready = assets.filter((asset) =>
    ['ready', 'scheduled', 'queued', 'published'].includes(asset.status),
  ).length;
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
