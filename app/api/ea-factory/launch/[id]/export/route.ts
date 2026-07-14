import { NextRequest, NextResponse } from 'next/server';
import { exportEACPLaunchJson, exportEACPLaunchMarkdown, getEACPLaunch } from '@/lib/eacp-launch';
import {
  adminAuthJsonError,
  requireAdminActionFromRequest,
} from '@/lib/admin-session-guard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: PageProps) {
  const auth = await requireAdminActionFromRequest(request, 'admin:manage');
  if (!auth.ok) return adminAuthJsonError(auth);

  const { id } = await params;
  const launch = await getEACPLaunch(id);
  if (!launch) {
    return NextResponse.json({ error: 'Launch not found.' }, { status: 404 });
  }

  const type = request.nextUrl.searchParams.get('type') ?? 'json';
  if (type === 'markdown') {
    return new NextResponse(exportEACPLaunchMarkdown(launch), {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${launch.id}.md"`,
      },
    });
  }
  if (type === 'codex') {
    return new NextResponse(launch.buildPackage.codexBuildPrompt, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${launch.id}-codex-prompt.txt"`,
      },
    });
  }

  return new NextResponse(exportEACPLaunchJson(launch), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${launch.id}.json"`,
    },
  });
}
