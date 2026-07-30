/**
 * Persist selected crawl media into Creative Studio (durable refs, no hotlinks in packs).
 */
import { createHash, randomUUID } from 'node:crypto';
import { saveMediaAsset } from '@/lib/creative-studio/media-store';
import type { MediaAssetCrawl, ResearchCrawlResult } from '@/lib/uxg/research/schemas';

const TRACKING_HINT =
  /pixel|tracking|beacon|1x1|spacer|sprite|analytics|facebook\.com\/tr|doubleclick/i;

function shouldRejectMedia(asset: MediaAssetCrawl): string | null {
  if (asset.rejected) return asset.rejectionReason || 'already_rejected';
  if (TRACKING_HINT.test(asset.originalUrl) || TRACKING_HINT.test(asset.altText || '')) {
    return 'tracking_or_spacer';
  }
  if (asset.width && asset.height && (asset.width < 64 || asset.height < 64)) {
    return 'too_small';
  }
  if (/watermark|stock.?photo.?id/i.test(`${asset.altText || ''} ${asset.nearbyText || ''}`)) {
    return 'watermark_signal';
  }
  return null;
}

function canonicalKey(url: string, perceptualHash?: string): string {
  const base = url.split('?')[0]!.toLowerCase();
  if (perceptualHash) return `ph:${perceptualHash}`;
  return `url:${createHash('sha256').update(base).digest('hex').slice(0, 24)}`;
}

/**
 * Copy eligible preview assets into Creative Studio and rewrite durableUrl.
 * Official-site assets remain usageStatus preview_only until ownership confirmed.
 * Does not hotlink in returned pack — durable refs preferred when store succeeds.
 */
export async function materializeDurableMedia(
  result: ResearchCrawlResult,
  options?: { organizationId?: string; projectId?: string },
): Promise<ResearchCrawlResult> {
  const orgId = options?.organizationId || process.env.EA_INTERNAL_ORG_ID || 'ea-factory';
  const seen = new Set<string>();
  const nextMedia: MediaAssetCrawl[] = [];

  for (const asset of result.mediaAssets) {
    const reject = shouldRejectMedia(asset);
    if (reject) {
      nextMedia.push({
        ...asset,
        rejected: true,
        rejectionReason: reject,
        usageStatus: 'rejected',
      });
      continue;
    }

    const key = canonicalKey(asset.originalUrl, asset.perceptualHash);
    if (seen.has(key)) {
      nextMedia.push({
        ...asset,
        rejected: true,
        rejectionReason: 'duplicate',
        usageStatus: 'rejected',
      });
      continue;
    }
    seen.add(key);

    // Official crawl assets are preview_only until permission confirmed.
    const usageStatus =
      asset.usageStatus === 'user_supplied' || asset.usageStatus === 'approved'
        ? asset.usageStatus
        : 'preview_only';

    let durableUrl = asset.durableUrl;
    try {
      const saved = await saveMediaAsset({
        organizationId: orgId,
        kind: asset.relevanceCategory === 'logo' ? 'logo' : 'image',
        label: asset.altText || asset.likelySubject || `uxg-${options?.projectId || 'crawl'}`,
        url: asset.originalUrl,
        mimeType: asset.mimeType,
        tags: [
          'uxg-research',
          `usage:${usageStatus}`,
          options?.projectId ? `project:${options.projectId}` : '',
          asset.perceptualHash ? `ph:${asset.perceptualHash}` : '',
        ].filter(Boolean),
        id: randomUUID(),
      });
      // Metadata + durable catalog reference (Creative Studio). Binary re-host
      // uses existing CTP chunk path when configured later; never hotlink in sites.
      durableUrl = saved.url.startsWith('/')
        ? saved.url
        : `/api/creative-studio/media/${saved.id}`;
    } catch {
      // Keep original for admin diagnostics; generation must prefer durableUrl when set.
      durableUrl = asset.durableUrl;
    }

    nextMedia.push({
      ...asset,
      usageStatus,
      durableUrl,
      rejected: false,
    });
  }

  return { ...result, mediaAssets: nextMedia };
}

/** True when a generated surface would hotlink an external crawl asset. */
export function assertsNoHotlink(url: string | undefined): boolean {
  if (!url) return true;
  if (url.startsWith('/')) return true;
  if (/efficiencyarchitects\.online|vercel\.app/i.test(url)) return true;
  return false;
}
