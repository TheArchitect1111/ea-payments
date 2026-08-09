import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import { listVideoEngines } from '@/lib/video-factory/providers';
import { resolveNarrationProvider } from '@/lib/video-factory/narration';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  return NextResponse.json({
    ok: true,
    service: 'EA Video Test Console',
    primaryEngine: 'remotion',
    endpoint: '/admin/video-test',
    render: '/api/admin/video-factory/render',
    publish: '/api/admin/video-factory/publish',
    optionalGemini: '/api/integrations/video/generate',
    engines: listVideoEngines(),
    narration: resolveNarrationProvider(),
    defaultPrompt: 'Why wealthy people use debt differently.',
  });
}

export async function POST(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  const renderUrl = new URL('/api/admin/video-factory/render', req.url);
  const forwarded = await fetch(renderUrl, {
    method: 'POST',
    headers: {
      cookie: req.headers.get('cookie') ?? '',
      'content-type': 'application/json',
    },
    body: JSON.stringify(await req.json().catch(() => ({}))),
  });

  return new NextResponse(forwarded.body, {
    status: forwarded.status,
    headers: forwarded.headers,
  });
}
