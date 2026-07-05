import type { CtpAssetManifest, CtpAssetManifestEntry } from '@/lib/ctp-asset-store';
import type { CtpSubmission } from '@/lib/ctp-submissions';

const ASSET_TYPE_LABELS: Record<string, string> = {
  logo: 'Logo',
  photos: 'Photos',
  videos: 'Videos',
  documents: 'Documents',
  policies: 'Policies or documents',
  presentations: 'PowerPoints or decks',
  'brand-guidelines': 'Brand guidelines',
  'social-media': 'Social media content',
  testimonials: 'Testimonials',
};

export type CtpAdminAssetView = {
  id: string;
  assetType: string;
  label: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
  isImage: boolean;
};

export type CtpAdminSubmissionView = {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  status: string;
  workspaceStatus: string;
  studioStatus: string;
  proposalId: string;
  assessmentId: string;
  submittedAt: string;
  creativeCampaignId?: string;
  portalSlug?: string;
  considerSlug?: string;
  reviewScheduledAt?: string;
  assets: CtpAdminAssetView[];
  intakeSummary?: string;
};

function assetLabel(assetType: string, entry: CtpAssetManifestEntry): string {
  return ASSET_TYPE_LABELS[assetType] ?? ASSET_TYPE_LABELS[entry.assetType] ?? entry.assetType;
}

function isImageMime(mimeType: string): boolean {
  return mimeType.toLowerCase().startsWith('image/');
}

export function buildCtpAdminAssetViews(manifest?: CtpAssetManifest): CtpAdminAssetView[] {
  if (!manifest) return [];

  return Object.entries(manifest).map(([assetType, entry]) => ({
    id: entry.id,
    assetType,
    label: assetLabel(assetType, entry),
    fileName: entry.fileName,
    mimeType: entry.mimeType,
    size: entry.size,
    url: entry.url,
    uploadedAt: entry.uploadedAt,
    isImage: isImageMime(entry.mimeType),
  }));
}

export function buildCtpAdminSubmissionView(submission: CtpSubmission): CtpAdminSubmissionView {
  return {
    id: submission.id,
    businessName: submission.businessName,
    contactName: submission.contactName,
    email: submission.email,
    status: submission.status,
    workspaceStatus: submission.workspaceStatus,
    studioStatus: submission.studioStatus,
    proposalId: submission.proposalId,
    assessmentId: submission.assessmentId,
    submittedAt: submission.submittedAt,
    creativeCampaignId: submission.creativeCampaignId,
    portalSlug: submission.portalSlug,
    considerSlug: submission.considerSlug,
    reviewScheduledAt: submission.reviewScheduledAt,
    assets: buildCtpAdminAssetViews(submission.assetManifest),
    intakeSummary: submission.intakeAnalysis?.summary,
  };
}

export function mapCtpAdminViewsByProposalId(
  submissions: CtpSubmission[],
): Record<string, CtpAdminSubmissionView> {
  const map: Record<string, CtpAdminSubmissionView> = {};
  for (const submission of submissions) {
    if (!submission.proposalId) continue;
    map[submission.proposalId] = buildCtpAdminSubmissionView(submission);
  }
  return map;
}
