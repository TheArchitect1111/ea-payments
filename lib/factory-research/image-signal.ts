/**
 * Read a Factory launch photo with existing Simplifi vision + CTP asset store.
 * Used so Concept Pack is about the real business in the image, not the filename.
 */
import { buildPageFromAsset } from '@/lib/asset-ingest';
import { readCtpAssetBytes } from '@/lib/ctp-asset-store';
import { describeScreenshotBase64 } from '@/lib/screenshot-vision';

export type FactoryImageSignal = {
  assetId?: string;
  imageUrl?: string;
  fileName?: string;
  mimeType?: string;
  visionText: string;
  suggestedClientName: string;
  summary: string;
  whatTheyDo?: string;
  audience?: string;
  cta?: string;
  url?: string;
  opportunities: string[];
};

const FACTORY_VISION_PROMPT = `You are helping Efficiency Architects build a sit-down Concept Pack from a phone photo / screenshot.

Extract what a founder would need in a meeting. Return plain text with these labels (one per line when possible):
BUSINESS_NAME: (best visible org/brand/person name — never invent a filename)
WHAT_THEY_DO: (one short sentence)
AUDIENCE: (who this is for)
CTA: (any ask / next step visible)
URL: (any website or handle if visible, else none)
OPPORTUNITIES: (3 short bullets separated by " | " — capacity, conversion, trust gaps)
SUMMARY: (2-3 sentences describing what you see and the business opportunity)

If the image is unclear, still give your best BUSINESS_NAME and SUMMARY from visible text.`;

export function isSyntheticPhotoClient(name: string | undefined): boolean {
  if (!name?.trim()) return true;
  return /^(launch\s+)?photo\s+project\b/i.test(name.trim()) || /^image\s+(launch|capture)\b/i.test(name.trim());
}

export function ctpAssetIdFromUrl(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/api\/ctp\/assets\/([a-zA-Z0-9_-]+)/i);
  return match?.[1] || null;
}

function lineValue(text: string, label: string): string | undefined {
  const re = new RegExp(`^${label}\\s*:\\s*(.+)$`, 'im');
  const match = text.match(re);
  const value = match?.[1]?.trim();
  if (!value || /^none$/i.test(value) || /^n\/?a$/i.test(value)) return undefined;
  return value.replace(/^["']|["']$/g, '').slice(0, 200);
}

function parseOpportunities(text: string): string[] {
  const raw = lineValue(text, 'OPPORTUNITIES');
  if (!raw) return [];
  return raw
    .split(/\s*\|\s*|\n|;/)
    .map((part) => part.replace(/^[-*•]\s*/, '').trim())
    .filter((part) => part.length > 8)
    .slice(0, 5);
}

export function parseFactoryVisionText(
  visionText: string,
  fallbackName: string,
): Omit<FactoryImageSignal, 'assetId' | 'imageUrl' | 'fileName' | 'mimeType' | 'visionText'> {
  const suggested =
    lineValue(visionText, 'BUSINESS_NAME') ||
    visionText
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 2 && l.length < 80 && !/^(this is|screenshot|image|the photo)/i.test(l)) ||
    fallbackName;

  const cleanName = suggested
    .replace(/^BUSINESS_NAME:\s*/i, '')
    .replace(/\.(jpg|jpeg|png|webp|heic)$/i, '')
    .trim()
    .slice(0, 120);

  return {
    suggestedClientName: cleanName || fallbackName,
    whatTheyDo: lineValue(visionText, 'WHAT_THEY_DO'),
    audience: lineValue(visionText, 'AUDIENCE'),
    cta: lineValue(visionText, 'CTA'),
    url: lineValue(visionText, 'URL')?.match(/https?:\/\/\S+/i)?.[0] || lineValue(visionText, 'URL'),
    opportunities: parseOpportunities(visionText),
    summary:
      lineValue(visionText, 'SUMMARY') ||
      visionText.replace(/\s+/g, ' ').trim().slice(0, 420) ||
      `${fallbackName} — visual capture for Concept Pack.`,
  };
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
