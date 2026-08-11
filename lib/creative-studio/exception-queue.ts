import { saveStudioRecord, loadStudioRecord } from '@/lib/creative-studio/persistence';
import type { CreativeCampaign } from '@/lib/creative-studio/types';

/** Exception severity and categories. */
export type ExceptionCategory =
  | 'publish-failure'
  | 'expired-auth'
  | 'source-integrity'
  | 'verification-failure'
  | 'missing-media'
  | 'media-rights'
  | 'broken-cta'
  | 'content-safety'
  | 'platform-unsupported'
  | 'system-uncertainty'
  | 'other';

export type ExceptionSeverity = 'critical' | 'warning' | 'info';
export type ExceptionStatus = 'open' | 'acknowledged' | 'resolved' | 'dismissed';

export type AmplifiException = {
  id: string;
  organizationId: string;
  category: ExceptionCategory;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  campaignId?: string;
  assetId?: string;
  campaignTitle?: string;
  assetLabel?: string;
  summary: string;
  detail?: string;
  retryable: boolean;
  openedAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
};

/** Learning/adaptation record - one per campaign when analytics are available. */
export type CampaignLearningRecord = {
  id: string;
  campaignId: string;
  organizationId: string;
  recordedAt: string;
  successMetric: string;
  successTarget?: number;
  actualLinkClicks: number;
  actualCtpCompletions: number;
  actualImpressions: number;
  actualReach: number;
  actualEngagements: number;
  bestContentType?: string;
  bestPlatform?: string;
  bestFormat?: string;
  /** Adaptation notes produced for future campaigns. */
  adaptationNotes: string[];
};

// ---- Exception Queue --------------------------------------------------------

function exceptionsKey(organizationId: string) {
  return `amplifi-exceptions-${organizationId}`;
}

async function loadExceptions(organizationId: string): Promise<AmplifiException[]> {
  const stored = await loadStudioRecord<AmplifiException[]>('experience', exceptionsKey(organizationId));
  return Array.isArray(stored) ? stored : [];
}

async function saveExceptions(organizationId: string, exceptions: AmplifiException[]) {
  await saveStudioRecord({
    recordType: 'experience',
    id: exceptionsKey(organizationId),
    organizationId,
    payload: exceptions.slice(0, 200),
    title: 'Amplifi Exception Queue',
  });
}

