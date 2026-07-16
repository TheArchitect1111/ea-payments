import type { ScrapedPage } from './firecrawl';
import { describeScreenshotBase64, pngDimensionsFromBase64 } from './screenshot-vision';

export type UploadKind = 'url' | 'image' | 'pdf' | 'document' | 'screenshot';

export interface IngestInput {
  url?: string;
  pageUrl?: string;
  fileName?: string;
  mimeType?: string;
  notes?: string;
  fileBase64?: string;
  screenshotBase64?: string;
}

export function detectUploadKind(input: IngestInput): UploadKind {
  if (input.screenshotBase64) return 'screenshot';
  if (input.url?.trim() && !input.fileBase64) return 'url';
  const mime = input.mimeType ?? '';
  if (mime.startsWith('image/') || input.fileBase64) return 'image';
  if (mime === 'application/pdf') return 'pdf';
  return 'document';
}

export function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
  return base
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    .slice(0, 120);
}

export function titleFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '') || url.slice(0, 80);
  } catch {
    return url.slice(0, 80);
  }
}

export function buildPageFromUpload(input: IngestInput): ScrapedPage {
  const kind = detectUploadKind(input);
  const fileName = input.fileName ?? 'uploaded-asset';
  const notes = input.notes?.trim() ?? '';
  const title =
    fileName === 'shared-note.txt' && notes
      ? notes.slice(0, 120)
      : titleFromFileName(fileName);

  const markdown = [
    `# ${title}`,
    '',
    `Uploaded ${kind} asset: ${fileName}`,
    input.mimeType ? `Type: ${input.mimeType}` : '',
    notes ? `Notes: ${notes}` : '',
    '',
    'This asset was submitted for business opportunity analysis — not design critique.',
    'Analysis focuses on visibility, messaging clarity, conversion paths, differentiation, modernity, and trust signals inferable from the submission context.',
    '',
    kind === 'image' || kind === 'screenshot'
      ? 'Visual marketing asset detected. Evaluate headline clarity, CTA presence, audience targeting, and trust elements typically found in flyers, ads, and social posts.'
      : kind === 'pdf'
        ? 'Document asset detected. Evaluate value proposition, contact paths, event details, and call-to-action clarity.'
        : 'Marketing asset detected. Evaluate business positioning and opportunity gaps.',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    url: input.pageUrl?.trim() || input.url?.trim() || `upload://${encodeURIComponent(fileName)}`,
    title,
    description: notes || `${title} — uploaded marketing asset for opportunity analysis`,
    markdown,
    metadata: {
      uploadKind: kind,
      fileName,
      mimeType: input.mimeType ?? '',
    },
    source: 'fallback',
  };
}

export async function buildPageFromScreenshot(input: IngestInput): Promise<ScrapedPage> {
  const base64 = input.screenshotBase64 ?? input.fileBase64 ?? '';
  const mimeType = input.mimeType ?? 'image/png';
  const pageUrl = input.pageUrl?.trim() || input.url?.trim() || '';
  const notes = input.notes?.trim() ?? '';
  const fileName = input.fileName ?? 'screenshot.png';
  const dims = pngDimensionsFromBase64(base64);
  const visionText = base64 ? await describeScreenshotBase64(base64, mimeType) : null;

  const title =
    (visionText && visionText.split('\n')[0]?.slice(0, 120)) ||
    (pageUrl ? titleFromUrl(pageUrl) : titleFromFileName(fileName));

  const markdown = [
    `# ${title}`,
    '',
    pageUrl ? `Source page: ${pageUrl}` : '',
    dims ? `Screenshot dimensions: ${dims.width}×${dims.height}px` : 'Screenshot capture',
    notes ? `Notes: ${notes}` : '',
    '',
    visionText
      ? `## Visual extraction\n${visionText}`
      : 'Screenshot submitted for opportunity analysis. Evaluate visible messaging, audience, CTAs, and trust signals.',
    '',
    'Analysis focuses on visibility, messaging clarity, conversion paths, differentiation, modernity, and trust.',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    url: pageUrl || `screenshot://${encodeURIComponent(fileName)}`,
    title,
    description: visionText?.slice(0, 240) || notes || `${title} — screenshot capture`,
    markdown,
    metadata: {
      uploadKind: 'screenshot',
      fileName,
      mimeType,
      hasVision: visionText ? 'true' : 'false',
    },
    source: visionText ? 'firecrawl' : 'fallback',
  };
}

export async function buildPageFromAsset(input: IngestInput): Promise<ScrapedPage> {
  if (input.screenshotBase64 || (input.fileBase64 && (input.mimeType?.startsWith('image/') ?? true))) {
    return buildPageFromScreenshot(input);
  }
  return buildPageFromUpload(input);
}

export function derivePendingTitle(input: IngestInput & { url?: string }): string {
  if (input.url?.trim()) return titleFromUrl(input.url.trim());
  if (input.pageUrl?.trim()) return titleFromUrl(input.pageUrl.trim());
  if (input.fileName?.trim()) return titleFromFileName(input.fileName);
  if (input.notes?.trim()) return input.notes.trim().slice(0, 80);
  if (input.screenshotBase64 || input.fileBase64) return 'Screenshot capture';
  return 'New capture';
}
