/**
 * Read a Factory launch photo with existing Simplifi vision + CTP asset store.
 * Used so Concept Pack is about the real business in the image, not the filename.
 */
import { buildPageFromAsset } from '@/lib/asset-ingest';
import { readCtpAssetBytes } from '@/lib/ctp-asset-store';
import { parseFactoryVisionText as parseVision } from '@/lib/factory-research/vision-parse.mjs';
import { describeScreenshotBase64 } from '@/lib/screenshot-vision';

export type FactoryImageSignal = {
  assetId?: string;
  imageUrl?: string;
  fileName?: string;
  mimeType?: string;
  visionText: string;
  suggestedClientName: string;
  summary: string;
  entityType?: string;
  whoTheyAre?: string;
  whatTheyDo?: string;
  audience?: string;
  offer?: string;
  voice?: string;
  proof?: string;
  friction?: string;
  opsClue?: string;
  cta?: string;
  url?: string;
  opportunities: string[];
};

const FACTORY_VISION_PROMPT = `You are helping Efficiency Architects build a sit-down Concept Pack from a phone photo / screenshot.

Extract enough that a consultant would feel they understand the person, business, or organization. Return plain text with these labels (one value per label; keep prose on one line when possible):
BUSINESS_NAME: (best visible org/brand/person name — never invent a filename)
ENTITY_TYPE: person | business | organization | unknown
WHO_THEY_ARE: (2-3 sentences on identity and context from what is visible)
WHAT_THEY_DO: (one short sentence)
WHO_THEY_SERVE: (who this is for)
OFFER: (programs, services, or product visible)
VOICE: (tone of the brand in a few words)
PROOF: (trust/proof signals visible, separated by " | ", or none)
FRICTION: (capacity, conversion, or trust gaps visible, separated by " | ")
OPS_CLUE: (how work seems to run today — paper, DM, form, portal — or none)
CTA: (any ask / next step visible)
URL: (any website or handle if visible, else none)
OPPORTUNITIES: (3 short bullets separated by " | " — capacity, conversion, trust gaps)
SUMMARY: (2-3 sentences describing what you see and the business opportunity)

If the image is unclear, still give your best BUSINESS_NAME, ENTITY_TYPE, WHO_THEY_ARE, and SUMMARY from visible text.`;

export function isSyntheticPhotoClient(name: string | undefined): boolean {
  if (!name?.trim()) return true;
  return /^(launch\s+)?photo\s+project\b/i.test(name.trim()) || /^image\s+(launch|capture)\b/i.test(name.trim());
}

export function ctpAssetIdFromUrl(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/api\/ctp\/assets\/([a-zA-Z0-9_-]+)/i);
  return match?.[1] || null;
}

export function parseFactoryVisionText(
  visionText: string,
  fallbackName: string,
): Omit<FactoryImageSignal, 'assetId' | 'imageUrl' | 'fileName' | 'mimeType' | 'visionText'> {
  return parseVision(visionText, fallbackName);
}

export async function analyzeFactoryLaunchImage(input: {
  url?: string;
  name?: string;
  type?: string;
}): Promise<FactoryImageSignal | null> {
  const assetId = ctpAssetIdFromUrl(input.url);
  if (!assetId) return null;

  const loaded = await readCtpAssetBytes(assetId);
  if (!loaded) {
    console.warn('[factory-image-signal] asset bytes missing', assetId);
    return null;
  }

  const mimeType = loaded.meta.mimeType || 'image/jpeg';
  if (!mimeType.startsWith('image/')) return null;

  const base64 = loaded.bytes.toString('base64');
  const fallbackName =
    (input.name || loaded.meta.fileName || 'Image capture')
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .trim() || 'Image capture';

  const visionText =
    (await describeScreenshotBase64(base64, mimeType, { prompt: FACTORY_VISION_PROMPT })) ||
    (await buildPageFromAsset({
      fileBase64: base64,
      mimeType,
      fileName: loaded.meta.fileName || input.name,
      url: input.url,
    }).then((page) => page.markdown));

  if (!visionText?.trim()) return null;

  const parsed = parseFactoryVisionText(visionText, fallbackName);
  return {
    assetId,
    imageUrl: input.url,
    fileName: loaded.meta.fileName || input.name,
    mimeType,
    visionText: visionText.trim(),
    ...parsed,
  };
}
