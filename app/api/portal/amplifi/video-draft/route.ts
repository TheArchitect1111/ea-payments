import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import {
  downloadAmplifiVideoDraft,
  getAmplifiVideoDraftStatus,
  moneyPrinterTurboConfigured,
  startAmplifiVideoDraft,
} from '@/lib/integrations/video/moneyprinterturbo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  if (!moneyPrinterTurboConfigured()) {
    return NextResponse.json({ ok: false, error: 'Amplifi video drafts are not configured.' }, { status: 503 });
  }
  try {
    const taskId = req.nextUrl.searchParams.get('taskId') || '';
    const status = await getAmplifiVideoDraftStatus(taskId);
    if (req.nextUrl.searchParams.get('download') === '1') {
      if (status.state !== 'complete' || !status.workerVideoPath) {
        return NextResponse.json({ ok: false, error: 'Video draft is not ready.' }, { status: 409 });
      }
      const workerResponse = await downloadAmplifiVideoDraft(status.workerVideoPath);
      return new NextResponse(workerResponse.body, {
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': 'inline; filename="amplifi-video-draft.mp4"',
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }
    return NextResponse.json({
      ok: true,
      task: {
        taskId: status.taskId,
        state: status.state,
        progress: status.progress,
        error: status.error,
        previewUrl: status.state === 'complete'
          ? `/api/portal/amplifi/video-draft?taskId=${encodeURIComponent(status.taskId)}&download=1`
          : undefined,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Video status failed.' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  if (!moneyPrinterTurboConfigured()) {
    return NextResponse.json({ ok: false, error: 'Amplifi video drafts are not configured.' }, { status: 503 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as { subject?: string; script?: string };
    const started = await startAmplifiVideoDraft({ subject: String(body.subject || ''), script: String(body.script || '') });
    return NextResponse.json({ ok: true, task: { ...started, state: 'processing', progress: 0 } }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Video generation failed.' }, { status: 502 });
  }
}