function exId() {
  return `ex-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function raiseException(input: {
  organizationId: string;
  category: ExceptionCategory;
  severity: ExceptionSeverity;
  summary: string;
  detail?: string;
  campaignId?: string;
  assetId?: string;
  campaignTitle?: string;
  assetLabel?: string;
  retryable?: boolean;
}): Promise<AmplifiException> {
  const exceptions = await loadExceptions(input.organizationId);
  const now = new Date().toISOString();
  const ex: AmplifiException = {
    id: exId(),
    organizationId: input.organizationId,
    category: input.category,
    severity: input.severity,
    status: 'open',
    summary: input.summary,
    detail: input.detail,
    campaignId: input.campaignId,
    assetId: input.assetId,
    campaignTitle: input.campaignTitle,
    assetLabel: input.assetLabel,
    retryable: input.retryable ?? false,
    openedAt: now,
    updatedAt: now,
  };
  await saveExceptions(input.organizationId, [ex, ...exceptions]);
  return ex;
}

export async function listExceptions(organizationId: string, status?: ExceptionStatus): Promise<AmplifiException[]> {
  const all = await loadExceptions(organizationId);
  return status ? all.filter((ex) => ex.status === status) : all;
}

export async function resolveException(
  organizationId: string,
  id: string,
  patch: { status: Exclude<ExceptionStatus, 'open'>; resolvedBy?: string; note?: string },
): Promise<AmplifiException | null> {
  const exceptions = await loadExceptions(organizationId);
  const index = exceptions.findIndex((ex) => ex.id === id);
  if (index < 0) return null;
  const now = new Date().toISOString();
  const updated: AmplifiException = {
    ...exceptions[index],
    status: patch.status,
    resolvedAt: patch.status === 'resolved' ? now : undefined,
    resolvedBy: patch.resolvedBy,
    resolutionNote: patch.note,
    updatedAt: now,
  };
  exceptions[index] = updated;
  await saveExceptions(organizationId, exceptions);
  return updated;
}

// ---- Learning + Adaptation --------------------------------------------------

function learningKey(organizationId: string) {
  return `amplifi-learning-${organizationId}`;
}

async function loadLearning(organizationId: string): Promise<CampaignLearningRecord[]> {
  const stored = await loadStudioRecord<CampaignLearningRecord[]>('experience', learningKey(organizationId));
  return Array.isArray(stored) ? stored : [];
}

async function saveLearning(organizationId: string, records: CampaignLearningRecord[]) {
  await saveStudioRecord({
    recordType: 'experience',
    id: learningKey(organizationId),
    organizationId,
    payload: records.slice(0, 100),
    title: 'Amplifi Learning Records',
  });
}

function inferAdaptations(record: Omit<CampaignLearningRecord, 'adaptationNotes' | 'id' | 'recordedAt'>): string[] {
  const notes: string[] = [];
  const ctr = record.actualImpressions > 0 ? record.actualLinkClicks / record.actualImpressions : null;
  const ctpRate = record.actualLinkClicks > 0 ? record.actualCtpCompletions / record.actualLinkClicks : null;
  if (record.bestContentType) notes.push(`Content type "${record.bestContentType}" produced the most engagement.`);
  if (record.bestPlatform) notes.push(`Platform "${record.bestPlatform}" drove more responses this campaign.`);
  if (record.bestFormat) notes.push(`Format "${record.bestFormat}" earned more attention.`);
  if (ctr !== null && ctr < 0.005) notes.push('Click-through rate was low; try a more specific headline or stronger CTA in the next campaign.');
  if (ctpRate !== null && ctpRate < 0.1) notes.push('Many clicks did not lead to CTP starts; check the CTA landing experience.');
  if (record.successTarget && record.actualLinkClicks < record.successTarget * 0.5) {
    notes.push(`Actual engagement was well below the goal of ${record.successTarget} ${record.successMetric}; consider broadening reach or adjusting cadence.`);
  }
  if (!notes.length) notes.push('Baseline established. Use this campaign to compare future performance.');
  return notes;
}

export async function recordCampaignLearning(input: {
  campaign: CreativeCampaign;
}): Promise<CampaignLearningRecord | null> {
  const { campaign } = input;
  if (!campaign.analytics) return null;

  const { totals, platformMetrics } = campaign.analytics;
  const impressions = platformMetrics.reduce((sum, item) => sum + item.impressions, 0);
  const reach = platformMetrics.reduce((sum, item) => sum + item.reach, 0);
  const engagements = platformMetrics.reduce((sum, item) => sum + item.reactions + item.comments + item.shares + item.saves, 0);

  const bestAsset = campaign.analytics.byAsset.sort((a, b) => b.ctpCompletions - a.ctpCompletions || b.linkClicks - a.linkClicks)[0];
  const bestAssetObj = bestAsset ? campaign.assets.find((a) => a.id === bestAsset.assetId) : undefined;
  const bestPlatformRecord = [...platformMetrics].sort((a, b) => (b.reactions + b.comments + b.shares) - (a.reactions + a.comments + a.shares))[0];

  const base = {
    campaignId: campaign.id,
    organizationId: campaign.organizationId,
    successMetric: campaign.strategy.successMetric,
    successTarget: campaign.strategy.successTarget,
    actualLinkClicks: totals.linkClicks,
    actualCtpCompletions: totals.ctpCompletions,
    actualImpressions: impressions,
    actualReach: reach,
    actualEngagements: engagements,
    bestContentType: bestAssetObj?.contentType,
    bestPlatform: bestPlatformRecord?.platform,
    bestFormat: bestAssetObj?.socialFormat,
  };

  const rec: CampaignLearningRecord = {
    id: `learn-${campaign.id}`,
    ...base,
    recordedAt: new Date().toISOString(),
    adaptationNotes: inferAdaptations(base),
  };

  const records = await loadLearning(campaign.organizationId);
  const existing = records.findIndex((row) => row.campaignId === campaign.id);
  if (existing >= 0) {
    records[existing] = rec;
  } else {
    records.unshift(rec);
  }
  await saveLearning(campaign.organizationId, records);
  return rec;
}

export async function listLearningRecords(organizationId: string): Promise<CampaignLearningRecord[]> {
  return loadLearning(organizationId);
}
