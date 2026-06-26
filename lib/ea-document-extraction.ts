import type { EACaptureKind } from './ea-intelligence';

export type ExtractedTrainingSource = {
  text: string;
  kind: EACaptureKind;
  extractionStatus: 'extracted' | 'partial' | 'needs-transcript' | 'unsupported';
  extractionNotes: string[];
  pageCount?: number;
  slideCount?: number;
};

type ExtractionInput = {
  fileName: string;
  mimeType?: string;
  buffer: Buffer;
  notes?: string;
};

export async function extractTrainingSourceFromFile(input: ExtractionInput): Promise<ExtractedTrainingSource> {
  const kind = inferCaptureKind(input.fileName, input.mimeType);
  const notes = input.notes?.trim();

  try {
    if (kind === 'pdf') {
      return await extractPdf(input.buffer, notes);
    }

    if (kind === 'word' && input.fileName.toLowerCase().endsWith('.docx')) {
      return await extractDocx(input.buffer, notes);
    }

    if (kind === 'powerpoint' && input.fileName.toLowerCase().endsWith('.pptx')) {
      return await extractPptx(input.buffer, notes);
    }

    if (isTextLike(input.fileName, input.mimeType)) {
      return extracted([notes, cleanupTranscript(input.buffer.toString('utf8'))], kind);
    }

    if (kind === 'video') {
      return {
        text: [
          notes,
          'Video file received. Upload a transcript, captions file, or notes so EA Intelligence can transform the content into lessons, quizzes, checklists, and manager summaries.',
        ].filter(Boolean).join('\n\n'),
        kind,
        extractionStatus: 'needs-transcript',
        extractionNotes: ['Video transcription is not enabled in this runtime yet. Use .txt, .vtt, or .srt transcript files for now.'],
      };
    }
  } catch (error) {
    return {
      text: [notes, `Uploaded file: ${input.fileName}`, `Extraction error: ${error instanceof Error ? error.message : 'Unknown error'}`]
        .filter(Boolean)
        .join('\n\n'),
      kind,
      extractionStatus: 'partial',
      extractionNotes: ['The file was received, but full text extraction did not complete.'],
    };
  }

  return {
    text: [notes, `Uploaded file: ${input.fileName}`, 'This file type is not supported for text extraction yet.'].filter(Boolean).join('\n\n'),
    kind,
    extractionStatus: 'unsupported',
    extractionNotes: ['Supported extraction types: PDF, DOCX, PPTX, TXT, VTT, and SRT.'],
  };
}

export function inferCaptureKind(fileName = '', mimeType = ''): EACaptureKind {
  const name = fileName.toLowerCase();
  const mime = mimeType.toLowerCase();
  if (mime.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
  if (mime.includes('presentation') || name.endsWith('.ppt') || name.endsWith('.pptx')) return 'powerpoint';
  if (mime.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) return 'word';
  if (mime.includes('video') || name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.webm')) return 'video';
  if (mime.includes('image')) return 'image';
  return 'text';
}

async function extractPdf(buffer: Buffer, notes?: string): Promise<ExtractedTrainingSource> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  const parsed = await parser.getText();
  await parser.destroy();
  return extracted([notes, parsed.text ?? ''], 'pdf', {
    pageCount: parsed.total,
    extractionNotes: parsed.text?.trim() ? ['PDF text extracted.'] : ['PDF parsed, but no selectable text was found.'],
  });
}

async function extractDocx(buffer: Buffer, notes?: string): Promise<ExtractedTrainingSource> {
  const mammoth = await import('mammoth');
  const parsed = await mammoth.extractRawText({ buffer });
  return extracted([notes, parsed.value], 'word', {
    extractionNotes: [
      'Word document text extracted.',
      ...parsed.messages.map((message) => message.message).filter(Boolean).slice(0, 4),
    ],
  });
}

async function extractPptx(buffer: Buffer, notes?: string): Promise<ExtractedTrainingSource> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => numericSuffix(a) - numericSuffix(b));
  const noteFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/i.test(name))
    .sort((a, b) => numericSuffix(a) - numericSuffix(b));
  const chunks: string[] = [];

  for (const fileName of [...slideFiles, ...noteFiles]) {
    const raw = await zip.file(fileName)?.async('string');
    const text = raw ? xmlText(raw) : '';
    if (text) chunks.push(text);
  }

  return extracted([notes, chunks.join('\n\n')], 'powerpoint', {
    slideCount: slideFiles.length,
    extractionNotes: chunks.length ? ['PowerPoint slide and speaker-note text extracted.'] : ['PowerPoint opened, but no slide text was found.'],
  });
}

function extracted(
  textParts: Array<string | undefined>,
  kind: EACaptureKind,
  options: Partial<Pick<ExtractedTrainingSource, 'extractionNotes' | 'pageCount' | 'slideCount'>> = {},
): ExtractedTrainingSource {
  const text = textParts.filter(Boolean).join('\n\n').trim();
  return {
    text,
    kind,
    extractionStatus: text ? 'extracted' : 'partial',
    extractionNotes: options.extractionNotes ?? ['Text extracted.'],
    pageCount: options.pageCount,
    slideCount: options.slideCount,
  };
}

function isTextLike(fileName = '', mimeType = '') {
  const name = fileName.toLowerCase();
  const mime = mimeType.toLowerCase();
  return mime.startsWith('text/') || ['.txt', '.md', '.csv', '.vtt', '.srt'].some((ext) => name.endsWith(ext));
}

function cleanupTranscript(value: string) {
  return value
    .replace(/WEBVTT/gi, '')
    .replace(/\d{2}:\d{2}:\d{2}[,.]\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}[,.]\d{3}/g, '')
    .replace(/^\d+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function xmlText(raw: string) {
  return raw
    .replace(/<a:br\/>/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function numericSuffix(value: string) {
  return Number(value.match(/(\d+)\.xml$/)?.[1] ?? 0);
}
