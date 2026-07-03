import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { runTrainingTransformationWorkflow, type EACaptureKind } from '@/lib/ea-intelligence';
import { extractTrainingSourceFromFile, inferCaptureKind } from '@/lib/ea-document-extraction';
import { createTrainingTransformationFromWorkflow } from '@/lib/training-transformation-store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  return verifyAdminSession(token);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const title = String(form.get('title') ?? '').trim();
    const notes = String(form.get('notes') ?? '').trim();
    const tenantId = String(form.get('tenantId') ?? '').trim();
    const file = form.get('file');

    if (file instanceof File && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const extracted = await extractTrainingSourceFromFile({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        buffer,
        notes,
      });

      const result = await runTrainingTransformationWorkflow({
        kind: extracted.kind,
        title: title || file.name,
        text: [
          extracted.text,
          `Uploaded file: ${file.name}`,
          `File type: ${file.type || 'unknown'}`,
          `Size: ${file.size} bytes`,
          ...extracted.extractionNotes.map((note) => `Extraction note: ${note}`),
        ].filter(Boolean).join('\n'),
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        product: 'ea-platform',
        tenantId: tenantId || undefined,
        metadata: {
          extractionStatus: extracted.extractionStatus,
          pageCount: extracted.pageCount,
          slideCount: extracted.slideCount,
        },
      });
      const record = await createTrainingTransformationFromWorkflow(result, {
        extractionStatus: extracted.extractionStatus,
        extractionNotes: extracted.extractionNotes,
      });

      return NextResponse.json({ ok: true, result, record });
    }

    const text = String(form.get('text') ?? '').trim();
    if (!text && !notes) {
      return NextResponse.json({ ok: false, error: 'Text, notes, or a file is required.' }, { status: 400 });
    }

    const result = await runTrainingTransformationWorkflow({
      kind: 'text',
      title: title || 'Training Transformation Input',
      text: [text, notes].filter(Boolean).join('\n\n'),
      product: 'ea-platform',
      tenantId: tenantId || undefined,
    });
    const record = await createTrainingTransformationFromWorkflow(result);

    return NextResponse.json({ ok: true, result, record });
  }

  const body = (await req.json()) as {
    title?: string;
    text?: string;
    sourceUrl?: string;
    kind?: EACaptureKind;
    tenantId?: string;
  };

  const text = body.text?.trim();
  if (!text && !body.sourceUrl) {
    return NextResponse.json({ ok: false, error: 'Text or sourceUrl is required.' }, { status: 400 });
  }

  const result = await runTrainingTransformationWorkflow({
    kind: body.kind ?? (body.sourceUrl ? 'link' : inferCaptureKind(body.title ?? '', '')),
    title: body.title?.trim() || 'Training Transformation Input',
    text,
    sourceUrl: body.sourceUrl?.trim(),
    product: 'ea-platform',
    tenantId: body.tenantId?.trim() || undefined,
  });
  const record = await createTrainingTransformationFromWorkflow(result);

  return NextResponse.json({ ok: true, result, record });
}
