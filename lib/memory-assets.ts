import type { CaptureRecord } from './capture-records';
import type { SimplifiObject } from './simplifi-objects';

export type MemoryAssetKind = 'url' | 'opportunity' | 'organization' | 'person' | 'note';

export interface MemoryAsset {
  id: string;
  title: string;
  kind: MemoryAssetKind;
  sourceUrl?: string;
  capturedAt: string;
  savePurpose?: string;
  opportunityScore?: number;
  reuseHint: string;
  href?: string;
}

function kindFromType(type: CaptureRecord['captureType']): MemoryAssetKind {
  if (type === 'Organization') return 'organization';
  if (type === 'Person') return 'person';
  if (type === 'Note') return 'note';
  if (type === 'Opportunity') return 'opportunity';
  return 'url';
}

export function captureToMemoryAsset(capture: CaptureRecord, baseUrl?: string): MemoryAsset {
  const base = baseUrl?.replace(/\/$/, '') ?? '';
  const href =
    capture.considerSlug && base
      ? `${base}/consider/${capture.considerSlug}`
      : capture.shareUrl;

  return {
    id: capture.id,
    title: capture.title,
    kind: kindFromType(capture.captureType),
    sourceUrl: capture.sourceUrl,
    capturedAt: capture.dateCaptured,
    savePurpose: capture.savePurpose,
    opportunityScore: capture.opportunityScore,
    reuseHint: capture.whatWeRecommend ?? capture.nextAction ?? 'Revisit when planning outreach.',
    href,
  };
}

export function objectsToMemoryLibrary(objects: SimplifiObject[]): MemoryAsset[] {
  return objects
    .filter((o) => o.status !== 'archived')
    .slice(0, 12)
    .map((o) => ({
      id: o.id,
      title: o.title,
      kind: o.type === 'Organization' ? 'organization' : o.type === 'Person' ? 'person' : 'opportunity',
      sourceUrl: o.sourceUrl,
      capturedAt: o.dateCaptured,
      savePurpose: o.savePurpose,
      opportunityScore: o.opportunityScore,
      reuseHint: o.whatWeRecommend,
      href: o.considerUrl ?? o.shareUrl,
    }));
}
