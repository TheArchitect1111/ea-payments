import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { createCaptureRecord } from '@/lib/capture-records';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const body = (await req.json()) as {
    title?: string;
    description?: string;
    sourceUrl?: string;
    captureType?: string;
    source?: string;
    category?: string;
    priority?: string;
    tags?: string[];
  };

  if (!body.title?.trim()) {
    return Response.json({ ok: false, error: 'Title is required.' }, { status: 400 });
  }

  const result = await createCaptureRecord({
    title: body.title,
    description: body.description,
    sourceUrl: body.sourceUrl,
    source: body.source,
    category: body.category,
    priority: body.priority as 'Low' | 'Normal' | 'High' | undefined,
    tags: body.tags,
    captureType: body.captureType as Parameters<typeof createCaptureRecord>[0]['captureType'],
  });

  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 500 });
  }

  return Response.json({ ok: true, record: result.record });
}
