import type { ScrapedPage } from './firecrawl';

export type UploadKind = 'url' | 'image' | 'pdf' | 'document';

export interface IngestInput {
  url?: string;
  fileName?: string;
  mimeType?: string;
  notes?: string;
}

export function detectUploadKind(input: IngestInput): UploadKind {
  if (input.url?.trim()) return 'url';
  const mime = input.mimeType ?? '';
  if (mime.startsWith('image/')) return 'image';
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

export function buildPageFromUpload(input: IngestInput): ScrapedPage {
  const kind = detectUploadKind(input);
  const fileName = input.fileName ?? 'uploaded-asset';
  const title = titleFromFileName(fileName);
  const notes = input.notes?.trim() ?? '';

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
    kind === 'image'
      ? 'Visual marketing asset detected. Evaluate headline clarity, CTA presence, audience targeting, and trust elements typically found in flyers, ads, and social posts.'
      : kind === 'pdf'
        ? 'Document asset detected. Evaluate value proposition, contact paths, event details, and call-to-action clarity.'
        : 'Marketing asset detected. Evaluate business positioning and opportunity gaps.',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    url: input.url?.trim() || `upload://${encodeURIComponent(fileName)}`,
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
